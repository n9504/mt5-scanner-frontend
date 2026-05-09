import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAccounts } from '../../api/client';
import api from '../../api/client';

const TIERS = [
  { key:'free',  name:'Free',  price:'$0',  color:'#556080', features:['1 account','50 trades','3 AI analyses'] },
  { key:'pro',   name:'Pro',   price:'$29', color:'#00C97A', features:['5 accounts','Unlimited trades','EA sync','Weekly insights'] },
  { key:'elite', name:'Elite', price:'$79', color:'#F0A500', features:['Unlimited accounts','AI chart analysis','Signals feed','Behaviour patterns'] },
  { key:'prop',  name:'Prop',  price:'$49', color:'#4090f0', features:['5 accounts','Prop firm rules','Drawdown tracker','Challenge mode'] },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} style={{
      padding:'6px 14px', background: copied ? 'rgba(0,201,122,.1)' : '#1a1f30',
      border:`1px solid ${copied ? '#00C97A' : '#252d42'}`, borderRadius:4,
      color: copied ? '#00C97A' : '#556080', fontSize:10, cursor:'pointer', fontWeight:700,
    }}>{copied ? '✓ Copied' : 'Copy'}</button>
  );
}

function Field({ label, value, onChange, suffix, placeholder }: any) {
  return (
    <div>
      <label style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
        letterSpacing:'.08em', display:'block', marginBottom:5 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '0'}
          style={{ width:'100%', padding:'9px 12px', paddingRight: suffix ? 36 : 12,
            background:'#111626', border:'1px solid #1a1f30', borderRadius:6,
            color:'#E8ECF4', fontSize:12, fontFamily:'inherit', outline:'none' }}
          onFocus={e => e.target.style.borderColor='#00C97A'}
          onBlur={e => e.target.style.borderColor='#1a1f30'}/>
        {suffix && <span style={{ position:'absolute', right:10, top:'50%',
          transform:'translateY(-50%)', color:'#556080', fontSize:11 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function AccountConfig({ account, onSaved }: { account: any; onSaved: () => void }) {
  const [type,    setType]    = useState(account.account_type || 'personal');
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    timezone:                account.timezone || 'UTC',
    daily_profit_target:     account.daily_profit_target || '',
    daily_loss_cap:          account.daily_loss_cap || '',
    risk_per_trade_pct:      account.risk_per_trade_pct || '1',
    prop_max_loss_per_trade: account.prop_max_loss_per_trade || '',
    prop_daily_max_loss:     account.prop_daily_max_loss || '',
    prop_5day_max_loss:      account.prop_5day_max_loss || '',
    prop_profit_cap:         account.prop_profit_cap || '',
    prop_challenge_target:   account.prop_challenge_target || '',
  });

  const f = (k: string) => ({ value: form[k as keyof typeof form],
    onChange: (v: string) => setForm({...form, [k]: v}) });

  const save = async () => {
    setSaving(true);
    try {
      const endpoint = type === 'prop' ? '/api/v1/setup/prop' : '/api/v1/setup/personal';
      const body: any = { account_id: account.id, timezone: form.timezone,
        risk_per_trade_pct: parseFloat(form.risk_per_trade_pct) || 1 };
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
      onSaved();
    } catch(e) {}
    setSaving(false);
  };

  return (
    <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
      borderRadius:8, padding:20, marginTop:10 }}>
      <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
        letterSpacing:'.08em', marginBottom:16 }}>Account Configuration</div>

      {/* Type selector */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        {[{k:'personal',icon:'👤',label:'Personal'},{k:'prop',icon:'🏦',label:'Prop Firm'}].map(opt => (
          <div key={opt.k} onClick={() => setType(opt.k)} style={{
            padding:'10px 14px', borderRadius:6, cursor:'pointer',
            border:`1px solid ${type===opt.k ? '#00C97A' : '#1a1f30'}`,
            background: type===opt.k ? 'rgba(0,201,122,0.05)' : 'transparent',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span>{opt.icon}</span>
            <span style={{ fontSize:12, fontWeight:700,
              color: type===opt.k ? '#E8ECF4' : '#556080' }}>{opt.label}</span>
          </div>
        ))}
      </div>

      {/* Timezone */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:10, color:'#556080', textTransform:'uppercase' as const,
          letterSpacing:'.08em', display:'block', marginBottom:5 }}>Timezone</label>
        <select value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})}
          style={{ width:'100%', padding:'9px 12px', background:'#111626',
            border:'1px solid #1a1f30', borderRadius:6, color:'#E8ECF4',
            fontSize:12, fontFamily:'inherit', outline:'none' }}>
          {[['UTC','UTC'],['Australia/Sydney','Sydney (AEST)'],['Europe/London','London (GMT)'],
            ['America/New_York','New York (EST)'],['Asia/Tokyo','Tokyo (JST)'],
            ['Asia/Singapore','Singapore (SGT)'],['Europe/Berlin','Frankfurt (CET)']
          ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Fields */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {type === 'personal' ? <>
          <Field label="Daily Profit Target" {...f('daily_profit_target')} suffix="$" />
          <Field label="Daily Loss Cap" {...f('daily_loss_cap')} suffix="$" />
          <Field label="Risk Per Trade" {...f('risk_per_trade_pct')} suffix="%" />
        </> : <>
          <Field label="Max Loss Per Trade" {...f('prop_max_loss_per_trade')} suffix="$" />
          <Field label="Daily Max Loss" {...f('prop_daily_max_loss')} suffix="$" />
          <Field label="5-Day Max Loss" {...f('prop_5day_max_loss')} suffix="$" />
          <Field label="Profit Cap" {...f('prop_profit_cap')} suffix="$" />
          <Field label="Challenge Target" {...f('prop_challenge_target')} suffix="$" />
          <Field label="Risk Per Trade" {...f('risk_per_trade_pct')} suffix="%" />
        </>}
      </div>

      <button onClick={save} disabled={saving} style={{
        padding:'9px 20px', background:'#00C97A', border:'none',
        borderRadius:6, color:'#000', fontSize:11, fontWeight:700,
        cursor:'pointer', letterSpacing:'.06em',
      }}>{saving ? 'Saving...' : 'Save Changes'}</button>
    </div>
  );
}

