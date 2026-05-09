import React, { useEffect, useState } from 'react';
import { getTrades, getSignals, getAccounts, getPerformance } from '../api/client';
import api from '../api/client';
import Sidebar from '../components/layout/Sidebar';
import Journal from './journal/Journal';
import Insights from './insights/Insights';
import Settings from './settings/Settings';
import AccountSetup from './setup/AccountSetup';
import Reports from './reports/Reports';
import CalendarPage from './calendar/CalendarPage';
import PlanPage from './plan/PlanPage';
import { useAuth } from '../context/AuthContext';

function fmt(n: number) { const abs = Math.abs(n).toFixed(2); return (n >= 0 ? '+$' : '-$') + abs; }

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
function MainTab({ openTrades, trades, accounts, performance, alerts, setAlerts }: any) {
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
              { label: 'Wins Today',      value: today.wins || 0,                color: '#00C97A' },
              { label: 'Losses Today',    value: today.losses || 0,              color: '#f04060' },
              { label: 'Gross P&L',       value: fmt(parseFloat(today.gross_pnl||0)), color: parseFloat(today.gross_pnl||0)>=0?'#00C97A':'#f04060' },
              { label: 'Commission',      value: (parseFloat(today.commission||0)).toFixed(2), color: '#556080' },
              { label: "Today's Net P&L", value: fmt(pnl),                       color: pnl>=0?'#00C97A':'#f04060' },
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

      {/* Alerts panel */}
      {alerts && alerts.length > 0 && (
        <div style={{ background:'rgba(240,64,96,0.05)', border:'1px solid rgba(240,64,96,0.2)',
          borderRadius:8, padding:'16px 20px' }}>
          <div style={{ fontSize:10, color:'#f04060', textTransform:'uppercase' as const,
            letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
            ⚠ Alerts ({alerts.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {alerts.map((a:any) => (
              <div key={a.id} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'8px 12px', background:'#111626',
                borderRadius:6, borderLeft:'3px solid #f04060' }}>
                <div>
                  <span style={{ fontSize:11, color:'#E8ECF4' }}>{a.message}</span>
                  <span style={{ fontSize:10, color:'#556080', marginLeft:10 }}>
                    {new Date(a.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <button onClick={async () => {
                  await api.put(`/api/v1/alerts/${a.id}/read`);
                  setAlerts((prev: any[]) => prev.filter((x:any) => x.id !== a.id));
                }} style={{ background:'none', border:'none', color:'#556080',
                  cursor:'pointer', fontSize:16, padding:'0 4px' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

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
  const range = maxEq - minEq || 1; // eslint-disable-line @typescript-eslint/no-unused-vars

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

      {equity.length > 1 && (() => {
        const W = 900; const H = 140;
        const padL = 55; const padR = 10; const padT = 10; const padB = 25;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;
        const color  = netPnl >= 0 ? '#00C97A' : '#f04060';
        const toX = (i:number) => padL + (i / (equity.length-1)) * chartW;
        const toY = (v:number) => padT + chartH - ((v - minEq) / (maxEq - minEq || 1)) * chartH;
        const linePts = equity.map((v:number,i:number) => `${toX(i)},${toY(v)}`).join(' ');
        const areaPts = `${padL},${padT+chartH} ${linePts} ${padL+chartW},${padT+chartH}`;
        return (
          <div style={{ background:'#0c0f1a', border:'1px solid #111626', borderRadius:8, padding:20 }}>
            <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
              letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>Equity Curve</div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display:'block', overflow:'visible' }}>
              <defs>
                <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
                  <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
                </linearGradient>
              </defs>
              {/* Y grid + labels */}
              {[0,0.25,0.5,0.75,1].map((pct,i) => {
                const v = maxEq - pct*(maxEq-minEq);
                const y = padT + pct*chartH;
                return (
                  <g key={i}>
                    <line x1={padL} y1={y} x2={padL+chartW} y2={y} stroke="#111626" strokeWidth="0.5"/>
                    <text x={padL-4} y={y+3} fill="#3a4560" fontSize="8" textAnchor="end" fontFamily="Inter,sans-serif">
                      {v>=0?'+':''}{v.toFixed(0)}
                    </text>
                  </g>
                );
              })}
              {/* Zero line */}
              {minEq < 0 && maxEq > 0 && (
                <line x1={padL} y1={toY(0)} x2={padL+chartW} y2={toY(0)}
                  stroke="#252d42" strokeWidth="1" strokeDasharray="3,3"/>
              )}
              {/* Fill */}
              <polygon points={areaPts} fill="url(#eqFill)"/>
              {/* Line */}
              <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.5"/>
              {/* X date labels */}
              {[0,0.2,0.4,0.6,0.8,1].map((pct,i) => {
                const idx2 = Math.min(equity.length-1, Math.floor(pct*(equity.length-1)));
                const t = trades[idx2];
                if (!t) return null;
                const d = new Date(t.close_time||t.open_time);
                return (
                  <text key={i} x={toX(idx2)} y={H-4}
                    fill="#3a4560" fontSize="8" textAnchor="middle" fontFamily="Inter,sans-serif">
                    {d.getUTCDate()}/{d.getUTCMonth()+1}
                  </text>
                );
              })}
            </svg>
          </div>
        );
      })()}

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

// ── MAIN DASHBOARD ──
export default function Dashboard() {
  const { tenant } = useAuth();
  const [tab,         setTab]         = useState('dashboard');
  const [trades,      setTrades]      = useState<any[]>([]);
  const [allTrades,   setAllTrades]   = useState<any[]>([]);
  const [openTrades,  setOpenTrades]  = useState<any[]>([]);
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

      const [tradeRes, allTradeRes, openRes, alertRes] = await Promise.all([
        getTrades({ status: 'CLOSED', period: 'today' }).catch(() => ({ data: [] })),
        getTrades({ status: 'CLOSED', period: 'all' }).catch(() => ({ data: [] })),
        getTrades({ status: 'OPEN' }).catch(() => ({ data: [] })),
        getSignals('PENDING').catch(() => ({ data: [] })),
        api.get('/api/v1/alerts').catch(() => ({ data: [] })),
      ]);
      setTrades(tradeRes.data);
      setAllTrades(allTradeRes.data);
      setOpenTrades(openRes.data);
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
      case 'dashboard':   return <MainTab openTrades={openTrades} trades={trades} accounts={accounts} performance={performance} alerts={alerts} setAlerts={setAlerts} />;
      case 'journal':     return <Journal />;
      case 'calendar':    return <CalendarPage />;
      case 'performance': return <PerformanceTab trades={allTrades} />;
      case 'reports':     return <Reports />;
      case 'plan':       return <PlanPage />;
      case 'insights':    return isPro ? <Insights /> : <div style={{ textAlign:'center', padding:60, color:'#556080' }}>Available on Pro plan</div>;
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