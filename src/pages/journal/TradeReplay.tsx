import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Dukascopy free historical data API ──
// Returns 1-minute OHLCV candles for any symbol/period
const DUKAS_SYMBOLS: Record<string, string> = {
  'EURUSD': 'EURUSD', 'GBPUSD': 'GBPUSD', 'USDJPY': 'USDJPY',
  'AUDUSD': 'AUDUSD', 'USDCAD': 'USDCAD', 'USDCHF': 'USDCHF',
  'GBPJPY': 'GBPJPY', 'EURJPY': 'EURJPY', 'EURGBP': 'EURGBP',
  'NZDUSD': 'NZDUSD', 'XAUUSD': 'XAUUSD', 'XAGUSD': 'XAGUSD',
  'NAS100': 'USTEC', 'US30': 'US30', 'GER40': 'GER30',
  'BTCUSD': 'BTCUSD',
};

interface Candle {
  time: number; // UTC ms
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradeReplayProps {
  trade: any;
  onClose: () => void;
}

async function fetchDukascopyCandles(
  symbol: string,
  startMs: number,
  endMs: number
): Promise<Candle[]> {
  // Dukascopy datafeed: returns 1-min candles
  // URL: https://datafeed.dukascopy.com/datafeed/EURUSD/2026/04/08/BID_candles_min_1.bi5
  // But easier: use their JSON API via CORS proxy
  // Actually use the public tick data URL format
  const candles: Candle[] = [];

  const start = new Date(startMs);
  const end   = new Date(endMs);

  // Generate list of hours to fetch
  const hours: Date[] = [];
  const cur = new Date(start);
  cur.setMinutes(0, 0, 0);
  while (cur <= end) {
    hours.push(new Date(cur));
    cur.setHours(cur.getHours() + 1);
  }

  for (const hour of hours) {
    const y  = hour.getUTCFullYear();
    const mo = String(hour.getUTCMonth()).padStart(2, '0'); // 0-indexed
    const d  = String(hour.getUTCDate()).padStart(2, '0');
    const h  = String(hour.getUTCHours()).padStart(2, '0');

    const url = `https://datafeed.dukascopy.com/datafeed/${symbol}/${y}/${mo}/${d}/${h}_BID_candles_min_1.bi5`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      if (buf.byteLength === 0) continue;

      // bi5 format: LZMA compressed binary
      // Each record: 4 bytes time offset (seconds from hour start)
      //              4 bytes open, high, low, close as int32 (divide by 100000 for most pairs)
      //              4 bytes volume (float)
      // Total: 24 bytes per candle
      const view = new DataView(buf);
      const pip  = symbol.includes('JPY') ? 1000 : symbol === 'XAUUSD' ? 1000 : 100000;

      for (let i = 0; i + 24 <= buf.byteLength; i += 24) {
        const secOffset = view.getInt32(i, false);
        const open  = view.getInt32(i + 4,  false) / pip;
        const close = view.getInt32(i + 8,  false) / pip;
        const low   = view.getInt32(i + 12, false) / pip;
        const high  = view.getInt32(i + 16, false) / pip;
        const ts    = hour.getTime() + secOffset * 1000;

        if (ts >= startMs && ts <= endMs + 60000) {
          candles.push({ time: ts, open, high, low, close });
        }
      }
    } catch(e) {
      // Hour not available, skip
    }
  }

  return candles.sort((a, b) => a.time - b.time);
}