export default function Settings() {
  const { tenant, logout } = useAuth();
  const [accounts,   setAccounts]   = useState<any[]>([]);
  const [apiKey,     setApiKey]     = useState('');
  const [activeTab,  setActiveTab]  = useState<'profile'|'accounts'|'subscription'>('profile');
  const [editingAcc, setEditingAcc] = useState<string|null>(null);

  const loadData = () => {
    getAccounts().then(r => setAccounts(r.data || [])).catch(() => {});
    setApiKey(localStorage.getItem('api_key') || '');
  };

  useEffect(() => { loadData(); }, []);

  const currentTier = tenant?.subscription || 'free';
  const tierInfo = TIERS.find(t => t.key === currentTier) || TIERS[0];

  const tabs = [
    { key:'profile',      label:'Profile' },
    { key:'accounts',     label:'Accounts' },
    { key:'subscription', label:'Subscription' },
  ] as const;

  return (
    <div style={{ padding:'24px 28px', maxWidth:900, margin:'0 auto' }}>
      <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'Georgia,serif',
        color:'#E8ECF4', marginBottom:24 }}>Settings</h1>

      <div style={{ display:'flex', borderBottom:'1px solid #1a1f30', marginBottom:28 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:'10px 20px', background:'none', border:'none',
            borderBottom: activeTab===t.key ? '2px solid #00C97A' : '2px solid transparent',
            color: activeTab===t.key ? '#E8ECF4' : '#556080',
            fontSize:12, fontWeight:700, cursor:'pointer',
            textTransform:'uppercase', letterSpacing:'.08em',
          }}>{t.label}</button>
        ))}
      </div>

      {/* PROFILE */}
      {activeTab === 'profile' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:500 }}>
          <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:24 }}>
            <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
              letterSpacing:'.08em', marginBottom:16 }}>Account Details</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div style={{ fontSize:10, color:'#556080', marginBottom:4 }}>Name</div>
                <div style={{ fontSize:14, color:'#E8ECF4' }}>{tenant?.name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#556080', marginBottom:4 }}>Email</div>
                <div style={{ fontSize:14, color:'#E8ECF4' }}>{tenant?.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#556080', marginBottom:4 }}>Plan</div>
                <span style={{ padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:700,
                  background:`${tierInfo.color}15`, color:tierInfo.color }}>
                  {tierInfo.name} — {tierInfo.price}/mo
                </span>
              </div>
            </div>
          </div>

          <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30', borderRadius:8, padding:24 }}>
            <div style={{ fontSize:11, color:'#556080', textTransform:'uppercase' as const,
              letterSpacing:'.08em', marginBottom:12 }}>MT5 API Key</div>
            <p style={{ fontSize:12, color:'#556080', marginBottom:12, lineHeight:1.6 }}>
              Use this in your MT5 EA to connect your account.
            </p>
            <div style={{ background:'#111626', border:'1px solid #252d42', borderRadius:6,
              padding:'12px 14px', marginBottom:8, display:'flex',
              alignItems:'center', justifyContent:'space-between', gap:10 }}>
              <code style={{ fontSize:11, color:'#00C97A', wordBreak:'break-all' as const,
                fontFamily:'monospace', flex:1 }}>
                {apiKey || '—'}
              </code>
              <CopyButton text={apiKey} />
            </div>
            <p style={{ fontSize:11, color:'#3a4560' }}>Keep this key private.</p>
          </div>

          <button onClick={logout} style={{
            padding:'10px 20px', background:'transparent',
            border:'1px solid rgba(240,64,96,0.3)', borderRadius:6,
            color:'#f04060', fontSize:12, cursor:'pointer', alignSelf:'flex-start' as const,
          }}>Sign Out</button>

          <div style={{ background:'rgba(240,64,96,0.03)', border:'1px solid rgba(240,64,96,0.1)',
            borderRadius:8, padding:'16px 20px', marginTop:8 }}>
            <div style={{ fontSize:11, color:'#f04060', textTransform:'uppercase' as const,
              letterSpacing:'.08em', marginBottom:8, fontWeight:700 }}>Danger Zone</div>
            <p style={{ fontSize:12, color:'#556080', marginBottom:12, lineHeight:1.6 }}>
              Wipe all synced trades and restart from scratch. Use this if trades are out of sync.
              After wiping, restart your MT5 EA to re-sync all history.
            </p>
            <button onClick={async () => {
              if (!window.confirm('Delete ALL trades? This cannot be undone. Restart MT5 EA after to re-sync.')) return;
              try {
                await api.delete('/api/v1/trades/all');
                alert('All trades deleted. Please restart MT5 EA now.');
              } catch(e) {
                alert('Failed — contact support');
              }
            }} style={{
              padding:'8px 18px', background:'transparent',
              border:'1px solid rgba(240,64,96,0.4)', borderRadius:6,
              color:'#f04060', fontSize:11, cursor:'pointer', fontWeight:700,
            }}>⚠ Wipe All Trades</button>
          </div>
        </div>
      )}

      {/* ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div>
          <div style={{ fontSize:12, color:'#556080', marginBottom:16 }}>
            {accounts.length} connected · {currentTier === 'elite' ? 'Unlimited' : currentTier === 'free' ? 'Max 1' : 'Max 5'} on your plan
          </div>

          {accounts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'#556080' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔌</div>
              <div style={{ fontSize:14, marginBottom:6 }}>No accounts connected</div>
              <div style={{ fontSize:12 }}>Install the MT5 EA to connect your first account</div>
            </div>
          ) : accounts.map((acc: any) => (
            <div key={acc.id} style={{ marginBottom:10 }}>
              <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
                borderRadius:8, padding:'16px 20px',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#E8ECF4', marginBottom:4 }}>
                    {acc.label || acc.server}
                  </div>
                  <div style={{ display:'flex', gap:12, fontSize:11, color:'#556080' }}>
                    <span>Login: {acc.login}</span>
                    <span>{acc.server}</span>
                    <span style={{ color: acc.account_type==='prop' ? '#4090f0' : '#556080' }}>
                      {acc.account_type === 'prop' ? '🏦 Prop' : '👤 Personal'}
                    </span>
                    {acc.timezone && <span>🌏 {acc.timezone}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:700, color:'#E8ECF4' }}>
                      {acc.currency} {parseFloat(acc.balance||0).toLocaleString()}
                    </div>
                    <div style={{ fontSize:10, color:'#556080', marginTop:2 }}>
                      Equity: {parseFloat(acc.equity||0).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => setEditingAcc(editingAcc === acc.id ? null : acc.id)}
                    style={{ padding:'6px 14px', background:'transparent',
                      border:'1px solid #252d42', borderRadius:5,
                      color:'#00C97A', fontSize:11, cursor:'pointer', fontWeight:700 }}>
                    {editingAcc === acc.id ? 'Close' : 'Edit'}
                  </button>
                </div>
              </div>
              {editingAcc === acc.id && (
                <AccountConfig account={acc} onSaved={() => { setEditingAcc(null); loadData(); }} />
              )}
            </div>
          ))}

          <div style={{ marginTop:16, padding:'12px 16px',
            background:'rgba(64,144,240,0.05)', border:'1px solid rgba(64,144,240,0.15)',
            borderRadius:6, fontSize:12, color:'#4090f0', lineHeight:1.6 }}>
            💡 To add a second account, install the EA on another MT5 terminal with the same API key.
          </div>
        </div>
      )}

      {/* SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div>
          <div style={{ marginBottom:20, padding:'16px 20px',
            background:'rgba(0,201,122,0.05)', border:'1px solid rgba(0,201,122,0.15)',
            borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:12, color:'#556080', marginBottom:4 }}>Current Plan</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#E8ECF4', fontFamily:'Georgia,serif' }}>
                {tierInfo.name} — <span style={{ color:tierInfo.color }}>{tierInfo.price}/mo</span>
              </div>
            </div>
            <span style={{ fontSize:11, padding:'4px 12px', borderRadius:4,
              background:'rgba(0,201,122,.1)', color:'#00C97A', fontWeight:700 }}>Active</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
            {TIERS.filter(t => t.key !== currentTier).map(tier => (
              <div key={tier.key} style={{ background:'#0c0f1a',
                border:`1px solid ${tier.color}25`, borderRadius:8, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#E8ECF4' }}>{tier.name}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:tier.color }}>
                    {tier.price}<span style={{ fontSize:11, color:'#556080' }}>/mo</span>
                  </div>
                </div>
                <ul style={{ margin:'0 0 16px', padding:'0 0 0 16px',
                  display:'flex', flexDirection:'column', gap:4 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ fontSize:12, color:'#8899b4' }}>{f}</li>
                  ))}
                </ul>
                <button style={{ width:'100%', padding:'8px 0',
                  background:'transparent', border:`1px solid ${tier.color}`,
                  borderRadius:6, color:tier.color, fontSize:11, fontWeight:700,
                  cursor:'pointer', letterSpacing:'.06em' }}>
                  Upgrade to {tier.name}
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding:'14px 16px', background:'rgba(240,64,96,0.03)',
            border:'1px solid rgba(240,64,96,0.1)', borderRadius:6,
            fontSize:12, color:'#556080', lineHeight:1.6 }}>
            Cancel anytime — no lock-in. Subscription continues until end of billing period.{' '}
            <span style={{ color:'#f04060', cursor:'pointer' }}>Cancel subscription</span>
          </div>
        </div>
      )}
    </div>
  );
}
