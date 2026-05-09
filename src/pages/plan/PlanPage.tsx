import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { getTrades } from '../../api/client';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function StatPill({ label, value, color }: any) {
  return (
    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700,
      background:`${color}15`, color, marginRight:6 }}>{label}: {value}</span>
  );
}

function ProgressBar({ value, max, color }: any) {
  const pct = max > 0 ? Math.min(100, (value/max)*100) : 0;
  const c   = pct >= 100 ? '#00C97A' : pct >= 70 ? '#F0A500' : '#f04060';
  return (
    <div style={{ height:6, background:'#1a1f30', borderRadius:3, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:3, transition:'width .3s' }}/>
    </div>
  );
}

export default function PlanPage() {
  const [trades,      setTrades]      = useState<any[]>([]);
  const [accounts,    setAccounts]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [aiPlan,      setAiPlan]      = useState<any>(null);
  const [todayTrades, setTodayTrades] = useState<any[]>([]);

  const today    = new Date();
  const todayDay = today.getUTCDay();
  const todayStr = today.toISOString().slice(0,10);

  useEffect(() => {
    const load = async () => {
      try {
        const [allR, todayR, accR] = await Promise.all([
          getTrades({ status:'CLOSED', period:'all' }).catch(()=>({data:[]})),
          getTrades({ status:'CLOSED', period:'today' }).catch(()=>({data:[]})),
          api.get('/api/v1/account').catch(()=>({data:[]})),
        ]);
        setTrades(allR.data || []);
        setTodayTrades(todayR.data || []);
        setAccounts(Array.isArray(accR.data) ? accR.data : [accR.data]);
      } catch(e) {}
      setLoading(false);
    };
    load();
  }, []);

  // Compute stats by day of week (last 4 weeks)
  const fourWeeksAgo = new Date(Date.now() - 28*24*60*60*1000);
  const recent = trades.filter(t => new Date(t.close_time) >= fourWeeksAgo);

  const byDaySymbol: Record<string, Record<string, {wins:number,losses:number,pnl:number}>> = {};
  recent.forEach(t => {
    if (!t.close_time) return;
    const d   = new Date(t.close_time);
    const day = DAYS[d.getUTCDay()];
    const sym = t.symbol;
    if (!byDaySymbol[day]) byDaySymbol[day] = {};
    if (!byDaySymbol[day][sym]) byDaySymbol[day][sym] = {wins:0,losses:0,pnl:0};
    if ((t.execution_outcome||'').startsWith('WIN')) byDaySymbol[day][sym].wins++;
    else byDaySymbol[day][sym].losses++;
    byDaySymbol[day][sym].pnl += parseFloat(t.net_pnl||0);
  });

  // Today's stats
  const account = accounts[0] || {};
  const dailyTarget = parseFloat(account.daily_profit_target || 0);
  const todayPnl    = todayTrades.reduce((s,t)=>s+parseFloat(t.net_pnl||0),0);
  const todayWins   = todayTrades.filter(t=>(t.execution_outcome||'').startsWith('WIN')).length;
  const todayLosses = todayTrades.length - todayWins;

  // Today's best/worst instruments from history
  const todayDayName = DAYS[todayDay];
  const todayBySymbol = byDaySymbol[todayDayName] || {};
  const symStats = Object.entries(todayBySymbol).map(([sym,d]:any) => ({
    sym, ...d,
    total: d.wins+d.losses,
    wr: d.wins+d.losses > 0 ? Math.round(d.wins/(d.wins+d.losses)*100) : 0,
    pnl: parseFloat(d.pnl.toFixed(2)),
  })).filter(s => s.total >= 2).sort((a,b) => b.wr - a.wr);

  const topSymbols    = symStats.filter(s => s.wr >= 55).slice(0,3);
  const bottomSymbols = symStats.filter(s => s.wr < 40).slice(0,2);

  // Forex Factory news (from our cache)
  const [news, setNews] = useState<any[]>([]);
  useEffect(() => {
    api.get('/api/v1/news/today').then(r => setNews(r.data||[])).catch(()=>{});
  }, []);

  const generateWeeklyPlan = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/api/v1/plan/generate', {
        trades_summary: Object.entries(byDaySymbol).map(([day,syms]) => ({
          day,
          symbols: Object.entries(syms).map(([sym,d]:any) => ({
            sym, wins:d.wins, losses:d.losses, pnl:parseFloat(d.pnl.toFixed(2)),
            wr: d.wins+d.losses > 0 ? Math.round(d.wins/(d.wins+d.losses)*100) : 0
          })).filter(s=>s.wins+s.losses>=2).sort((a,b)=>b.wr-a.wr)
        })),
        daily_target:  dailyTarget,
        account_balance: parseFloat(account.balance||0),
      });
      setAiPlan(r.data);
    } catch(e) { console.error(e); }
    setGenerating(false);
  };

  return (
    <div style={{ padding:'24px 28px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif',
          color:'#E8ECF4', marginBottom:4 }}>Plan & Edge</h1>
        <p style={{ color:'#556080', fontSize:12 }}>
          Based on your last 4 weeks of trading data
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', color:'#556080', padding:60 }}>Loading...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* TODAY TRACKER */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Today progress */}
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
              borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:16 }}>
                Today — {todayDayName} {todayStr}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:9, color:'#556080', marginBottom:4 }}>Net P&L</div>
                  <div style={{ fontSize:20, fontWeight:700, fontFamily:'Georgia,serif',
                    color:todayPnl>=0?'#00C97A':'#f04060' }}>
                    {todayPnl>=0?'+$':'-$'}{Math.abs(todayPnl).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, color:'#556080', marginBottom:4 }}>Trades</div>
                  <div style={{ fontSize:20, fontWeight:700, fontFamily:'Georgia,serif',
                    color:'#E8ECF4' }}>{todayWins}W / {todayLosses}L</div>
                </div>
                <div>
                  <div style={{ fontSize:9, color:'#556080', marginBottom:4 }}>Daily Target</div>
                  <div style={{ fontSize:20, fontWeight:700, fontFamily:'Georgia,serif',
                    color:dailyTarget>0&&todayPnl>=dailyTarget?'#00C97A':'#F0A500' }}>
                    {dailyTarget > 0 ? `$${dailyTarget}` : 'Not set'}
                  </div>
                </div>
              </div>
              {dailyTarget > 0 && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    fontSize:10, color:'#556080', marginBottom:6 }}>
                    <span>Progress to daily target</span>
                    <span style={{ color:todayPnl>=dailyTarget?'#00C97A':'#E8ECF4' }}>
                      {Math.min(100,Math.round(todayPnl/dailyTarget*100))}%
                    </span>
                  </div>
                  <ProgressBar value={todayPnl} max={dailyTarget} color="#00C97A" />
                  {todayPnl >= dailyTarget && (
                    <div style={{ fontSize:11, color:'#00C97A', marginTop:8 }}>
                      ✓ Daily target achieved — consider stopping for the day
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* High impact news today */}
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
              borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
                High Impact News Today
              </div>
              {news.length === 0 ? (
                <div style={{ color:'#3a4560', fontSize:12, padding:'8px 0' }}>
                  No high impact events today
                </div>
              ) : news.filter((n:any)=>n.impact==='High').map((n:any,i:number) => (
                <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid #111626',
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ fontSize:10, fontWeight:700,
                      background:'rgba(240,64,96,.12)', color:'#f04060',
                      padding:'1px 6px', borderRadius:3, marginRight:8 }}>
                      {n.currency}
                    </span>
                    <span style={{ fontSize:12, color:'#E8ECF4' }}>{n.title}</span>
                  </div>
                  <span style={{ fontSize:11, color:'#556080', whiteSpace:'nowrap' as const }}>
                    {n.event_time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TODAY'S EDGE from history */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Focus instruments */}
            <div style={{ background:'rgba(0,201,122,0.04)',
              border:'1px solid rgba(0,201,122,0.2)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#00C97A', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
                📈 Historical Edge Today ({todayDayName}s)
              </div>
              {topSymbols.length === 0 ? (
                <div style={{ color:'#3a4560', fontSize:12 }}>
                  Not enough {todayDayName} data yet (need 2+ trades per symbol)
                </div>
              ) : topSymbols.map(s => (
                <div key={s.sym} style={{ padding:'10px 0',
                  borderBottom:'1px solid rgba(0,201,122,0.1)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#E8ECF4' }}>{s.sym}</span>
                    <StatPill label="WR" value={`${s.wr}%`} color="#00C97A" />
                  </div>
                  <div style={{ fontSize:11, color:'#556080' }}>
                    {s.total} {todayDayName}s · Avg P&L {s.pnl>=0?'+$':'-$'}{Math.abs(s.pnl/s.total).toFixed(2)}/trade
                  </div>
                </div>
              ))}
              <div style={{ fontSize:10, color:'#3a4560', marginTop:10, fontStyle:'italic' }}>
                Based on your last 4 weeks. Not a trade recommendation.
              </div>
            </div>

            {/* Caution instruments */}
            <div style={{ background:'rgba(240,64,96,0.04)',
              border:'1px solid rgba(240,64,96,0.2)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#f04060', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
                ⚠ Caution Today ({todayDayName}s)
              </div>
              {bottomSymbols.length === 0 ? (
                <div style={{ color:'#3a4560', fontSize:12 }}>
                  No underperforming instruments on {todayDayName}s yet
                </div>
              ) : bottomSymbols.map(s => (
                <div key={s.sym} style={{ padding:'10px 0',
                  borderBottom:'1px solid rgba(240,64,96,0.1)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#E8ECF4' }}>{s.sym}</span>
                    <StatPill label="WR" value={`${s.wr}%`} color="#f04060" />
                  </div>
                  <div style={{ fontSize:11, color:'#556080' }}>
                    {s.total} {todayDayName}s · historically weak — be cautious
                  </div>
                </div>
              ))}
              <div style={{ fontSize:10, color:'#3a4560', marginTop:10, fontStyle:'italic' }}>
                Past performance only. Always conduct your own analysis.
              </div>
            </div>
          </div>

          {/* WEEKLY EDGE GRID */}
          <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
            borderRadius:8, padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700 }}>
                4-Week Edge by Day
              </div>
              <button onClick={generateWeeklyPlan} disabled={generating} style={{
                padding:'6px 16px', background: generating ? '#1a2a1a' : '#00C97A',
                border:'none', borderRadius:5,
                color: generating ? '#00C97A' : '#000',
                fontSize:11, fontWeight:700, cursor:'pointer',
              }}>
                {generating ? '🧠 Generating...' : '🧠 AI Weekly Insights'}
              </button>
            </div>

            <div style={{ overflowX:'auto' as const }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead>
                  <tr>
                    <th style={{ fontSize:9, color:'#556080', textTransform:'uppercase' as const,
                      letterSpacing:'.08em', padding:'6px 12px', textAlign:'left' as const,
                      borderBottom:'1px solid #1a1f30' }}>Symbol</th>
                    {['Mon','Tue','Wed','Thu','Fri'].map(d => (
                      <th key={d} style={{ fontSize:9, color:'#556080',
                        textTransform:'uppercase' as const, letterSpacing:'.08em',
                        padding:'6px 12px', textAlign:'center' as const,
                        borderBottom:'1px solid #1a1f30',
                      }}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(recent.map(t=>t.symbol))).map(sym => (
                    <tr key={sym} style={{ borderBottom:'1px solid #0c0f1a' }}>
                      <td style={{ padding:'8px 12px', fontWeight:700,
                        color:'#F0A500', fontSize:12 }}>{sym}</td>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => {
                        const d = byDaySymbol[day]?.[sym as string];
                        if (!d || d.wins+d.losses < 1) return (
                          <td key={day} style={{ padding:'8px 12px',
                            textAlign:'center' as const, color:'#252d42', fontSize:11 }}>—</td>
                        );
                        const wr = Math.round(d.wins/(d.wins+d.losses)*100);
                        const bg = wr >= 60 ? 'rgba(0,201,122,.08)' :
                                   wr >= 40 ? 'rgba(240,160,0,.08)' :
                                              'rgba(240,64,96,.08)';
                        const color = wr >= 60 ? '#00C97A' : wr >= 40 ? '#F0A500' : '#f04060';
                        return (
                          <td key={day} style={{ padding:'8px 12px',
                            textAlign:'center' as const, background:bg }}>
                            <div style={{ fontSize:12, fontWeight:700, color }}>{wr}%</div>
                            <div style={{ fontSize:9, color:'#556080' }}>{d.wins+d.losses}t</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI PLAN */}
          {aiPlan && (
            <div style={{ background:'rgba(144,96,240,0.05)',
              border:'1px solid rgba(144,96,240,0.2)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#9060f0', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:16 }}>
                🧠 AI Weekly Insights
              </div>
              <div style={{ fontSize:13, color:'#8899b4', lineHeight:1.8,
                marginBottom:16 }}>{aiPlan.summary}</div>
              {aiPlan.days && aiPlan.days.map((d:any,i:number) => (
                <div key={i} style={{ marginBottom:12, padding:'12px 14px',
                  background:'#111626', borderRadius:6 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#E8ECF4',
                    marginBottom:6 }}>{d.day}</div>
                  {d.focus && <div style={{ fontSize:11, color:'#00C97A', marginBottom:4 }}>
                    📈 Focus: {d.focus}
                  </div>}
                  {d.caution && <div style={{ fontSize:11, color:'#F0A500', marginBottom:4 }}>
                    ⚠ Caution: {d.caution}
                  </div>}
                  {d.note && <div style={{ fontSize:11, color:'#556080' }}>{d.note}</div>}
                </div>
              ))}
              <div style={{ fontSize:10, color:'#3a4560', marginTop:8, fontStyle:'italic' }}>
                Based on your last 4 weeks of trading. Not a recommendation. Past performance ≠ future results.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
