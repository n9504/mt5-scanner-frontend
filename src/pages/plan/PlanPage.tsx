import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { getTrades } from '../../api/client';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    EXCELLENT:  { label: '★ Excellent',    color: '#00C97A', bg: 'rgba(0,201,122,.15)' },
    PASS:       { label: '✓ Pass',         color: '#00C97A', bg: 'rgba(0,201,122,.10)' },
    RISKY:      { label: '⚠ Risky',        color: '#F0A500', bg: 'rgba(240,160,0,.12)' },
    UNPROFITABLE: { label: '✗ Unprofitable', color: '#f04060', bg: 'rgba(240,64,96,.12)' },
    FAIL:       { label: '✗ Unprofitable', color: '#f04060', bg: 'rgba(240,64,96,.12)' },
    FUTURE:     { label: '— Upcoming',     color: '#3a4560', bg: 'transparent' },
  };
  const s = map[status] || { label: status, color: '#556080', bg: 'transparent' };
  return (
    <span style={{ padding:'3px 10px', borderRadius:4, fontSize:10, fontWeight:700,
      background:s.bg, color:s.color }}>{s.label}</span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PlanRow({ label, planned, actual, format, status }: any) {
  const isGood = actual !== null && planned !== null && (
    (label === 'Max Loss' && Math.abs(actual) <= Math.abs(planned)) ||
    (label !== 'Max Loss' && actual >= planned * 0.8)
  );
  const actualColor = actual === null ? '#3a4560' :
    label === 'Max Loss' ? (Math.abs(actual) <= Math.abs(planned) ? '#00C97A' : '#f04060') :
    actual >= planned * 0.9 ? '#00C97A' : actual >= planned * 0.7 ? '#F0A500' : '#f04060';

  return (
    <tr style={{ borderBottom:'1px solid #111626' }}>
      <td style={{ padding:'12px 16px', fontSize:12, color:'#8899b4', fontWeight:500 }}>{label}</td>
      <td style={{ padding:'12px 16px', fontSize:12, color:'#556080', textAlign:'right' as const }}>
        {planned !== null ? format(planned) : '—'}
      </td>
      <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700,
        color: actual !== null ? actualColor : '#3a4560', textAlign:'right' as const }}>
        {actual !== null ? format(actual) : '—'}
      </td>
      <td style={{ padding:'12px 16px', textAlign:'center' as const }}>
        {actual !== null && planned !== null ? (
          <span style={{ fontSize:14 }}>{isGood ? '✓' : '✗'}</span>
        ) : ''}
      </td>
    </tr>
  );
}

