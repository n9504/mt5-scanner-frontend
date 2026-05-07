import React, { useState, useEffect } from 'react';
import { getTrades } from '../../api/client';

function StatCard({ label, value, sub, color }: any) {
  return (
    <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:'16px 20px' }}>
      <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const, letterSpacing:'.08em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:color||'#E8ECF4', fontFamily:'Georgia,serif' }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'#556080', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, wins, losses, pnl }: any) {
  const total = wins + losses;
  const wr    = total > 0 ? Math.round(wins/total*100) : 0;
  const color = pnl >= 0 ? '#00C97A' : '#f04060';
  return (
    <div style={{ padding:'10px 14px', background:'#111626', borderRadius:6, marginBottom:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#E8ECF4' }}>{label}</span>
        <div style={{ display:'flex', gap:12, fontSize:11 }}>
          <span style={{ color:'#556080' }}>{total} trades</span>
          <span style={{ color:'#F0A500' }}>{wr}% WR</span>
          <span style={{ color, fontWeight:700 }}>{pnl>=0?'+':''}{pnl.toFixed(2)}</span>
        </div>
      </div>
      <div style={{ height:3, background:'#1a1f30', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${wr}%`, height:'100%',
          background: wr>=50?'#00C97A':wr>=40?'#F0A500':'#f04060', borderRadius:2 }}/>
      </div>
    </div>
  );
}

export default function Reports() {
  const [trades,  setTrades]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('month');

  useEffect(() => {
    getTrades({ status:'CLOSED', period }).then(r => {
      setTrades(r.data || []);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [period]);

  // Compute stats
  const wins    = trades.filter(t=>(t.execution_outcome||'').startsWith('WIN'));
  const losses  = trades.filter(t=>(t.execution_outcome||'').startsWith('LOSS'));
  const netPnl  = trades.reduce((s,t)=>s+parseFloat(t.net_pnl||0),0);
  const winRate = trades.length > 0 ? Math.round(wins.length/trades.length*100) : 0;
  const avgRR   = wins.length > 0
    ? wins.reduce((s,t)=>s+parseFloat(t.rr_actual||0),0)/wins.length : 0;
  const profitFactor = losses.length > 0
    ? Math.abs(wins.reduce((s,t)=>s+parseFloat(t.net_pnl||0),0)) /
      Math.abs(losses.reduce((s,t)=>s+parseFloat(t.net_pnl||0),0)) : 0;

  // By symbol
  const bySymbol: any = {};
  trades.forEach(t => {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = {wins:0,losses:0,pnl:0};
    if ((t.execution_outcome||'').startsWith('WIN')) bySymbol[t.symbol].wins++;
    else bySymbol[t.symbol].losses++;
    bySymbol[t.symbol].pnl += parseFloat(t.net_pnl||0);
  });
  const symbolList = Object.entries(bySymbol)
    .map(([sym,d]:any) => ({ sym, ...d, pnl:parseFloat(d.pnl.toFixed(2)) }))
    .sort((a,b) => b.pnl - a.pnl);

  // By tag
  const byTag: any = {};
  trades.forEach(t => {
    (t.tags||[]).forEach((tag: string) => {
      if (!byTag[tag]) byTag[tag] = {wins:0,losses:0,pnl:0};
      if ((t.execution_outcome||'').startsWith('WIN')) byTag[tag].wins++;
      else byTag[tag].losses++;
      byTag[tag].pnl += parseFloat(t.net_pnl||0);
    });
  });
  const tagList = Object.entries(byTag)
    .map(([tag,d]:any) => ({ tag, ...d, pnl:parseFloat(d.pnl.toFixed(2)) }))
    .sort((a,b) => b.pnl - a.pnl).slice(0,10);

  // By session
  const bySession: any = {};
  trades.forEach(t => {
    const s = t.session || 'Unknown';
    if (!bySession[s]) bySession[s] = {wins:0,losses:0,pnl:0};
    if ((t.execution_outcome||'').startsWith('WIN')) bySession[s].wins++;
    else bySession[s].losses++;
    bySession[s].pnl += parseFloat(t.net_pnl||0);
  });

  // By scanner
  const byScanner: any = {};
  trades.forEach(t => {
    const s = t.scanner || 'MANUAL';
    if (!byScanner[s]) byScanner[s] = {wins:0,losses:0,pnl:0};
    if ((t.execution_outcome||'').startsWith('WIN')) byScanner[s].wins++;
    else byScanner[s].losses++;
    byScanner[s].pnl += parseFloat(t.net_pnl||0);
  });

  return (
    <div style={{ padding:'24px 28px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif', color:'#E8ECF4', marginBottom:4 }}>Reports</h1>
          <p style={{ color:'#556080', fontSize:12 }}>{trades.length} trades analysed</p>
        </div>
        <select value={period} onChange={e=>setPeriod(e.target.value)} style={{
          padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
          borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit' }}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', color:'#556080', padding:60 }}>Loading...</div>
      ) : trades.length === 0 ? (
        <div style={{ textAlign:'center', color:'#556080', padding:60 }}>No trades for this period</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Key stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
            <StatCard label="Net P&L" value={`${netPnl>=0?'+':''}${netPnl.toFixed(2)}`} color={netPnl>=0?'#00C97A':'#f04060'} />
            <StatCard label="Win Rate" value={`${winRate}%`} color={winRate>=50?'#00C97A':winRate>=40?'#F0A500':'#f04060'} sub={`${wins.length}W · ${losses.length}L`} />
            <StatCard label="Profit Factor" value={profitFactor.toFixed(2)} color={profitFactor>=1.5?'#00C97A':profitFactor>=1?'#F0A500':'#f04060'} />
            <StatCard label="Avg Win RR" value={avgRR>0?`${avgRR.toFixed(2)}R`:'—'} color={avgRR>=1?'#00C97A':'#F0A500'} />
            <StatCard label="Trades" value={trades.length} sub={`${period}`} />
          </div>

          {/* By instrument + by session side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* By Symbol */}
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.08em', marginBottom:14 }}>By Instrument</div>
              {symbolList.length === 0
                ? <div style={{ color:'#3a4560', fontSize:12 }}>No data</div>
                : symbolList.map(s => <Bar key={s.sym} label={s.sym} wins={s.wins} losses={s.losses} pnl={s.pnl} />)}
            </div>

            {/* By Session */}
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.08em', marginBottom:14 }}>By Session</div>
              {Object.entries(bySession).map(([s,d]:any) => (
                <Bar key={s} label={s.charAt(0).toUpperCase()+s.slice(1)}
                  wins={d.wins} losses={d.losses} pnl={parseFloat(d.pnl.toFixed(2))} />
              ))}
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
                  letterSpacing:'.08em', marginBottom:14 }}>By Scanner</div>
                {Object.entries(byScanner).map(([s,d]:any) => (
                  <Bar key={s} label={s} wins={d.wins} losses={d.losses} pnl={parseFloat(d.pnl.toFixed(2))} />
                ))}
              </div>
            </div>
          </div>

          {/* By tag */}
          {tagList.length > 0 && (
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.08em', marginBottom:14 }}>By Setup Tag</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {tagList.map(t => (
                  <Bar key={t.tag} label={t.tag} wins={t.wins} losses={t.losses} pnl={t.pnl} />
                ))}
              </div>
            </div>
          )}

          {/* Best/worst trades */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'#0c0f1a', border:'1px solid rgba(0,201,122,.15)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:11, color:'#00C97A', textTransform:'uppercase' as const,
                letterSpacing:'.08em', marginBottom:14 }}>Top 5 Trades</div>
              {[...trades].sort((a,b)=>parseFloat(b.net_pnl||0)-parseFloat(a.net_pnl||0)).slice(0,5).map(t=>(
                <div key={t.id} style={{ display:'flex', justifyContent:'space-between',
                  padding:'8px 0', borderBottom:'1px solid #111626', fontSize:12 }}>
                  <span style={{ color:'#E8ECF4' }}>{t.symbol} <span style={{ color:'#556080' }}>{t.bias}</span></span>
                  <span style={{ color:'#00C97A', fontWeight:700 }}>+{parseFloat(t.net_pnl||0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'#0c0f1a', border:'1px solid rgba(240,64,96,.15)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:11, color:'#f04060', textTransform:'uppercase' as const,
                letterSpacing:'.08em', marginBottom:14 }}>Bottom 5 Trades</div>
              {[...trades].sort((a,b)=>parseFloat(a.net_pnl||0)-parseFloat(b.net_pnl||0)).slice(0,5).map(t=>(
                <div key={t.id} style={{ display:'flex', justifyContent:'space-between',
                  padding:'8px 0', borderBottom:'1px solid #111626', fontSize:12 }}>
                  <span style={{ color:'#E8ECF4' }}>{t.symbol} <span style={{ color:'#556080' }}>{t.bias}</span></span>
                  <span style={{ color:'#f04060', fontWeight:700 }}>{parseFloat(t.net_pnl||0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
