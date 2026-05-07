import React, { useState, useEffect } from 'react';
import { getTrades } from '../../api/client';
import api from '../../api/client';

// ── TAG TYPES ──
const TAG_COLORS: Record<string, string> = {
  // Setup
  FVG: '#4090f0', OB: '#9060f0', BOS: '#00C97A', CHoCH: '#00C97A',
  Support: '#F0A500', Resistance: '#f04060', Breakout: '#00c9a7',
  Range: '#556080', Trend: '#00C97A', Reversal: '#f04060',
  // Emotion (AI)
  Disciplined: '#00C97A', FOMO: '#f04060', Revenge: '#f04060',
  Hesitated: '#F0A500', Overconfident: '#f04060', Patient: '#00C97A',
  // Session (auto)
  Asia: '#4090f0', London: '#F0A500', US: '#00C97A',
  // Result (auto)
  'TP Hit': '#00C97A', 'SL Hit': '#f04060', Trail: '#F0A500',
  'Early Exit': '#F0A500', 'Manual Close': '#556080',
};



const SETUP_TAGS = ['FVG', 'OB', 'BOS', 'CHoCH', 'Support', 'Resistance', 'Breakout', 'Range', 'Trend', 'Reversal'];
const EMOTION_TAGS = ['Disciplined', 'FOMO', 'Revenge', 'Hesitated', 'Overconfident', 'Patient'];

function Tag({ label, type, onRemove }: { label: string, type?: string, onRemove?: () => void }) {
  const color = TAG_COLORS[label] || '#556080';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 10,
      fontWeight: 700, letterSpacing: '.06em',
      background: `${color}18`, color, border: `1px solid ${color}40`,
    }}>
      {label}
      {onRemove && (
        <span onClick={onRemove} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 12 }}>×</span>
      )}
    </span>
  );
}

function TagSelector({ selected, onChange }: { selected: string[], onChange: (tags: string[]) => void }) {
  const [custom, setCustom] = useState('');
  const toggle = (t: string) => {
    onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);
  };
  const addCustom = () => {
    if (custom.trim() && !selected.includes(custom.trim())) {
      onChange([...selected, custom.trim()]);
      setCustom('');
    }
  };
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
          letterSpacing: '.08em', marginBottom: 6 }}>Setup</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SETUP_TAGS.map(t => (
            <span key={t} onClick={() => toggle(t)} style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              cursor: 'pointer', border: `1px solid ${selected.includes(t) ? TAG_COLORS[t] : '#252d42'}`,
              color: selected.includes(t) ? TAG_COLORS[t] : '#556080',
              background: selected.includes(t) ? `${TAG_COLORS[t]}15` : 'transparent',
            }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
          letterSpacing: '.08em', marginBottom: 6 }}>Emotion</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOTION_TAGS.map(t => (
            <span key={t} onClick={() => toggle(t)} style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              cursor: 'pointer', border: `1px solid ${selected.includes(t) ? TAG_COLORS[t] : '#252d42'}`,
              color: selected.includes(t) ? TAG_COLORS[t] : '#556080',
              background: selected.includes(t) ? `${TAG_COLORS[t]}15` : 'transparent',
            }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={custom} onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Custom tag..."
          style={{
            flex: 1, padding: '6px 10px', background: '#111626',
            border: '1px solid #1a1f30', borderRadius: 6,
            color: '#E8ECF4', fontSize: 11, fontFamily: 'inherit',
          }}/>
        <button onClick={addCustom} style={{
          padding: '6px 12px', background: '#252d42', border: 'none',
          borderRadius: 6, color: '#E8ECF4', fontSize: 11, cursor: 'pointer',
        }}>Add</button>
      </div>
    </div>
  );
}

