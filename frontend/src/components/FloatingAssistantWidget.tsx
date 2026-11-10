import React, { useState } from 'react';
import { User } from '../types';
import { ChatInterface } from './ChatInterface';
import {
  Bot,
  X,
  Maximize2
} from 'lucide-react';

interface FloatingAssistantWidgetProps {
  user: User;
  onExpandToFullPage: (initialQuery?: string) => void;
  quickPrompts?: string[];
}

export const FloatingAssistantWidget: React.FC<FloatingAssistantWidgetProps> = ({
  user,
  onExpandToFullPage,
  quickPrompts
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = user.role === 'admin';

  return (
    <div style={{ position: 'fixed', bottom: '1.75rem', right: '2rem', zIndex: 1000 }}>
      {/* Floating Messenger Window when Open */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '420px',
          height: '580px',
          maxHeight: 'calc(100vh - 80px)',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Top Window Header */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}>
                <Bot size={17} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                    PeopleSphere AI
                  </span>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'inline-block'
                  }} />
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: '-2px' }}>
                  {isAdmin ? 'Administrative Assistant' : 'Corporate Policy Assistant'}
                </span>
              </div>
            </div>

            {/* Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExpandToFullPage();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.3rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
                title="Open in full page view"
              >
                <Maximize2 size={15} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.3rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
                title="Minimize assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div style={{ flex: 1, height: 'calc(100% - 50px)', overflow: 'hidden' }}>
            <ChatInterface
              user={user}
              quickPrompts={quickPrompts}
              title={isAdmin ? "HR Administrative Assistant" : "HR Policy Assistant"}
              welcomeTitle={`Hello, ${user.name.split(' ')[0]}`}
              welcomeSubtitle={
                isAdmin
                  ? "Ask about policies or query organization-wide employee records."
                  : "Ask about company policies, leave entitlements, or healthcare."
              }
            />
          </div>
        </div>
      )}

      {/* Floating Launcher Pill Button (Visible when widget is minimized) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1.15rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '9999px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.4), 0 4px 6px -2px rgba(15, 23, 42, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 14px 28px -4px rgba(15, 23, 42, 0.5), 0 6px 10px -2px rgba(15, 23, 42, 0.2)';
            e.currentTarget.style.backgroundColor = '#1e293b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(15, 23, 42, 0.4), 0 4px 6px -2px rgba(15, 23, 42, 0.1)';
            e.currentTarget.style.backgroundColor = '#0f172a';
          }}
          title="Click to ask the AI HR Assistant"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Bot size={16} />
            </div>
            {/* Live Green Status Dot */}
            <span style={{
              position: 'absolute',
              top: '-1px',
              right: '-1px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 0 2px #0f172a'
            }} />
          </div>

          <span style={{ fontSize: '0.84rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Ask HR Assistant
          </span>
        </button>
      )}
    </div>
  );
};

