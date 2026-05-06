import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Logo = () => (
  <svg width="180" height="48" viewBox="0 0 180 48" fill="none">
    <rect x="0" y="10" width="5" height="28" rx="2.5" fill="#00C97A"/>
    <rect x="8" y="5" width="5" height="38" rx="2.5" fill="#00C97A" opacity=".7"/>
    <rect x="16" y="0" width="5" height="48" rx="2.5" fill="#00C97A" opacity=".9"/>
    <rect x="24" y="8" width="5" height="32" rx="2.5" fill="#F0A500"/>
    <rect x="32" y="14" width="5" height="22" rx="2.5" fill="#00C97A" opacity=".6"/>
    <rect x="40" y="3" width="5" height="42" rx="2.5" fill="#00C97A"/>
    <text x="54" y="32" fontFamily="Georgia, serif" fontSize="22" fontWeight="700"
      fill="#E8ECF4" letterSpacing="-0.5">Trade</text>
    <text x="108" y="32" fontFamily="Georgia, serif" fontSize="22" fontWeight="400"
      fill="#00C97A" letterSpacing="-0.5">Pattrnly</text>
  </svg>
);

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const [mode, setMode] = useState<'login'|'register'>(isRegister ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(isRegister ? 'register' : 'login');
  }, [isRegister]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email, pass);
      else await register(email, pass, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#070b14', fontFamily: "'JetBrains Mono', monospace",
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing: border-box; }
      `}</style>

      {/* LEFT PANEL */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 80px',
        background: 'linear-gradient(135deg, #070b14 0%, #0a1220 100%)',
        borderRight: '1px solid #1a1f30',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(#00C97A 1px, transparent 1px), linear-gradient(90deg, #00C97A 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}/>
        {/* Glow */}
        <div style={{
          position: 'absolute', bottom: '20%', left: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,201,122,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div style={{ position: 'relative', animation: 'slideIn 0.8s ease both' }}>
          <div style={{ marginBottom: 48 }}>
            <Logo />
          </div>

          <h2 style={{
            fontSize: 36, fontWeight: 700, fontFamily: 'Georgia, serif',
            lineHeight: 1.2, marginBottom: 16, color: '#E8ECF4',
          }}>
            Find your edge.<br/>
            <span style={{ color: '#00C97A' }}>Trade smarter.</span>
          </h2>

          <p style={{ color: '#556080', fontSize: 13, lineHeight: 1.8, maxWidth: 380, marginBottom: 48 }}>
            AI-powered trading journal that automatically captures your trades,
            analyses chart screenshots, and reveals your real trading patterns.
          </p>

          {/* Feature list */}
          {[
            { icon: '📸', text: 'Auto chart screenshots at entry & exit' },
            { icon: '🧠', text: 'AI detects your trading patterns' },
            { icon: '⚡', text: 'EA syncs all trades automatically' },
            { icon: '🏷️', text: 'Smart tagging — emotion, setup, session' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 16,
              animation: `slideIn 0.8s ${0.1 * i + 0.3}s ease both`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'rgba(0,201,122,0.08)',
                border: '1px solid rgba(0,201,122,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>{f.icon}</div>
              <span style={{ color: '#8899b4', fontSize: 13 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - AUTH FORM */}
      <div style={{
        width: 480, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 56px',
        background: '#070b14',
      }}>
        <div style={{ marginBottom: 40 }}>
          <h3 style={{
            fontSize: 24, fontWeight: 700, fontFamily: 'Georgia, serif',
            color: '#E8ECF4', marginBottom: 8,
          }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h3>
          <p style={{ color: '#556080', fontSize: 13 }}>
            {mode === 'login'
              ? 'Sign in to access your journal'
              : 'Start your free trading journal today'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 11, color: '#556080', textTransform: 'uppercase',
                letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>Full Name</label>
              <input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#0c0f1a', border: '1px solid #1a1f30',
                  borderRadius: 8, color: '#E8ECF4', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#00C97A'}
                onBlur={e => e.target.style.borderColor = '#1a1f30'}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: '#556080', textTransform: 'uppercase',
              letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: '#0c0f1a', border: '1px solid #1a1f30',
                borderRadius: 8, color: '#E8ECF4', fontSize: 13,
                fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#00C97A'}
              onBlur={e => e.target.style.borderColor = '#1a1f30'}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#556080', textTransform: 'uppercase',
              letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: '#0c0f1a', border: '1px solid #1a1f30',
                borderRadius: 8, color: '#E8ECF4', fontSize: 13,
                fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#00C97A'}
              onBlur={e => e.target.style.borderColor = '#1a1f30'}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 6,
              background: 'rgba(240,64,96,0.08)',
              border: '1px solid rgba(240,64,96,0.2)',
              color: '#f04060', fontSize: 12,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px', background: loading ? '#1a2a1a' : '#00C97A',
              border: 'none', borderRadius: 8,
              color: loading ? '#00C97A' : '#000',
              fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '.06em', textTransform: 'uppercase',
              marginTop: 8, transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 0 20px rgba(0,201,122,0.2)',
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{
          marginTop: 24, textAlign: 'center',
          fontSize: 12, color: '#556080',
        }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <span
                style={{ color: '#00C97A', cursor: 'pointer' }}
                onClick={() => { setMode('register'); setError(''); }}
              >Register free</span>
            </>
          ) : (
            <>Already have an account?{' '}
              <span
                style={{ color: '#00C97A', cursor: 'pointer' }}
                onClick={() => { setMode('login'); setError(''); }}
              >Sign in</span>
            </>
          )}
        </div>

        {mode === 'register' && (
          <p style={{
            marginTop: 24, fontSize: 11, color: '#3a4560',
            textAlign: 'center', lineHeight: 1.6,
          }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
            Free plan includes 50 trades. No credit card required.
          </p>
        )}
      </div>
    </div>
  );
}
