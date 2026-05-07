import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const SYMBOLS = ["EURUSD","GBPUSD","USDJPY","GBPJPY","AUDUSD","USDCAD","EURJPY","EURGBP","NAS100","GER40","US30","BTCUSD","ETHUSD"];

function BiasTag({ bias }: { bias: string }) {
  const color = bias==='BUY'?'#00C97A':bias==='SELL'?'#f04060':'#556080';
  const bg    = bias==='BUY'?'rgba(0,201,122,.12)':bias==='SELL'?'rgba(240,64,96,.12)':'rgba(85,96,128,.12)';
  return <span style={{ padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:700, background:bg, color }}>{bias||'NEUTRAL'}</span>;
}

export default function Bias() {
  const [weekly,   setWeekly]   = useState<any>({});
  const [intraday, setIntraday] = useState<any>({});
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'weekly'|'intraday'>('weekly');

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/bias?scanner=S3').catch(()=>({data:{}})),
      api.get('/api/v1/bias?scanner=S2').catch(()=>({data:{}})),
    ]).then(([w,i]) => { setWeekly(w.data||{}); setIntraday(i.data||{}); setLoading(false); });
  }, []);

  const data = tab==='weekly' ? weekly : intraday;

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif', color:'#E8ECF4', marginBottom:4 }}>Pattrnly Bias</h1>
        <p style={{ color:'#556080', fontSize:12 }}>Market bias updated daily from our analysis engine</p>
      </div>

      <div style={{ background:'rgba(240,160,0,0.05)', border:'1px solid rgba(240,160,0,0.2)',
        borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:11, color:'#8899b4', lineHeight:1.7 }}>
        <strong style={{ color:'#F0A500' }}>⚠ Disclaimer:</strong> This bias is for informational purposes only and is <strong style={{ color:'#E8ECF4' }}>not a trade recommendation</strong>. Trading leveraged instruments involves significant risk of loss. Always conduct your own analysis.
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid #1a1f30', marginBottom:20 }}>
        {[{k:'weekly',label:'Weekly Bias',sub:'W1/D1/H4 · Updated daily 00:00 UTC'},
          {k:'intraday',label:'Intraday Bias',sub:'H1/M15 · Updated each session'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} style={{
            padding:'10px 24px', background:'none', border:'none',
            borderBottom:tab===t.k?'2px solid #00C97A':'2px solid transparent', cursor:'pointer' }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase' as const,
              letterSpacing:'.06em', color:tab===t.k?'#E8ECF4':'#556080' }}>{t.label}</div>
            <div style={{ fontSize:10, color:'#3a4560', marginTop:2 }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', color:'#556080', padding:60 }}>Loading...</div>
      ) : Object.keys(data).length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#556080' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
          No bias data yet — updated daily from scanner
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {SYMBOLS.map(sym => {
            const b = data[sym]; if (!b) return null;
            const bias = b.bias||'NEUTRAL';
            const borderColor = bias==='BUY'?'rgba(0,201,122,.2)':bias==='SELL'?'rgba(240,64,96,.2)':'#1a1f30';
            return (
              <div key={sym} style={{ background:'#0c0f1a', border:`1px solid ${borderColor}`, borderRadius:8, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#E8ECF4' }}>{sym}</div>
                    {b.condition && <div style={{ fontSize:9, color:'#556080', textTransform:'uppercase' as const, letterSpacing:'.06em', marginTop:2 }}>{b.condition}</div>}
                  </div>
                  <BiasTag bias={bias} />
                </div>
                {b.confidence && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ height:3, background:'#1a1f30', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:`${b.confidence}%`, height:'100%',
                        background:bias==='BUY'?'#00C97A':bias==='SELL'?'#f04060':'#556080' }}/>
                    </div>
                    <div style={{ fontSize:9, color:'#556080', marginTop:3 }}>{b.confidence}% confidence</div>
                  </div>
                )}
                {(b.hypothesis||b.bias_reason) && (
                  <div style={{ fontSize:11, color:'#8899b4', lineHeight:1.6, borderTop:'1px solid #111626', paddingTop:8, marginTop:4 }}>
                    {(b.hypothesis||b.bias_reason||'').slice(0,120)}{(b.hypothesis||b.bias_reason||'').length>120?'...':''}
                  </div>
                )}
                {(b.buy_tp||b.sell_tp) && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 }}>
                    {b.buy_tp && <div style={{ background:'#111626', borderRadius:4, padding:'6px 8px' }}>
                      <div style={{ fontSize:9, color:'#556080' }}>Buy TP</div>
                      <div style={{ fontSize:12, color:'#00C97A', fontWeight:700 }}>{b.buy_tp}</div>
                    </div>}
                    {b.sell_tp && <div style={{ background:'#111626', borderRadius:4, padding:'6px 8px' }}>
                      <div style={{ fontSize:9, color:'#556080' }}>Sell TP</div>
                      <div style={{ fontSize:12, color:'#f04060', fontWeight:700 }}>{b.sell_tp}</div>
                    </div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
