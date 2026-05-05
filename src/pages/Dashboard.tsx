import React, { useEffect, useState } from 'react';
import { getTrades, getSignals, getAccounts, getPerformance, getBias } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  const [narrative,   setNarrative]   = useState<any>({});
  const [loading,     setLoading]     = useState(true);

  const loadData = async () => {
    try {
      const [tradeRes, openRes, sigRes, accRes, perfRes, biasRes] = await Promise.all([
        getTrades({ status: 'CLOSED', period: 'today' }),
        getTrades({ status: 'OPEN' }),
        getSignals('PENDING'),
        getAccounts(),
        getPerformance(),
        getBias('S3'),
      ]);
      setTrades(tradeRes.data);
      setOpenTrades(openRes.data);
      setSignals(sigRes.data);
      setAccounts(accRes.data);
      setPerformance(perfRes.data);
      setNarrative(biasRes.data);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'var(--amber)', fontWeight: 700, letterSpacing: '.1em' }}>
            MT5 SCANNER
          </span>
          {['main', 'performance', 'signals'].map(t => (
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
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{tenant?.email}</span>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '4px 10px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div className="empty">Loading...</div>
        ) : (
          <>
            {tab === 'main' && <MainTab openTrades={openTrades} trades={trades} narrative={narrative} performance={performance} />}
            {tab === 'performance' && <PerformanceTab performance={performance} trades={trades} />}
            {tab === 'signals' && <SignalsTab signals={signals} onRefresh={loadData} />}
          </>
        )}
      </div>
    </div>
  );
}

// ── MAIN TAB ──
function MainTab({ openTrades, trades, narrative, performance }: any) {
  const today = performance?.today || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Net P&L Today', value: formatPnl(today.net_pnl || 0), cls: today.net_pnl >= 0 ? 'green' : 'red' },
          { label: 'Trades', value: today.trades || 0, cls: '' },
          { label: 'Win Rate', value: `${today.win_rate || 0}%`, cls: 'amber' },
          { label: 'Open Positions', value: openTrades.length, cls: '' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }} className={s.cls}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Open positions */}
      <div className="card">
        <div className="section-title">Open Positions</div>
        {openTrades.length === 0 ? <div className="empty">No open positions</div> : (
          <table>
            <thead><tr>
              <th>Symbol</th><th>Dir</th><th>Scanner</th><th>Lot</th>
              <th>Entry</th><th>SL</th><th>TP</th><th>Float P&L</th>
            </tr></thead>
            <tbody>
              {openTrades.map((t: any) => (
                <tr key={t.id}>
                  <td className="amber">{t.symbol}</td>
                  <td><Badge type={t.bias} /></td>
                  <td><ScannerBadge s={t.scanner} /></td>
                  <td>{t.lot}</td>
                  <td>{t.entry_price}</td>
                  <td className="red">{t.sl || '—'}</td>
                  <td className="green">{t.tp || '—'}</td>
                  <td>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Today's closed trades */}
      <div className="card">
        <div className="section-title">Today's Closed Trades</div>
        {trades.length === 0 ? <div className="empty">No closed trades today</div> : (
          <table>
            <thead><tr>
              <th>Time</th><th>Symbol</th><th>Dir</th><th>Scanner</th>
              <th>Lot</th><th>Entry</th><th>Close</th><th>Result</th><th>Net P&L</th><th>RR</th>
            </tr></thead>
            <tbody>
              {trades.map((t: any) => {
                const win = (t.execution_outcome || '').startsWith('WIN');
                const isTrail = (t.execution_outcome || '').includes('TRAIL');
                return (
                  <tr key={t.id}>
                    <td className="muted">{t.close_time ? new Date(t.close_time).toLocaleTimeString() : '—'}</td>
                    <td className="amber">{t.symbol}</td>
                    <td><Badge type={t.bias} /></td>
                    <td><ScannerBadge s={t.scanner} /></td>
                    <td>{t.lot}</td>
                    <td>{t.entry_price}</td>
                    <td>{t.close_price || '—'}</td>
                    <td>
                      <span style={{
                        padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                        background: win ? 'rgba(0,201,122,.15)' : 'rgba(240,64,96,.15)',
                        color: win ? 'var(--green)' : 'var(--red)',
                      }}>
                        {isTrail ? 'TRAIL' : win ? 'WIN' : 'LOSS'}
                      </span>
                    </td>
                    <td className={win ? 'green' : 'red'}>{formatPnl(t.net_pnl || 0)}</td>
                    <td className="muted">{t.rr_actual ? `${t.rr_actual}R` : '—'}</td>
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
  const today = performance?.today || {};
  const periods = [
    { label: 'Today',    data: performance?.today },
    { label: 'This Week',data: null },
    { label: 'This Month',data: null },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Net P&L',   value: formatPnl(today.net_pnl || 0),      cls: today.net_pnl >= 0 ? 'green' : 'red' },
          { label: 'Trades',    value: today.trades || 0,                    cls: '' },
          { label: 'Wins',      value: today.wins || 0,                      cls: 'green' },
          { label: 'Win Rate',  value: `${today.win_rate || 0}%`,            cls: 'amber' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }} className={s.cls}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title">Trade History</div>
        {trades.length === 0 ? <div className="empty">No trades</div> : (
          <table>
            <thead><tr>
              <th>Time</th><th>Symbol</th><th>Dir</th><th>Scanner</th>
              <th>Net P&L</th><th>RR</th><th>Result</th>
            </tr></thead>
            <tbody>
              {trades.map((t: any) => {
                const win = (t.execution_outcome || '').startsWith('WIN');
                return (
                  <tr key={t.id}>
                    <td className="muted">{t.close_time ? new Date(t.close_time).toLocaleTimeString() : '—'}</td>
                    <td className="amber">{t.symbol}</td>
                    <td><Badge type={t.bias} /></td>
                    <td><ScannerBadge s={t.scanner} /></td>
                    <td className={win ? 'green' : 'red'}>{formatPnl(t.net_pnl || 0)}</td>
                    <td className="muted">{t.rr_actual ? `${t.rr_actual}R` : '—'}</td>
                    <td style={{ color: win ? 'var(--green)' : 'var(--red)', fontSize: 10, fontWeight: 700 }}>
                      {t.execution_outcome || '—'}
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
