import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── LOGO ──
const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size * 3.2} height={size} viewBox="0 0 128 40" fill="none">
    <rect x="0" y="8" width="4" height="24" rx="2" fill="#00C97A"/>
    <rect x="7" y="4" width="4" height="32" rx="2" fill="#00C97A" opacity=".7"/>
    <rect x="14" y="0" width="4" height="40" rx="2" fill="#00C97A" opacity=".9"/>
    <rect x="21" y="6" width="4" height="28" rx="2" fill="#F0A500"/>
    <rect x="28" y="12" width="4" height="20" rx="2" fill="#00C97A" opacity=".6"/>
    <rect x="35" y="2" width="4" height="36" rx="2" fill="#00C97A"/>
    <text x="46" y="27" fontFamily="'Georgia', serif" fontSize="18" fontWeight="700"
      fill="#E8ECF4" letterSpacing="-0.5">Trade</text>
    <text x="88" y="27" fontFamily="'Georgia', serif" fontSize="18" fontWeight="400"
      fill="#00C97A" letterSpacing="-0.5">Pattrnly</text>
  </svg>
);

// ── CHART ANIMATION ──
const AnimatedChart = () => {
  const points = [
    [0,80],[8,72],[16,78],[24,55],[32,60],[40,42],[48,48],
    [56,30],[64,38],[72,22],[80,28],[88,15],[96,20],[104,8],[112,14],[120,5]
  ];
  const path = points.map((p,i) => `${i===0?'M':'L'}${p[0]*5},${p[1]*2}`).join(' ');

  return (
    <svg viewBox="0 0 600 170" style={{ width: '100%', height: '100%', opacity: 0.6 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C97A" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#00C97A" stopOpacity="0"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <path d={`${path} L600,170 L0,170 Z`} fill="url(#chartGrad)"/>
      <path d={path} stroke="#00C97A" strokeWidth="2.5" fill="none" filter="url(#glow)"
        strokeDasharray="800" strokeDashoffset="800"
        style={{ animation: 'drawLine 3s ease forwards' }}/>
      {points.filter((_,i) => i % 4 === 0).map((p, i) => (
        <circle key={i} cx={p[0]*5} cy={p[1]*2} r="4" fill="#00C97A"
          style={{ animation: `fadeIn 0.3s ${i*0.4+2.5}s both` }}/>
      ))}
    </svg>
  );
};

// ── TIER CARD ──
const TierCard = ({ tier, onSelect }: { tier: any, onSelect: () => void }) => {
  if (tier.locked) return (
    <div style={{ background:'#0c0f1a', border:'1px solid #1a1f30',
      borderRadius:16, padding:'32px 28px', opacity:0.45,
      textAlign:'center' as const, display:'flex', flexDirection:'column' as const,
      alignItems:'center', justifyContent:'center', minHeight:200 }}>
      <div style={{ fontSize:28, marginBottom:12 }}>🔒</div>
      <div style={{ fontSize:14, fontWeight:700, color:'#E8ECF4', marginBottom:6 }}>
        {tier.name}
      </div>
      <div style={{ fontSize:11, color:'#556080' }}>{tier.desc}</div>
    </div>
  );
  return (
  <div style={{
    background: tier.featured ? 'linear-gradient(135deg, #0a1628, #0d2040)' : '#0c0f1a',
    border: `1px solid ${tier.featured ? '#00C97A' : '#1a1f30'}`,
    borderRadius: 16,
    padding: '32px 28px',
    position: 'relative',
    transform: tier.featured ? 'scale(1.05)' : 'scale(1)',
    boxShadow: tier.featured ? '0 0 40px rgba(0,201,122,0.15)' : 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  }}
  onMouseEnter={e => { if (!tier.featured) (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
  onMouseLeave={e => { if (!tier.featured) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
  >
    {tier.featured && (
      <div style={{
        position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
        background: '#00C97A', color: '#000', padding: '4px 16px',
        borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
        textTransform: 'uppercase',
      }}>Most Popular</div>
    )}
    <div style={{ fontSize: 11, color: '#556080', textTransform: 'uppercase',
      letterSpacing: '.1em', marginBottom: 8 }}>{tier.name}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
      <span style={{ fontSize: 40, fontWeight: 700, color: '#E8ECF4',
        fontFamily: 'Georgia, serif' }}>${tier.price}</span>
      <span style={{ color: '#556080', fontSize: 13 }}>/mo</span>
    </div>
    <div style={{ color: '#556080', fontSize: 12, marginBottom: 24 }}>{tier.desc}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
      {tier.features.map((f: string, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: '#00C97A', fontSize: 14, marginTop: 1 }}>✓</span>
          <span style={{ color: '#8899b4', fontSize: 13, lineHeight: 1.4 }}>{f}</span>
        </div>
      ))}
      {tier.excluded?.map((f: string, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, opacity: 0.4 }}>
          <span style={{ color: '#556080', fontSize: 14, marginTop: 1 }}>✗</span>
          <span style={{ color: '#556080', fontSize: 13, lineHeight: 1.4 }}>{f}</span>
        </div>
      ))}
    </div>
    <button onClick={onSelect} style={{
      width: '100%', padding: '12px 0',
      background: tier.featured ? '#00C97A' : 'transparent',
      color: tier.featured ? '#000' : '#00C97A',
      border: `1.5px solid ${tier.featured ? '#00C97A' : '#00C97A'}`,
      borderRadius: 8, fontSize: 13, fontWeight: 700,
      letterSpacing: '.06em', textTransform: 'uppercase',
      cursor: 'pointer', transition: 'all 0.2s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.background = '#00C97A';
      (e.currentTarget as HTMLElement).style.color = '#000';
    }}
    onMouseLeave={e => {
      if (!tier.featured) {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = '#00C97A';
      }
    }}>
      {tier.cta}
    </button>
  </div>
);
};
const Feature = ({ icon, title, desc }: any) => (
  <div style={{
    padding: '28px 24px', borderRadius: 12,
    background: '#0c0f1a', border: '1px solid #1a1f30',
    transition: 'border-color 0.2s',
  }}
  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#252d42'}
  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1a1f30'}
  >
    <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#E8ECF4',
      marginBottom: 10, fontFamily: 'Georgia, serif' }}>{title}</div>
    <div style={{ fontSize: 13, color: '#556080', lineHeight: 1.7 }}>{desc}</div>
  </div>
);

// ── STAT ──
const Stat = ({ value, label }: any) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 42, fontWeight: 700, color: '#00C97A',
      fontFamily: 'Georgia, serif', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#556080', marginTop: 6,
      textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
  </div>
);

