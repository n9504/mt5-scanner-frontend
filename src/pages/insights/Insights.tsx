import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { getAccounts } from '../../api/client';

function ScoreBar({ label, value, prev }: any) {
  const color = value >= 75 ? '#00C97A' : value >= 50 ? '#F0A500' : '#f04060';
  const change = prev !== undefined ? value - prev : null;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:12, color:'#8899b4' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {change !== null && (
            <span style={{ fontSize:10, color: change > 0 ? '#00C97A' : change < 0 ? '#f04060' : '#556080' }}>
              {change > 0 ? `↑ +${change}` : change < 0 ? `↓ ${change}` : '→'}
            </span>
          )}
          <span style={{ fontSize:14, fontWeight:700, color, fontFamily:'Georgia,serif' }}>{value}/100</span>
        </div>
      </div>
      <div style={{ height:6, background:'#111626', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${value}%`, height:'100%', background:color,
          borderRadius:3, transition:'width .6s ease' }}/>
      </div>
    </div>
  );
}

function DNARow({ label, items, color }: any) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:10, color, textTransform:'uppercase' as const,
        letterSpacing:'.08em', marginBottom:6, fontWeight:700 }}>{label}</div>
      {items.map((item: any, i: number) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between',
          padding:'6px 10px', background:'#111626', borderRadius:4, marginBottom:4 }}>
          <span style={{ fontSize:12, color:'#E8ECF4' }}>
            {item.value || item.tag || item.sym || ''}
          </span>
          <span style={{ fontSize:11, fontWeight:700, color }}>
            {item.pct}% of {label.toLowerCase().includes('win') ? 'wins' : 'losses'}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConfidencePill({ confidence, count }: any) {
  const color = confidence === 'High' ? '#00C97A' : confidence === 'Medium' ? '#F0A500' : '#556080';
  return (
    <span style={{ fontSize:9, padding:'2px 8px', borderRadius:3,
      background:`${color}15`, color, fontWeight:700 }}>
      {confidence} confidence · {count} trades
    </span>
  );
}

export default function Insights() {
  const [accounts,  setAccounts]  = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [insights,  setInsights]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [running,   setRunning]   = useState(false);

  useEffect(() => {
    getAccounts().then(r => {
      const accs = r.data || [];
      setAccounts(accs);
      if (accs.length) setAccountId(accs[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    api.get(`/api/v1/insights/latest?account_id=${accountId}`)
      .then(r => setInsights(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Auto-check weekly
    api.get(`/api/v1/insights/check?account_id=${accountId}`)
      .then(r => { if (r.data?.status === 'running') setRunning(true); })
      .catch(() => {});
  }, [accountId]);

  const a = insights?.analysis;
  const scores = a?.behavioural_scores;
  const dna    = a?.trading_dna;
  const drift  = a?.behaviour_drift;

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif',
            color:'#E8ECF4', marginBottom:4 }}>Behavioural Intelligence</h1>
          <p style={{ color:'#556080', fontSize:12 }}>
            Automatic analysis of your trading behaviour — updated weekly
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {accounts.length > 1 && (
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              style={{ padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
                borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit' }}>
              {accounts.map((a:any) => (
                <option key={a.id} value={a.id}>{a.label || a.server}</option>
              ))}
            </select>
          )}
          {running && (
            <span style={{ fontSize:11, color:'#9060f0', padding:'6px 12px',
              background:'rgba(144,96,240,.08)', borderRadius:5 }}>
              🧠 Analysing...
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', color:'#556080', padding:'60px 0' }}>Loading...</div>
      ) : !a ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🧠</div>
          <h2 style={{ fontSize:20, fontWeight:700, fontFamily:'Georgia,serif',
            color:'#E8ECF4', marginBottom:8 }}>Behavioural analysis not yet available</h2>
          <p style={{ color:'#556080', fontSize:13, maxWidth:440, margin:'0 auto 16px', lineHeight:1.7 }}>
            Analysis runs automatically each week after your first 10 trades.
            Your patterns and tendencies will appear here as your trade history builds.
          </p>
          <div style={{ fontSize:11, color:'#3a4560' }}>
            Available on Pro, Elite and Prop plans
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* NARRATIVE — THE STAR */}
          <div style={{ background:'rgba(144,96,240,0.06)',
            border:'1px solid rgba(144,96,240,0.25)', borderRadius:8, padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:10, color:'#9060f0', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700 }}>
                🧠 Behavioural Intelligence Report
              </div>
              {a.trader_profile && (
                <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                  background:'rgba(144,96,240,.15)', color:'#9060f0' }}>
                  {a.trader_profile}
                </span>
              )}
            </div>
            <p style={{ fontSize:14, color:'#E8ECF4', lineHeight:1.9,
              fontFamily:'Georgia,serif', margin:0 }}>
              {a.narrative}
            </p>
            {insights.generated_at && (
              <div style={{ fontSize:10, color:'#3a4560', marginTop:12 }}>
                Last updated: {new Date(insights.generated_at).toLocaleDateString('en',
                  {weekday:'long',day:'numeric',month:'long'})}
              </div>
            )}
          </div>

          {/* WEEKLY FOCUS — THE ACTIONABLE HOOK */}
          {(a.weekly_focus) && (
            <div style={{ background:'rgba(0,201,122,0.06)',
              border:'1px solid rgba(0,201,122,0.3)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#00C97A', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:10 }}>
                🎯 This Week's Focus
              </div>
              <p style={{ fontSize:13, color:'#E8ECF4', lineHeight:1.8, margin:0 }}>
                {a.weekly_focus}
              </p>
            </div>
          )}

          {/* TOP 3 PERFORMANCE IMPROVEMENTS */}
          {(a.top_3_improvements||[]).length > 0 && (
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
              borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:14 }}>
                📊 Top Behavioural Observations
              </div>
              {(a.top_3_improvements||[]).map((obs:string, i:number) => (
                <div key={i} style={{ padding:'10px 14px', background:'#111626',
                  borderRadius:5, marginBottom:8, fontSize:12, color:'#8899b4',
                  lineHeight:1.7, borderLeft:'2px solid #252d42' }}>
                  <span style={{ color:'#4090f0', fontWeight:700, marginRight:8 }}>
                    {i+1}.
                  </span>
                  {obs}
                </div>
              ))}
            </div>
          )}

          {/* BEHAVIOURAL SCORECARD */}
          {scores && (
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
              borderRadius:8, padding:24 }}>
              <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:20 }}>
                Behavioural Scorecard
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 40px' }}>
                <ScoreBar label="Discipline"          value={scores.discipline} />
                <ScoreBar label="Risk Consistency"    value={scores.risk_consistency} />
                <ScoreBar label="Patience"            value={scores.patience} />
                <ScoreBar label="Emotional Stability" value={scores.emotional_stability} />
                <ScoreBar label="Rule Adherence"      value={scores.rule_adherence} />
              </div>

              {/* Expectancy */}
              <div style={{ marginTop:20, padding:'14px 16px',
                background: scores.expectancy >= 0 ? 'rgba(0,201,122,.05)' : 'rgba(240,64,96,.05)',
                border:`1px solid ${scores.expectancy >= 0 ? 'rgba(0,201,122,.2)' : 'rgba(240,64,96,.2)'}`,
                borderRadius:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                      letterSpacing:'.08em', marginBottom:4 }}>Expectancy per trade</div>
                    <div style={{ fontSize:24, fontWeight:700, fontFamily:'Georgia,serif',
                      color: scores.expectancy >= 0 ? '#00C97A' : '#f04060' }}>
                      {scores.expectancy >= 0 ? '+' : ''}{scores.expectancy?.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' as const, display:'flex', gap:16 }}>
                    <div>
                      <div style={{ fontSize:9, color:'#556080', marginBottom:3 }}>Avg Win</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#00C97A' }}>
                        +{scores.avg_win?.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:9, color:'#556080', marginBottom:3 }}>Avg Loss</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#f04060' }}>
                        {scores.avg_loss?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                {scores.expectancy < 0 && (
                  <div style={{ fontSize:11, color:'#f04060', marginTop:8 }}>
                    Negative expectancy — losses exceed wins on average despite win rate
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STRENGTHS & WEAKNESSES */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'rgba(0,201,122,.04)',
              border:'1px solid rgba(0,201,122,.15)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#00C97A', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:14 }}>✓ Strengths</div>
              {(a.strengths||[]).map((s:string,i:number) => (
                <div key={i} style={{ fontSize:12, color:'#8899b4', lineHeight:1.7,
                  marginBottom:8, paddingLeft:12, borderLeft:'2px solid rgba(0,201,122,.3)' }}>
                  {s}
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(240,64,96,.04)',
              border:'1px solid rgba(240,64,96,.15)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#f04060', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:14 }}>⚠ Patterns to address</div>
              {(a.weaknesses||[]).map((s:string,i:number) => (
                <div key={i} style={{ fontSize:12, color:'#8899b4', lineHeight:1.7,
                  marginBottom:8, paddingLeft:12, borderLeft:'2px solid rgba(240,64,96,.3)' }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* BEHAVIOUR CONTRADICTIONS */}
          {(a.behaviour_contradictions||[]).length > 0 && (
            <div style={{ background:'rgba(240,160,0,.05)',
              border:'1px solid rgba(240,160,0,.2)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#F0A500', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:14 }}>
                🔍 Behavioural Contradictions Detected
              </div>
              {(a.behaviour_contradictions||[]).map((s:string,i:number) => (
                <div key={i} style={{ fontSize:12, color:'#E8ECF4', lineHeight:1.7,
                  marginBottom:8, padding:'10px 14px', background:'rgba(240,160,0,.05)',
                  borderRadius:5 }}>
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* TRADING DNA */}
          {dna && dna.sample_size >= 20 && (
            <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
              borderRadius:8, padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                  letterSpacing:'.1em', fontWeight:700 }}>Trading DNA</div>
                <ConfidencePill confidence={dna.confidence} count={dna.sample_size} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <DNARow label="Winning Sessions"  items={dna.winning_sessions}  color="#00C97A" />
                  <DNARow label="Winning Symbols"   items={dna.winning_symbols}   color="#00C97A" />
                  <DNARow label="Winning Patterns"  items={dna.winning_tags}      color="#00C97A" />
                </div>
                <div>
                  <DNARow label="Losing Sessions"   items={dna.losing_sessions}   color="#f04060" />
                  <DNARow label="Losing Symbols"    items={dna.losing_symbols}    color="#f04060" />
                  <DNARow label="Losing Patterns"   items={dna.losing_tags}       color="#f04060" />
                </div>
              </div>
            </div>
          )}

          {/* BEHAVIOUR DRIFT */}
          {drift && (drift.drifts||[]).length > 0 && (
            <div style={{ background:'rgba(240,64,96,.05)',
              border:'1px solid rgba(240,64,96,.2)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#f04060', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
                ⚡ Behaviour Drift Detected
              </div>
              {(drift.drifts||[]).map((d:string,i:number) => (
                <div key={i} style={{ fontSize:12, color:'#E8ECF4', lineHeight:1.7,
                  marginBottom:6, padding:'8px 12px', background:'rgba(240,64,96,.05)',
                  borderRadius:4 }}>{d}</div>
              ))}
            </div>
          )}

          {/* WHAT IMPROVED */}
          {(a.what_improved||[]).length > 0 && (
            <div style={{ background:'rgba(0,201,122,.04)',
              border:'1px solid rgba(0,201,122,.15)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:10, color:'#00C97A', textTransform:'uppercase' as const,
                letterSpacing:'.1em', fontWeight:700, marginBottom:12 }}>
                📈 What Improved
              </div>
              {(a.what_improved||[]).map((s:string,i:number) => (
                <div key={i} style={{ fontSize:12, color:'#8899b4', lineHeight:1.7,
                  marginBottom:6 }}>✓ {s}</div>
              ))}
            </div>
          )}

          {/* YEAR-END + TOP FOCUS */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {insights.year_end_pnl !== null && (
              <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
                borderRadius:8, padding:20 }}>
                <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                  letterSpacing:'.08em', marginBottom:8 }}>Performance Trend Projection</div>
                <div style={{ fontSize:28, fontWeight:700, fontFamily:'Georgia,serif',
                  color: insights.year_end_pnl >= 0 ? '#00C97A' : '#f04060', marginBottom:8 }}>
                  {insights.year_end_pnl >= 0 ? '+$' : '-$'}{Math.abs(insights.year_end_pnl).toLocaleString()}
                </div>
                <div style={{ fontSize:11, color:'#556080', lineHeight:1.6 }}>
                  {a.performance_trend_narrative || a.year_end_narrative}
                </div>
              </div>
            )}
            {a.top_focus && (
              <div style={{ background:'rgba(64,144,240,.05)',
                border:'1px solid rgba(64,144,240,.2)', borderRadius:8, padding:20 }}>
                <div style={{ fontSize:10, color:'#4090f0', textTransform:'uppercase' as const,
                  letterSpacing:'.08em', marginBottom:8 }}>Key Behavioural Observation</div>
                <div style={{ fontSize:13, color:'#E8ECF4', lineHeight:1.7 }}>
                  {a.top_focus}
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div style={{ padding:'12px 16px', background:'#070b14',
            borderRadius:6, fontSize:10, color:'#3a4560', lineHeight:1.6,
            fontStyle:'italic' }}>
            This report is a behavioural analysis of your historical trading execution.
            It does not constitute financial advice, investment recommendations, or trading signals.
            Past patterns do not indicate future results. Always conduct your own analysis before trading.
          </div>
        </div>
      )}
    </div>
  );
}
