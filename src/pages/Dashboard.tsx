import React, { useEffect, useState } from 'react';
import { getTrades, getSignals, getAccounts, getPerformance } from '../api/client';
import api from '../api/client';
import Journal from './journal/Journal';
import Insights from './insights/Insights';
import Settings from './settings/Settings';
import AccountSetup from './setup/AccountSetup';
import Bias from './bias/Bias';
import Reports from './reports/Reports';
import { useAuth } from '../context/AuthContext';

const Logo = () => (
  <svg width="140" height="28" viewBox="0 0 180 40" fill="none">
    <rect x="0" y="6" width="4" height="22" rx="2" fill="#00C97A"/>
    <rect x="6" y="3" width="4" height="28" rx="2" fill="#00C97A" opacity=".7"/>
    <rect x="12" y="0" width="4" height="34" rx="2" fill="#00C97A" opacity=".9"/>
    <rect x="18" y="5" width="4" height="24" rx="2" fill="#F0A500"/>
    <rect x="24" y="10" width="4" height="16" rx="2" fill="#00C97A" opacity=".6"/>
    <rect x="30" y="2" width="4" height="30" rx="2" fill="#00C97A"/>
    <text x="40" y="24" fontFamily="Georgia,serif" fontSize="16" fontWeight="700" fill="#E8ECF4">Trade</text>
    <text x="82" y="24" fontFamily="Georgia,serif" fontSize="16" fontWeight="400" fill="#00C97A">Pattrnly</text>
  </svg>
);

function formatPnl(v: number) {
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}

function Badge({ type }: { type: string }) {
  const cls = type === 'BUY' ? 'badge-buy' : type === 'SELL' ? 'badge-sell' : '';
  return <span className={`badge ${cls}`}>{type}</span>;
}

function ScannerBadge({ s }: { s: string }) {
  const colors: any = { S1: 'var(--green)', S2: 'var(--blue)', MANUAL: 'var(--muted)' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 3,
      fontSize: 10, fontWeight: 700, border: '1px solid var(--border2)',
      color: colors[s] || 'var(--muted)', background: 'var(--bg4)'
    }}>{s}</span>
  );
}