// ── MAIN LANDING PAGE ──
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tiers = [
    {
      name: 'Beta',
      price: 0,
      desc: '21 days free — no credit card required',
      cta: 'Join Beta Free →',
      featured: true,
      badge: '🎉 Limited Time',
      features: [
        'Unlimited trades — auto-synced via MT5 EA',
        'Unlimited manual setup tagging',
        'Unlimited auto session tagging',
        'Unlimited auto behaviour tagging',
        'Screenshots always stored',
        'AI structural analysis — up to 5 trades/day',
        'Trading DNA after 50 trades',
        'Weekly AI behavioural insights',
        'Dashboard, calendar, plan & performance',
        '1 account',
      ],
    },
    {
      name: 'Journal',
      price: 9,
      desc: 'Unlimited journalling with weekly AI insights',
      cta: 'Start at $9/mo',
      featured: false,
      features: [
        'Unlimited trades — auto-synced via MT5 EA',
        'Unlimited manual setup tagging',
        'Unlimited auto session tagging',
        'Unlimited auto behaviour tagging',
        'Screenshots always stored',
        'Dashboard, calendar, performance reports',
        'Weekly AI behavioural insights',
        'Plan & Edge tracker · 1 account',
      ],
      excluded: [
        'AI structural analysis',
      ],
    },
    {
      name: 'More plans',
      price: null,
      desc: 'Higher AI analysis limits — coming soon',
      cta: null,
      featured: false,
      locked: true,
      features: [],
    },
  ];

  const features = [
    {
      icon: '📓',
      title: 'Automatic Trade Journal',
      desc: 'Connect your MT4/MT5 via our EA and every trade is automatically logged — entry, exit, P&L, screenshots. No manual entry.',
    },
    {
      icon: '🧠',
      title: 'AI Pattern Analysis',
      desc: 'After 50 trades, our AI analyses your history and reveals your real edge — best hours, instruments, sessions and setups.',
    },
    {
      icon: '📸',
      title: 'Chart Screenshot Capture',
      desc: 'Every trade is captured at entry and exit. See exactly what the market looked like when you pulled the trigger.',
    },
    {
      icon: '🏷️',
      title: 'Tags & Notes',
      desc: 'Tag trades by setup, emotion or session. Add notes. Filter by tag to find patterns across hundreds of trades.',
    },
    {
      icon: '⚡',
      title: 'Behaviour Flags',
      desc: 'AI detects revenge trading, FOMO entries, and emotional patterns — before they destroy your account.',
    },
    {
      icon: '🏦',
      title: 'Prop Firm Mode',
      desc: 'Track daily loss limits, max drawdown and challenge rules for FTMO, 5ers, MyFundedFX and more.',
    },
  ];

  return (
    <div style={{
      background: '#070b14', color: '#E8ECF4', minHeight: '100vh',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      <style>{`
        @media (max-width: 768px) {
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .footer-inner { flex-direction: column !important; gap: 16px !important; text-align: center !important; }
          .hero-title { font-size: 32px !important; }
          .hero-desc { font-size: 14px !important; }
          .section-pad { padding: 60px 20px !important; }
          .nav-pad { padding: 16px 20px !important; }
        }

        @keyframes drawLine { to { stroke-dashoffset: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 0.8s ease both; }
        .slide-up-2 { animation: slideUp 0.8s 0.2s ease both; }
        .slide-up-3 { animation: slideUp 0.8s 0.4s ease both; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #070b14; }
        ::-webkit-scrollbar-thumb { background: #1a1f30; border-radius: 2px; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(7,11,20,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #1a1f30' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <Logo size={28} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Features', 'Pricing', 'Journal', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{
              color: '#556080', fontSize: 12, textTransform: 'uppercase',
              letterSpacing: '.08em', textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#E8ECF4'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#556080'}
            >{item}</a>
          ))}
          <button onClick={() => navigate('/login')} style={{
            padding: '8px 20px', background: 'transparent',
            border: '1px solid #252d42', borderRadius: 6,
            color: '#E8ECF4', fontSize: 12, cursor: 'pointer',
            letterSpacing: '.06em', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#00C97A'; (e.currentTarget as HTMLElement).style.color = '#00C97A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252d42'; (e.currentTarget as HTMLElement).style.color = '#E8ECF4'; }}
          >Sign In</button>
          <button onClick={() => navigate('/register')} style={{
            padding: '8px 20px', background: '#00C97A',
            border: 'none', borderRadius: 6,
            color: '#000', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '.06em',
          }}>Start Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 48px 80px', textAlign: 'center', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(#00C97A 1px, transparent 1px), linear-gradient(90deg, #00C97A 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}/>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,201,122,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div className="slide-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          border: '1px solid rgba(0,201,122,0.3)',
          background: 'rgba(0,201,122,0.05)',
          marginBottom: 32,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C97A',
            animation: 'pulse 2s infinite' }}/>
          <span style={{ fontSize: 11, color: '#00C97A', letterSpacing: '.08em',
            textTransform: 'uppercase' }}>Discover What You Actually Trade. Master What Works.</span>
        </div>

        <h1 className="slide-up-2" style={{
          fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.1,
          fontFamily: 'Georgia, serif', marginBottom: 24,
          maxWidth: 800,
        }}>
          Know Your Edge.<br/>
          <span style={{ color: '#00C97A' }}>Trade With Conviction.</span>
        </h1>

        <p className="slide-up-3" style={{
          fontSize: 16, color: '#556080', maxWidth: 560,
          lineHeight: 1.8, marginBottom: 40,
        }}>
          TradePattrnly automatically journals your trades, captures chart screenshots,
          and uses AI to reveal the patterns in your trading — your real edge.
        </p>

        <div className="slide-up-3" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} style={{
            padding: '14px 32px', background: '#00C97A', border: 'none',
            borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '.06em',
            boxShadow: '0 0 30px rgba(0,201,122,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 50px rgba(0,201,122,0.5)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0,201,122,0.3)'}
          >Start for Free →</button>
          <button style={{
            padding: '14px 32px', background: 'transparent',
            border: '1px solid #252d42', borderRadius: 8,
            color: '#8899b4', fontSize: 14, cursor: 'pointer',
          }}>Watch Demo</button>
        </div>

        {/* Chart preview */}
        <div style={{
          marginTop: 80, width: '100%', maxWidth: 900,
          background: '#0c0f1a', border: '1px solid #1a1f30',
          borderRadius: 16, padding: '24px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['#FF5F57','#FFBD2E','#28CA41'].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }}/>
            ))}
            <div style={{ marginLeft: 8, fontSize: 11, color: '#556080' }}>
              Your trading edge — EURUSD · London Session · Win rate: 68%
            </div>
          </div>
          <div style={{ height: 160 }}>
            <AnimatedChart />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{
        padding: '60px 48px', borderTop: '1px solid #1a1f30',
        borderBottom: '1px solid #1a1f30',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40,
        }}>
          <Stat value="50+" label="Trades to find your edge" />
          <Stat value="$0.30" label="AI analysis per trade" />
          <Stat value="MT4/5" label="Auto EA sync" />
          <Stat value="100%" label="Your data, your insights" />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: '#00C97A', textTransform: 'uppercase',
              letterSpacing: '.12em', marginBottom: 12 }}>Features</div>
            <h2 style={{ fontSize: 40, fontWeight: 700, fontFamily: 'Georgia, serif',
              marginBottom: 16 }}>Everything you need to<br/>understand your trading</h2>
            <p style={{ color: '#556080', fontSize: 14, maxWidth: 500, margin: '0 auto' }}>
              From automatic journalling to AI-powered pattern analysis — built for traders who take their performance seriously.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {features.map((f, i) => <Feature key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{
        padding: '100px 48px',
        background: 'linear-gradient(180deg, #070b14 0%, #0a0f1e 100%)',
        borderTop: '1px solid #1a1f30',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#00C97A', textTransform: 'uppercase',
            letterSpacing: '.12em', marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: 40, fontWeight: 700, fontFamily: 'Georgia, serif',
            marginBottom: 60 }}>Three steps to finding your edge</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40 }}>
            {[
              { step: '01', title: 'Connect your MT5', desc: 'Install our free EA in your MetaTrader. It automatically syncs all your trades, screenshots and account data in real-time.' },
              { step: '02', title: 'Journal builds itself', desc: 'Every trade is logged with entry/exit price, chart screenshot, P&L, duration and session. Add tags and notes.' },
              { step: '03', title: 'AI reveals your patterns', desc: 'After 50 trades, our AI analyses everything — your best hours, instruments, sessions, and emotional patterns.' },
            ].map((item, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {i < 2 && (
                  <div style={{
                    position: 'absolute', top: 20, left: '60%', width: '80%',
                    height: 1, background: 'linear-gradient(90deg, #252d42, transparent)',
                  }}/>
                )}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: '1px solid #252d42', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 12, color: '#00C97A',
                  fontWeight: 700,
                }}>{item.step}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12,
                  fontFamily: 'Georgia, serif' }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#556080', lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '100px 48px', borderTop: '1px solid #1a1f30' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: '#00C97A', textTransform: 'uppercase',
              letterSpacing: '.12em', marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 40, fontWeight: 700, fontFamily: 'Georgia, serif',
              marginBottom: 16 }}>Transparent pricing — unlimited journalling on every plan</h2>
            <p style={{ color: '#556080', fontSize: 14 }}>Screenshots always stored. AI analysis scales with your plan. Cancel anytime.</p>
          </div>
          {/* Beta callout */}
          <div style={{ background:'rgba(0,201,122,.06)', border:'1px solid rgba(0,201,122,.2)',
            borderRadius:10, padding:'20px 28px', marginBottom:32, textAlign:'center' as const }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#00C97A',
              textTransform:'uppercase' as const, letterSpacing:'.1em' }}>
              🎉 Beta Launch — Now Open
            </span>
            <p style={{ fontSize:14, color:'#E8ECF4', margin:'8px 0 4px', fontWeight:600 }}>
              Join during beta and get 21 days free — no credit card required
            </p>
            <p style={{ fontSize:12, color:'#556080', margin:0 }}>
              Unlimited journalling · AI analysis up to 5 trades/day · Weekly behavioural insights · 1 account
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'start' }}>
            {tiers.map((tier, i) => (
              <TierCard key={i} tier={tier} onSelect={() => navigate('/register')} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '100px 48px', textAlign: 'center',
        borderTop: '1px solid #1a1f30',
        background: 'linear-gradient(180deg, #070b14 0%, #0a1220 100%)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 700, fontFamily: 'Georgia, serif',
            marginBottom: 20, lineHeight: 1.2 }}>
            Start finding your<br/>
            <span style={{ color: '#00C97A' }}>trading edge today</span>
          </h2>
          <p style={{ color: '#556080', fontSize: 14, marginBottom: 40, lineHeight: 1.8 }}>
            Free to start. No credit card · No commitment · Full Elite access.<br/>
            Connect your MT5 in under 2 minutes.
          </p>
          <button onClick={() => navigate('/register')} style={{
            padding: '16px 48px', background: '#00C97A', border: 'none',
            borderRadius: 8, color: '#000', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '.06em',
            boxShadow: '0 0 40px rgba(0,201,122,0.3)',
          }}>Get Started Free →</button>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" style={{
        padding: '80px 48px', borderTop: '1px solid #1a1f30',
        background: '#070b14',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
          <div>
            <div style={{ fontSize: 11, color: '#00C97A', textTransform: 'uppercase',
              letterSpacing: '.12em', marginBottom: 12 }}>About</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Georgia,serif',
              marginBottom: 16, lineHeight: 1.3 }}>Built for traders who want to improve</h2>
            <p style={{ color: '#556080', fontSize: 13, lineHeight: 1.8 }}>
              TradePattrnly was built for traders who want to understand themselves, not just track trades.
              We combine automatic trade capture with genuine AI behavioural analysis — so you can
              discover what you actually trade, and master what works.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '🔒', title: 'Your data stays yours', desc: 'We never sell or share your trading data. Row-level security means only you can see your trades.' },
              { icon: '💸', title: 'Cancel anytime', desc: 'No lock-in, no minimum commitment. Cancel with one click and keep your data for 90 days.' },
              { icon: '🌏', title: 'Works globally', desc: 'Supports MT4 and MT5, all brokers, all currencies. Timezone-aware for traders worldwide.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14 }}>
                <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#E8ECF4',
                    marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#556080', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '40px 48px', borderTop: '1px solid #1a1f30',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Logo size={22} />
        <div style={{ color: '#556080', fontSize: 11 }}>
          TradePattrnly provides analytics, journaling and educational insights only. It does not provide financial advice, investment recommendations, or trading signals. Past performance does not indicate future results. Trading leveraged instruments involves significant risk of loss.
          </div>
          <div style={{ marginTop:8 }}>
          © 2026 TradePattrnly. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'Terms', path: '/terms' },
            { label: 'Privacy', path: '/privacy' },
            { label: 'Cancellation', path: '/refund' },
          ].map(item => (
            <span key={item.label} onClick={() => navigate(item.path)}
              style={{ color: '#556080', fontSize: 11,
              cursor: 'pointer', letterSpacing: '.06em',
              transition: 'color .2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#E8ECF4'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#556080'}
            >{item.label}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
