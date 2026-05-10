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


export default function Reports() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrades({ status:'CLOSED', period:'all' })
      .then(r => setTrades(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPnl  = trades.reduce((s,t) => s+parseFloat(t.net_pnl||0),0);
  const wins      = trades.filter(t => (t.execution_outcome||'').startsWith('WIN')).length;
  const wr        = trades.length > 0 ? Math.round(wins/trades.length*100) : 0;
  const expectancy = wins > 0 && trades.length > wins
    ? (wins/trades.length) * (trades.filter(t=>(t.execution_outcome||'').startsWith('WIN')).reduce((s,t)=>s+parseFloat(t.net_pnl||0),0)/wins)
    + ((trades.length-wins)/trades.length) * (trades.filter(t=>!(t.execution_outcome||'').startsWith('WIN')).reduce((s,t)=>s+parseFloat(t.net_pnl||0),0)/(trades.length-wins))
    : 0;

  const SESSIONS   = ['Asia','London','US','London/US Overlap'];
  const PLAN_TAGS  = ['Clarity','Desperate','Reckless','Forcing Trade','Gamble'];
  const EXIT_BEHAV = ['Calm','Disciplined','Fear','Panic','Lucky','Patient','Strategic','Impatient','Greedy','Conservative'];
  const RISK_TAGS  = ['No Risk','Balanced Risk','Elevated Risk','Aggressive Risk'];

  function PerfRow({ label, wins, losses, pnl }: any) {
    const total = wins + losses;
    if (total === 0) return null;
    const wr2   = Math.round(wins/total*100);
    const color = wr2 >= 55 ? '#00C97A' : wr2 >= 40 ? '#F0A500' : '#f04060';
    return (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'10px 0', borderBottom:'1px solid #111626' }}>
        <span style={{ fontSize:12, color:'#E8ECF4', flex:1 }}>{label}</span>
        <span style={{ fontSize:11, color:'#556080', marginRight:16 }}>{total} trades</span>
        <span style={{ fontSize:12, fontWeight:700, color, marginRight:16, minWidth:52 }}>{wr2}% WR</span>
        <span style={{ fontSize:12, fontWeight:700, minWidth:72, textAlign:'right' as const,
          color: pnl >= 0 ? '#00C97A' : '#f04060' }}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
        </span>
      </div>
    );
  }

  function Section({ title, children }: any) {
    return (
      <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
        borderRadius:8, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
          letterSpacing:'.08em', fontWeight:700, marginBottom:14 }}>{title}</div>
        {children}
      </div>
    );
  }

  function tagRows(tagList: string[], field: string) {
    return tagList.map(tag => {
      const matched = trades.filter(t => ((t[field]||[]) as string[]).includes(tag));
      if (matched.length === 0) return null;
      const w   = matched.filter(t => (t.execution_outcome||'').startsWith('WIN')).length;
      const pnl = matched.reduce((s,t) => s+parseFloat(t.net_pnl||0),0);
      return { label: tag, wins: w, losses: matched.length - w, pnl: parseFloat(pnl.toFixed(2)) };
    }).filter(Boolean) as any[];
  }

  // Session matrix
  const sessionRows: any[] = [];
  SESSIONS.forEach(entryS => {
    SESSIONS.forEach(exitS => {
      const matched = trades.filter(t => {
        const eT = (t.entry_tags||[]) as string[];
        const xT = (t.exit_tags ||[]) as string[];
        return eT.includes(entryS) && xT.includes(exitS);
      });
      if (matched.length === 0) return;
      const w   = matched.filter(t => (t.execution_outcome||'').startsWith('WIN')).length;
      const pnl = matched.reduce((s,t) => s+parseFloat(t.net_pnl||0),0);
      sessionRows.push({
        label: `Opened in ${entryS} · Closed in ${exitS}`,
        wins: w, losses: matched.length - w, pnl: parseFloat(pnl.toFixed(2))
      });
    });
  });

  const entryRows = tagRows(PLAN_TAGS, 'entry_tags');
  const exitRows  = tagRows(EXIT_BEHAV, 'exit_tags');
  const riskRows  = tagRows(RISK_TAGS, 'tags');

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>
      <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif',
        color:'#E8ECF4', marginBottom:4 }}>Performance Reports</h1>
      <p style={{ color:'#556080', fontSize:12, marginBottom:24 }}>
        Based on {trades.length} closed trades
      </p>

      {loading ? (
        <div style={{ textAlign:'center', color:'#556080', padding:'60px 0' }}>Loading...</div>
      ) : trades.length === 0 ? (
        <div style={{ textAlign:'center', color:'#556080', padding:'60px 0' }}>No closed trades yet</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>

          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <StatCard label="Total Trades"  value={trades.length} />
            <StatCard label="Win Rate"      value={`${wr}%`} color={wr>=50?'#00C97A':wr>=40?'#F0A500':'#f04060'} />
            <StatCard label="Net P&L"       value={`${totalPnl>=0?'+':''}${totalPnl.toFixed(2)}`} color={totalPnl>=0?'#00C97A':'#f04060'} />
            <StatCard label="Expectancy"    value={`${expectancy>=0?'+':''}${expectancy.toFixed(2)}`} color={expectancy>=0?'#00C97A':'#f04060'} sub="per trade" />
          </div>

          <Section title="Performance by Session">
            {sessionRows.length === 0
              ? <div style={{ fontSize:12, color:'#3a4560' }}>No session data yet — entry and exit tags required</div>
              : sessionRows.map((r,i) => <PerfRow key={i} {...r} />)
            }
          </Section>

          <Section title="Performance by Entry Tag">
            {entryRows.length === 0
              ? <div style={{ fontSize:12, color:'#3a4560' }}>No entry tags yet</div>
              : entryRows.map((r,i) => <PerfRow key={i} {...r} />)
            }
          </Section>

          <Section title="Performance by Exit Tag">
            {exitRows.length === 0
              ? <div style={{ fontSize:12, color:'#3a4560' }}>No exit tags yet</div>
              : exitRows.map((r,i) => <PerfRow key={i} {...r} />)
            }
          </Section>

          <Section title="Performance by Risk Tag">
            {riskRows.length === 0
              ? <div style={{ fontSize:12, color:'#3a4560' }}>No risk tags yet</div>
              : riskRows.map((r,i) => <PerfRow key={i} {...r} />)
            }
          </Section>

        </div>
      )}
    </div>
  );
}
