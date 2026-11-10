import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Document } from '../types';
import {
  FileText,
  Download,
  Search,
  Bot,
  ArrowRight,
  Calendar,
  HardDrive
} from 'lucide-react';

interface CompanyPoliciesViewProps {
  onNavigateToAssistant?: (prefilledQuery?: string) => void;
}

export const CompanyPoliciesView: React.FC<CompanyPoliciesViewProps> = ({
  onNavigateToAssistant
}) => {
  const [policies, setPolicies] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getDocuments(true) // Fetch latest active policies only
      .then((docs) => setPolicies(docs))
      .catch((err) => console.error('Failed to load company policies:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredPolicies = policies.filter(p =>
    (p.policy_name || p.filename).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Company Policy Library
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe'
            }}>
              {policies.length} Active {policies.length === 1 ? 'Policy' : 'Policies'}
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem' }}>
            Official corporate guidelines, leave entitlements, benefits, and workplace standards
          </p>
        </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search policies by keyword or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem 0.5rem 2.4rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            />
          </div>
        </div>

        {/* Main Listed Content */}
        {loading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>
            Loading official policy documents...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '3.5rem 1rem',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <FileText size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              {searchQuery ? 'No policies matched your search' : 'No policies published yet'}
            </h3>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#64748b' }}>
              {searchQuery ? 'Try another keyword.' : 'HR has not published any policy documents to the portal yet.'}
            </p>
          </div>
        ) : (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                overflow: 'hidden'
              }}>
                {/* Table Header Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(320px, 2.2fr) minmax(140px, 1fr) minmax(160px, 1.1fr) minmax(240px, 1.4fr)',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <div>Document & Policy Name</div>
                  <div>Version & Status</div>
                  <div>Details & Published</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

          {/* Listed Document Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {filteredPolicies.map((policy, idx) => {
                            const displayName = policy.policy_name || policy.filename.replace('.pdf', '').replace(/_/g, ' ');

                            return (
                              <div
                                key={policy.id}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'minmax(320px, 2.2fr) minmax(140px, 1fr) minmax(160px, 1.1fr) minmax(240px, 1.4fr)',
                                  alignItems: 'center',
                                  padding: '1.1rem 1.5rem',
                                  borderBottom: idx === filteredPolicies.length - 1 ? 'none' : '1px solid #f1f5f9',
                                  backgroundColor: '#ffffff',
                                  transition: 'background-color 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fafbfc';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                }}
                              >
                                {/* Column 1: Document Name & Description */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                    border: '1px solid #dbeafe'
                                  }}>
                                    <FileText size={20} />
                                  </div>

                                  <div style={{ overflow: 'hidden' }}>
                                    <h3 style={{
                                      fontSize: '0.94rem',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      lineHeight: 1.3,
                                      marginBottom: '0.15rem'
                                    }}>
                                      {displayName}
                                    </h3>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                        {policy.filename}
                                      </span>

                                      {policy.description && (
                                        <span style={{
                                          fontSize: '0.72rem',
                                          color: '#475569',
                                          backgroundColor: '#f1f5f9',
                                          padding: '0.1rem 0.5rem',
                                          borderRadius: '6px',
                                          maxWidth: '340px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }} title={policy.description}>
                                          &ldquo;{policy.description}&rdquo;
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Column 2: Version & Status */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '0.18rem 0.55rem',
                                    borderRadius: '9999px',
                                    backgroundColor: '#f0fdf4',
                                    color: '#166534',
                                    border: '1px solid #bbf7d0',
                      display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                                    v{policy.version} &bull; Active
                                  </span>
                                </div>

                                  {/* Column 3: Metadata (Size & Upload Date) */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.74rem', color: '#64748b' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <Calendar size={13} color="#94a3b8" />
                                      <span>{new Date(policy.uploaded_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <HardDrive size={13} color="#94a3b8" />
                                      <span>{formatFileSize(policy.file_size)}</span>
                                      <span>&bull;</span>
                                      <span style={{ color: '#2563eb', fontWeight: 500 }}>{policy.chunk_count} sections</span>
                                    </div>
                                  </div>

                  {/* Column 4: Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <a
                      href={api.getDocumentDownloadUrl(policy.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        color: '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#0f172a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#334155';
                      }}
                      title="Open PDF document in new tab"
                    >
                      <Download size={13} />
                      <span>View PDF</span>
                    </a>

                    {onNavigateToAssistant && (
                                    <button
                                      onClick={() => onNavigateToAssistant(`What are the key rules and entitlements in the ${displayName}?`)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.35rem',
                                        padding: '0.45rem 0.95rem',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #0f172a',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        boxShadow: '0 1px 2px rgba(15,23,42,0.1)'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1e293b';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#0f172a';
                                      }}
                                      title="Query AI Assistant about this policy"
                                    >
                                      <Bot size={13} />
                                      <span>Ask AI</span>
                                      <ArrowRight size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                        );
            })}
                      </div>
                    </div>
      )}
                  </div>
                  );
};
