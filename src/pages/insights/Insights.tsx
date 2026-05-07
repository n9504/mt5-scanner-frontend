import React, { useState, useEffect } from 'react';
import api, { getTrades } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ADMIN_EMAIL = 'pnara9504@gmail.com';

function StatBar({ label, value, max, color }: any) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#8899b4' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#E8ECF4', fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: '#1a1f30', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color || '#00C97A',
          borderRadius: 3, transition: 'width 1s ease' }}/>
      </div>
    </div>
  );
}

function InsightCard({ icon, title, content, color, type }: any) {
  const borderColor = type === 'warning' ? '#f04060' :
                      type === 'positive' ? '#00C97A' : '#4090f0';
  return (
    <div style={{
      background: '#0c0f1a', border: `1px solid ${borderColor}30`,
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 8, padding: '16px 20px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#E8ECF4',
            marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#8899b4', lineHeight: 1.7 }}>{content}</div>
        </div>
      </div>
    </div>
  );
}

function ProjectionCard({ current, projected, label }: any) {
  const positive = projected >= 0;
  return (
    <div style={{ background: '#0c0f1a', border: '1px solid #1a1f30',
      borderRadius: 8, padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
        letterSpacing: '.08em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700,
        color: positive ? '#00C97A' : '#f04060',
        fontFamily: 'Georgia,serif' }}>
        {positive ? '+' : ''}{projected.toFixed(0)}
      </div>
      <div style={{ fontSize: 11, color: '#556080', marginTop: 6 }}>
        Based on current trajectory
      </div>
    </div>
  );
}

export default function Insights() {
  const { tenant } = useAuth();
  const isAdmin = tenant?.email === ADMIN_EMAIL;

  const [trades,    setTrades]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [insight,   setInsight]   = useState<any>(null);
  const [lastRun,   setLastRun]   = useState<string|null>(null);
  const [canRun,    setCanRun]    = useState(false);

  useEffect(() => {
    loadData();
    checkLastRun();
  }, []); // eslint-disable-line

  const loadData = async () => {
    try {
      const r = await getTrades({ status: 'CLOSED', period: 'all' });
      setTrades(r.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const checkLastRun = async () => {
    try {
      const r = await api.get('/api/v1/insights/last');
      if (r.data?.last_run) {
        setLastRun(r.data.last_run);
        setInsight(r.data.insight);
        const lastDate = new Date(r.data.last_run);
        const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        setCanRun(isAdmin || daysSince >= 7);
      } else {
        setCanRun(true);
      }
    } catch(e) { setCanRun(true); }
  };

  const runAnalysis = async () => {
    setAnalysing(true);
    try {
      const r = await api.post('/api/v1/insights/analyse');
      setInsight(r.data);
      setLastRun(new Date().toISOString());
      setCanRun(false);
    } catch(e) { console.error(e); }
    setAnalysing(false);
  };

  const totalTrades = trades.length;
  const wins   = trades.filter(t => (t.execution_outcome||'').startsWith('WIN')).length;
  const losses = trades.filter(t => (t.execution_outcome||'').startsWith('LOSS')).length;
  const netPnl = trades.reduce((s,t) => s + parseFloat(t.net_pnl||0), 0);
  const winRate = totalTrades > 0 ? (wins/totalTrades*100).toFixed(1) : '0';

  // By session
  const bySession: Record<string, {wins:number;losses:number;pnl:number}> = {};
  trades.forEach(t => {
    const s = t.session || 'Unknown';
    if (!bySession[s]) bySession[s] = {wins:0,losses:0,pnl:0};
    if ((t.execution_outcome||'').startsWith('WIN')) bySession[s].wins++;
    else bySession[s].losses++;
    bySession[s].pnl += parseFloat(t.net_pnl||0);
  });

  // By symbol
  const bySymbol: Record<string, {wins:number;losses:number;pnl:number;count:number}> = {};
  trades.forEach(t => {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = {wins:0,losses:0,pnl:0,count:0};
    bySymbol[t.symbol].count++;
    bySymbol[t.symbol].pnl += parseFloat(t.net_pnl||0);
    if ((t.execution_outcome||'').startsWith('WIN')) bySymbol[t.symbol].wins++;
    else bySymbol[t.symbol].losses++;
  });

  // Weekly projection
  const weeksTrading = Math.max(1, totalTrades / 5);
  const weeklyAvg = netPnl / weeksTrading;
  const yearEndProjection = weeklyAvg * 52;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Georgia,serif',
            color: '#E8ECF4', marginBottom: 6 }}>Trading Insights</h1>
          <p style={{ fontSize: 12, color: '#556080' }}>
            {totalTrades} trades analysed · {lastRun
              ? `Last run: ${new Date(lastRun).toLocaleDateString()}`
              : 'Not yet run'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={runAnalysis}
            disabled={analysing || !canRun || totalTrades < 10}
            style={{
              padding: '10px 24px',
              background: canRun && totalTrades >= 10 ? '#9060f0' : '#1a1f30',
              border: 'none', borderRadius: 8,
              color: canRun && totalTrades >= 10 ? '#fff' : '#556080',
              fontSize: 12, fontWeight: 700, cursor: canRun && totalTrades >= 10 ? 'pointer' : 'not-allowed',
              letterSpacing: '.06em',
            }}>
            {analysing ? '🧠 Analysing...' :
             totalTrades < 10 ? `Need ${10 - totalTrades} more trades` :
             !canRun ? 'Available next week' :
             '🧠 Run AI Analysis'}
          </button>
          {!isAdmin && !canRun && (
            <div style={{ fontSize: 10, color: '#556080', marginTop: 4 }}>
              Weekly analysis — Pro/Elite plan
            </div>
          )}
          {isAdmin && (
            <div style={{ fontSize: 10, color: '#9060f0', marginTop: 4 }}>Admin — unlimited runs</div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#556080', padding: 60 }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* LEFT COLUMN */}
          <div>
            {/* Stats overview */}
            <div style={{ background: '#0c0f1a', border: '1px solid #1a1f30',
              borderRadius: 8, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: 16 }}>Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { l: 'Total Trades', v: totalTrades, c: '#E8ECF4' },
                  { l: 'Win Rate', v: `${winRate}%`, c: parseFloat(winRate) >= 50 ? '#00C97A' : '#f04060' },
                  { l: 'Net P&L', v: `${netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}`, c: netPnl >= 0 ? '#00C97A' : '#f04060' },
                  { l: 'Wins / Losses', v: `${wins}W / ${losses}L`, c: '#8899b4' },
                ].map(s => (
                  <div key={s.l} style={{ background: '#111626', borderRadius: 6, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase',
                      letterSpacing: '.08em', marginBottom: 4 }}>{s.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* By session */}
              <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: 12 }}>Win Rate by Session</div>
              {Object.entries(bySession).map(([session, data]) => {
                const total = data.wins + data.losses;
                const wr = total > 0 ? Math.round(data.wins/total*100) : 0;
                return (
                  <StatBar key={session} label={`${session} (${total} trades)`}
                    value={`${wr}%`} max={100}
                    color={wr >= 60 ? '#00C97A' : wr >= 40 ? '#F0A500' : '#f04060'} />
                );
              })}
            </div>

            {/* By symbol */}
            <div style={{ background: '#0c0f1a', border: '1px solid #1a1f30',
              borderRadius: 8, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: 16 }}>Performance by Instrument</div>
              {Object.entries(bySymbol)
                .sort((a,b) => b[1].pnl - a[1].pnl)
                .slice(0, 8)
                .map(([symbol, data]) => {
                  const total = data.wins + data.losses;
                  const wr = total > 0 ? Math.round(data.wins/total*100) : 0;
                  return (
                    <div key={symbol} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '8px 0',
                      borderBottom: '1px solid #111626' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#E8ECF4' }}>{symbol}</span>
                        <span style={{ fontSize: 10, color: '#556080', marginLeft: 8 }}>{data.count} trades</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700,
                          color: data.pnl >= 0 ? '#00C97A' : '#f04060' }}>
                          {data.pnl >= 0 ? '+' : ''}{data.pnl.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, color: '#556080' }}>{wr}% WR</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Year projection */}
            <div style={{ background: '#0c0f1a', border: '1px solid #1a1f30',
              borderRadius: 8, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: 16 }}>Year-End Projection</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <ProjectionCard label="Projected Annual P&L"
                  projected={yearEndProjection} current={netPnl} />
                <ProjectionCard label="Next 30 Days"
                  projected={weeklyAvg * 4.3} current={0} />
              </div>
              <div style={{ fontSize: 11, color: '#3a4560', lineHeight: 1.6 }}>
                Based on {weeksTrading.toFixed(1)} weeks of trading data.
                Projection assumes consistent performance. Recent trades weighted more heavily.
              </div>
            </div>

            {/* AI Insights */}
            {insight ? (
              <div style={{ background: '#0c0f1a', border: '1px solid #1a1f30',
                borderRadius: 8, padding: '20px' }}>
                <div style={{ fontSize: 10, color: '#9060f0', textTransform: 'uppercase',
                  letterSpacing: '.08em', marginBottom: 16 }}>🧠 AI Analysis</div>

                {insight.summary && (
                  <div style={{ fontSize: 13, color: '#8899b4', lineHeight: 1.8,
                    marginBottom: 20, padding: '14px 16px', background: '#111626',
                    borderRadius: 6 }}>
                    {insight.summary}
                  </div>
                )}

                {insight.patterns?.map((p: any, i: number) => (
                  <InsightCard key={i} icon={p.icon || '📊'}
                    title={p.title} content={p.content} type={p.type} />
                ))}

                {insight.action_items?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
                      letterSpacing: '.08em', marginBottom: 12 }}>Action Items</div>
                    {insight.action_items.map((item: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        <span style={{ color: '#00C97A', fontWeight: 700, flexShrink: 0 }}>{i+1}.</span>
                        <span style={{ fontSize: 12, color: '#8899b4', lineHeight: 1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#0c0f1a', border: '1px solid #1a1f30',
                borderRadius: 8, padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
                <div style={{ fontSize: 14, color: '#E8ECF4', fontWeight: 700, marginBottom: 8 }}>
                  No analysis yet
                </div>
                <div style={{ fontSize: 12, color: '#556080', lineHeight: 1.7 }}>
                  {totalTrades < 10
                    ? `Trade ${10 - totalTrades} more times to unlock AI analysis`
                    : 'Click "Run AI Analysis" to get your personalised trading insights'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