export default function TradeReplay({ trade, onClose }: TradeReplayProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [candles,   setCandles]   = useState<Candle[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [playing,   setPlaying]   = useState(false);
  const [speed,     setSpeed]     = useState(1);
  const [current,   setCurrent]   = useState(0); // index of last visible candle
  const intervalRef = useRef<any>(null);

  const sym     = DUKAS_SYMBOLS[trade.symbol] || trade.symbol;
  const entry   = parseFloat(trade.entry_price || 0);
  const exitP   = parseFloat(trade.close_price || 0);
  const sl      = parseFloat(trade.sl || 0);
  const tp      = parseFloat(trade.tp || 0);
  const isJPY   = trade.symbol?.includes('JPY');
  const dec     = isJPY ? 3 : trade.symbol === 'XAUUSD' ? 2 : 5;
  const isBuy   = trade.bias === 'BUY';

  // Load candles
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const startMs = new Date(trade.open_time).getTime()  - 60 * 60 * 1000; // 1hr before
        const endMs   = trade.close_time
          ? new Date(trade.close_time).getTime() + 60 * 60 * 1000 // 1hr after
          : new Date(trade.open_time).getTime()  + 4 * 60 * 60 * 1000;

        const data = await fetchDukascopyCandles(sym, startMs, endMs);

        if (data.length === 0) {
          setError('No data available for this period from Dukascopy');
        } else {
          setCandles(data);
          // Start at candle just before entry
          const entryTs = new Date(trade.open_time).getTime();
          const idx = data.findIndex(c => c.time >= entryTs);
          setCurrent(Math.max(0, idx > 0 ? idx - 1 : 0));
        }
      } catch(e) {
        setError('Failed to load chart data');
      }
      setLoading(false);
    };
    load();
  }, [trade, sym]); // eslint-disable-line

  // Draw chart
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    const visible = candles.slice(0, current + 1);
    if (visible.length === 0) return;

    const pad   = { top: 40, right: 80, bottom: 40, left: 10 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    // Price range
    const allPrices = [
      ...visible.flatMap(c => [c.high, c.low]),
      sl || entry, tp || entry, entry, exitP || entry
    ].filter(Boolean);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 0.001;
    const pad2  = range * 0.1;
    const lo    = minP - pad2;
    const hi    = maxP + pad2;

    const toY = (p: number) => pad.top + chartH - ((p - lo) / (hi - lo)) * chartH;
    const toX = (i: number) => pad.left + (i / Math.max(visible.length - 1, 1)) * chartW;

    const candleW = Math.max(2, Math.min(12, chartW / visible.length - 2));

    // Grid lines
    ctx.strokeStyle = '#111626';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const price = hi - (i / 5) * (hi - lo);
      ctx.fillStyle = '#3a4560';
      ctx.font = '10px Inter,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(dec), W - pad.right + 4, y + 4);
    }

    // SL line
    if (sl) {
      ctx.strokeStyle = '#f04060';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, toY(sl)); ctx.lineTo(W - pad.right, toY(sl));
      ctx.stroke();
      ctx.fillStyle = '#f04060';
      ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`SL ${sl.toFixed(dec)}`, W - pad.right + 4, toY(sl) + 4);
    }

    // TP line
    if (tp) {
      ctx.strokeStyle = '#00C97A';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, toY(tp)); ctx.lineTo(W - pad.right, toY(tp));
      ctx.stroke();
      ctx.fillStyle = '#00C97A';
      ctx.fillText(`TP ${tp.toFixed(dec)}`, W - pad.right + 4, toY(tp) + 4);
    }

    // Entry line
    ctx.strokeStyle = '#F0A500';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(entry)); ctx.lineTo(W - pad.right, toY(entry));
    ctx.stroke();
    ctx.fillStyle = '#F0A500';
    ctx.fillText(`Entry ${entry.toFixed(dec)}`, W - pad.right + 4, toY(entry) + 4);

    ctx.setLineDash([]);

    // Candles
    visible.forEach((c, i) => {
      const x    = toX(i);
      const isUp = c.close >= c.open;
      const color = isUp ? '#00C97A' : '#f04060';
      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
      ctx.lineWidth   = 1;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH   = Math.max(1, bodyBot - bodyTop);
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    });

    // Entry marker (triangle)
    const entryIdx = candles.findIndex(c => c.time >= new Date(trade.open_time).getTime());
    if (entryIdx >= 0 && entryIdx <= current) {
      const ex = toX(entryIdx);
      const ey = toY(entry);
      ctx.fillStyle = '#F0A500';
      ctx.beginPath();
      if (isBuy) {
        ctx.moveTo(ex, ey - 8);
        ctx.lineTo(ex - 6, ey - 18);
        ctx.lineTo(ex + 6, ey - 18);
      } else {
        ctx.moveTo(ex, ey + 8);
        ctx.lineTo(ex - 6, ey + 18);
        ctx.lineTo(ex + 6, ey + 18);
      }
      ctx.fill();
      ctx.fillStyle = '#F0A500';
      ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ENTRY', ex, isBuy ? ey - 22 : ey + 30);
    }

    // Exit marker
    if (trade.close_time && exitP) {
      const exitTs  = new Date(trade.close_time).getTime();
      const exitIdx = candles.findIndex(c => c.time >= exitTs);
      if (exitIdx >= 0 && exitIdx <= current) {
        const xx = toX(exitIdx);
        const xy = toY(exitP);
        const win = (trade.execution_outcome || '').startsWith('WIN');
        ctx.fillStyle = win ? '#00C97A' : '#f04060';
        ctx.beginPath();
        ctx.arc(xx, xy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = 'bold 10px Inter,sans-serif';
        ctx.fillText('EXIT', xx, xy - 12);
      }
    }

    // Current price label
    if (visible.length > 0) {
      const last = visible[visible.length - 1];
      const ly   = toY(last.close);
      ctx.fillStyle = last.close >= (visible[visible.length - 2]?.close || last.open) ? '#00C97A' : '#f04060';
      ctx.fillRect(W - pad.right + 2, ly - 8, pad.right - 4, 16);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(last.close.toFixed(dec), W - pad.right + 4, ly + 4);
    }

    // Time labels
    ctx.fillStyle = '#3a4560';
    ctx.font = '9px Inter,sans-serif';
    ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(pct => {
      const idx2 = Math.floor(pct * (visible.length - 1));
      if (idx2 < visible.length) {
        const x2 = toX(idx2);
        const t  = new Date(visible[idx2].time);
        ctx.fillText(
          `${String(t.getUTCHours()).padStart(2,'0')}:${String(t.getUTCMinutes()).padStart(2,'0')}`,
          x2, H - 10
        );
      }
    });
  }, [candles, current, entry, exitP, sl, tp, dec, isBuy, trade]);

  useEffect(() => { draw(); }, [draw]);

  // Play/pause
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrent(prev => {
          if (prev >= candles.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, Math.max(50, 500 / speed));
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, candles.length]);

  const entryTs = new Date(trade.open_time).getTime();
  const exitTs  = trade.close_time ? new Date(trade.close_time).getTime() : 0;
  const currentTs = candles[current]?.time || 0;
  const pnlAtCurrent = (() => {
    if (!candles[current] || !entry) return null;
    const price = candles[current].close;
    const pip   = isJPY ? 0.01 : trade.symbol === 'XAUUSD' ? 0.01 : 0.0001;
    const pipVal = 10;
    const lot   = parseFloat(trade.lot || 0.01);
    const diff  = isBuy ? price - entry : entry - price;
    return (diff / pip * pipVal * lot).toFixed(2);
  })();

  return (
    <div style={{ background:'#070b14', borderRadius:8,
      border:'1px solid #1a1f30', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1a1f30',
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#E8ECF4' }}>
            ▶ Trade Replay
          </span>
          <span style={{ fontSize:11, color:'#556080' }}>
            {trade.symbol} · {trade.bias} · {parseFloat(trade.lot||0).toFixed(2)} lots
          </span>
          <span style={{ padding:'2px 8px', borderRadius:3, fontSize:10, fontWeight:700,
            background: isBuy ? 'rgba(0,201,122,.12)' : 'rgba(240,64,96,.12)',
            color: isBuy ? '#00C97A' : '#f04060' }}>{trade.bias}</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none',
          color:'#556080', cursor:'pointer', fontSize:18 }}>×</button>
      </div>

      {loading ? (
        <div style={{ padding:'60px', textAlign:'center', color:'#556080' }}>
          <div style={{ fontSize:24, marginBottom:12 }}>⏳</div>
          Loading historical data from Dukascopy...
        </div>
      ) : error ? (
        <div style={{ padding:'40px', textAlign:'center' }}>
          <div style={{ fontSize:24, marginBottom:12 }}>⚠️</div>
          <div style={{ color:'#f04060', marginBottom:8 }}>{error}</div>
          <div style={{ fontSize:11, color:'#556080' }}>
            Dukascopy historical data may not be available for this symbol or time period.
          </div>
        </div>
      ) : (
        <>
          {/* Canvas chart */}
          <canvas ref={canvasRef} width={860} height={400}
            style={{ width:'100%', display:'block' }}/>

          {/* Controls */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid #1a1f30',
            display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' as const }}>

            {/* Play/pause */}
            <button onClick={() => setPlaying(!playing)} style={{
              padding:'6px 16px', background: playing ? '#1a1f30' : '#00C97A',
              border:'none', borderRadius:5, color: playing ? '#00C97A' : '#000',
              fontSize:12, fontWeight:700, cursor:'pointer', minWidth:70,
            }}>{playing ? '⏸ Pause' : '▶ Play'}</button>

            {/* Reset to entry */}
            <button onClick={() => {
              const idx = candles.findIndex(c => c.time >= entryTs);
              setCurrent(Math.max(0, idx - 1));
              setPlaying(false);
            }} style={{ padding:'6px 12px', background:'transparent',
              border:'1px solid #252d42', borderRadius:5,
              color:'#556080', fontSize:11, cursor:'pointer' }}>⏮ Entry</button>

            {/* Jump to exit */}
            {exitTs > 0 && (
              <button onClick={() => {
                const idx = candles.findIndex(c => c.time >= exitTs);
                setCurrent(Math.min(candles.length - 1, idx >= 0 ? idx : candles.length - 1));
                setPlaying(false);
              }} style={{ padding:'6px 12px', background:'transparent',
                border:'1px solid #252d42', borderRadius:5,
                color:'#556080', fontSize:11, cursor:'pointer' }}>⏭ Exit</button>
            )}

            {/* Speed */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:10, color:'#556080' }}>Speed</span>
              {[1, 2, 5, 10, 20].map(s => (
                <button key={s} onClick={() => setSpeed(s)} style={{
                  padding:'3px 8px', borderRadius:4, fontSize:10, cursor:'pointer',
                  background: speed===s ? '#00C97A' : 'transparent',
                  border:`1px solid ${speed===s ? '#00C97A' : '#252d42'}`,
                  color: speed===s ? '#000' : '#556080',
                  fontWeight: speed===s ? 700 : 400,
                }}>{s}x</button>
              ))}
            </div>

            {/* Scrubber */}
            <input type="range" min={0} max={candles.length - 1} value={current}
              onChange={e => { setPlaying(false); setCurrent(parseInt(e.target.value)); }}
              style={{ flex:1, minWidth:100 }}/>

            {/* Info */}
            <div style={{ display:'flex', gap:16, fontSize:11 }}>
              <span style={{ color:'#556080' }}>
                {currentTs ? new Date(currentTs).toUTCString().slice(5, 22) : '—'}
              </span>
              {pnlAtCurrent !== null && (
                <span style={{ fontWeight:700,
                  color: parseFloat(pnlAtCurrent) >= 0 ? '#00C97A' : '#f04060' }}>
                  {parseFloat(pnlAtCurrent) >= 0 ? '+$' : '-$'}{Math.abs(parseFloat(pnlAtCurrent)).toFixed(2)}
                </span>
              )}
              <span style={{ color:'#3a4560' }}>
                {current + 1}/{candles.length} candles
              </span>
            </div>
          </div>

          {/* Trade info strip */}
          <div style={{ padding:'8px 16px', borderTop:'1px solid #0c0f1a',
            display:'flex', gap:20, fontSize:10, color:'#556080' }}>
            <span>Entry: <strong style={{ color:'#F0A500' }}>{entry.toFixed(dec)}</strong></span>
            {sl > 0 && <span>SL: <strong style={{ color:'#f04060' }}>{sl.toFixed(dec)}</strong></span>}
            {tp > 0 && <span>TP: <strong style={{ color:'#00C97A' }}>{tp.toFixed(dec)}</strong></span>}
            {exitP > 0 && <span>Exit: <strong style={{ color:'#E8ECF4' }}>{exitP.toFixed(dec)}</strong></span>}
            <span>Data source: Dukascopy (UTC)</span>
          </div>
        </>
      )}
    </div>
  );
}
