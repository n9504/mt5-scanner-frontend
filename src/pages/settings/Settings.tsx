import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAccounts, getConfig } from '../../api/client';

function Section({ title, children }: any) {
  return (
    <div style={{ background: '#0c0f1a', border: '1px solid #1a1f30',
      borderRadius: 8, padding: '24px', marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: '#556080', textTransform: 'uppercase' as const,
        letterSpacing: '.1em', marginBottom: 20, fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, action }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid #111626' }}>
      <div>
        <div style={{ fontSize: 13, color: '#E8ECF4', marginBottom: 2 }}>{label}</div>
        {value && <div style={{ fontSize: 11, color: '#556080' }}>{value}</div>}
      </div>
      {action}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    free: '#556080', pro: '#4090f0', elite: '#9060f0', prop: '#F0A500'
  };
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700,
      background: `${colors[tier] || '#556080'}20`,
      color: colors[tier] || '#556080',
      textTransform: 'uppercase' as const, letterSpacing: '.08em',
    }}>{tier}</span>
  );
}

export default function Settings() {
  const { tenant, logout } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [config,   setConfig]   = useState<any>({});
  const [copied,   setCopied]   = useState(false);
  const [apiKey,   setApiKey]   = useState('');

  useEffect(() => {
    loadAll();
  }, []); // eslint-disable-line

  const loadAll = async () => {
    try {
      const [accR, cfgR] = await Promise.all([
        getAccounts().catch(() => ({ data: [] })),
        getConfig().catch(() => ({ data: {} })),
      ]);
      setAccounts(accR.data || []);
      setConfig(cfgR.data || {});
      const key = localStorage.getItem('api_key') || '';
      setApiKey(key);
    } catch(e) {}
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tier = tenant?.subscription || 'free';
  const maxAccounts = tier === 'elite' ? 'Unlimited' : tier === 'pro' || tier === 'prop' ? 5 : 1;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia,serif',
        color: '#E8ECF4', marginBottom: 24 }}>Settings</h1>

      {/* Profile */}
      <Section title="Profile">
        <Row label="Name" value={tenant?.name || '—'} />
        <Row label="Email" value={tenant?.email} />
        <Row label="Subscription" action={<TierBadge tier={tier} />} />
        {tier === 'free' && (
          <div style={{ marginTop: 16, padding: '14px 16px',
            background: 'rgba(64,144,240,.05)', border: '1px solid rgba(64,144,240,.2)',
            borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: '#4090f0', marginBottom: 8 }}>
              Upgrade to unlock more features
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { name: 'Pro', price: '$29/mo', color: '#4090f0' },
                { name: 'Elite', price: '$79/mo', color: '#9060f0' },
                { name: 'Prop', price: '$49/mo', color: '#F0A500' },
              ].map(p => (
                <button key={p.name} style={{
                  padding: '6px 16px', background: 'transparent',
                  border: `1px solid ${p.color}`, borderRadius: 6,
                  color: p.color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>{p.name} — {p.price}</button>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* API Key */}
      <Section title="MT5 Connection">
        <div style={{ marginBottom: 8, fontSize: 12, color: '#556080', lineHeight: 1.7 }}>
          Use this API key in your TradePattrnly EA to connect MetaTrader 5 to your journal.
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            flex: 1, padding: '10px 14px', background: '#111626',
            border: '1px solid #1a1f30', borderRadius: 6,
            fontSize: 12, color: '#00C97A', fontFamily: 'monospace',
            wordBreak: 'break-all' as const,
          }}>
            {apiKey || '—'}
          </div>
          <button onClick={copyApiKey} style={{
            padding: '10px 16px', background: copied ? '#00C97A' : '#1a1f30',
            border: 'none', borderRadius: 6, color: copied ? '#000' : '#E8ECF4',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const,
            transition: 'all .2s', flexShrink: 0,
          }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#3a4560' }}>
          EA download:{' '}
          <a href="https://azzzmgxsydlvwicfqvxm.supabase.co/storage/v1/object/public/assets/TradePattrnly_EA.mq5"
            style={{ color: '#00C97A' }} target="_blank" rel="noreferrer">
            TradePattrnly_EA.mq5
          </a>
        </div>
      </Section>

      {/* Connected Accounts */}
      <Section title={`Connected Accounts (${accounts.length}/${maxAccounts})`}>
        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#556080', padding: '20px 0', fontSize: 13 }}>
            No accounts connected yet. Install the EA in MT5 to get started.
          </div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #111626' }}>
              <div>
                <div style={{ fontSize: 13, color: '#E8ECF4', fontWeight: 700 }}>
                  {acc.label || acc.server}
                </div>
                <div style={{ fontSize: 11, color: '#556080' }}>
                  Login: {acc.login} · {acc.currency} · Balance: {parseFloat(acc.balance||0).toFixed(2)}
                </div>
              </div>
              <span style={{ width: 8, height: 8, borderRadius: '50%',
                background: '#00C97A', display: 'inline-block' }}/>
            </div>
          ))
        )}
        {(tier === 'free' && accounts.length >= 1) ||
         ((tier === 'pro' || tier === 'prop') && accounts.length >= 5) ? (
          <div style={{ marginTop: 12, fontSize: 11, color: '#F0A500' }}>
            Account limit reached. Upgrade to add more accounts.
          </div>
        ) : (
          <div style={{ marginTop: 12, fontSize: 11, color: '#556080' }}>
            To add another account: install the EA on a new MT5 terminal with the same API key.
            It will appear here automatically.
          </div>
        )}
      </Section>

      {/* Risk Config */}
      <Section title="Risk Configuration">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { l: 'Account Type', v: config.account_type || 'Not set' },
            { l: 'Daily Target', v: config.daily_target ? `$${config.daily_target}` : '—' },
            { l: 'Daily Loss Cap', v: config.daily_loss_cap ? `$${config.daily_loss_cap}` : '—' },
            { l: 'Risk Per Trade', v: config.risk_per_trade ? `${config.risk_per_trade}%` : '—' },
            config.account_type === 'prop' && { l: 'Firm', v: config.firm_name || '—' },
            config.account_type === 'prop' && { l: 'Max Loss/Trade', v: config.max_loss_trade ? `$${config.max_loss_trade}` : '—' },
          ].filter(Boolean).map((item: any) => (
            <div key={item.l} style={{ background: '#111626', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 9, color: '#556080', textTransform: 'uppercase' as const,
                letterSpacing: '.08em', marginBottom: 4 }}>{item.l}</div>
              <div style={{ fontSize: 13, color: '#E8ECF4' }}>{item.v}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Account">
        <button onClick={logout} style={{
          padding: '10px 24px', background: 'transparent',
          border: '1px solid #f04060', borderRadius: 6,
          color: '#f04060', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>Sign Out</button>
      </Section>
    </div>
  );
}
