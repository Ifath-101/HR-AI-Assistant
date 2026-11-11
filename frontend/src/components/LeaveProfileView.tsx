import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import {
  Calendar,
  HeartPulse,
  ShieldCheck,
  ArrowRight,
  Bot
} from 'lucide-react';

interface LeaveProfileViewProps {
  initialUser: User;
  onNavigateToAssistant?: () => void;
}

export const LeaveProfileView: React.FC<LeaveProfileViewProps> = ({
  initialUser,
  onNavigateToAssistant
}) => {
  const [profile, setProfile] = useState<User>(initialUser);
  const isAdmin = profile.role === 'admin';

  useEffect(() => {
    api.getMyRecord()
      .then(fresh => setProfile(fresh))
      .catch((err) => console.error('Failed to load profile:', err));
  }, []);

  return (
    <div style={{
      maxWidth: '1080px',
      margin: '0 auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          My Profile & Leave Entitlements
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem' }}>
          Verified employment profile, annual leave balance, and medical leave usage
        </p>
      </div>

      {/* Profile Overview Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: isAdmin ? '#fef3c7' : '#eff6ff',
              color: isAdmin ? '#b45309' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              fontWeight: 800,
              border: isAdmin ? '1px solid #fde68a' : '1px solid #bfdbfe'
            }}>
              {profile.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {profile.name}
                </h3>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: isAdmin ? '#fef3c7' : '#eff6ff',
                  color: isAdmin ? '#92400e' : '#1d4ed8'
                }}>
                  {isAdmin ? 'Administrator' : 'Employee'}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.15rem' }}>
                {profile.designation} &bull; {profile.department}
              </p>
            </div>
          </div>

          {onNavigateToAssistant && (
            <button
              onClick={onNavigateToAssistant}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(15,23,42,0.15)'
              }}
            >
              <Bot size={14} />
              <span>Ask AI About My Leave</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Detailed Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #f1f5f9'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Employee ID</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{profile.employee_id}</span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Official Email</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{profile.email}</span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Designation</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{profile.designation}</span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Department</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{profile.department}</span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Reporting Manager</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{profile.reporting_manager}</span>
          </div>
        </div>
      </div>

      {/* Leave Balance Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Annual Leave Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  Annual Leave
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Standard allowance: 20 days / year
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8'
            }}>
              Paid Time Off
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {profile.annual_leave_balance}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
              days remaining
            </span>
          </div>

          {/* Progress visual */}
          <div style={{
            height: '8px',
            borderRadius: '9999px',
            backgroundColor: '#e2e8f0',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (profile.annual_leave_balance / 20) * 100)}%`,
              backgroundColor: '#2563eb',
              borderRadius: '9999px'
            }} />
          </div>

          <div style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #f1f5f9',
            fontSize: '0.74rem',
            color: '#475569',
            lineHeight: 1.45
          }}>
            <strong>Policy rule:</strong> Up to 5 unused annual leave days can be carried forward into the next calendar year. Any additional unused days expire December 31st.
          </div>
        </div>

        {/* Medical Leave Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HeartPulse size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  Medical Leave
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Standard allowance: 10 days / year
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c'
            }}>
              Sick Leave
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#b91c1c', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {Math.max(0, 10 - profile.medical_leave_used)}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
              days remaining
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem', fontWeight: 500 }}>
            {profile.medical_leave_used} of 10 days used this calendar year
          </div>

          {/* Progress visual */}
          <div style={{
            height: '8px',
            borderRadius: '9999px',
            backgroundColor: '#e2e8f0',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (Math.max(0, 10 - profile.medical_leave_used) / 10) * 100)}%`,
              backgroundColor: '#dc2626',
              borderRadius: '9999px'
            }} />
          </div>

          <div style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #f1f5f9',
            fontSize: '0.74rem',
            color: '#475569',
            lineHeight: 1.45
          }}>
            <strong>Policy rule:</strong> An official Medical Certificate (MC) is mandatory for sick leave exceeding three (3) consecutive working days. Unplanned emergency absence must be notified by 8:30 AM.
          </div>
        </div>
      </div>

      {/* Security & Confidentiality Notice */}
      <div style={{
        padding: '0.85rem 1rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '0.76rem',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem'
      }}>
        <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
        <span>
          <strong>Confidential HR Records:</strong> Employment data is verified against the company database and protected under corporate privacy standards.
        </span>
      </div>
    </div>
  );
};
