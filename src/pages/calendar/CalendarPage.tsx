import React, { useState, useEffect } from 'react';
import { getTrades } from '../../api/client';

function fmt(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2); }

interface DayData {
  date: string;
  trades: any[];
  pnl: number;
  wins: number;
  losses: number;
  wr: number;
}

export default function CalendarPage() {
  const [trades,     setTrades]     = useState<any[]>([]);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [month,      setMonth]      = useState(new Date().getMonth());
  const [selectedDay,setSelectedDay]= useState<string | null>(null);

  useEffect(() => {
    getTrades({ status: 'CLOSED', period: 'all' })
      .then(r => setTrades(r.data || []))
      .catch(() => {})
      .finally(() => {});
  }, []);

  // Group trades by date
  const byDate: Record<string, DayData> = {};
  trades.forEach(t => {
    if (!t.close_time) return;
    // Use UTC date to match server-stored dates
    const d = new Date(t.close_time);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    if (!byDate[key]) byDate[key] = { date: key, trades: [], pnl: 0, wins: 0, losses: 0, wr: 0 };
    byDate[key].trades.push(t);
    byDate[key].pnl += parseFloat(t.net_pnl || 0); // net_pnl already includes commission
    if ((t.execution_outcome||'').startsWith('WIN')) byDate[key].wins++;
    else byDate[key].losses++;
  });
  Object.values(byDate).forEach(d => {
    d.pnl = parseFloat(d.pnl.toFixed(2));
    d.wr  = d.trades.length > 0 ? Math.round(d.wins / d.trades.length * 100) : 0;
  });

  // Calendar grid
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  // Weekly totals
  const weeks: Record<number, { pnl: number; days: number }> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const week = Math.ceil((d + firstDay) / 7);
    const key  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (!weeks[week]) weeks[week] = { pnl: 0, days: 0 };
    if (byDate[key]) {
      weeks[week].pnl  += byDate[key].pnl;
      weeks[week].days += 1;
    }
  }

  // Monthly total
  const monthPnl = Object.values(byDate)
    .filter(d => { const dt = new Date(d.date); return dt.getFullYear()===year && dt.getMonth()===month; })
    .reduce((s, d) => s + d.pnl, 0);
  const monthTrades = Object.values(byDate)
    .filter(d => { const dt = new Date(d.date); return dt.getFullYear()===year && dt.getMonth()===month; })
    .flatMap(d => d.trades);
  const monthWins = monthTrades.filter(t => (t.execution_outcome||'').startsWith('WIN')).length;

  const selectedData = selectedDay ? byDate[selectedDay] : null;

  const prev = () => { if (month === 0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1); setSelectedDay(null); };
  const next = () => { if (month === 11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1); setSelectedDay(null); };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia,serif', color: '#E8ECF4', marginBottom: 4 }}>Calendar</h1>
          <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
            <span style={{ color: '#556080' }}>
              Monthly P&L: <span style={{ color: monthPnl >= 0 ? '#00C97A' : '#f04060', fontWeight: 700 }}>
                {fmt(monthPnl)}
              </span>
            </span>
            <span style={{ color: '#556080' }}>
              {monthTrades.length} trades · {monthTrades.length > 0 ? Math.round(monthWins/monthTrades.length*100) : 0}% WR
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prev} style={{ background: '#111626', border: '1px solid #1a1f30',
            borderRadius: 6, color: '#E8ECF4', padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}>‹</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#E8ECF4', minWidth: 140, textAlign: 'center' }}>
            {monthName} {year}
          </span>
          <button onClick={next} style={{ background: '#111626', border: '1px solid #1a1f30',
            borderRadius: 6, color: '#E8ECF4', padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}>›</button>
          <button onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); }}
            style={{ background: '#111626', border: '1px solid #1a1f30', borderRadius: 6,
              color: '#556080', padding: '6px 14px', cursor: 'pointer', fontSize: 11 }}>Today</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Calendar */}
        <div style={{ flex: 1 }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr) 80px', gap: 2, marginBottom: 2 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#556080',
                textTransform: 'uppercase', letterSpacing: '.06em', padding: '6px 0' }}>{d}</div>
            ))}
            <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase',
              letterSpacing: '.06em', padding: '6px 8px', textAlign: 'center' }}>Week</div>
          </div>

          {/* Calendar grid */}
          {Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) }, (_, weekIdx) => {
            const weekNum = weekIdx + 1;
            const weekData = weeks[weekNum];
            return (
              <div key={weekIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr) 80px', gap: 2, marginBottom: 2 }}>
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const dayNum = weekIdx * 7 + dayIdx - firstDay + 1;
                  if (dayNum < 1 || dayNum > daysInMonth) {
                    return <div key={dayIdx} style={{ background: '#080b16', borderRadius: 4, minHeight: 70 }}/>;
                  }
                  const key   = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
                  const data  = byDate[key];
                  const isSelected = selectedDay === key;
                  const isToday = new Date().toISOString().slice(0,10) === key;
                  const pnlColor = data ? (data.pnl >= 0 ? '#00C97A' : '#f04060') : '#556080';
                  const bgColor  = data
                    ? data.pnl >= 0 ? 'rgba(0,201,122,0.06)' : 'rgba(240,64,96,0.06)'
                    : '#0c0f1a';

                  return (
                    <div key={dayIdx}
                      onClick={() => data && setSelectedDay(isSelected ? null : key)}
                      style={{
                        background: isSelected ? 'rgba(0,201,122,0.12)' : bgColor,
                        border: `1px solid ${isSelected ? '#00C97A' : isToday ? '#252d42' : '#111626'}`,
                        borderRadius: 4, minHeight: 70, padding: '6px 8px',
                        cursor: data ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      <div style={{ fontSize: 11, color: isToday ? '#00C97A' : '#556080',
                        fontWeight: isToday ? 700 : 400, marginBottom: 4 }}>{dayNum}</div>
                      {data && (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: pnlColor, lineHeight: 1.2 }}>
                            {fmt(data.pnl)}
                          </div>
                          <div style={{ fontSize: 10, color: '#556080', marginTop: 3 }}>
                            {data.trades.length} trade{data.trades.length !== 1 ? 's' : ''}
                          </div>
                          <div style={{ fontSize: 10, color: data.wr >= 50 ? '#00C97A' : '#f04060', marginTop:1 }}>
                            {data.wr}% WR
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {/* Weekly summary */}
                <div style={{ background: '#080b16', border: '1px solid #111626',
                  borderRadius: 4, minHeight: 70, padding: '6px 8px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 9, color: '#3a4560', textTransform: 'uppercase',
                    letterSpacing: '.06em', marginBottom: 4 }}>Week {weekNum}</div>
                  {weekData && weekData.days > 0 ? (
                    <div style={{ fontSize: 12, fontWeight: 700,
                      color: weekData.pnl >= 0 ? '#00C97A' : '#f04060' }}>
                      {fmt(weekData.pnl)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#3a4560' }}>—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day detail panel */}
        {selectedDay && selectedData && (
          <div style={{ width: 320, background: '#0c0f1a', border: '1px solid #1a1f30',
            borderRadius: 8, padding: 20, alignSelf: 'flex-start', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E8ECF4' }}>
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en', { weekday:'long', day:'numeric', month:'long' })}
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  <span style={{ color: selectedData.pnl >= 0 ? '#00C97A' : '#f04060', fontWeight: 700 }}>
                    {fmt(selectedData.pnl)}
                  </span>
                  <span style={{ color: '#556080' }}> · {selectedData.trades.length} trades · {selectedData.wr}% WR</span>
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{
                background: 'none', border: 'none', color: '#556080', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedData.trades.map((t, i) => {
                const win  = (t.execution_outcome||'').startsWith('WIN');
                const pnl  = parseFloat(t.net_pnl || 0);
                const dec  = parseFloat(t.entry_price||0) > 100 ? 2 : 5;
                return (
                  <div key={i} style={{
                    background: '#111626', borderRadius: 6, padding: '10px 12px',
                    borderLeft: `3px solid ${win ? '#00C97A' : '#f04060'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#E8ECF4' }}>{t.symbol}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3,
                          background: t.bias==='BUY' ? 'rgba(0,201,122,.12)' : 'rgba(240,64,96,.12)',
                          color: t.bias==='BUY' ? '#00C97A' : '#f04060', fontWeight: 700 }}>{t.bias}</span>
                        <span style={{ fontSize: 10, color: '#556080' }}>{t.scanner}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: win ? '#00C97A' : '#f04060' }}>
                        {fmt(pnl)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#556080' }}>
                      <span>Entry: {parseFloat(t.entry_price||0).toFixed(dec)}</span>
                      {t.close_price && <span>Exit: {parseFloat(t.close_price).toFixed(dec)}</span>}
                      {t.rr_actual && <span>{parseFloat(t.rr_actual).toFixed(2)}R</span>}
                      <span>{t.close_time ? new Date(t.close_time).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
