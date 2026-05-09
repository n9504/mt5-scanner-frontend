import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  key: string;
  icon: string;
  label: string;
  tier?: string; // 'all' | 'pro' | 'elite'
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   icon: '⬛', label: 'Dashboard'  },
  { key: 'journal',     icon: '📓', label: 'Journal'    },
  { key: 'calendar',    icon: '📅', label: 'Calendar'   },
  { key: 'performance', icon: '📈', label: 'Performance'},
  { key: 'reports',     icon: '📊', label: 'Reports'    },
  { key: 'plan',        icon: '🎯', label: 'Plan & Edge' },
  { key: 'insights',    icon: '🧠', label: 'Insights',  tier: 'pro' },
  { key: 'settings',    icon: '⚙️', label: 'Settings'   },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  accounts: any[];
  tenant: any;
}

export default function Sidebar({ activeTab, onTabChange, accounts, tenant }: SidebarProps) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const account = accounts?.[0];
  const isElite = tenant?.subscription === 'elite' || tenant?.email === 'pnara9504@gmail.com';
  const isPro   = isElite || tenant?.subscription === 'pro' || tenant?.subscription === 'prop';

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.tier === 'elite') return isElite;
    if (item.tier === 'pro')   return isPro;
    return true;
  });

  return (
    <div style={{
      width: collapsed ? 56 : 220,
      minHeight: '100vh',
      background: '#060912',
      borderRight: '1px solid #111626',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 12px' : '20px 20px',
        borderBottom: '1px solid #111626',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
      }}>
        {!collapsed && (
          <svg width="130" height="26" viewBox="0 0 180 40" fill="none">
            <rect x="0" y="6" width="4" height="22" rx="2" fill="#00C97A"/>
            <rect x="6" y="3" width="4" height="28" rx="2" fill="#00C97A" opacity=".7"/>
            <rect x="12" y="0" width="4" height="34" rx="2" fill="#00C97A" opacity=".9"/>
            <rect x="18" y="5" width="4" height="24" rx="2" fill="#F0A500"/>
            <rect x="24" y="10" width="4" height="16" rx="2" fill="#00C97A" opacity=".6"/>
            <rect x="30" y="2" width="4" height="30" rx="2" fill="#00C97A"/>
            <text x="40" y="24" fontFamily="Georgia,serif" fontSize="15" fontWeight="700" fill="#E8ECF4">Trade</text>
            <text x="78" y="24" fontFamily="Georgia,serif" fontSize="15" fontWeight="400" fill="#00C97A">Pattrnly</text>
          </svg>
        )}
        {collapsed && (
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <rect x="0" y="8" width="5" height="24" rx="2" fill="#00C97A"/>
            <rect x="8" y="4" width="5" height="32" rx="2" fill="#00C97A" opacity=".7"/>
            <rect x="16" y="0" width="5" height="40" rx="2" fill="#00C97A"/>
            <rect x="24" y="6" width="5" height="28" rx="2" fill="#F0A500"/>
          </svg>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: 'none', border: 'none', color: '#556080',
          cursor: 'pointer', fontSize: 14, padding: 4,
          display: 'flex', alignItems: 'center',
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Account info */}
      {!collapsed && account && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #111626',
          background: '#080b16',
        }}>
          <div style={{ fontSize: 9, color: '#3a4560', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
            Active Account
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#E8ECF4', marginBottom: 2 }}>
            {account.label || account.server?.split('-')[0] || 'MT5 Account'}
          </div>
          <div style={{ fontSize: 11, color: '#00C97A', fontWeight: 700 }}>
            {account.currency} {parseFloat(account.balance || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {visibleItems.map(item => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'rgba(0,201,122,0.08)' : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${active ? '#00C97A' : 'transparent'}`,
                color: active ? '#E8ECF4' : '#556080',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: "'Inter',-apple-system,sans-serif",
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.color = '#8899b4';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.color = '#556080';
              }}
            >
              <span style={{ fontSize: 15, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom - user + logout */}
      <div style={{ borderTop: '1px solid #111626', padding: '12px 0' }}>
        {!collapsed && (
          <div style={{ padding: '6px 16px 10px', fontSize: 11, color: '#3a4560',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tenant?.email}
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 0' : '10px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'transparent', border: 'none',
            color: '#556080', cursor: 'pointer',
            fontSize: 12, fontFamily: "'Inter',-apple-system,sans-serif",
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f04060'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#556080'}
        >
          <span style={{ fontSize: 15 }}>↩</span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
