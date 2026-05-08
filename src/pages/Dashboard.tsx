import React, { useEffect, useState } from 'react';
import { getTrades, getSignals, getAccounts, getPerformance } from '../api/client';
import api from '../api/client';
import Sidebar from '../components/layout/Sidebar';
import Journal from './journal/Journal';
import Insights from './insights/Insights';
import Settings from './settings/Settings';
import AccountSetup from './setup/AccountSetup';
import Bias from './bias/Bias';
import Reports from './reports/Reports';
import CalendarPage from './calendar/CalendarPage';
import { useAuth } from '../context/AuthContext';

function fmt(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2); }

function Badge({ type }: { type: string }) {
  const buy = type === 'BUY';
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 700,
      background: buy ? 'rgba(0,201,122,.12)' : 'rgba(240,64,96,.12)',
      color: buy ? '#00C97A' : '#f04060',
    }}>{type}</span>
  );
}

function SBadge({ s }: { s: string }) {
  const c = s === 'S1' ? '#00C97A' : s === 'S2' ? '#4090f0' : '#556080';
  return (
    <span style={{ padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 700,
      border: `1px solid ${c}40`, color: c, background: `${c}10` }}>{s}</span>
  );
}

function StatCard({ label, value, sub, color, small }: any) {
  return (
    <div style={{ background: '#0c0f1a', border: '1px solid #111626', borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase' as const,
        letterSpacing: '.1em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: small ? 18 : 22, fontWeight: 700, color: color || '#E8ECF4',
        fontFamily: 'Georgia,serif', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#556080', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ── MAIN TAB ──
function MainTab({ openTrades, trades, accounts, performance }: any) {
  const today   = performance?.today || {};
  const pnl     = parseFloat(today.net_pnl || 0);
  const wr      = parseFloat(today.win_rate || 0);
  const account = accounts?.[0];
  const balance = parseFloat(account?.balance || 0);

  // Best/worst case from open trades
  const bestCase = openTrades.reduce((s: number, t: any) => {
    const e = parseFloat(t.entry_price || 0);
    const tp = parseFloat(t.tp || 0);
    const lot = parseFloat(t.lot || 0);
    if (!tp || !e || !lot) return s;
    const sym = t.symbol || '';
    const isJPY = sym.includes('JPY');
    const isXAU = sym === 'XAUUSD';
    const tickSize = isJPY ? 0.01 : isXAU ? 0.01 : 0.0001;
    const tickVal  = isJPY ? 1000 : isXAU ? 1 : 10;
    const pips = Math.abs(tp - e) / tickSize;
    return s + (t.bias === 'BUY' ? 1 : -1) * (tp > e ? 1 : -1) * pips * tickVal * lot;
  }, 0);

  const worstCase = openTrades.reduce((s: number, t: any) => {
    const e = parseFloat(t.entry_price || 0);
    const sl = parseFloat(t.sl || 0);
    const lot = parseFloat(t.lot || 0);
    if (!sl || !e || !lot) return s;
    const sym = t.symbol || '';
    const isJPY = sym.includes('JPY');
    const isXAU = sym === 'XAUUSD';
    const tickSize = isJPY ? 0.01 : isXAU ? 0.01 : 0.0001;
    const tickVal  = isJPY ? 1000 : isXAU ? 1 : 10;
    const pips = Math.abs(sl - e) / tickSize;
    return s - pips * tickVal * lot;
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        <StatCard label="Balance" value={account ? `${account.currency} ${balance.toLocaleString('en',{minimumFractionDigits:2})}` : '—'} />
        <StatCard label="Today P&L" value={fmt(pnl)} color={pnl >= 0 ? '#00C97A' : '#f04060'} />
        <StatCard label="Win Rate" value={`${wr}%`} color={wr >= 50 ? '#00C97A' : wr >= 40 ? '#F0A500' : '#f04060'} sub={`${today.wins||0}W · ${today.losses||0}L`} />
        <StatCard label="Trades Today" value={today.trades || 0} />
        <StatCard label="Open" value={openTrades.length} color={openTrades.length > 0 ? '#F0A500' : '#556080'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Open positions */}
        <div style={{ background: '#0c0f1a', border: '1px solid #111626', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase' as const, letterSpacing: '.1em', fontWeight: 700 }}>
              Open Positions
            </div>
            {openTrades.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, background: 'rgba(0,201,122,.08)', border: '1px solid rgba(0,201,122,.2)',
                  borderRadius: 4, padding: '3px 8px', color: '#00C97A' }}>
                  Best {account?.currency} {(balance + bestCase).toFixed(2)}
                </span>
                <span style={{ fontSize: 10, background: 'rgba(240,64,96,.08)', border: '1px solid rgba(240,64,96,.2)',
                  borderRadius: 4, padding: '3px 8px', color: '#f04060' }}>
                  Worst {account?.currency} {(balance + worstCase).toFixed(2)}
                </span>
              </div>
            )}
          </div>
          {openTrades.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#3a4560', padding: '24px 0', fontSize: 12 }}>No open positions</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Symbol','Dir','Entry','SL','TP','Scanner'].map(h => (
                    <th key={h} style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase' as const,
                      letterSpacing: '.08em', padding: '4px 8px', textAlign: 'left' as const,
                      borderBottom: '1px solid #111626' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openTrades.map((t: any) => {
                  const dec = parseFloat(t.entry_price||0) > 100 ? 2 : 5;
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #0c0f1a' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#F0A500', fontSize: 12 }}>{t.symbol}</td>
                      <td style={{ padding: '8px' }}><Badge type={t.bias} /></td>
                      <td style={{ padding: '8px', fontSize: 12, color: '#E8ECF4' }}>{parseFloat(t.entry_price||0).toFixed(dec)}</td>
                      <td style={{ padding: '8px', fontSize: 12, color: '#f04060' }}>{t.sl ? parseFloat(t.sl).toFixed(dec) : '—'}</td>
                      <td style={{ padding: '8px', fontSize: 12, color: '#00C97A' }}>{t.tp ? parseFloat(t.tp).toFixed(dec) : '—'}</td>
                      <td style={{ padding: '8px' }}><SBadge s={t.scanner} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Today at a glance */}
        <div style={{ background: '#0c0f1a', border: '1px solid #111626', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase' as const,
            letterSpacing: '.1em', fontWeight: 700, marginBottom: 14 }}>Today at a Glance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Wins',       value: today.wins || 0,                color: '#00C97A' },
              { label: 'Losses',     value: today.losses || 0,              color: '#f04060' },
              { label: 'Gross P&L',  value: fmt(parseFloat(today.gross_pnl||0)), color: parseFloat(today.gross_pnl||0)>=0?'#00C97A':'#f04060' },
              { label: 'Commission', value: (parseFloat(today.commission||0)).toFixed(2), color: '#556080' },
              { label: 'Net P&L',    value: fmt(pnl),                       color: pnl>=0?'#00C97A':'#f04060' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: i < arr.length-1 ? '1px solid #111626' : 'none',
              }}>
                <span style={{ fontSize: 12, color: '#8899b4' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent trades */}
      <div style={{ background: '#0c0f1a', border: '1px solid #111626', borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase' as const,
          letterSpacing: '.1em', fontWeight: 700, marginBottom: 14 }}>Today's Closed Trades</div>
        {trades.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#3a4560', padding: '24px 0', fontSize: 12 }}>No closed trades today</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time','Symbol','Dir','Scanner','Entry','Exit','Lot','Commission','Net P&L','RR','Result'].map(h => (
                  <th key={h} style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase' as const,
                    letterSpacing: '.08em', padding: '4px 8px', textAlign: 'left' as const,
                    borderBottom: '1px solid #111626' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t: any) => {
                const win   = (t.execution_outcome||'').startsWith('WIN');
                const trail = (t.execution_outcome||'').includes('TRAIL');
                const dec   = parseFloat(t.entry_price||0) > 100 ? 2 : 5;
                const comm  = parseFloat(t.commission||0);
                const pnlv  = parseFloat(t.net_pnl||0);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #0c0f1a' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#111626'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td style={{ padding: '8px', fontSize: 11, color: '#556080' }}>
                      {t.close_time ? new Date(t.close_time).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}) : '—'}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#F0A500', fontSize: 12 }}>{t.symbol}</td>
                    <td style={{ padding: '8px' }}><Badge type={t.bias} /></td>
                    <td style={{ padding: '8px' }}><SBadge s={t.scanner} /></td>
                    <td style={{ padding: '8px', fontSize: 12, color: '#8899b4' }}>{parseFloat(t.entry_price||0).toFixed(dec)}</td>
                    <td style={{ padding: '8px', fontSize: 12, color: '#8899b4' }}>{t.close_price ? parseFloat(t.close_price).toFixed(dec) : '—'}</td>
                    <td style={{ padding: '8px', fontSize: 11, color: '#556080' }}>{t.lot}</td>
                    <td style={{ padding: '8px', fontSize: 11, color: '#556080' }}>{comm !== 0 ? comm.toFixed(2) : '—'}</td>
                    <td style={{ padding: '8px', fontSize: 13, fontWeight: 700, color: pnlv>=0?'#00C97A':'#f04060' }}>{fmt(pnlv)}</td>
                    <td style={{ padding: '8px', fontSize: 11, color: '#556080' }}>{t.rr_actual ? `${parseFloat(t.rr_actual).toFixed(2)}R` : '—'}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                        background: win ? 'rgba(0,201,122,.12)' : 'rgba(240,64,96,.12)',
                        color: win ? '#00C97A' : '#f04060' }}>
                        {trail ? 'TRAIL' : win ? 'WIN' : 'LOSS'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── PERFORMANCE TAB ──
function PerformanceTab({ trades }: any) {
  const wins   = trades.filter((t:any)=>(t.execution_outcome||'').startsWith('WIN'));
  const losses = trades.filter((t:any)=>(t.execution_outcome||'').startsWith('LOSS'));
  const netPnl = trades.reduce((s:number,t:any)=>s+parseFloat(t.net_pnl||0),0);
  const grossPnl = trades.reduce((s:number,t:any)=>s+parseFloat(t.gross_pnl||0),0);
  const totalComm = trades.reduce((s:number,t:any)=>s+parseFloat(t.commission||0),0);
  const pf = losses.length > 0
    ? Math.abs(wins.reduce((s:number,t:any)=>s+parseFloat(t.net_pnl||0),0)) /
      Math.abs(losses.reduce((s:number,t:any)=>s+parseFloat(t.net_pnl||0),0)) : 0;
  const wr = trades.length > 0 ? Math.round(wins.length/trades.length*100) : 0;

  // Equity curve
  let cum = 0;
  const equity = trades.map((t:any) => { cum += parseFloat(t.net_pnl||0); return parseFloat(cum.toFixed(2)); });
  const maxEq = Math.max(...equity, 0.01);
  const minEq = Math.min(...equity, -0.01);
  const range = maxEq - minEq || 1;
  const pts = equity.length > 1
    ? equity.map((v:number,i:number) =>
        `${(i/(equity.length-1)*100).toFixed(1)},${(80-((v-minEq)/range*70+5)).toFixed(1)}`).join(' ')
    : '';

  // By symbol
  const bySymbol: any = {};
  trades.forEach((t:any) => {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = {wins:0,losses:0,pnl:0};
    if ((t.execution_outcome||'').startsWith('WIN')) bySymbol[t.symbol].wins++;
    else bySymbol[t.symbol].losses++;
    bySymbol[t.symbol].pnl += parseFloat(t.net_pnl||0);
  });
  const symList = Object.entries(bySymbol)
    .map(([sym,d]:any)=>({sym,...d,
      wr:Math.round(d.wins/(d.wins+d.losses)*100),
      pnl:parseFloat(d.pnl.toFixed(2))}))
    .sort((a:any,b:any)=>b.pnl-a.pnl);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
        <StatCard label="Net P&L"       value={fmt(netPnl)}    color={netPnl>=0?'#00C97A':'#f04060'} small />
        <StatCard label="Gross P&L"     value={fmt(grossPnl)}  color={grossPnl>=0?'#00C97A':'#f04060'} small />
        <StatCard label="Commission"    value={totalComm.toFixed(2)} color="#556080" small />
        <StatCard label="Win Rate"      value={`${wr}%`}       color={wr>=50?'#00C97A':wr>=40?'#F0A500':'#f04060'} small />
        <StatCard label="Profit Factor" value={pf.toFixed(2)}  color={pf>=1.5?'#00C97A':pf>=1?'#F0A500':'#f04060'} small />
        <StatCard label="Trades"        value={`${wins.length}W / ${losses.length}L`} small />
      </div>

      {equity.length > 1 && (
        <div style={{ background:'#0c0f1a', border:'1px solid #111626', borderRadius:8, padding:20 }}>
          <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
            letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>Equity Curve</div>
          <svg width="100%" height="80" viewBox="0 0 100 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={netPnl>=0?"#00C97A":"#f04060"} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={netPnl>=0?"#00C97A":"#f04060"} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polyline points={pts} fill="none" stroke={netPnl>=0?"#00C97A":"#f04060"} strokeWidth="0.8"/>
            <polygon points={`0,80 ${pts} 100,80`} fill="url(#eqG)"/>
          </svg>
        </div>
      )}

      {symList.length > 0 && (
        <div style={{ background:'#0c0f1a', border:'1px solid #111626', borderRadius:8, padding:20 }}>
          <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
            letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>By Instrument</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Symbol','Trades','Win Rate','Net P&L'].map(h=>(
                <th key={h} style={{ fontSize:9, color:'#556080', textTransform:'uppercase' as const,
                  letterSpacing:'.08em', padding:'4px 8px', textAlign:'left' as const,
                  borderBottom:'1px solid #111626' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {symList.map((s:any)=>(
                <tr key={s.sym} style={{ borderBottom:'1px solid #0c0f1a' }}>
                  <td style={{ padding:'8px', fontWeight:700, color:'#F0A500', fontSize:12 }}>{s.sym}</td>
                  <td style={{ padding:'8px', fontSize:12, color:'#8899b4' }}>{s.wins+s.losses}</td>
                  <td style={{ padding:'8px', fontSize:12, color:s.wr>=50?'#00C97A':s.wr>=40?'#F0A500':'#f04060' }}>{s.wr}%</td>
                  <td style={{ padding:'8px', fontSize:12, fontWeight:700, color:s.pnl>=0?'#00C97A':'#f04060' }}>{fmt(s.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── SIGNALS TAB ──
function SignalsTab({ signals, onRefresh }: any) {
  const [loading, setLoading] = useState<string|null>(null);
  const toggle = async (id:string) => { setLoading(id); await api.put(`/api/v1/signals/${id}/toggle`); await onRefresh(); setLoading(null); };
  const cancel = async (id:string) => { setLoading(id); await api.put(`/api/v1/signals/${id}/cancel`); await onRefresh(); setLoading(null); };

  return (
    <div style={{ background:'#0c0f1a', border:'1px solid #111626', borderRadius:8, padding:20 }}>
      <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
        letterSpacing:'.1em', fontWeight:700, marginBottom:14 }}>Active Signals</div>
      {signals.length === 0 ? (
        <div style={{ textAlign:'center', color:'#3a4560', padding:'40px 0', fontSize:12 }}>No active signals</div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>
            {['Time','Symbol','Dir','Scanner','Entry','SL','TP','RR','Fire','Actions'].map(h=>(
              <th key={h} style={{ fontSize:9, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.08em', padding:'4px 8px', textAlign:'left' as const,
                borderBottom:'1px solid #111626' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {signals.map((s:any)=>(
              <tr key={s.id} style={{ borderBottom:'1px solid #0c0f1a' }}>
                <td style={{ padding:'8px', fontSize:11, color:'#556080' }}>{new Date(s.signal_time).toLocaleTimeString()}</td>
                <td style={{ padding:'8px', fontWeight:700, color:'#F0A500', fontSize:12 }}>{s.symbol}</td>
                <td style={{ padding:'8px' }}><Badge type={s.bias} /></td>
                <td style={{ padding:'8px' }}><SBadge s={s.scanner} /></td>
                <td style={{ padding:'8px', fontSize:12, color:'#8899b4' }}>{s.entry}</td>
                <td style={{ padding:'8px', fontSize:12, color:'#f04060' }}>{s.sl}</td>
                <td style={{ padding:'8px', fontSize:12, color:'#00C97A' }}>{s.tp}</td>
                <td style={{ padding:'8px', fontSize:12, color:'#F0A500' }}>{s.rr_target}R</td>
                <td style={{ padding:'8px' }}>
                  <span onClick={()=>toggle(s.id)} style={{
                    padding:'2px 8px', borderRadius:3, fontSize:10, fontWeight:700, cursor:'pointer',
                    background:s.fire_enabled?'rgba(0,201,122,.12)':'rgba(240,64,96,.12)',
                    color:s.fire_enabled?'#00C97A':'#f04060' }}>
                    {s.fire_enabled?'ON':'OFF'}
                  </span>
                </td>
                <td style={{ padding:'8px' }}>
                  <button onClick={()=>cancel(s.id)} disabled={loading===s.id}
                    style={{ padding:'3px 10px', background:'transparent', border:'1px solid #252d42',
                      borderRadius:4, color:'#556080', fontSize:10, cursor:'pointer' }}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── MAIN DASHBOARD ──
export default function Dashboard() {
  const { tenant } = useAuth();
  const [tab,         setTab]         = useState('dashboard');
  const [trades,      setTrades]      = useState<any[]>([]);
  const [openTrades,  setOpenTrades]  = useState<any[]>([]);
  const [signals,     setSignals]     = useState<any[]>([]);
  const [accounts,    setAccounts]    = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [alerts,      setAlerts]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showSetup,   setShowSetup]   = useState(false);

  const loadData = async () => {
    try {
      const [accRes, perfRes] = await Promise.all([
        getAccounts().catch(() => ({ data: [] })),
        getPerformance().catch(() => ({ data: null })),
      ]);
      setAccounts(accRes.data);
      setPerformance(perfRes.data);

      const [tradeRes, openRes, sigRes, alertRes] = await Promise.all([
        getTrades({ status: 'CLOSED', period: 'today' }).catch(() => ({ data: [] })),
        getTrades({ status: 'OPEN' }).catch(() => ({ data: [] })),
        getSignals('PENDING').catch(() => ({ data: [] })),
        api.get('/api/v1/alerts').catch(() => ({ data: [] })),
      ]);
      setTrades(tradeRes.data);
      setOpenTrades(openRes.data);
      setSignals(sigRes.data);
      setAlerts(alertRes.data || []);

      const setupSeen = localStorage.getItem('setup_seen');
      if (!setupSeen && accRes.data?.length && !accRes.data[0].setup_complete) {
        setShowSetup(true);
      }
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 60000);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line

  const isElite = tenant?.subscription === 'elite' || tenant?.email === 'pnara9504@gmail.com';
  const isPro   = isElite || tenant?.subscription === 'pro' || tenant?.subscription === 'prop';

  const renderTab = () => {
    if (loading && tab === 'dashboard') return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:300, color:'#556080', fontSize:13 }}>Loading...</div>
    );
    switch(tab) {
      case 'dashboard':   return <MainTab openTrades={openTrades} trades={trades} accounts={accounts} performance={performance} />;
      case 'journal':     return <Journal />;
      case 'calendar':    return <CalendarPage />;
      case 'performance': return <PerformanceTab trades={trades} />;
      case 'reports':     return <Reports />;
      case 'bias':        return <Bias />;
      case 'insights':    return isPro ? <Insights /> : <div style={{ textAlign:'center', padding:60, color:'#556080' }}>Available on Pro plan</div>;
      case 'signals':     return isElite ? <SignalsTab signals={signals} onRefresh={loadData} /> : <div style={{ textAlign:'center', padding:60, color:'#556080' }}>Available on Elite plan</div>;
      case 'settings':    return <Settings />;
      default:            return null;
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#070b14',
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:'#E8ECF4' }}>

      {/* Setup wizard overlay */}
      {showSetup && accounts[0] && (
        <AccountSetup
          accountId={accounts[0]?.id || ''}
          onComplete={() => {
            localStorage.setItem('setup_seen','1');
            setShowSetup(false);
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={tab}
        onTabChange={setTab}
        accounts={accounts}
        tenant={tenant}
      />

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top bar */}
        <div style={{ borderBottom:'1px solid #111626', background:'#060912',
          padding:'12px 28px', display:'flex', alignItems:'center',
          justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#E8ECF4', margin:0,
              textTransform:'capitalize' }}>
              {tab === 'dashboard' ? 'Dashboard' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {alerts.length > 0 && (
              <div style={{ padding:'4px 10px', background:'rgba(240,64,96,.1)',
                border:'1px solid rgba(240,64,96,.2)', borderRadius:5,
                fontSize:11, color:'#f04060', cursor:'pointer' }}
                onClick={() => setTab('settings')}>
                ⚠ {alerts.length} alert{alerts.length > 1 ? 's' : ''}
              </div>
            )}
            <div style={{ fontSize:11, color:'#556080' }}>
              <span style={{ color:'#E8ECF4', fontWeight:600 }}>{tenant?.name || tenant?.email?.split('@')[0]}</span>
              {' · '}
              <span style={{ color: tenant?.subscription === 'elite' ? '#F0A500' :
                tenant?.subscription === 'pro' ? '#00C97A' : '#556080',
                textTransform:'uppercase', fontSize:10, fontWeight:700 }}>
                {tenant?.subscription || 'free'}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