// ── TRADE ROW EXPANDED ──
function TradeDetail({ trade, onUpdate }: { trade: any, onUpdate: (t: any) => void }) {
  const [notes, setNotes] = useState(trade.notes || '');
  const [tags, setTags] = useState<string[]>(trade.tags || []);
  const [saving, setSaving] = useState(false);
  const [analysing, setAnalysing] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/api/v1/trades/${trade.id}/journal`, { notes, tags });
      onUpdate({ ...trade, notes, tags });
    } catch(e) {}
    setSaving(false);
  };

  const runAnalysis = async () => {
    setAnalysing(true);
    try {
      const r = await api.post(`/api/v1/trades/${trade.id}/analyse`);
      if (r.data.tags) {
        const newTags = Array.from(new Set([...tags, ...(r.data.tags as string[])]));
        setTags(newTags);
        onUpdate({ ...trade, tags: newTags, ai_analysis: r.data.analysis });
      }
    } catch(e) {}
    setAnalysing(false);
  };


  const pnl = parseFloat(trade.net_pnl || 0);

  return (
    <div style={{
      background: '#0a0d1a', border: '1px solid #1a1f30',
      borderRadius: 10, padding: 20, marginBottom: 8,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#E8ECF4',
            fontFamily: 'Georgia, serif' }}>{trade.symbol}</span>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
            background: trade.bias === 'BUY' ? 'rgba(0,201,122,.15)' : 'rgba(240,64,96,.15)',
            color: trade.bias === 'BUY' ? '#00C97A' : '#f04060',
          }}>{trade.bias}</span>
          <span style={{ fontSize: 11, color: '#556080' }}>{trade.scanner}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: pnl >= 0 ? '#00C97A' : '#f04060',
          }}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: '#556080' }}>
            {trade.rr_actual ? `${trade.rr_actual}R` : '—'}
          </div>
        </div>
      </div>

      {/* Trade stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Entry', value: trade.entry_price },
          { label: 'Exit', value: trade.close_price || '—' },
          { label: 'Lot', value: trade.lot },
          { label: 'Duration', value: trade.open_time && trade.close_time
            ? formatDuration(trade.open_time, trade.close_time) : '—' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#111626', borderRadius: 6, padding: '8px 12px',
          }}>
            <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase',
              letterSpacing: '.08em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: '#E8ECF4' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Screenshots */}
      {(trade.screenshot_entry || trade.screenshot_exit) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {trade.screenshot_entry && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: 6 }}>Entry Chart</div>
              <img src={trade.screenshot_entry.startsWith('data:') ? trade.screenshot_entry : `data:image/png;base64,${trade.screenshot_entry}`} alt="Entry"
                style={{ width: '100%', borderRadius: 6, border: '1px solid #1a1f30' }}/>
            </div>
          )}
          {trade.screenshot_exit && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: 6 }}>Exit Chart</div>
              <img src={trade.screenshot_exit.startsWith('data:') ? trade.screenshot_exit : `data:image/png;base64,${trade.screenshot_exit}`} alt="Exit"
                style={{ width: '100%', borderRadius: 6, border: '1px solid #1a1f30' }}/>
            </div>
          )}
        </div>
      )}

      {/* Post-exit quality */}
      {trade.post_exit_tracked && trade.exit_quality && (
        <div style={{
          background: trade.exit_quality === 'EARLY' ? 'rgba(240,160,0,0.05)' :
                      trade.exit_quality === 'PERFECT' ? 'rgba(0,201,122,0.05)' :
                      'rgba(64,144,240,0.05)',
          border: `1px solid ${trade.exit_quality === 'EARLY' ? 'rgba(240,160,0,0.2)' :
                               trade.exit_quality === 'PERFECT' ? 'rgba(0,201,122,0.2)' :
                               'rgba(64,144,240,0.2)'}`,
          borderRadius: 6, padding: '12px 14px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em',
            marginBottom: 8, color: trade.exit_quality === 'EARLY' ? '#F0A500' :
            trade.exit_quality === 'PERFECT' ? '#00C97A' : '#4090f0' }}>
            Exit Quality — {trade.exit_quality}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#111626', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.06em', marginBottom: 4 }}>Post-exit High (60min)</div>
              <div style={{ fontSize: 14, color: '#00C97A' }}>{trade.post_exit_high}</div>
            </div>
            <div style={{ background: '#111626', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.06em', marginBottom: 4 }}>Post-exit Low (60min)</div>
              <div style={{ fontSize: 14, color: '#f04060' }}>{trade.post_exit_low}</div>
            </div>
          </div>
          {trade.exit_quality === 'EARLY' && (
            <div style={{ fontSize: 11, color: '#F0A500', marginTop: 8 }}>
              ⚠ Price continued moving in your favour after exit — consider trailing stops
            </div>
          )}
          {trade.exit_quality === 'PERFECT' && (
            <div style={{ fontSize: 11, color: '#00C97A', marginTop: 8 }}>
              ✓ Good exit — price reversed after you closed
            </div>
          )}
        </div>
      )}

      {/* H1 Screenshots */}
      {(trade.screenshot_h1_entry || trade.screenshot_h1_exit) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: 8 }}>H1 Structure</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {trade.screenshot_h1_entry && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#556080', marginBottom: 4 }}>H1 Entry</div>
                <img src={`data:image/png;base64,${trade.screenshot_h1_entry}`} alt="H1 Entry"
                  style={{ width: '100%', borderRadius: 6, border: '1px solid #1a1f30' }}/>
              </div>
            )}
            {trade.screenshot_h1_exit && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#556080', marginBottom: 4 }}>H1 Exit</div>
                <img src={`data:image/png;base64,${trade.screenshot_h1_exit}`} alt="H1 Exit"
                  style={{ width: '100%', borderRadius: 6, border: '1px solid #1a1f30' }}/>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {trade.ai_analysis && (
        <div style={{
          background: 'rgba(144,96,240,0.05)', border: '1px solid rgba(144,96,240,0.2)',
          borderRadius: 6, padding: '12px 14px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: '#9060f0', textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: 6 }}>🧠 AI Analysis</div>
          <div style={{ fontSize: 12, color: '#8899b4', lineHeight: 1.7 }}>
            {trade.ai_analysis}
          </div>
        </div>
      )}

      {/* Tags */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
          letterSpacing: '.08em', marginBottom: 8 }}>Tags</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {tags.map(t => (
            <Tag key={t} label={t} onRemove={() => setTags(tags.filter(x => x !== t))} />
          ))}
          {tags.length === 0 && <span style={{ fontSize: 11, color: '#3a4560' }}>No tags yet</span>}
        </div>
        <TagSelector selected={tags} onChange={setTags} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
          letterSpacing: '.08em', marginBottom: 8 }}>Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="What did you notice? What would you do differently?"
          style={{
            width: '100%', minHeight: 80, padding: '10px 12px',
            background: '#111626', border: '1px solid #1a1f30',
            borderRadius: 6, color: '#E8ECF4', fontSize: 12,
            fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          }}/>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{
          padding: '8px 20px', background: '#00C97A', border: 'none',
          borderRadius: 6, color: '#000', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', letterSpacing: '.06em',
        }}>{saving ? 'Saving...' : 'Save Notes & Tags'}</button>
        {(trade.screenshot_entry || trade.screenshot_exit) && !trade.ai_analysis && (
          <button onClick={runAnalysis} disabled={analysing} style={{
            padding: '8px 20px', background: 'transparent',
            border: '1px solid #9060f0', borderRadius: 6,
            color: '#9060f0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>{analysing ? '🧠 Analysing...' : '🧠 Run AI Analysis'}</button>
        )}
      </div>
    </div>
  );
}

function formatDuration(open: string, close: string) {
  const ms = new Date(close).getTime() - new Date(open).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs/24)}d ${hrs%24}h`;
}

