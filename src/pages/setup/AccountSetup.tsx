import React, { useState } from 'react';
import api from '../../api/client';

export default function AccountSetup({ accountId, onComplete }: { accountId: string; onComplete: () => void }) {
  const [step,    setStep]    = useState(0);
  const [type,    setType]    = useState<'personal'|'prop'|null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({
    timezone: 'UTC+00:00',
    daily_profit_target: '', daily_loss_cap: '', risk_per_trade_pct: '1',
    prop_max_loss_per_trade: '', prop_daily_max_loss: '',
    prop_5day_max_loss: '', prop_profit_cap: '', prop_challenge_target: '',
  });

  const save = async () => {
    setSaving(true); setError('');
    try {
      const endpoint = type === 'prop' ? '/api/v1/setup/prop' : '/api/v1/setup/personal';
      const body: any = {
        account_id: accountId,
        timezone: form.timezone,
        risk_per_trade_pct: parseFloat(form.risk_per_trade_pct) || 1,
      };
      if (type === 'personal') {
        if (form.daily_profit_target) body.daily_profit_target = parseFloat(form.daily_profit_target);
        if (form.daily_loss_cap)      body.daily_loss_cap      = parseFloat(form.daily_loss_cap);
      } else {
        if (form.prop_max_loss_per_trade) body.prop_max_loss_per_trade = parseFloat(form.prop_max_loss_per_trade);
        if (form.prop_daily_max_loss)     body.prop_daily_max_loss     = parseFloat(form.prop_daily_max_loss);
        if (form.prop_5day_max_loss)      body.prop_5day_max_loss      = parseFloat(form.prop_5day_max_loss);
        if (form.prop_profit_cap)         body.prop_profit_cap         = parseFloat(form.prop_profit_cap);
        if (form.prop_challenge_target)   body.prop_challenge_target   = parseFloat(form.prop_challenge_target);
      }
      await api.post(endpoint, body);
      // Mark setup as complete in localStorage immediately
      localStorage.setItem('setup_seen', '1');
      setStep(2);
    } catch(e: any) {
      setError(e?.response?.data?.detail || 'Save failed — please try again');
    }
    setSaving(false);
  };

  const Field = ({ label, field, suffix, placeholder }: any) => (
    <div>
      <label style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
        letterSpacing:'.08em', display:'block', marginBottom:5 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input type="number" placeholder={placeholder || '0'}
          value={(form as any)[field]}
          onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
          style={{ width:'100%', padding:'9px 12px', paddingRight: suffix ? 36 : 12,
            background:'#111626', border:'1px solid #1a1f30', borderRadius:6,
            color:'#E8ECF4', fontSize:12, fontFamily:'inherit', outline:'none' }}
          onFocus={e => e.target.style.borderColor = '#00C97A'}
          onBlur={e => e.target.style.borderColor = '#1a1f30'}/>
        {suffix && <span style={{ position:'absolute', right:10, top:'50%',
          transform:'translateY(-50%)', color:'#556080', fontSize:11 }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(7,11,20,0.95)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
      fontFamily:"'JetBrains Mono', monospace" }}>
      <div style={{ width:500, background:'#0c0f1a', border:'1px solid #1a1f30',
        borderRadius:12, padding:40 }}>

        {/* Step 0 — Account type */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, fontFamily:'Georgia,serif',
              color:'#E8ECF4', marginBottom:8 }}>Set up your account</h2>
            <p style={{ color:'#556080', fontSize:12, marginBottom:24 }}>
              What type of account is this?
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
              {[
                { k:'personal', icon:'👤', title:'Personal', desc:'Your own capital' },
                { k:'prop',     icon:'🏦', title:'Prop Firm', desc:'Funded / challenge account' },
              ].map(opt => (
                <div key={opt.k} onClick={() => setType(opt.k as any)} style={{
                  padding:20, borderRadius:8, cursor:'pointer', textAlign:'center' as const,
                  border:`1px solid ${type===opt.k ? '#00C97A' : '#1a1f30'}`,
                  background: type===opt.k ? 'rgba(0,201,122,0.05)' : '#111626',
                }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{opt.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700,
                    color: type===opt.k ? '#E8ECF4' : '#8899b4' }}>{opt.title}</div>
                  <div style={{ fontSize:11, color:'#556080', marginTop:4 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => type && setStep(1)} disabled={!type} style={{
              width:'100%', padding:12, background: type ? '#00C97A' : '#252d42',
              border:'none', borderRadius:6, color: type ? '#000' : '#556080',
              fontSize:12, fontWeight:700, cursor: type ? 'pointer' : 'not-allowed',
            }}>Continue →</button>
            <button onClick={() => { localStorage.setItem('setup_seen','1'); onComplete(); }}
              style={{ width:'100%', marginTop:8, padding:'8px', background:'transparent',
                border:'none', color:'#3a4560', fontSize:11, cursor:'pointer' }}>
              Skip for now
            </button>
          </div>
        )}

        {/* Step 1 — Configuration */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, fontFamily:'Georgia,serif',
              color:'#E8ECF4', marginBottom:8 }}>
              {type === 'prop' ? 'Prop Firm Rules' : 'Personal Goals'}
            </h2>
            <p style={{ color:'#556080', fontSize:12, marginBottom:20 }}>
              You can change these anytime in Settings.
            </p>

            <div style={{ display:'flex', flexDirection:'column' as const, gap:12, marginBottom:20 }}>
              <div>
                <label style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
                  letterSpacing:'.08em', display:'block', marginBottom:5 }}>Timezone</label>
                <select value={form.timezone}
                  onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', background:'#111626',
                    border:'1px solid #1a1f30', borderRadius:6, color:'#E8ECF4',
                    fontSize:12, fontFamily:'inherit', outline:'none' }}>
                  <option value="UTC+00:00">UTC+00:00 (London)</option>
                  <option value="UTC+01:00">UTC+01:00 (Paris, Berlin)</option>
                  <option value="UTC+02:00">UTC+02:00 (Cairo, Johannesburg)</option>
                  <option value="UTC+03:00">UTC+03:00 (Moscow, Riyadh)</option>
                  <option value="UTC+03:30">UTC+03:30 (Tehran)</option>
                  <option value="UTC+04:00">UTC+04:00 (Dubai)</option>
                  <option value="UTC+04:30">UTC+04:30 (Kabul)</option>
                  <option value="UTC+05:00">UTC+05:00 (Karachi)</option>
                  <option value="UTC+05:30">UTC+05:30 (Mumbai)</option>
                  <option value="UTC+05:45">UTC+05:45 (Kathmandu)</option>
                  <option value="UTC+06:00">UTC+06:00 (Dhaka)</option>
                  <option value="UTC+06:30">UTC+06:30 (Yangon)</option>
                  <option value="UTC+07:00">UTC+07:00 (Bangkok, Jakarta)</option>
                  <option value="UTC+08:00">UTC+08:00 (Singapore, HK, Perth)</option>
                  <option value="UTC+09:00">UTC+09:00 (Tokyo, Seoul)</option>
                  <option value="UTC+09:30">UTC+09:30 (Adelaide)</option>
                  <option value="UTC+10:00">UTC+10:00 (Sydney, Brisbane)</option>
                  <option value="UTC+11:00">UTC+11:00 (Solomon Islands)</option>
                  <option value="UTC+12:00">UTC+12:00 (Auckland)</option>
                  <option value="UTC-01:00">UTC-01:00 (Azores)</option>
                  <option value="UTC-02:00">UTC-02:00 (South Georgia)</option>
                  <option value="UTC-03:00">UTC-03:00 (Brasilia)</option>
                  <option value="UTC-04:00">UTC-04:00 (Halifax)</option>
                  <option value="UTC-05:00">UTC-05:00 (New York)</option>
                  <option value="UTC-06:00">UTC-06:00 (Chicago)</option>
                  <option value="UTC-07:00">UTC-07:00 (Denver)</option>
                  <option value="UTC-08:00">UTC-08:00 (Los Angeles)</option>
                  <option value="UTC-09:00">UTC-09:00 (Alaska)</option>
                  <option value="UTC-10:00">UTC-10:00 (Hawaii)</option>
                  <option value="UTC-11:00">UTC-11:00 (American Samoa)</option>
                  <option value="UTC-12:00">UTC-12:00 (Baker Island)</option>
                </select>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {type === 'personal' ? <>
                  <Field label="Daily Profit Target" field="daily_profit_target" suffix="$" />
                  <Field label="Daily Loss Cap" field="daily_loss_cap" suffix="$" />
                  <Field label="Risk Per Trade" field="risk_per_trade_pct" suffix="%" placeholder="1" />
                </> : <>
                  <Field label="Max Loss / Trade" field="prop_max_loss_per_trade" suffix="$" />
                  <Field label="Daily Max Loss" field="prop_daily_max_loss" suffix="$" />
                  <Field label="5-Day Max Loss" field="prop_5day_max_loss" suffix="$" />
                  <Field label="Profit Cap" field="prop_profit_cap" suffix="$" />
                  <Field label="Challenge Target" field="prop_challenge_target" suffix="$" />
                  <Field label="Risk Per Trade" field="risk_per_trade_pct" suffix="%" placeholder="0.5" />
                </>}
              </div>
            </div>

            {error && (
              <div style={{ padding:'8px 12px', background:'rgba(240,64,96,.08)',
                border:'1px solid rgba(240,64,96,.2)', borderRadius:5,
                color:'#f04060', fontSize:11, marginBottom:12 }}>{error}</div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep(0)} style={{
                padding:'10px 20px', background:'transparent',
                border:'1px solid #252d42', borderRadius:6,
                color:'#556080', fontSize:11, cursor:'pointer' }}>Back</button>
              <button onClick={save} disabled={saving} style={{
                flex:1, padding:12, background: saving ? '#1a2a1a' : '#00C97A',
                border:'none', borderRadius:6,
                color: saving ? '#00C97A' : '#000',
                fontSize:12, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
              }}>{saving ? 'Saving...' : 'Save & Continue →'}</button>
            </div>
          </div>
        )}

        {/* Step 2 — Done */}
        {step === 2 && (
          <div style={{ textAlign:'center' as const }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif',
              color:'#E8ECF4', marginBottom:8 }}>All set!</h2>
            <p style={{ color:'#556080', fontSize:12, lineHeight:1.7, marginBottom:28 }}>
              Account configured. Your trades will appear automatically once the EA is running.
              You can update these settings anytime from Settings → Accounts.
            </p>
            <button onClick={onComplete} style={{
              padding:'12px 32px', background:'#00C97A', border:'none',
              borderRadius:6, color:'#000', fontSize:12, fontWeight:700, cursor:'pointer',
            }}>Go to Dashboard →</button>
          </div>
        )}
      </div>
    </div>
  );
}
