import React, { useState, useEffect } from 'react';
import { getTrades } from '../../api/client';
import api from '../../api/client';

// ── TAG CONFIG ──
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  FVG:          { bg: 'rgba(64,144,240,.12)',  color: '#4090f0' },
  OB:           { bg: 'rgba(144,96,240,.12)',  color: '#9060f0' },
  BOS:          { bg: 'rgba(0,201,122,.12)',   color: '#00C97A' },
  CHoCH:        { bg: 'rgba(0,201,122,.12)',   color: '#00C97A' },
  Support:      { bg: 'rgba(240,160,0,.12)',   color: '#F0A500' },
  Resistance:   { bg: 'rgba(240,64,96,.12)',   color: '#f04060' },
  Breakout:     { bg: 'rgba(0,201,167,.12)',   color: '#00c9a7' },
  Range:        { bg: 'rgba(85,96,128,.12)',   color: '#556080' },
  Trend:        { bg: 'rgba(0,201,122,.12)',   color: '#00C97A' },
  Reversal:     { bg: 'rgba(240,64,96,.12)',   color: '#f04060' },
  Disciplined:  { bg: 'rgba(0,201,122,.12)',   color: '#00C97A' },
  FOMO:         { bg: 'rgba(240,64,96,.12)',   color: '#f04060' },
  Revenge:      { bg: 'rgba(240,64,96,.12)',   color: '#f04060' },
  Hesitated:    { bg: 'rgba(240,160,0,.12)',   color: '#F0A500' },
  Overconfident:{ bg: 'rgba(240,64,96,.12)',   color: '#f04060' },
  Patient:      { bg: 'rgba(0,201,122,.12)',   color: '#00C97A' },
  Asia:         { bg: 'rgba(64,144,240,.12)',  color: '#4090f0' },
  London:       { bg: 'rgba(240,160,0,.12)',   color: '#F0A500' },
  US:           { bg: 'rgba(0,201,122,.12)',   color: '#00C97A' },
  'TP Hit':     { bg: 'rgba(0,201,122,.12)',   color: '#00C97A' },
  'SL Hit':     { bg: 'rgba(240,64,96,.12)',   color: '#f04060' },
  Trail:        { bg: 'rgba(240,160,0,.12)',   color: '#F0A500' },
  'Early Exit': { bg: 'rgba(240,160,0,.12)',   color: '#F0A500' },
  'Manual Close':{ bg: 'rgba(85,96,128,.12)',  color: '#556080' },
};

const SETUP_TAGS   = ['FVG','OB','BOS','CHoCH','Support','Resistance','Breakout','Range','Trend','Reversal'];
const EMOTION_TAGS = ['Disciplined','FOMO','Revenge','Hesitated','Overconfident','Patient'];

function Tag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  const c = TAG_COLORS[label] || { bg: 'rgba(85,96,128,.12)', color: '#556080' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3,
      padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700,
      background:c.bg, color:c.color, letterSpacing:'.04em',
    }}>
      {label}
      {onRemove && (
        <span onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ cursor:'pointer', opacity:.6, fontSize:12, lineHeight:1 }}>×</span>
      )}
    </span>
  );
}