// ── MAIN JOURNAL PAGE ──
export default function Journal() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [period, setPeriod] = useState('week');
  const [filterTag, setFilterTag] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterScanner, setFilterScanner] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const r = await getTrades({ status: 'CLOSED', period });
      setTrades(r.data || []);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]); // eslint-disable-line

  const filtered = trades.filter(t => {
    if (filterSymbol && t.symbol !== filterSymbol) return false;
    if (filterScanner !== 'all' && t.scanner !== filterScanner) return false;
    if (filterTag && !(t.tags || []).includes(filterTag)) return false;
    return true;
  });

  const symbols = Array.from(new Set(trades.map((t: any) => t.symbol as string)));
  const allTags = Array.from(new Set(trades.flatMap((t: any) => (t.tags || []) as string[])));

  const wins   = filtered.filter(t => (t.execution_outcome||'').startsWith('WIN')).length;
  const losses = filtered.filter(t => (t.execution_outcome||'').startsWith('LOSS')).length;
  const netPnl = filtered.reduce((s, t) => s + parseFloat(t.net_pnl || 0), 0);

  const updateTrade = (updated: any) => {
    setTrades(trades.map(t => t.id === updated.id ? updated : t));
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif',
            color: '#E8ECF4', marginBottom: 4 }}>Trade Journal</h1>
          <div style={{ fontSize: 12, color: '#556080' }}>
            {filtered.length} trades · {wins}W {losses}L ·{' '}
            <span style={{ color: netPnl >= 0 ? '#00C97A' : '#f04060' }}>
              {netPnl >= 0 ? '+' : ''}{netPnl.toFixed(2)}
            </span>
          </div>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{
          padding: '6px 12px', background: '#0c0f1a', border: '1px solid #252d42',
          borderRadius: 6, color: '#E8ECF4', fontSize: 12, fontFamily: 'inherit',
        }}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterSymbol} onChange={e => setFilterSymbol(e.target.value)} style={{
          padding: '6px 12px', background: '#0c0f1a', border: '1px solid #1a1f30',
          borderRadius: 6, color: '#E8ECF4', fontSize: 11, fontFamily: 'inherit',
        }}>
          <option value="">All Symbols</option>
          {symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterScanner} onChange={e => setFilterScanner(e.target.value)} style={{
          padding: '6px 12px', background: '#0c0f1a', border: '1px solid #1a1f30',
          borderRadius: 6, color: '#E8ECF4', fontSize: 11, fontFamily: 'inherit',
        }}>
          <option value="all">All Scanners</option>
          <option value="S1">S1</option>
          <option value="S2">S2</option>
          <option value="MANUAL">Manual</option>
        </select>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{
          padding: '6px 12px', background: '#0c0f1a', border: '1px solid #1a1f30',
          borderRadius: 6, color: '#E8ECF4', fontSize: 11, fontFamily: 'inherit',
        }}>
          <option value="">All Tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterSymbol || filterTag || filterScanner !== 'all') && (
          <button onClick={() => { setFilterSymbol(''); setFilterTag(''); setFilterScanner('all'); }}
            style={{ padding: '6px 12px', background: 'transparent',
              border: '1px solid #252d42', borderRadius: 6,
              color: '#556080', fontSize: 11, cursor: 'pointer' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Trade list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#556080', padding: 40 }}>Loading trades...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#556080', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📓</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>No trades found</div>
          <div style={{ fontSize: 12 }}>Connect your MT5 EA to start journalling automatically</div>
        </div>
      ) : (
        filtered.map(trade => (
          <div key={trade.id}>
            {/* Collapsed row */}
            {expanded !== trade.id && (
              <div onClick={() => setExpanded(trade.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: '#0c0f1a',
                  border: '1px solid #1a1f30', borderRadius: 8,
                  marginBottom: 6, cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#252d42'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1a1f30'}
              >
                <div style={{ width: 80, color: '#556080', fontSize: 11 }}>
                  {trade.close_time ? new Date(trade.close_time).toLocaleDateString() : '—'}
                </div>
                <div style={{ width: 80, fontWeight: 700, color: '#E8ECF4' }}>{trade.symbol}</div>
                <div style={{ width: 50 }}>
                  <span style={{
                    padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                    background: trade.bias === 'BUY' ? 'rgba(0,201,122,.12)' : 'rgba(240,64,96,.12)',
                    color: trade.bias === 'BUY' ? '#00C97A' : '#f04060',
                  }}>{trade.bias}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(trade.tags || []).slice(0,4).map((t: string) => <Tag key={t} label={t} />)}
                  {(trade.tags || []).length === 0 && (
                    <span style={{ fontSize: 10, color: '#3a4560' }}>No tags — click to add</span>
                  )}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700, minWidth: 70, textAlign: 'right',
                  color: parseFloat(trade.net_pnl || 0) >= 0 ? '#00C97A' : '#f04060',
                }}>
                  {parseFloat(trade.net_pnl || 0) >= 0 ? '+' : ''}
                  {parseFloat(trade.net_pnl || 0).toFixed(2)}
                </div>
                <div style={{ color: '#556080', fontSize: 18 }}>›</div>
              </div>
            )}

            {/* Expanded detail */}
            {expanded === trade.id && (
              <div>
                <div onClick={() => setExpanded(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', cursor: 'pointer',
                    color: '#556080', fontSize: 11, marginBottom: 4,
                  }}>
                  ‹ Close
                </div>
                <TradeDetail trade={trade} onUpdate={(t) => { updateTrade(t); }} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
