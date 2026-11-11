import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ChatInterface } from './ChatInterface';
import {
  Calendar,
  HeartPulse,
  UserCheck,
  Bot,
  ShieldCheck
} from 'lucide-react';

interface EmployeeDashboardProps {
  user: User;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user: initialUser }) => {
  const [userProfile, setUserProfile] = useState<User>(initialUser);

  // Refresh profile on mount to guarantee fresh record data
  useEffect(() => {
    api.getMyRecord()
      .then(fresh => setUserProfile(fresh))
      .catch((err) => console.error('Error fetching employee profile:', err));
  }, []);

  const quickPrompts = [
    "How many annual leave days do I have remaining?",
    "Can I carry forward my remaining annual leave?",
    "What is the process for applying for annual leave?",
    "Who is my reporting manager?",
    "How many medical leave days have I used?",
    "What are the rules for medical leave certificate?"
  ];

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '1.25rem 1.75rem',
      display: 'grid',
      gridTemplateColumns: '340px 1fr',
      gap: '1.5rem',
      height: 'calc(100vh - 65px)',
      boxSizing: 'border-box'
    }}>
      {/* LEFT COLUMN: Profile & Leave Summary */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        overflowY: 'auto'
      }}>
        {/* Profile Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              border: '1px solid #bfdbfe'
            }}>
              {userProfile.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                {userProfile.name}
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b' }}>
                {userProfile.designation}
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #f1f5f9'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Employee ID</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{userProfile.employee_id}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Department</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{userProfile.department}</span>
            </div>
          </div>

          {/* Leave Balances Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.85rem',
              backgroundColor: '#f8faff',
              border: '1px solid #dbeafe',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={17} color="#2563eb" />
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#1e40af' }}>Annual Leave</div>
                  <div style={{ fontSize: '0.68rem', color: '#3b82f6' }}>Entitlement: 20 days/yr</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8' }}>
                  {userProfile.annual_leave_balance}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#1e40af', marginLeft: '3px' }}>left</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.85rem',
              backgroundColor: '#fffdfd',
              border: '1px solid #fee2e2',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={17} color="#dc2626" />
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#991b1b' }}>Medical Leave</div>
                  <div style={{ fontSize: '0.68rem', color: '#ef4444' }}>Entitlement: 10 days/yr</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c' }}>
                    {Math.max(0, 10 - userProfile.medical_leave_used)}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#991b1b', marginLeft: '3px' }}>left</span>
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                  ({userProfile.medical_leave_used} used of 10)
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.85rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#334155'
            }}>
              <UserCheck size={15} color="#64748b" />
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Reporting Manager</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{userProfile.reporting_manager}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Questions Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem', color: '#0f172a' }}>
            <Bot size={15} color="#2563eb" />
            <h4 style={{ fontSize: '0.84rem', fontWeight: 700 }}>Quick Topics</h4>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '0.75rem' }}>
            Common questions about HR policies:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {quickPrompts.slice(0, 5).map((prompt, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.45rem 0.65rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  color: '#475569',
                  lineHeight: 1.35
                }}
              >
                &bull; {prompt}
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div style={{
          padding: '0.75rem 0.85rem',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '0.72rem',
          color: '#64748b',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <ShieldCheck size={16} color="#16a34a" style={{ flexShrink: 0 }} />
          <span>
            <strong>Confidential & Secure:</strong> Your personal employment records are private and strictly protected.
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Assistant Chat Interface */}
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <ChatInterface
          user={userProfile}
          quickPrompts={quickPrompts}
          title="HR Policy Assistant"
        />
      </div>
    </div>
  );
};
