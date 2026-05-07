import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logo = () => (
  <svg width="140" height="28" viewBox="0 0 180 40" fill="none">
    <rect x="0" y="6" width="4" height="22" rx="2" fill="#00C97A"/>
    <rect x="6" y="3" width="4" height="28" rx="2" fill="#00C97A" opacity=".7"/>
    <rect x="12" y="0" width="4" height="34" rx="2" fill="#00C97A" opacity=".9"/>
    <rect x="18" y="5" width="4" height="24" rx="2" fill="#F0A500"/>
    <rect x="24" y="10" width="4" height="16" rx="2" fill="#00C97A" opacity=".6"/>
    <rect x="30" y="2" width="4" height="30" rx="2" fill="#00C97A"/>
    <text x="40" y="24" fontFamily="Georgia,serif" fontSize="16" fontWeight="700" fill="#E8ECF4">Trade</text>
    <text x="82" y="24" fontFamily="Georgia,serif" fontSize="16" fontWeight="400" fill="#00C97A">Pattrnly</text>
  </svg>
);

const s = {
  page: { background: '#070b14', minHeight: '100vh', color: '#E8ECF4',
    fontFamily: "'JetBrains Mono', monospace" } as React.CSSProperties,
  nav: { padding: '16px 48px', borderBottom: '1px solid #1a1f30',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  container: { maxWidth: 800, margin: '0 auto', padding: '60px 24px' } as React.CSSProperties,
  h1: { fontSize: 32, fontWeight: 700, fontFamily: 'Georgia,serif',
    marginBottom: 8, color: '#E8ECF4' } as React.CSSProperties,
  date: { fontSize: 11, color: '#556080', marginBottom: 40 } as React.CSSProperties,
  h2: { fontSize: 16, fontWeight: 700, color: '#00C97A', marginTop: 32,
    marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '.06em' },
  p: { fontSize: 13, color: '#8899b4', lineHeight: 1.8, marginBottom: 12 } as React.CSSProperties,
  li: { fontSize: 13, color: '#8899b4', lineHeight: 1.8, marginBottom: 6,
    marginLeft: 20 } as React.CSSProperties,
};

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo /></div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize: 11, color: '#556080' }}>Legal</span>
          <button onClick={() => navigate('/')} style={{
            padding:'6px 14px', background:'transparent', border:'1px solid #252d42',
            borderRadius:4, color:'#556080', fontSize:11, cursor:'pointer' }}>← Home</button>
        </div>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.date}>Last updated: May 2026</p>

        <h2 style={s.h2}>1. Information We Collect</h2>
        <p style={s.p}>We collect the following information when you use TradePattrnly:</p>
        <ul>
          <li style={s.li}><strong>Account information:</strong> Email address, name, password (hashed)</li>
          <li style={s.li}><strong>Trading data:</strong> Trade history, positions, P&L synced via your MT5 EA</li>
          <li style={s.li}><strong>Usage data:</strong> How you interact with the platform</li>
          <li style={s.li}><strong>Device data:</strong> Browser type, IP address, timezone</li>
        </ul>

        <h2 style={s.h2}>2. How We Use Your Information</h2>
        <p style={s.p}>We use your information to:</p>
        <ul>
          <li style={s.li}>Provide and improve the Service</li>
          <li style={s.li}>Generate AI analysis and trading insights</li>
          <li style={s.li}>Send transactional emails (account setup, alerts)</li>
          <li style={s.li}>Process payments via our payment processor</li>
          <li style={s.li}>Comply with legal obligations</li>
        </ul>

        <h2 style={s.h2}>3. Your Trading Data</h2>
        <p style={s.p}>Your trading data is your own. We do not sell, share, or use your individual trading data for any purpose other than providing the Service to you. Aggregated, anonymised data may be used to improve the platform.</p>

        <h2 style={s.h2}>4. AI Analysis</h2>
        <p style={s.p}>Trade screenshots and data sent for AI analysis are processed by Anthropic's Claude API. Data is processed in accordance with Anthropic's privacy policy. We do not store screenshots longer than necessary for analysis.</p>

        <h2 style={s.h2}>5. Data Storage</h2>
        <p style={s.p}>Your data is stored securely using Supabase (PostgreSQL) with row-level security. Data is hosted in servers compliant with industry security standards. We retain your data for as long as your account is active.</p>

        <h2 style={s.h2}>6. Data Sharing</h2>
        <p style={s.p}>We do not sell your personal data. We share data only with:</p>
        <ul>
          <li style={s.li}>Payment processors (Paddle) for billing purposes</li>
          <li style={s.li}>Anthropic for AI analysis features</li>
          <li style={s.li}>Law enforcement when legally required</li>
        </ul>

        <h2 style={s.h2}>7. Cookies</h2>
        <p style={s.p}>We use essential cookies for authentication. We do not use tracking or advertising cookies.</p>

        <h2 style={s.h2}>8. Your Rights</h2>
        <p style={s.p}>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at support@tradepattrnly.com. We will respond within 30 days.</p>

        <h2 style={s.h2}>9. Data Deletion</h2>
        <p style={s.p}>You can delete your account and all associated data at any time from Settings. Data is permanently deleted within 30 days of account deletion.</p>

        <h2 style={s.h2}>10. Security</h2>
        <p style={s.p}>We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and row-level database security. No method of transmission over the internet is 100% secure.</p>

        <h2 style={s.h2}>11. Children's Privacy</h2>
        <p style={s.p}>TradePattrnly is not intended for users under 18 years of age. We do not knowingly collect data from minors.</p>

        <h2 style={s.h2}>12. Contact</h2>
        <p style={s.p}>For privacy questions, contact us at privacy@tradepattrnly.com</p>
      </div>
    </div>
  );
}