function TagPicker({ selected, onChange }: { selected: string[]; onChange: (t: string[]) => void }) {
  const [custom, setCustom] = useState('');
  const toggle = (t: string) =>
    onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !selected.includes(v)) { onChange([...selected, v]); setCustom(''); }
  };
  const Section = ({ title, tags }: { title: string; tags: string[] }) => (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:9, color:'#556080', textTransform:'uppercase',
        letterSpacing:'.1em', marginBottom:6 }}>{title}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {tags.map(t => (
          <span key={t} onClick={() => toggle(t)} style={{
            padding:'3px 10px', borderRadius:4, fontSize:10, fontWeight:700,
            cursor:'pointer', userSelect:'none',
            border:`1px solid ${selected.includes(t) ? (TAG_COLORS[t]?.color||'#556080') : '#252d42'}`,
            color: selected.includes(t) ? (TAG_COLORS[t]?.color||'#556080') : '#556080',
            background: selected.includes(t) ? (TAG_COLORS[t]?.bg||'transparent') : 'transparent',
            transition:'all .15s',
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <Section title="Setup" tags={SETUP_TAGS} />
      <Section title="Emotion" tags={EMOTION_TAGS} />
      <div style={{ display:'flex', gap:6 }}>
        <input value={custom} onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key==='Enter' && addCustom()}
          placeholder="Add custom tag..."
          style={{ flex:1, padding:'6px 10px', background:'#111626',
            border:'1px solid #1a1f30', borderRadius:4,
            color:'#E8ECF4', fontSize:11, fontFamily:'inherit', outline:'none' }}/>
        <button onClick={addCustom} style={{
          padding:'6px 14px', background:'#1a1f30', border:'none',
          borderRadius:4, color:'#E8ECF4', fontSize:11, cursor:'pointer' }}>+</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: any) {
  return (
    <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
      borderRadius:8, padding:'16px 20px' }}>
      <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase',
        letterSpacing:'.08em', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color: color||'#E8ECF4',
        fontFamily:'Georgia,serif' }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'#556080', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function formatDur(open: string, close: string) {
  const ms = new Date(close).getTime() - new Date(open).getTime();
  const m  = Math.floor(ms/60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ${m%60}m`;
  return `${Math.floor(h/24)}d ${h%24}h`;
}

function TradeRow({ trade, onUpdate }: { trade: any; onUpdate: (t: any) => void }) {
  const [open,      setOpen]      = useState(false);
  const [tags,      setTags]      = useState<string[]>(trade.tags || []);
  const [notes,     setNotes]     = useState(trade.notes || '');
  const [saving,    setSaving]    = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [tab,       setTab]       = useState<'overview'|'charts'|'notes'>('overview');
  const [screenshots, setScreenshots] = useState<any>(null);
  const [loadingSS,   setLoadingSS]   = useState(false);

  const win  = (trade.execution_outcome||'').startsWith('WIN');
  const pnl  = parseFloat(trade.net_pnl || 0);
  const dec  = (trade.entry_price||0) > 100 ? 2 : 5;

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/api/v1/trades/${trade.id}/journal`, { notes, tags });
      onUpdate({ ...trade, notes, tags });
    } catch(e) {}
    setSaving(false);
  };

  const analyse = async () => {
    setAnalysing(true);
    try {
      await api.post(`/api/v1/trades/${trade.id}/analyse`);
      // Poll for result
      let n = 0;
      const t = setInterval(async () => {
        n++;
        try {
          const r = await api.get(`/api/v1/trades?status=CLOSED&period=all`);
          const u = (r.data||[]).find((x: any) => x.id === trade.id);
          if (u?.ai_analysis || n > 10) {
            clearInterval(t);
            if (u) { setTags(u.tags||[]); onUpdate(u); }
            setAnalysing(false);
          }
        } catch { clearInterval(t); setAnalysing(false); }
      }, 3000);
    } catch { setAnalysing(false); }
  };

  const exitQ    = trade.exit_quality;
  const exitColor = exitQ === 'PERFECT' ? '#00C97A' : exitQ === 'EARLY' ? '#F0A500' : '#4090f0';

  return (
    <>
      {/* COLLAPSED ROW */}
      <tr onClick={() => setOpen(!open)}
        style={{ cursor:'pointer', borderBottom:'1px solid #111626',
          background: open ? '#0d1020' : 'transparent', transition:'background .15s' }}>
        <td style={{ padding:'12px 16px', color:'#556080', fontSize:11 }}>
          {trade.close_time ? new Date(trade.close_time).toLocaleDateString('en-AU',
            { day:'2-digit', month:'short' }) : '—'}
          <div style={{ fontSize:10, color:'#3a4560', marginTop:2 }}>
            {trade.close_time ? new Date(trade.close_time).toLocaleTimeString('en-AU',
              { hour:'2-digit', minute:'2-digit' }) : ''}
          </div>
        </td>
        <td style={{ padding:'12px 16px' }}>
          <div style={{ fontWeight:700, color:'#E8ECF4', fontSize:13 }}>{trade.symbol}</div>
          <div style={{ fontSize:10, color:'#556080', marginTop:2 }}>{trade.scanner}</div>
        </td>
        <td style={{ padding:'12px 16px' }}>
          <span style={{
            padding:'3px 10px', borderRadius:4, fontSize:10, fontWeight:700,
            background: trade.bias==='BUY' ? 'rgba(0,201,122,.12)' : 'rgba(240,64,96,.12)',
            color: trade.bias==='BUY' ? '#00C97A' : '#f04060',
          }}>{trade.bias}</span>
        </td>
        <td style={{ padding:'12px 16px', fontSize:12, color:'#8899b4' }}>{trade.lot}</td>
        <td style={{ padding:'12px 16px', fontSize:12, color:'#8899b4' }}>
          {parseFloat(trade.entry_price||0).toFixed(dec)}
        </td>
        <td style={{ padding:'12px 16px', fontSize:12, color:'#8899b4' }}>
          {trade.close_price ? parseFloat(trade.close_price).toFixed(dec) : '—'}
        </td>
        <td style={{ padding:'12px 16px', fontSize:12, color:'#556080' }}>
          {trade.open_time && trade.close_time ? formatDur(trade.open_time, trade.close_time) : '—'}
        </td>
        <td style={{ padding:'12px 16px' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {(tags||[]).slice(0,3).map((t: string) => <Tag key={t} label={t} />)}
            {(tags||[]).length > 3 && (
              <span style={{ fontSize:10, color:'#556080' }}>+{(tags||[]).length-3}</span>
            )}
          </div>
        </td>
        <td style={{ padding:'12px 16px', textAlign:'right' }}>
          <div style={{ fontSize:14, fontWeight:700, color: pnl>=0 ? '#00C97A' : '#f04060' }}>
            {pnl>=0 ? '+' : ''}{pnl.toFixed(2)}
          </div>
          <div style={{ fontSize:10, color:'#556080', marginTop:2 }}>
            {trade.rr_actual ? `${parseFloat(trade.rr_actual).toFixed(2)}R` : '—'}
          </div>
        </td>
        <td style={{ padding:'12px 16px', textAlign:'center' }}>
          {trade.status === 'OPEN' ? (
            <span style={{ padding:'3px 10px', borderRadius:4, fontSize:10, fontWeight:700,
              background:'rgba(240,160,0,.12)', color:'#F0A500', animation:'pulse 2s infinite' }}>
              OPEN
            </span>
          ) : (
            <span style={{
              padding:'3px 10px', borderRadius:4, fontSize:10, fontWeight:700,
              background: win ? 'rgba(0,201,122,.12)' : 'rgba(240,64,96,.12)',
              color: win ? '#00C97A' : '#f04060',
            }}>
              {(trade.execution_outcome||'').includes('TRAIL') ? 'TRAIL' :
               win ? 'WIN' : 'LOSS'}
            </span>
          )}
        </td>
      </tr>

      {/* EXPANDED DETAIL */}
      {open && (
        <tr style={{ background:'#070b14' }}>
          <td colSpan={10} style={{ padding:0, borderBottom:'1px solid #1a1f30' }}>
            <div style={{ padding:'20px 24px' }}>

              {/* Inner tabs */}
              <div style={{ display:'flex', gap:0, marginBottom:20,
                borderBottom:'1px solid #1a1f30' }}>
                {(['overview','charts','notes'] as const).map(t => (
                  <button key={t} onClick={() => {
                setTab(t);
                if (t === 'charts' && !screenshots && !loadingSS) {
                  setLoadingSS(true);
                  api.get(`/api/v1/trades/${trade.id}/screenshots`)
                    .then(r => { setScreenshots(r.data); })
                    .catch(() => {})
                    .finally(() => setLoadingSS(false));
                }
              }} style={{
                    padding:'8px 20px', background:'none', border:'none',
                    borderBottom: tab===t ? '2px solid #00C97A' : '2px solid transparent',
                    color: tab===t ? '#E8ECF4' : '#556080',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                    textTransform:'uppercase', letterSpacing:'.08em',
                    transition:'all .15s',
                  }}>{t}</button>
                ))}
              </div>

              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  {/* Left - stats + AI analysis */}
                  <div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                      {[
                        { l:'Entry',    v: parseFloat(trade.entry_price||0).toFixed(dec) },
                        { l:'Exit',     v: trade.close_price ? parseFloat(trade.close_price).toFixed(dec) : '—' },
                        { l:'SL',       v: trade.sl ? parseFloat(trade.sl).toFixed(dec) : '—' },
                        { l:'TP',       v: trade.tp ? parseFloat(trade.tp).toFixed(dec) : '—' },
                        { l:'RR Target', v: trade.rr_target ? `${trade.rr_target}R` : '—' },
                        { l:'RR Actual', v: trade.rr_actual ? `${parseFloat(trade.rr_actual).toFixed(2)}R` : '—' },
                      ].map(s => (
                        <div key={s.l} style={{ background:'#0c0f1a',
                          borderRadius:6, padding:'10px 14px', border:'1px solid #1a1f30' }}>
                          <div style={{ fontSize:9, color:'#556080', textTransform:'uppercase',
                            letterSpacing:'.08em', marginBottom:4 }}>{s.l}</div>
                          <div style={{ fontSize:13, color:'#E8ECF4', fontWeight:600 }}>{s.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Entry Analysis */}
                    {(() => {
                      let ea: any = null;
                      try { ea = trade.entry_analysis ? JSON.parse(trade.entry_analysis) : null; } catch(e) {}
                      return ea ? (
                        <div style={{ marginBottom:12 }}>
                          {/* Score + probabilities */}
                          <div style={{ background:'rgba(0,201,122,.04)', border:'1px solid rgba(0,201,122,.15)',
                            borderRadius:6, padding:'14px 16px', marginBottom:8 }}>
                            <div style={{ fontSize:10, color:'#00C97A', textTransform:'uppercase' as const,
                              letterSpacing:'.08em', marginBottom:12 }}>📊 Entry Analysis</div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
                              <div style={{ background:'#111626', borderRadius:5, padding:'10px 12px', textAlign:'center' as const }}>
                                <div style={{ fontSize:9, color:'#556080', marginBottom:4 }}>ENTRY SCORE</div>
                                <div style={{ fontSize:22, fontWeight:700, color: ea.entry_score>=7?'#00C97A':ea.entry_score>=5?'#F0A500':'#f04060',
                                  fontFamily:'Georgia,serif' }}>{ea.entry_score}/10</div>
                              </div>
                              <div style={{ background:'#111626', borderRadius:5, padding:'10px 12px', textAlign:'center' as const }}>
                                <div style={{ fontSize:9, color:'#556080', marginBottom:4 }}>TP PROBABILITY</div>
                                <div style={{ fontSize:22, fontWeight:700, color:'#00C97A', fontFamily:'Georgia,serif' }}>{ea.tp_probability}%</div>
                              </div>
                              <div style={{ background:'#111626', borderRadius:5, padding:'10px 12px', textAlign:'center' as const }}>
                                <div style={{ fontSize:9, color:'#556080', marginBottom:4 }}>SL PROBABILITY</div>
                                <div style={{ fontSize:22, fontWeight:700, color:'#f04060', fontFamily:'Georgia,serif' }}>{ea.sl_probability}%</div>
                              </div>
                            </div>
                            {ea.entry_reasoning && (
                              <div style={{ fontSize:12, color:'#8899b4', lineHeight:1.7, marginBottom:8 }}>{ea.entry_reasoning}</div>
                            )}
                            {ea.key_level && <div style={{ fontSize:11, color:'#F0A500', marginBottom:4 }}>📍 Key level: {ea.key_level}</div>}
                            {ea.watch_for && <div style={{ fontSize:11, color:'#556080' }}>👀 {ea.watch_for}</div>}
                          </div>

                          {/* Simulated balance */}
                          {(ea.sim_tp_pnl !== undefined || ea.sim_sl_pnl !== undefined) && (
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                              <div style={{ background:'rgba(0,201,122,.04)', border:'1px solid rgba(0,201,122,.15)',
                                borderRadius:5, padding:'10px 14px' }}>
                                <div style={{ fontSize:9, color:'#556080', textTransform:'uppercase' as const,
                                  letterSpacing:'.06em', marginBottom:4 }}>If all {ea.open_count || 1} open trades hit TP</div>
                                <div style={{ fontSize:16, fontWeight:700, color:'#00C97A' }}>
                                  {ea.sim_tp_pnl >= 0 ? '+' : ''}{ea.sim_tp_pnl?.toFixed(2) || '—'}
                                </div>
                              </div>
                              <div style={{ background:'rgba(240,64,96,.04)', border:'1px solid rgba(240,64,96,.15)',
                                borderRadius:5, padding:'10px 14px' }}>
                                <div style={{ fontSize:9, color:'#556080', textTransform:'uppercase' as const,
                                  letterSpacing:'.06em', marginBottom:4 }}>If all open trades hit SL</div>
                                <div style={{ fontSize:16, fontWeight:700, color:'#f04060' }}>
                                  {ea.sim_sl_pnl >= 0 ? '+' : ''}{ea.sim_sl_pnl?.toFixed(2) || '—'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        trade.status === 'OPEN' ? (
                          <div style={{ background:'rgba(64,144,240,.05)', border:'1px solid rgba(64,144,240,.15)',
                            borderRadius:6, padding:'12px 14px', marginBottom:10, fontSize:12, color:'#4090f0' }}>
                            ⏳ Entry analysis running... Screenshots are being processed by AI.
                          </div>
                        ) : null
                      );
                    })()}

                    {/* Exit Analysis */}
                    {(() => {
                      let xa: any = null;
                      try { xa = trade.exit_analysis ? JSON.parse(trade.exit_analysis) : null; } catch(e) {}
                      return xa ? (
                        <div style={{ background:'rgba(144,96,240,.04)',
                          border:'1px solid rgba(144,96,240,.15)',
                          borderRadius:6, padding:'14px 16px', marginBottom:10 }}>
                          <div style={{ fontSize:10, color:'#9060f0', textTransform:'uppercase' as const,
                            letterSpacing:'.08em', marginBottom:10, display:'flex',
                            justifyContent:'space-between', alignItems:'center' }}>
                            <span>🧠 Exit Analysis</span>
                            <span style={{ padding:'2px 8px', borderRadius:3, fontSize:10,
                              background:'rgba(144,96,240,.12)', color:'#9060f0' }}>
                              Exit score: {xa.exit_score}/10
                            </span>
                          </div>
                          <div style={{ fontSize:12, color:'#8899b4', lineHeight:1.7, marginBottom:8 }}>{xa.overall_analysis}</div>
                          {xa.what_went_right && <div style={{ fontSize:11, color:'#00C97A', marginBottom:4 }}>✓ {xa.what_went_right}</div>}
                          {xa.what_went_wrong && xa.what_went_wrong !== 'Nothing significant' && (
                            <div style={{ fontSize:11, color:'#f04060', marginBottom:4 }}>✗ {xa.what_went_wrong}</div>
                          )}
                          {xa.lesson && <div style={{ fontSize:11, color:'#F0A500', marginTop:4 }}>💡 {xa.lesson}</div>}
                        </div>
                      ) : (
                        <button onClick={analyse} disabled={analysing} style={{
                          width:'100%', padding:'10px', background:'rgba(144,96,240,.08)',
                          border:'1px solid rgba(144,96,240,.2)', borderRadius:6,
                          color:'#9060f0', fontSize:11, fontWeight:700, cursor:'pointer',
                          letterSpacing:'.06em', marginBottom:10,
                        }}>
                          {analysing ? '🧠 Analysing...' : '🧠 Run AI Analysis'}
                        </button>
                      );
                    })()}

                    {/* Post-exit */}
                    {trade.post_exit_tracked && exitQ && (
                      <div style={{ background:`${exitColor}08`,
                        border:`1px solid ${exitColor}25`,
                        borderRadius:6, padding:'12px 16px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center', marginBottom:10 }}>
                          <div style={{ fontSize:10, color:exitColor, textTransform:'uppercase',
                            letterSpacing:'.08em', fontWeight:700 }}>Exit Quality</div>
                          <span style={{ padding:'2px 10px', borderRadius:4, fontSize:10,
                            fontWeight:700, background:`${exitColor}15`, color:exitColor }}>
                            {exitQ}
                          </span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                          <div style={{ background:'#0c0f1a', borderRadius:4, padding:'8px 10px' }}>
                            <div style={{ fontSize:9, color:'#556080', marginBottom:3 }}>60min High</div>
                            <div style={{ fontSize:13, color:'#00C97A', fontWeight:600 }}>
                              {parseFloat(trade.post_exit_high||0).toFixed(dec)}
                            </div>
                          </div>
                          <div style={{ background:'#0c0f1a', borderRadius:4, padding:'8px 10px' }}>
                            <div style={{ fontSize:9, color:'#556080', marginBottom:3 }}>60min Low</div>
                            <div style={{ fontSize:13, color:'#f04060', fontWeight:600 }}>
                              {parseFloat(trade.post_exit_low||0).toFixed(dec)}
                            </div>
                          </div>
                        </div>
                        {exitQ === 'EARLY' && (
                          <div style={{ fontSize:11, color:'#F0A500', marginTop:8 }}>
                            ⚠ Price continued in your favour — consider trailing stops
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right - tags */}
                  <div>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:10, color:'#556080', textTransform:'uppercase',
                        letterSpacing:'.08em', marginBottom:10 }}>Tags</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14,
                        minHeight:32 }}>
                        {tags.length === 0 ? (
                          <span style={{ fontSize:11, color:'#3a4560', fontStyle:'italic' }}>
                            No tags yet
                          </span>
                        ) : tags.map(t => (
                          <Tag key={t} label={t}
                            onRemove={() => setTags(tags.filter(x => x !== t))} />
                        ))}
                      </div>
                      <TagPicker selected={tags} onChange={setTags} />
                    </div>
                    <button onClick={save} disabled={saving} style={{
                      padding:'9px 20px', background:'#00C97A', border:'none',
                      borderRadius:6, color:'#000', fontSize:11, fontWeight:700,
                      cursor:'pointer', letterSpacing:'.06em', marginTop:8,
                    }}>
                      {saving ? 'Saving...' : 'Save Tags'}
                    </button>
                  </div>
                </div>
              )}

              {/* CHARTS TAB */}
              {tab === 'charts' && (
                <div>
                  {loadingSS ? (
                <div style={{ textAlign:'center', color:'#556080', padding:'40px 0', fontSize:12 }}>
                  Loading charts...
                </div>
              ) : !screenshots?.screenshot_entry && !screenshots?.screenshot_h1_entry && !trade.screenshot_entry && !trade.screenshot_h1_entry ? (
                    <div style={{ textAlign:'center', color:'#556080', padding:'40px 0' }}>
                      <div style={{ fontSize:24, marginBottom:8 }}>
                        {trade.status === 'OPEN' ? '⏳' : '📸'}
                      </div>
                      <div>{trade.status === 'OPEN' ? 'Entry chart uploading...' : 'No charts captured yet'}</div>
                      <div style={{ fontSize:11, marginTop:4 }}>
                        {trade.status === 'OPEN'
                          ? 'Entry chart uploads within 30 seconds of trade open'
                          : 'Charts are captured automatically when EA is active'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Entry charts */}
                      {(trade.screenshot_entry || trade.screenshot_h1_entry) && (
                        <div style={{ marginBottom:20 }}>
                          <div style={{ fontSize:11, color:'#00C97A', fontWeight:700,
                            textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
                            Entry
                          </div>
                          <div style={{ display:'grid',
                            gridTemplateColumns: trade.screenshot_entry && trade.screenshot_h1_entry
                              ? '1fr 1fr' : '1fr', gap:12 }}>
                            {trade.screenshot_entry && (
                              <div>
                                <div style={{ fontSize:9, color:'#556080', marginBottom:6 }}>M15</div>
                                <img
                                  src={(screenshots?.screenshot_entry || trade.screenshot_entry || '').startsWith('data:')
                                    ? (screenshots?.screenshot_entry || trade.screenshot_entry)
                                    : `data:image/png;base64,${screenshots?.screenshot_entry || trade.screenshot_entry}`}
                                  alt="M15 Entry"
                                  style={{ width:'100%', borderRadius:6,
                                    border:'1px solid #1a1f30', display:'block' }}/>
                              </div>
                            )}
                            {trade.screenshot_h1_entry && (
                              <div>
                                <div style={{ fontSize:9, color:'#556080', marginBottom:6 }}>H1</div>
                                <img
                                  src={(screenshots?.screenshot_h1_entry || trade.screenshot_h1_entry || '').startsWith('data:')
                                    ? (screenshots?.screenshot_h1_entry || trade.screenshot_h1_entry)
                                    : `data:image/png;base64,${screenshots?.screenshot_h1_entry || trade.screenshot_h1_entry}`}
                                  alt="H1 Entry"
                                  style={{ width:'100%', borderRadius:6,
                                    border:'1px solid #1a1f30', display:'block' }}/>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Exit charts */}
                      {(trade.screenshot_exit || trade.screenshot_h1_exit) && (
                        <div>
                          <div style={{ fontSize:11, color:'#f04060', fontWeight:700,
                            textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
                            Exit
                          </div>
                          <div style={{ display:'grid',
                            gridTemplateColumns: trade.screenshot_exit && trade.screenshot_h1_exit
                              ? '1fr 1fr' : '1fr', gap:12 }}>
                            {trade.screenshot_exit && (
                              <div>
                                <div style={{ fontSize:9, color:'#556080', marginBottom:6 }}>M15</div>
                                <img
                                  src={(screenshots?.screenshot_exit || trade.screenshot_exit || '').startsWith('data:')
                                    ? (screenshots?.screenshot_exit || trade.screenshot_exit)
                                    : `data:image/png;base64,${screenshots?.screenshot_exit || trade.screenshot_exit}`}
                                  alt="M15 Exit"
                                  style={{ width:'100%', borderRadius:6,
                                    border:'1px solid #1a1f30', display:'block' }}/>
                              </div>
                            )}
                            {trade.screenshot_h1_exit && (
                              <div>
                                <div style={{ fontSize:9, color:'#556080', marginBottom:6 }}>H1</div>
                                <img
                                  src={(screenshots?.screenshot_h1_exit || trade.screenshot_h1_exit || '').startsWith('data:')
                                    ? (screenshots?.screenshot_h1_exit || trade.screenshot_h1_exit)
                                    : `data:image/png;base64,${screenshots?.screenshot_h1_exit || trade.screenshot_h1_exit}`}
                                  alt="H1 Exit"
                                  style={{ width:'100%', borderRadius:6,
                                    border:'1px solid #1a1f30', display:'block' }}/>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {tab === 'notes' && (
                <div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="What was your reasoning? What would you do differently? Any market observations..."
                    style={{
                      width:'100%', minHeight:160, padding:'12px 14px',
                      background:'#0c0f1a', border:'1px solid #1a1f30',
                      borderRadius:6, color:'#E8ECF4', fontSize:13,
                      fontFamily:'inherit', resize:'vertical', outline:'none',
                      lineHeight:1.7,
                    }}/>
                  <button onClick={save} disabled={saving} style={{
                    marginTop:12, padding:'9px 24px', background:'#00C97A',
                    border:'none', borderRadius:6, color:'#000',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                    letterSpacing:'.06em',
                  }}>
                    {saving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── MAIN JOURNAL ──
export default function Journal() {
  const [trades,        setTrades]        = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [period,        setPeriod]        = useState('week');
  const [filterSymbol,  setFilterSymbol]  = useState('');
  const [filterScanner, setFilterScanner] = useState('all');
  const [filterTag,     setFilterTag]     = useState('');
  const [filterResult,  setFilterResult]  = useState('all');
  const [filterDate,    setFilterDate]    = useState('');

  const load = async (force=false) => {
    const cacheKey = `journal_trades_${period}`;
    // Use cache for speed unless forced
    if (!force) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          setTrades(JSON.parse(cached));
          setLoading(false);
          // Refresh in background
          loadFresh(cacheKey);
          return;
        } catch(e) {}
      }
    }
    setLoading(true);
    await loadFresh(cacheKey);
    setLoading(false);
  };

  const loadFresh = async (cacheKey: string) => {
    try {
      const [closedR, openR] = await Promise.all([
        getTrades({ status:'CLOSED', period }).catch(() => ({ data:[] })),
        getTrades({ status:'OPEN' }).catch(() => ({ data:[] })),
      ]);
      const all = [...(openR.data||[]), ...(closedR.data||[])];
      setTrades(all);
      sessionStorage.setItem(cacheKey, JSON.stringify(all));
    } catch(e) {}
  };

  useEffect(() => { setLoading(true); load(); }, [period]); // eslint-disable-line

  const filtered = trades.filter(t => {
    if (filterSymbol && t.symbol !== filterSymbol) return false;
    if (filterScanner !== 'all' && t.scanner !== filterScanner) return false;
    if (filterTag && !(t.tags||[]).includes(filterTag)) return false;
    if (filterResult === 'win'  && !(t.execution_outcome||'').startsWith('WIN'))  return false;
    if (filterResult === 'loss' && !(t.execution_outcome||'').startsWith('LOSS')) return false;
    if (filterDate) {
      const closeDate = t.close_time ? new Date(t.close_time).toISOString().slice(0,10) : '';
      if (closeDate !== filterDate) return false;
    }
    return true;
  });

  const symbols = Array.from(new Set(trades.map((t:any) => t.symbol as string)));
  const allTags = Array.from(new Set(trades.flatMap((t:any) => (t.tags||[]) as string[])));
  const wins    = filtered.filter(t => (t.execution_outcome||'').startsWith('WIN')).length;
  const losses  = filtered.filter(t => (t.execution_outcome||'').startsWith('LOSS')).length;
  const netPnl  = filtered.reduce((s,t) => s + parseFloat(t.net_pnl||0), 0);
  const avgRR   = filtered.filter(t=>t.rr_actual).length > 0
    ? filtered.reduce((s,t) => s+parseFloat(t.rr_actual||0),0) / filtered.filter(t=>t.rr_actual).length
    : 0;
  const winRate = filtered.length > 0 ? Math.round(wins/filtered.length*100) : 0;

  const updateTrade = (u: any) => setTrades(trades.map(t => t.id===u.id ? u : t));

  return (
    <div style={{ padding:'24px 28px', maxWidth:1300, margin:'0 auto' }}>
      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        <StatCard label="Net P&L" value={`${netPnl>=0?'+':''}${netPnl.toFixed(2)}`}
          color={netPnl>=0?'#00C97A':'#f04060'} />
        <StatCard label="Trades" value={filtered.length} sub={`${wins}W · ${losses}L`} />
        <StatCard label="Win Rate" value={`${winRate}%`}
          color={winRate>=50?'#00C97A':winRate>=40?'#F0A500':'#f04060'} />
        <StatCard label="Avg RR" value={avgRR>0?`${avgRR.toFixed(2)}R`:'—'}
          color={avgRR>=1?'#00C97A':'#F0A500'} />
        <StatCard label="Best Trade"
          value={filtered.length ? `+${Math.max(...filtered.map(t=>parseFloat(t.net_pnl||0))).toFixed(2)}` : '—'}
          color="#00C97A" />
      </div>

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:10,
        marginBottom:16, flexWrap:'wrap' }}>
        <select value={period} onChange={e=>setPeriod(e.target.value)} style={{
          padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
          borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit' }}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
        <select value={filterResult} onChange={e=>setFilterResult(e.target.value)} style={{
          padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
          borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit' }}>
          <option value="all">All Results</option>
          <option value="win">Wins Only</option>
          <option value="loss">Losses Only</option>
        </select>
        <select value={filterSymbol} onChange={e=>setFilterSymbol(e.target.value)} style={{
          padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
          borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit' }}>
          <option value="">All Symbols</option>
          {symbols.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterScanner} onChange={e=>setFilterScanner(e.target.value)} style={{
          padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
          borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit' }}>
          <option value="all">All Scanners</option>
          <option value="S1">S1</option>
          <option value="S2">S2</option>
          <option value="MANUAL">Manual</option>
        </select>
        {allTags.length > 0 && (
          <select value={filterTag} onChange={e=>setFilterTag(e.target.value)} style={{
            padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
            borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit' }}>
            <option value="">All Tags</option>
            {allTags.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
          style={{ padding:'7px 12px', background:'#0c0f1a', border:'1px solid #252d42',
            borderRadius:6, color:'#E8ECF4', fontSize:11, fontFamily:'inherit',
            colorScheme:'dark' }}/>
        {(filterSymbol||filterTag||filterScanner!=='all'||filterResult!=='all'||filterDate) && (
          <button onClick={()=>{setFilterSymbol('');setFilterTag('');
            setFilterScanner('all');setFilterResult('all');setFilterDate('');}} style={{
            padding:'7px 12px', background:'transparent',
            border:'1px solid #252d42', borderRadius:6,
            color:'#556080', fontSize:11, cursor:'pointer' }}>
            Clear
          </button>
        )}
        <div style={{ marginLeft:'auto', color:'#556080', fontSize:11 }}>
          {filtered.length} trades
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, overflow:'hidden' }}>
        {loading ? (
          <div style={{ textAlign:'center', color:'#556080', padding:'48px 0' }}>
            Loading trades...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', color:'#556080', padding:'60px 0' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📓</div>
            <div style={{ fontSize:14, marginBottom:6 }}>No trades found</div>
            <div style={{ fontSize:12 }}>Connect your MT5 EA to start journalling automatically</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #1a1f30', background:'#070b14' }}>
                {['Date','Symbol','Dir','Lot','Entry','Exit','Duration','Tags','P&L','Result'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left',
                    fontSize:9, fontWeight:700, color:'#556080',
                    textTransform:'uppercase', letterSpacing:'.1em',
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(trade => (
                <TradeRow key={trade.id} trade={trade} onUpdate={updateTrade} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
