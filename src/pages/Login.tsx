import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode,  setMode]  = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [name,  setName]  = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div className="card" style={{ width: 380, padding: 32 }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 18, letterSpacing: '.1em' }}>
            MT5 SCANNER
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create new account'}
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input placeholder="Full name" value={name}
              onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
          )}
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
          <input type="password" placeholder="Password" value={pass}
            onChange={e => setPass(e.target.value)} required style={{ width: '100%' }} />

          {error && (
            <div style={{ color: 'var(--red)', fontSize: 11, padding: '6px 10px',
              background: 'rgba(240,64,96,.1)', borderRadius: 4 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-amber"
            style={{ width: '100%', padding: '10px', marginTop: 4 }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 11 }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <span style={{ color: 'var(--amber)', cursor: 'pointer' }}
                onClick={() => setMode('register')}>Register</span>
            </>
          ) : (
            <>Already have an account?{' '}
              <span style={{ color: 'var(--amber)', cursor: 'pointer' }}
                onClick={() => setMode('login')}>Sign In</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