export default function PlanPage() {
  const [trades,      setTrades]      = useState<any[]>([]);
  const [accounts,    setAccounts]    = useState<any[]>([]);
  const [todayPlan,   setTodayPlan]   = useState<any>(null);
  const [weeklyPlan,  setWeeklyPlan]  = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [aiPlan,      setAiPlan]      = useState<any>(null);
  const [news,        setNews]        = useState<any[]>([]);

  const today    = new Date();
  const todayDay = today.getUTCDay();

  useEffect(() => {
    const load = async () => {
      try {
        const [allR, accR] = await Promise.all([
          getTrades({ status:'CLOSED', period:'all' }).catch(()=>({data:[]})),
          api.get('/api/v1/account').catch(()=>({data:[]})),
        ]);
        setTrades(allR.data || []);
        const accs = Array.isArray(accR.data) ? accR.data : [accR.data];
        setAccounts(accs);

        if (accs[0]?.id) {
          const [todayR, weekR] = await Promise.all([
            api.get(`/api/v1/daily-plan/today?account_id=${accs[0].id}`).catch(()=>({data:null})),
            api.get(`/api/v1/daily-plan/weekly?account_id=${accs[0].id}`).catch(()=>({data:null})),
          ]);
          setTodayPlan(todayR.data);
          setWeeklyPlan(weekR.data);
        }
        api.get('/api/v1/news/today').then(r => setNews(r.data||[])).catch(()=>{});
      } catch(e) {}
      setLoading(false);
    };
    load();
  }, []);

  // Day-of-week edge stats (last 4 weeks)
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

  const fmtPnl  = (v: number) => v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`;

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/api/v1/plan/generate', {
        trades_summary: Object.entries(byDaySymbol).map(([day,syms]) => ({
          day,
          symbols: Object.entries(syms).map(([sym,d]:any) => ({
            sym, wins:d.wins, losses:d.losses, pnl:parseFloat(d.pnl.toFixed(2)),
            wr: d.wins+d.losses > 0 ? Math.round(d.wins/(d.wins+d.losses)*100) : 0
          })).filter(s=>s.wins+s.losses>=2).sort((a:any,b:any)=>b.wr-a.wr)
        })),
        daily_target:    todayPlan?.planned_profit || 0,
        account_balance: parseFloat(accounts[0]?.balance||0),
      });
      setAiPlan(r.data);
    } catch(e) {}
    setGenerating(false);
  };

  if (loading) return <div style={{ padding:48, textAlign:'center', color:'#556080' }}>Loading...</div>;

  return (
    <div style={{ padding:'24px 28px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif', color:'#E8ECF4', marginBottom:4 }}>
          Plan & Edge
        </h1>
        <p style={{ color:'#556080', fontSize:12 }}>Based on your last 4 weeks · {todayDayName}</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* TODAY PLAN VS ACTUAL */}
        {todayPlan && (
          <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #1a1f30',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700 }}>
                Today — {new Date().toLocaleDateString('en',{weekday:'long',day:'numeric',month:'long'})}
              </div>
              <StatusBadge status={todayPlan.status} />
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#070b14' }}>
                  <td colSpan={4} style={{ padding:'6px 16px', fontSize:9, color:'#3a4560',
                    fontStyle:'italic' }}>
                    Pass = P&L within boundaries (max loss to target) AND trades ≤ planned. 0 trades = Excellent.
                  </td>
                </tr>
                <tr style={{ background:'#070b14' }}>
                  {['Metric','Planned','Actual',''].map(h => (
                    <th key={h} style={{ padding:'8px 16px', fontSize:9, color:'#3a4560',
                      textTransform:'uppercase' as const, letterSpacing:'.1em',
                      textAlign: h === '' ? 'center' as const : h === 'Metric' ? 'left' as const : 'right' as const,
                      borderBottom:'1px solid #111626' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom:'1px solid #111626' }}>
                    <td style={{ padding:'12px 16px', fontSize:12, color:'#8899b4', fontWeight:500 }}>Trades</td>
                    <td style={{ padding:'12px 16px', fontSize:12, color:'#556080', textAlign:'right' as const }}>
                      ≤{todayPlan.planned_trades}
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700,
                      color: todayPlan.actual_trades === 0 ? '#00C97A'
                           : todayPlan.actual_trades <= todayPlan.planned_trades ? '#00C97A' : '#f04060',
                      textAlign:'right' as const }}>
                      {todayPlan.actual_trades === 0 ? '0 — no trades' : todayPlan.actual_trades}
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'center' as const, fontSize:14 }}>
                      {todayPlan.actual_trades <= todayPlan.planned_trades ? '✓' : '✗'}
                    </td>
                  </tr>
                {/* Single P&L row showing actual vs boundaries */}
                {(todayPlan.planned_profit > 0 || todayPlan.planned_max_loss > 0) && (
                  <tr style={{ borderBottom:'1px solid #111626' }}>
                    <td style={{ padding:'12px 16px', fontSize:12, color:'#8899b4', fontWeight:500 }}>P&L</td>
                    <td style={{ padding:'12px 16px', fontSize:11, color:'#556080', textAlign:'right' as const }}>
                      {todayPlan.planned_max_loss > 0 && <span>-${todayPlan.planned_max_loss} to </span>}
                      {todayPlan.planned_profit > 0 ? `+$${todayPlan.planned_profit}` : 'any profit'}
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700,
                      color: todayPlan.actual_profit >= (todayPlan.planned_profit||0) ? '#00C97A'
                           : todayPlan.actual_profit >= -(todayPlan.planned_max_loss||999999) ? '#F0A500'
                           : '#f04060',
                      textAlign:'right' as const }}>
                      {fmtPnl(todayPlan.actual_profit)}
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'center' as const, fontSize:14 }}>
                      {todayPlan.actual_profit >= -(todayPlan.planned_max_loss||999999) ? '✓' : '✗'}
                    </td>
                  </tr>
                )}
                <tr style={{ borderBottom:'1px solid #111626' }}>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'#8899b4', fontWeight:500 }}>Win Rate</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'#556080', textAlign:'right' as const }}>—</td>
                  <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700,
                    color: todayPlan.actual_wr >= 50 ? '#00C97A' : '#f04060',
                    textAlign:'right' as const }}>
                    {todayPlan.actual_wr}%
                  </td>
                  <td />
                </tr>
                <tr style={{ background:'#070b14' }}>
                  <td colSpan={2} style={{ padding:'10px 16px', fontSize:11, color:'#556080' }}>
                    {todayPlan.actual_wins}W · {todayPlan.actual_losses}L today
                  </td>
                  <td colSpan={2} style={{ padding:'10px 16px', textAlign:'right' as const, fontSize:13,
                    fontWeight:700, color: todayPlan.actual_profit >= 0 ? '#00C97A' : '#f04060' }}>
                    {fmtPnl(todayPlan.actual_profit)} net
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* WEEKLY TABLE */}
        {weeklyPlan && (
          <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #1a1f30',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700 }}>
                This Week
              </div>
              <div style={{ display:'flex', gap:12, fontSize:11 }}>
                {weeklyPlan.excellent_days > 0 && <span style={{ color:'#00C97A' }}>★ {weeklyPlan.excellent_days} excellent</span>}
                <span style={{ color:'#00C97A' }}>✓ {weeklyPlan.pass_days} pass</span>
                {weeklyPlan.risky_days > 0 && <span style={{ color:'#F0A500' }}>⚠ {weeklyPlan.risky_days} risky</span>}
                <span style={{ color:'#f04060' }}>✗ {weeklyPlan.fail_days} fail</span>
                <span style={{ color: weeklyPlan.week_profit >= 0 ? '#00C97A' : '#f04060', fontWeight:700 }}>
                  {fmtPnl(weeklyPlan.week_profit)} week
                </span>
              </div>
            </div>

            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#070b14' }}>
                  {['Day','Trades','Profit','W/L','Result'].map(h => (
                    <th key={h} style={{ padding:'8px 16px', fontSize:9, color:'#3a4560',
                      textTransform:'uppercase' as const, letterSpacing:'.1em',
                      textAlign: h === 'Day' ? 'left' as const : 'right' as const,
                      borderBottom:'1px solid #111626' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyPlan.days.map((d: any, i: number) => (
                  <tr key={i} style={{ borderBottom:'1px solid #111626',
                    opacity: d.status === 'FUTURE' ? 0.4 : 1 }}>
                    <td style={{ padding:'12px 16px', fontSize:12, fontWeight:600,
                      color: d.status === 'FUTURE' ? '#3a4560' : '#E8ECF4' }}>
                      {d.day}
                      <div style={{ fontSize:9, color:'#3a4560', marginTop:2 }}>
                        {d.planned_trades} trades · {d.planned_profit > 0 ? `$${d.planned_profit} target` : 'no target'}
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'right' as const, fontSize:12,
                      color: d.actual_trades === 0 ? '#00C97A' : d.actual_trades > d.planned_trades ? '#f04060' : '#00C97A' }}>
                      {d.status !== 'FUTURE' ? (d.actual_trades === 0 ? '0 ★' : `${d.actual_trades}/${d.planned_trades}`) : '—'}
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'right' as const, fontSize:12,
                      fontWeight:700,
                      color: d.actual_profit > 0 ? '#00C97A' : d.actual_profit < 0 ? '#f04060' : '#556080' }}>
                      {d.status !== 'FUTURE' && d.actual_trades > 0 ? fmtPnl(d.actual_profit) : '—'}
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'right' as const, fontSize:11,
                      color:'#556080' }}>
                      {d.status !== 'FUTURE' && d.actual_trades > 0
                        ? `${d.actual_wins}W ${d.actual_losses}L (${d.actual_wr}%)`
                        : '—'}
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'right' as const }}>
                      {d.status !== 'FUTURE' ? <StatusBadge status={d.status} /> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'#070b14', borderTop:'1px solid #1a1f30' }}>
                  <td style={{ padding:'10px 16px', fontSize:11, color:'#556080' }}>
                    Weekly total · {weeklyPlan.trading_days} trading days
                  </td>
                  <td colSpan={3}/>
                  <td style={{ padding:'10px 16px', textAlign:'right' as const, fontSize:13,
                    fontWeight:700, color: weeklyPlan.week_profit >= 0 ? '#00C97A' : '#f04060' }}>
                    {fmtPnl(weeklyPlan.week_profit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TODAY'S EDGE + NEWS side by side */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:'rgba(0,201,122,0.04)', border:'1px solid rgba(0,201,122,0.2)',
            borderRadius:8, padding:20 }}>
            <div style={{ fontSize:10, color:'#00C97A', textTransform:'uppercase' as const,
              letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
              📈 Historical Performance Pattern — {todayDayName}s
            </div>
            {topSymbols.length === 0 ? (
              <div style={{ color:'#3a4560', fontSize:12 }}>Not enough data yet</div>
            ) : topSymbols.map(s => (
              <div key={s.sym} style={{ padding:'8px 0', borderBottom:'1px solid rgba(0,201,122,0.08)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#E8ECF4' }}>{s.sym}</span>
                  <span style={{ padding:'2px 8px', borderRadius:3, fontSize:10, fontWeight:700,
                    background:'rgba(0,201,122,.12)', color:'#00C97A' }}>{s.wr}% WR</span>
                </div>
                <div style={{ fontSize:10, color:'#556080', marginTop:3 }}>
                  {s.total} {todayDayName}s · avg {s.pnl>=0?'+$':'-$'}{Math.abs(s.pnl/s.total).toFixed(2)}/trade
                </div>
              </div>
            ))}
            {bottomSymbols.length > 0 && (
              <>
                <div style={{ fontSize:10, color:'#f04060', textTransform:'uppercase' as const,
                  letterSpacing:'.08em', fontWeight:700, margin:'14px 0 8px' }}>⚠ Caution</div>
                {bottomSymbols.map(s => (
                  <div key={s.sym} style={{ padding:'6px 0', fontSize:12, color:'#8899b4' }}>
                    <span style={{ color:'#E8ECF4', fontWeight:600 }}>{s.sym}</span>
                    <span style={{ color:'#f04060', marginLeft:8 }}>{s.wr}% WR on {todayDayName}s</span>
                  </div>
                ))}
              </>
            )}
            <div style={{ fontSize:9, color:'#3a4560', marginTop:12, fontStyle:'italic' }}>
              Based on last 4 weeks. Not a recommendation.
            </div>
          </div>

          <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:20 }}>
            <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
              letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
              High Impact News Today
            </div>
            {news.filter((n:any)=>n.impact==='High').length === 0 ? (
              <div style={{ color:'#3a4560', fontSize:12 }}>No high impact events today</div>
            ) : news.filter((n:any)=>n.impact==='High').map((n:any,i:number) => (
              <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid #111626',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:3,
                    background:'rgba(240,64,96,.12)', color:'#f04060', marginRight:8 }}>
                    {n.currency}
                  </span>
                  <span style={{ fontSize:12, color:'#E8ECF4' }}>{n.title}</span>
                </div>
                <span style={{ fontSize:10, color:'#556080', whiteSpace:'nowrap' as const, marginLeft:8 }}>
                  {n.event_time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WEEKLY EDGE GRID */}
        <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
              letterSpacing:'.1em', fontWeight:700 }}>4-Week Edge by Day</div>
            <button onClick={generatePlan} disabled={generating} style={{
              padding:'6px 14px', background: generating ? '#1a2a1a' : '#9060f0',
              border:'none', borderRadius:5, color: generating ? '#9060f0' : '#fff',
              fontSize:11, fontWeight:700, cursor:'pointer' }}>
              {generating ? '🧠 Generating...' : '🧠 AI Insights'}
            </button>
          </div>
          <div style={{ overflowX:'auto' as const }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
              <thead>
                <tr>
                  <th style={{ fontSize:9, color:'#556080', textTransform:'uppercase' as const,
                    letterSpacing:'.08em', padding:'6px 12px', textAlign:'left' as const,
                    borderBottom:'1px solid #1a1f30' }}>Symbol</th>
                  {['Mon','Tue','Wed','Thu','Fri'].map((d,i) => {
                    const isToday = todayDay === i+1;
                    return (
                      <th key={d} style={{ fontSize:9, color: isToday?'#00C97A':'#556080',
                        textTransform:'uppercase' as const, letterSpacing:'.08em',
                        padding:'6px 12px', textAlign:'center' as const,
                        borderBottom:'1px solid #1a1f30' }}>{d}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(recent.map(t=>t.symbol))).sort().map(sym => (
                  <tr key={sym} style={{ borderBottom:'1px solid #0c0f1a' }}>
                    <td style={{ padding:'8px 12px', fontWeight:700, color:'#F0A500', fontSize:12 }}>{sym}</td>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => {
                      const d = byDaySymbol[day]?.[sym as string];
                      if (!d || d.wins+d.losses < 1) return (
                        <td key={day} style={{ padding:'8px 12px', textAlign:'center' as const,
                          color:'#252d42', fontSize:11 }}>—</td>
                      );
                      const total2 = d.wins+d.losses;
                      const wr = Math.round(d.wins/total2*100);
                      const conf = total2 >= 10 ? 1 : total2 >= 5 ? 0.75 : total2 >= 3 ? 0.5 : 0.3;
                      const confLabel = total2 >= 10 ? '' : total2 >= 5 ? 'emerging' : 'weak';
                      const bg = wr>=60?'rgba(0,201,122,.08)':wr>=40?'rgba(240,160,0,.06)':'rgba(240,64,96,.06)';
                      const color = wr>=60?'#00C97A':wr>=40?'#F0A500':'#f04060';
                      return (
                        <td key={day} style={{ padding:'8px 12px', textAlign:'center' as const,
                          background:bg, opacity:conf }}>
                          <div style={{ fontSize:12, fontWeight:700, color }}>{wr}%</div>
                          <div style={{ fontSize:9, color:'#556080' }}>{total2}t</div>
                          {confLabel && <div style={{ fontSize:8, color:'#3a4560' }}>{confLabel}</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI INSIGHTS */}
        {aiPlan && (
          <div style={{ background:'rgba(144,96,240,0.05)', border:'1px solid rgba(144,96,240,0.2)',
            borderRadius:8, padding:20 }}>
            <div style={{ fontSize:10, color:'#9060f0', textTransform:'uppercase' as const,
              letterSpacing:'.1em', fontWeight:700, marginBottom:14 }}>🧠 AI Weekly Insights</div>
            <div style={{ fontSize:13, color:'#8899b4', lineHeight:1.8, marginBottom:14 }}>
              {aiPlan.summary}
            </div>
            {aiPlan.days?.map((d:any,i:number) => (
              <div key={i} style={{ marginBottom:8, padding:'10px 14px', background:'#111626', borderRadius:6 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#E8ECF4', marginBottom:4 }}>{d.day}</div>
                {d.focus   && <div style={{ fontSize:11, color:'#00C97A', marginBottom:3 }}>📈 {d.focus}</div>}
                {d.caution && <div style={{ fontSize:11, color:'#F0A500', marginBottom:3 }}>⚠ {d.caution}</div>}
                {d.note    && <div style={{ fontSize:11, color:'#556080' }}>{d.note}</div>}
              </div>
            ))}
            <div style={{ fontSize:9, color:'#3a4560', marginTop:10, fontStyle:'italic' }}>
              Based on last 4 weeks. Not a recommendation. Past performance ≠ future results.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
