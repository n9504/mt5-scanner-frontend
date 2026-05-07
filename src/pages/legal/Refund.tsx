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
  highlight: { background: 'rgba(0,201,122,0.05)', border: '1px solid rgba(0,201,122,0.15)',
    borderRadius: 8, padding: '20px 24px', marginBottom: 24 } as React.CSSProperties,
};

export default function Refund() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo /></div>
        <span style={{ fontSize: 11, color: '#556080' }}>Legal</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Cancellation Policy</h1>
        <p style={s.date}>Last updated: May 2026</p>

        <div style={s.highlight}>
          <p style={{ ...s.p, color: '#00C97A', marginBottom: 0 }}>
            <strong>Simple policy:</strong> Cancel anytime. No lock-in. No questions asked.
            Your subscription continues until the end of the current billing period.
          </p>
        </div>

        <h2 style={s.h2}>1. Cancel Anytime</h2>
        <p style={s.p}>You may cancel your TradePattrnly subscription at any time with no penalty. There are no cancellation fees, no minimum commitment periods, and no questions asked.</p>

        <h2 style={s.h2}>2. What Happens When You Cancel</h2>
        <p style={s.p}>When you cancel your subscription:</p>
        <p style={s.p}>— Your subscription remains active until the end of the current billing period.</p>
        <p style={s.p}>— You will not be charged again after cancellation.</p>
        <p style={s.p}>— You retain full access to your plan features until the period ends.</p>
        <p style={s.p}>— Your trade data and journal are preserved for 90 days after cancellation.</p>

        <h2 style={s.h2}>3. No Refunds</h2>
        <p style={s.p}>We do not offer refunds for partial billing periods. Given our flexible month-to-month structure with no lock-in, all charges are final. We encourage you to use the Free plan to evaluate the platform before upgrading.</p>

        <h2 style={s.h2}>4. How to Cancel</h2>
        <p style={s.p}>You can cancel your subscription at any time from your account Settings page. Cancellation takes effect immediately — you will not be billed again but retain access until the period ends.</p>

        <h2 style={s.h2}>5. Downgrading</h2>
        <p style={s.p}>You may downgrade to a lower tier or the Free plan at any time. The downgrade takes effect at the start of the next billing period.</p>

        <h2 style={s.h2}>6. Contact</h2>
        <p style={s.p}>For cancellation assistance, contact us at support@tradepattrnly.com</p>
      </div>
    </div>
  );
}
