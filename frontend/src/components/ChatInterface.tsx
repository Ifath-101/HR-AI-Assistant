import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { User, ChatMessage } from '../types';
import {
  Send,
  FileText,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Bot,
  User as UserIcon
} from 'lucide-react';

interface ChatInterfaceProps {
  user: User;
  quickPrompts?: string[];
  title?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  user,
  quickPrompts = [],
  title = "HR Assistant",
  welcomeTitle,
  welcomeSubtitle,
  initialQuery,
  onClearInitialQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setInputQuery(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [initialQuery]);

  // Restore persistent conversation history from database on mount
  useEffect(() => {
    api.getChatHistory()
      .then(history => {
        if (history && history.length > 0) {
          const loaded: ChatMessage[] = history.map(item => ({
            role: item.role,
            content: item.content,
            is_personalized: item.is_personalized,
            citations: item.citations,
            timestamp: item.created_at
              ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined
          }));
          setMessages(loaded);
        }
      })
      .catch((err) => console.error('Error fetching chat history:', err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClearHistory = async () => {
    try {
      await api.clearChatHistory();
    } catch (e) {
      console.error('Failed to clear chat history:', e);
    }
    setMessages([]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    // Format recent history turns for context
    const historyPayload = messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const response = await api.sendChatMessage(query, historyPayload);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        is_personalized: response.is_personalized,
        citations: response.citations,
        employee_context_used: response.employee_context_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to generate response. Please ensure policies are uploaded or try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleCitation = (index: number) => {
    setExpandedCitations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const defaultWelcomeTitle = `Welcome, ${user.name.split(' ')[0]}`;
  const defaultWelcomeSubtitle = user.role === 'admin'
    ? 'Ask anything about corporate HR policies, verify guidelines, or check employee leave balances.'
    : 'Ask about company policies, your leave entitlement, medical coverage, or benefits.';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 0 3px #d1fae5'
          }} />
          <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
            {title}
          </span>
          <span style={{
            fontSize: '0.72rem',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            padding: '0.15rem 0.5rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            {user.role === 'admin' ? 'Administrator Mode' : 'Employee Portal'}
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#64748b',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#64748b';
            }}
            title="Clear conversation history from database"
          >
            <RotateCcw size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div style={{
        flex: 1,
        padding: '1.25rem 1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        backgroundColor: '#fafbfc'
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            maxWidth: '520px',
            padding: '2.5rem 1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              border: '1px solid #dbeafe'
            }}>
              <Bot size={24} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>
              {welcomeTitle || defaultWelcomeTitle}
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.55, marginBottom: '1.75rem' }}>
              {welcomeSubtitle || defaultWelcomeSubtitle}
            </p>

            {quickPrompts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  Suggested Inquiries
                </span>
                {quickPrompts.slice(0, 4).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    style={{
                      padding: '0.6rem 0.85rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      color: '#334155',
                      textAlign: 'left',
                      lineHeight: 1.4,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                      e.currentTarget.style.color = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.color = '#334155';
                    }}
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: msg.role === 'user' ? '#1e293b' : '#eff6ff',
                color: msg.role === 'user' ? '#ffffff' : '#2563eb',
                border: msg.role === 'user' ? 'none' : '1px solid #dbeafe'
              }}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={17} />}
              </div>

              {/* Message Content Container */}
              <div style={{
                maxWidth: '78%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  padding: '0.85rem 1.15rem',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  backgroundColor: msg.role === 'user' ? '#1e293b' : '#ffffff',
                  color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                  border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: msg.role === 'user' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.03)',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {/* Verified Personal Record Badge */}
                  {msg.role === 'assistant' && msg.is_personalized && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.55rem',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      marginBottom: '0.55rem'
                    }}>
                      <CheckCircle2 size={12} color="#16a34a" />
                      <span>Verified Record</span>
                    </div>
                  )}

                  <div>{msg.content}</div>

                  {/* Document Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div style={{
                      marginTop: '0.85rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '0.45rem'
                      }}>
                        <FileText size={12} color="#2563eb" />
                        <span>Supporting Citations:</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {msg.citations.map((cite, cIdx) => {
                          const citeKey = idx * 100 + cIdx;
                          const isExpanded = !!expandedCitations[citeKey];

                          return (
                            <div
                              key={cIdx}
                              style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '0.4rem 0.65rem',
                                fontSize: '0.74rem'
                              }}
                            >
                              <div
                                onClick={() => toggleCitation(citeKey)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  color: '#1e40af',
                                  fontWeight: 600
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  📄 {cite.policy_name || cite.filename}
                                  {cite.version && (
                                    <span style={{
                                      fontSize: '0.64rem',
                                      fontWeight: 600,
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      padding: '0.05rem 0.35rem',
                                      borderRadius: '4px',
                                      border: '1px solid #bfdbfe'
                                    }}>
                                      v{cite.version}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 500,
                                    backgroundColor: '#e2e8f0',
                                    color: '#475569',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px'
                                  }}>
                                    Page {cite.page}
                                  </span>
                                </span>
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </div>
                              {isExpanded && (
                                <div style={{
                                  marginTop: '0.35rem',
                                  color: '#475569',
                                  fontSize: '0.72rem',
                                  borderLeft: '2px solid #93c5fd',
                                  paddingLeft: '0.5rem',
                                  lineHeight: 1.45
                                }}>
                                  &ldquo;{cite.text_snippet}&rdquo;
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {msg.timestamp && (
                  <span style={{
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    marginTop: '0.3rem',
                    padding: '0 0.35rem'
                  }}>
                    {msg.timestamp}
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading / Generating State */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #dbeafe',
              flexShrink: 0
            }}>
              <Bot size={17} />
            </div>
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#ffffff',
              borderRadius: '14px 14px 14px 4px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <span className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
              <span className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', animationDelay: '0.2s' }} />
              <span className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', animationDelay: '0.4s' }} />
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.25rem' }}>Synthesizing policy context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#ffffff'
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.4rem 0.6rem 0.4rem 1rem',
            transition: 'border-color 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={user.role === 'admin' ? "Ask about policies, approval procedures, or employee details..." : "Ask about leave, healthcare benefits, remote work guidelines..."}
            disabled={isLoading}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.88rem',
              color: '#0f172a',
              resize: 'none',
              maxHeight: '80px',
              lineHeight: 1.45,
              padding: '0.35rem 0'
            }}
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: inputQuery.trim() && !isLoading ? '#2563eb' : '#e2e8f0',
              color: inputQuery.trim() && !isLoading ? '#ffffff' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: inputQuery.trim() && !isLoading ? 'pointer' : 'default',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={15} />
          </button>
        </form>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.4rem',
          padding: '0 0.35rem',
          fontSize: '0.7rem',
          color: '#94a3b8'
        }}>
          <span>Press <strong>Enter</strong> to send &bull; <strong>Shift + Enter</strong> for new line</span>
          <span>Verified against current policy documentation</span>
        </div>
      </div>
    </div>
  );
};

