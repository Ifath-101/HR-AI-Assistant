import React from 'react';
import { User } from '../types';
import { LogOut, Building2 } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const isAdmin = user.role === 'admin';

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #f1f5f9',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand logo & title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(15,23,42,0.15)'
        }}>
          <Building2 size={19} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              PeopleSphere
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '0.12rem 0.5rem',
              borderRadius: '9999px',
              border: '1px solid #bbf7d0'
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
              Active
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '-1px' }}>
            Personalized Corporate HR Assistant
          </span>
        </div>
      </div>

      {/* User profile & actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: '#f8fafc',
          padding: '0.35rem 0.75rem',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: isAdmin ? '#fef3c7' : '#eff6ff',
            color: isAdmin ? '#b45309' : '#2563eb',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isAdmin ? '1px solid #fde68a' : '1px solid #bfdbfe'
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
              {user.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                {user.designation}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '0.05rem 0.35rem',
                borderRadius: '4px',
                backgroundColor: isAdmin ? '#fef3c7' : '#eff6ff',
                color: isAdmin ? '#92400e' : '#1d4ed8'
              }}>
                {isAdmin ? 'Admin' : 'Employee'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.75rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#64748b',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.borderColor = '#fecaca';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#64748b';
          }}
          title="Sign out of portal"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
