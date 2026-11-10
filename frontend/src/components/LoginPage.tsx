import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ShieldCheck, UserCheck, Lock, Mail, AlertCircle, ArrowRight, Building2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.login(email.trim(), password);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      const response = await api.login(demoEmail, demoPass);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 8px 16px -4px rgba(15,23,42,0.2)',
          marginBottom: '1rem'
        }}>
          <Building2 size={28} />
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          PeopleSphere
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: '380px' }}>
          Personalized Corporate HR Assistant & Policy Portal
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            Sign in to Portal
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
            Select a demo profile or enter your credentials below
          </p>
        </div>

        {/* 1-Click Demo Profiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@gmail.com', 'Admin@123')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.95rem',
              backgroundColor: '#fffdf5',
              border: '1px solid #fef3c7',
              borderRadius: '10px',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#fde68a';
              e.currentTarget.style.backgroundColor = '#fffbeb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#fef3c7';
              e.currentTarget.style.backgroundColor = '#fffdf5';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#92400e' }}>
                  HR Administrator &bull; HR Manager
                </div>
                <div style={{ fontSize: '0.72rem', color: '#b45309' }}>
                  admin@gmail.com &bull; Upload docs & AI Assistant
                </div>
              </div>
            </div>
            <ArrowRight size={15} color="#b45309" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('employee@gmail.com', 'Employee@123')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.95rem',
              backgroundColor: '#f8faff',
              border: '1px solid #e0f2fe',
              borderRadius: '10px',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#bfdbfe';
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e0f2fe';
              e.currentTarget.style.backgroundColor = '#f8faff';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e40af' }}>
                  Employee: Jane Doe &bull; AI/ML Intern
                </div>
                <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>
                  employee@gmail.com &bull; Policies, Leave & AI Chat
                </div>
              </div>
            </div>
            <ArrowRight size={15} color="#2563eb" />
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0',
          color: '#e2e8f0'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>or continue with credentials</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.8rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: '100%',
                  padding: '0.52rem 0.75rem 0.52rem 2.2rem',
                  fontSize: '0.86rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.52rem 0.75rem 0.52rem 2.2rem',
                  fontSize: '0.86rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.35rem',
              padding: '0.65rem 1rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(15,23,42,0.15)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
