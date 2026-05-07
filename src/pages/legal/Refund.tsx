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
        <h1 style={s.h1}>Refund Policy</h1>
        <p style={s.date}>Last updated: May 2026</p>

        <div style={s.highlight}>
          <p style={{ ...s.p, color: '#00C97A', marginBottom: 0 }}>
            <strong>Summary:</strong> We offer a 7-day money-back guarantee on all paid plans.
            No questions asked.
          </p>
        </div>

        <h2 style={s.h2}>1. 7-Day Money-Back Guarantee</h2>
        <p style={s.p}>If you are not satisfied with TradePattrnly for any reason, you may request a full refund within 7 days of your initial purchase. This applies to all paid plans — Pro, Elite, and Prop.</p>
        <p style={s.p}>To request a refund within the 7-day window, contact us at support@tradepattrnly.com with your account email and we will process your refund within 5 business days.</p>

        <h2 style={s.h2}>2. Subscription Cancellations</h2>
        <p style={s.p}>You may cancel your subscription at any time. When you cancel:</p>
        <p style={s.p}>Your subscription remains active until the end of the current billing period. You will not be charged again after cancellation. No partial refunds are issued for unused days in the current billing period after the 7-day guarantee window.</p>

        <h2 style={s.h2}>3. Eligibility</h2>
        <p style={s.p}>Refunds are available for:</p>
        <p style={s.p}>— First-time purchases within 7 days of the initial charge.</p>
        <p style={s.p}>Refunds are not available for:</p>
        <p style={s.p}>— Renewal charges after the initial billing period. — Accounts found to be in violation of our Terms of Service. — Requests made after the 7-day window has passed.</p>

        <h2 style={s.h2}>4. Free Plan</h2>
        <p style={s.p}>The Free plan has no charges and therefore no refund policy applies.</p>

        <h2 style={s.h2}>5. How to Request a Refund</h2>
        <p style={s.p}>Email us at <strong style={{ color: '#E8ECF4' }}>support@tradepattrnly.com</strong> with:</p>
        <p style={s.p}>— Your account email address — The date of purchase — Reason for refund (optional)</p>
        <p style={s.p}>We will confirm your refund request within 1 business day and process the refund within 5 business days.</p>

        <h2 style={s.h2}>6. Contact</h2>
        <p style={s.p}>For refund questions, contact us at support@tradepattrnly.com</p>
      </div>
    </div>
  );
}
