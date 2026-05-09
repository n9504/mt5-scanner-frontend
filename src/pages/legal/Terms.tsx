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

const styles = {
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
};

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo /></div>
        <span style={{ fontSize: 11, color: '#556080' }}>Legal</span>
      </nav>
      <div style={styles.container}>
        <h1 style={styles.h1}>Terms of Service</h1>
        <p style={styles.date}>Last updated: May 2026</p>

        <h2 style={styles.h2}>1. Acceptance of Terms</h2>
        <p style={styles.p}>By accessing or using TradePattrnly, you also agree to our Privacy Policy available at tradepattrnly.com/privacy. By accessing or using TradePattrnly ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>

        <h2 style={styles.h2}>2. Description of Service</h2>
        <p style={styles.p}>TradePattrnly is an AI-powered behavioral intelligence and trading analytics platform. The Service provides automated trade tracking, behavioural pattern analysis, AI-generated educational insights, and performance analytics. TradePattrnly is a tool for educational and informational purposes only.</p>

        <h2 style={styles.h2}>3. Not Financial Advice</h2>
        <p style={styles.p}>TradePattrnly does not provide financial advice. All content, analysis, behavioral insights, and educational content provided through the Service are for informational and educational purposes only. Nothing on this platform constitutes a recommendation to buy or sell any financial instrument. You are solely responsible for your trading decisions.</p>
        <p style={styles.p}>Trading financial instruments involves significant risk of loss and may not be suitable for all investors. Past performance is not indicative of future results.</p>

        <h2 style={styles.h2}>4. User Accounts</h2>
        <p style={styles.p}>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorised use of your account.</p>

        <h2 style={styles.h2}>5. Subscription and Billing</h2>
        <p style={styles.p}>Paid subscriptions are billed on a monthly basis. You may cancel at any time. Cancellation takes effect at the end of the current billing period. We reserve the right to modify pricing with 30 days notice.</p>

        <h2 style={styles.h2}>6. Acceptable Use</h2>
        <p style={styles.p}>You agree not to misuse the Service, attempt to reverse engineer any part of the platform, share your account credentials, or use the Service for any illegal purpose.</p>

        <h2 style={styles.h2}>6a. No Guarantee of Availability</h2>
        <p style={styles.p}>We do not guarantee uninterrupted availability, accuracy, or reliability of the Service. The platform may be unavailable due to maintenance, technical issues, or circumstances beyond our control. We are not liable for any losses arising from unavailability of the Service.</p>

        <h2 style={styles.h2}>6b. No Reliance</h2>
        <p style={styles.p}>You acknowledge that any reliance on information, insights, or analysis provided by the Service is at your own risk. The Service provides historical behavioural analysis only and does not constitute advice of any kind. All information is provided for educational and informational purposes only.</p>

        <h2 style={styles.h2}>7. Intellectual Property &amp; Data</h2>
        <p style={styles.p}>TradePattrnly and its original content, features, and functionality are owned by TradePattrnly and are protected by international copyright laws. Your trade data remains your own. We do not sell your personal trading data to third parties.</p>
        <p style={styles.p}>By using the Service, you grant TradePattrnly a limited licence to process your data solely to provide the Service. We may use anonymised, aggregated data to improve our models and service quality. No personally identifiable information is used in model training without explicit consent. Use of the Service is also governed by our <a href="/privacy" style={{ color:'#00C97A' }}>Privacy Policy</a>.</p>

        <h2 style={styles.h2}>8. Limitation of Liability</h2>
        <p style={styles.p}>TradePattrnly shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the Service, including any trading losses. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.</p>

        <h2 style={styles.h2}>9. Termination</h2>
        <p style={styles.p}>We reserve the right to terminate or suspend your account for violation of these terms. You may terminate your account at any time by contacting support.</p>

        <h2 style={styles.h2}>10. Changes to Terms</h2>
        <p style={styles.p}>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>

        <h2 style={styles.h2}>11. Contact</h2>
        <p style={styles.p}>For questions about these Terms, contact us at support@tradepattrnly.com</p>
      </div>
    </div>
  );
}