export default function Dashboard() {
  const { tenant, logout } = useAuth();
  const [tab,         setTab]         = useState('main');
  const [trades,      setTrades]      = useState<any[]>([]);
  const [openTrades,  setOpenTrades]  = useState<any[]>([]);
  const [signals,     setSignals]     = useState<any[]>([]);
  const [accounts,    setAccounts]    = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);

  const [loading,     setLoading]     = useState(true);
  const [alerts,      setAlerts]      = useState<any[]>([]);
  const [showSetup,   setShowSetup]   = useState(false);

  const loadData = async () => {
    try {
      // Critical data — load separately so one failure doesn't block others
      const [accRes, perfRes] = await Promise.all([
        getAccounts().catch(() => ({ data: [] })),
        getPerformance().catch(() => ({ data: null })),
      ]);
      setAccounts(accRes.data);
      setPerformance(perfRes.data);


      const [tradeRes, openRes, sigRes] = await Promise.all([
        getTrades({ status: 'CLOSED', period: 'today' }).catch(() => ({ data: [] })),
        getTrades({ status: 'OPEN' }).catch(() => ({ data: [] })),
        getSignals('PENDING').catch(() => ({ data: [] })),
        Promise.resolve({ data: {} }),
      ]);
      setTrades(tradeRes.data);
      setOpenTrades(openRes.data);
      setSignals(sigRes.data);

      // Load alerts
      try {
        const alertRes = await api.get('/api/v1/alerts');
        setAlerts(alertRes.data || []);
      } catch(e) {}
      // Check if setup needed - localStorage is the gate
      const setupSeen = localStorage.getItem('setup_seen');
      if (!setupSeen && accRes.data?.length && !accRes.data[0].setup_complete) {
        setShowSetup(true);
      } else if (setupSeen) {
        setShowSetup(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const account = accounts[0];
  const todayPnl = performance?.today?.net_pnl || 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Logo />
          {(['main', 'performance', 'journal', 'bias', 'reports', 'insights', 'settings'] as const).map(t => (
            <span key={t}
              onClick={() => setTab(t)}
              style={{
                cursor: 'pointer', fontSize: 11, fontWeight: 700,
                letterSpacing: '.06em', textTransform: 'uppercase',
                color: tab === t ? 'var(--amber)' : 'var(--muted)',
                borderBottom: tab === t ? '2px solid var(--amber)' : '2px solid transparent',
                paddingBottom: 2,
              }}>
              {t}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {accounts.length > 1 && (
            <select
              onChange={e => {
                const acc = accounts.find((a: any) => a.id === e.target.value);
                if (acc) setAccounts([acc, ...accounts.filter((a: any) => a.id !== acc.id)]);
              }}
              style={{ background: '#0c0f1a', border: '1px solid #252d42',
                color: '#E8ECF4', padding: '4px 8px', borderRadius: 4,
                fontSize: 11, fontFamily: 'inherit' }}>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.label || a.server} ({a.currency})</option>
              ))}
            </select>
          )}
          {account && (
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>
              Balance: <span style={{ color: 'var(--text)' }}>
                {account.currency} {Number(account.balance).toFixed(2)}
              </span>
            </span>
          )}
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>
            Daily P&L: <span className={todayPnl >= 0 ? 'green' : 'red'}>
              {formatPnl(todayPnl)}
            </span>
          </span>
          {alerts.length > 0 && (
            <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700,
              background:'rgba(240,64,96,.15)', color:'#f04060', cursor:'pointer' }}
              onClick={() => setTab('main')}>
              ⚠ {alerts.length} alert{alerts.length>1?'s':''}
            </span>
          )}
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{tenant?.email}</span>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '4px 10px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {showSetup && accounts[0] && (
          <AccountSetup
            accountId={accounts[0]?.id || ''}
            onComplete={() => {
              localStorage.setItem('setup_seen', '1');
              setShowSetup(false);
              loadData();
            }}
          />
        )}
        {loading ? (
          <div className="empty">Loading...</div>
        ) : (
          <>
            {tab === 'main' && <MainTab openTrades={openTrades} trades={trades} accounts={accounts} performance={performance} />}
            {tab === 'performance' && <PerformanceTab performance={performance} trades={trades} />}
            {tab === 'signals' && <SignalsTab signals={signals} onRefresh={loadData} />}
            {tab === 'journal'   && <Journal />}
            {tab === 'insights'  && <Insights />}
            {tab === 'settings'  && <Settings />}
            {tab === 'bias'      && <Bias />}
            {tab === 'reports'   && <Reports />}
            {/* Account setup wizard - show if first account not setup */}
            {!loading && accounts.length > 0 && !accounts[0].setup_complete && (
              <AccountSetup accountId={accounts[0]?.id || ''} onComplete={() => { localStorage.setItem('setup_seen','1');
                const updated = [...accounts];
                updated[0] = { ...updated[0], setup_complete: true };
                setAccounts(updated);
              }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── MAIN TAB ──
function MainTab({ openTrades, trades, accounts, performance }: any) {
  const today  = performance?.today || {};
  const pnl    = parseFloat(today.net_pnl || 0);
  const wr     = parseFloat(today.win_rate || 0);
  const account = accounts?.[0];

  // Weekly equity points (last 7 days from trades)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Top stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        {[
          { label:'Balance',     value: account ? `${account.currency} ${parseFloat(account.balance||0).toLocaleString()}` : '—', color:'#E8ECF4' },
          { label:'Today P&L',   value: formatPnl(pnl),  color: pnl>=0?'var(--green)':'var(--red)' },
          { label:'Win Rate',    value: `${wr}%`,         color: wr>=50?'var(--green)':wr>=40?'var(--amber)':'var(--red)' },
          { label:'Trades Today',value: today.trades||0,  color:'#E8ECF4' },
          { label:'Open',        value: openTrades.length, color: openTrades.length>0?'var(--amber)':'var(--muted)' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:6,
              textTransform:'uppercase', letterSpacing:'.06em' }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.color,
              fontFamily:'Georgia,serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Open positions */}
        <div className="card">
          <div className="section-title">Open Positions</div>
          {openTrades.length === 0 ? (
            <div className="empty">No open positions</div>
          ) : (
            <table>
              <thead><tr>
                <th>Symbol</th><th>Dir</th><th>Entry</th><th>SL</th><th>TP</th><th>Scanner</th>
              </tr></thead>
              <tbody>
                {openTrades.map((t: any) => {
                  const dec = parseFloat(t.entry_price||0) > 100 ? 2 : 5;
                  return (
                    <tr key={t.id}>
                      <td style={{ color:'var(--amber)', fontWeight:700 }}>{t.symbol}</td>
                      <td><Badge type={t.bias} /></td>
                      <td>{parseFloat(t.entry_price||0).toFixed(dec)}</td>
                      <td className="red">{t.sl ? parseFloat(t.sl).toFixed(dec) : '—'}</td>
                      <td className="green">{t.tp ? parseFloat(t.tp).toFixed(dec) : '—'}</td>
                      <td><ScannerBadge s={t.scanner} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Today summary */}
        <div className="card">
          <div className="section-title">Today at a Glance</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Wins',      value: today.wins||0,   color:'var(--green)' },
              { label:'Losses',    value: today.losses||0, color:'var(--red)' },
              { label:'Gross P&L', value: formatPnl(parseFloat(today.gross_pnl||0)), color: parseFloat(today.gross_pnl||0)>=0?'var(--green)':'var(--red)' },
              { label:'Commission',value: parseFloat(today.commission||0).toFixed(2), color:'var(--muted)' },
              { label:'Net P&L',   value: formatPnl(pnl), color: pnl>=0?'var(--green)':'var(--red)' },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--muted)' }}>{r.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent closed trades */}
      <div className="card">
        <div className="section-title">Today's Closed Trades</div>
        {trades.length === 0 ? <div className="empty">No closed trades today</div> : (
          <table>
            <thead><tr>
              <th>Time</th><th>Symbol</th><th>Dir</th><th>Scanner</th>
              <th>Entry</th><th>Close</th><th>Lot</th><th>Commission</th><th>Net P&L</th><th>RR</th><th>Result</th>
            </tr></thead>
            <tbody>
              {trades.map((t: any) => {
                const win   = (t.execution_outcome||'').startsWith('WIN');
                const trail = (t.execution_outcome||'').includes('TRAIL');
                const dec   = parseFloat(t.entry_price||0) > 100 ? 2 : 5;
                const comm  = parseFloat(t.commission||0);
                return (
                  <tr key={t.id}>
                    <td className="muted">{t.close_time ? new Date(t.close_time).toLocaleTimeString() : '—'}</td>
                    <td style={{ color:'var(--amber)', fontWeight:700 }}>{t.symbol}</td>
                    <td><Badge type={t.bias} /></td>
                    <td><ScannerBadge s={t.scanner} /></td>
                    <td>{parseFloat(t.entry_price||0).toFixed(dec)}</td>
                    <td>{t.close_price ? parseFloat(t.close_price).toFixed(dec) : '—'}</td>
                    <td className="muted">{t.lot}</td>
                    <td className="muted">{comm !== 0 ? comm.toFixed(2) : '—'}</td>
                    <td className={win ? 'green' : 'red'}>{formatPnl(parseFloat(t.net_pnl||0))}</td>
                    <td className="muted">{t.rr_actual ? `${parseFloat(t.rr_actual).toFixed(2)}R` : '—'}</td>
                    <td>
                      <span style={{ padding:'2px 6px', borderRadius:3, fontSize:10, fontWeight:700,
                        background: win?'rgba(0,201,122,.15)':'rgba(240,64,96,.15)',
                        color: win?'var(--green)':'var(--red)' }}>
                        {trail?'TRAIL':win?'WIN':'LOSS'}
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
function PerformanceTab({ performance, trades }: any) {
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
  const pts = equity.map((v:number,i:number) =>
    `${(i/(equity.length-1||1)*100).toFixed(1)},${(80-((v-minEq)/range*70+5)).toFixed(1)}`).join(' ');

  // By symbol
  const bySymbol: any = {};
  trades.forEach((t:any) => {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = {wins:0,losses:0,pnl:0};
    if ((t.execution_outcome||'').startsWith('WIN')) bySymbol[t.symbol].wins++;
    else bySymbol[t.symbol].losses++;
    bySymbol[t.symbol].pnl += parseFloat(t.net_pnl||0);
  });
  const symList = Object.entries(bySymbol)
    .map(([sym,d]:any)=>({sym,...d,wr:Math.round(d.wins/(d.wins+d.losses)*100),pnl:parseFloat(d.pnl.toFixed(2))}))
    .sort((a:any,b:any)=>b.pnl-a.pnl);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
        {[
          { label:'Net P&L',       value:formatPnl(netPnl),    cls:netPnl>=0?'green':'red' },
          { label:'Gross P&L',     value:formatPnl(grossPnl),  cls:grossPnl>=0?'green':'red' },
          { label:'Commission',    value:totalComm.toFixed(2), cls:'muted' },
          { label:'Win Rate',      value:`${wr}%`,             cls:wr>=50?'green':wr>=40?'amber':'red' },
          { label:'Profit Factor', value:pf.toFixed(2),        cls:pf>=1.5?'green':pf>=1?'amber':'red' },
          { label:'Trades',        value:`${wins.length}W / ${losses.length}L`, cls:'' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize:9, color:'var(--muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }}>{s.label}</div>
            <div style={{ fontSize:16, fontWeight:700 }} className={s.cls}>{s.value}</div>
          </div>
        ))}
      </div>

      {equity.length > 1 && (
        <div className="card">
          <div className="section-title">Equity Curve</div>
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
        <div className="card">
          <div className="section-title">Performance by Instrument</div>
          <table>
            <thead><tr><th>Symbol</th><th>Trades</th><th>Win Rate</th><th>Net P&L</th></tr></thead>
            <tbody>
              {symList.map((s:any) => (
                <tr key={s.sym}>
                  <td style={{ fontWeight:700, color:'var(--amber)' }}>{s.sym}</td>
                  <td className="muted">{s.wins+s.losses}</td>
                  <td style={{ color:s.wr>=50?'var(--green)':s.wr>=40?'var(--amber)':'var(--red)' }}>{s.wr}%</td>
                  <td className={s.pnl>=0?'green':'red'}>{formatPnl(s.pnl)}</td>
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
  const { toggleSignal, cancelSignal } = require('../api/client');
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setLoading(id);
    await toggleSignal(id);
    await onRefresh();
    setLoading(null);
  };

  const handleCancel = async (id: string) => {
    setLoading(id);
    await cancelSignal(id);
    await onRefresh();
    setLoading(null);
  };

  return (
    <div className="card">
      <div className="section-title">Active Signals</div>
      {signals.length === 0 ? <div className="empty">No active signals</div> : (
        <table>
          <thead><tr>
            <th>Time</th><th>Symbol</th><th>Dir</th><th>Scanner</th>
            <th>Entry</th><th>SL</th><th>TP</th><th>RR</th><th>Fire</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {signals.map((s: any) => (
              <tr key={s.id}>
                <td className="muted">{new Date(s.signal_time).toLocaleTimeString()}</td>
                <td className="amber">{s.symbol}</td>
                <td><Badge type={s.bias} /></td>
                <td><ScannerBadge s={s.scanner} /></td>
                <td>{s.entry}</td>
                <td className="red">{s.sl}</td>
                <td className="green">{s.tp}</td>
                <td className="amber">{s.rr_target}R</td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                    background: s.fire_enabled ? 'rgba(0,201,122,.15)' : 'rgba(240,64,96,.15)',
                    color: s.fire_enabled ? 'var(--green)' : 'var(--red)',
                    cursor: 'pointer',
                  }} onClick={() => handleToggle(s.id)}>
                    {s.fire_enabled ? 'FIRE ON' : 'FIRE OFF'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost" onClick={() => handleCancel(s.id)}
                    disabled={loading === s.id} style={{ padding: '2px 8px', fontSize: 10 }}>
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
