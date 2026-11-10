import React from 'react';
import { User } from '../types';
import {
  Bot,
  FileText,
  Users,
  Calendar,
  LogOut,
  Building2,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  user: User;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  documentCount?: number;
  employeeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onLogout,
  documentCount = 0,
  employeeCount = 0
}) => {
  const isAdmin = user.role === 'admin';

  interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    description?: string;
  }

  const menuItems: MenuItem[] = [
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: <Bot size={18} />,
      description: 'Policy Q&A & Inquiries'
    },
    ...(isAdmin ? [
      {
        id: 'documents',
        label: 'Policy Documents',
        icon: <FileText size={18} />,
        badge: documentCount,
        description: 'Upload & Version Control'
      },
      {
        id: 'employees',
        label: 'Employee Directory',
        icon: <Users size={18} />,
        badge: employeeCount,
        description: 'Manage Staff Records'
      }
    ] : [
      {
        id: 'policies',
        label: 'Company Policies',
        icon: <FileText size={18} />,
        badge: documentCount,
        description: 'Official Policy Library'
      }
    ]),
    {
      id: 'profile',
      label: 'My Profile & Leaves',
      icon: <Calendar size={18} />,
      description: 'Leave Balance & Details'
    }
  ];

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Top Brand Header */}
      <div>
        <div style={{
          padding: '1.25rem 1.25rem 1rem 1.25rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(15,23,42,0.15)',
            flexShrink: 0
          }}>
            <Building2 size={20} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                PeopleSphere
              </span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 0 2px #d1fae5',
                display: 'inline-block'
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '-1px' }}>
              Corporate HR Assistant
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <div style={{ padding: '1rem 0.75rem' }}>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0 0.5rem',
            marginBottom: '0.4rem'
          }}>
            Navigation Menu
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                    color: isActive ? '#0f172a' : '#475569',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    border: '1px solid',
                    borderColor: isActive ? '#e2e8f0' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ color: isActive ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? '#e2e8f0' : '#f1f5f9',
                      color: isActive ? '#0f172a' : '#64748b'
                    }}>
                      {item.badge}
                    </span>
                  )}
                  {item.badge === undefined && isActive && (
                    <ChevronRight size={14} color="#94a3b8" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Profile & Sign Out */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#fafbfc'
      }}>
        {/* User Info Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.5rem',
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          marginBottom: '0.65rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isAdmin ? '#fef3c7' : '#eff6ff',
            color: isAdmin ? '#b45309' : '#2563eb',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isAdmin ? '1px solid #fde68a' : '1px solid #bfdbfe',
            flexShrink: 0
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden', lineHeight: 1.25 }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user.name}
            </div>
            <div style={{
              fontSize: '0.72rem',
              color: '#64748b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '0.15rem'
            }}>
              {user.designation}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
              <span style={{
                fontSize: '0.64rem',
                fontWeight: 600,
                padding: '0.05rem 0.35rem',
                borderRadius: '4px',
                backgroundColor: isAdmin ? '#fef3c7' : '#eff6ff',
                color: isAdmin ? '#92400e' : '#1d4ed8'
              }}>
                {isAdmin ? 'Admin' : 'Employee'}
              </span>
              <span style={{
                fontSize: '0.68rem',
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.employee_id}
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#64748b',
            fontSize: '0.78rem',
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
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

