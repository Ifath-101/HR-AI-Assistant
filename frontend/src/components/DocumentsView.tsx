import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Document } from '../types';
import {
  FileText,
  Trash2,
  Download,
  FileUp,
  Layers,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  RotateCcw,
  History,
  GitBranch
} from 'lucide-react';

interface DocumentsViewProps {
  onCountChange?: (count: number) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onCountChange }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [existingPolicyNames, setExistingPolicyNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active');

  // Upload Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPolicyOption, setSelectedPolicyOption] = useState<string>('__new__');
  const [customPolicyName, setCustomPolicyName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allDocs, policyNames] = await Promise.all([
        api.getDocuments(false), // Fetch all versions
        api.getPolicyNames()
      ]);
      setDocuments(allDocs);
      setExistingPolicyNames(policyNames);
      
      const activeCount = allDocs.filter(d => d.is_latest).length;
      if (onCountChange) {
        onCountChange(activeCount);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setStatusMessage({ type: 'error', text: 'Only PDF documents are supported.' });
        return;
      }
      setSelectedFile(file);
      setStatusMessage(null);

      // If user hasn't set a custom title and is creating new, auto-fill from filename
      if (selectedPolicyOption === '__new__' && !customPolicyName) {
        const inferred = file.name.replace('.pdf', '').replace(/_/g, ' ').replace(/-/g, ' ').trim();
        setCustomPolicyName(inferred);
      }
    }
  };

  const handlePolicyOptionChange = (option: string) => {
    setSelectedPolicyOption(option);
    if (option === '__new__') {
      if (selectedFile) {
        setCustomPolicyName(selectedFile.name.replace('.pdf', '').replace(/_/g, ' ').replace(/-/g, ' ').trim());
      } else {
        setCustomPolicyName('');
      }
    } else {
      setCustomPolicyName(option);
    }
  };

  // Determine which version this upload will be
  const getExpectedVersion = (): number => {
    const targetName = (selectedPolicyOption === '__new__' ? customPolicyName : selectedPolicyOption).trim().toLowerCase();
    if (!targetName) return 1;
    const matching = documents.filter(d => (d.policy_name || '').trim().toLowerCase() === targetName);
    if (matching.length === 0) return 1;
    return Math.max(...matching.map(m => m.version || 1)) + 1;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    const finalPolicyName = (selectedPolicyOption === '__new__' ? customPolicyName : selectedPolicyOption).trim();
    if (!finalPolicyName) {
      setStatusMessage({ type: 'error', text: 'Please enter a Policy Title/Name.' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const newDoc = await api.uploadDocument(selectedFile, finalPolicyName, description);
      setStatusMessage({
        type: 'success',
        text: `Successfully published "${newDoc.policy_name}" Version ${newDoc.version} (${newDoc.chunk_count} sections indexed for AI)!`
      });
      setSelectedFile(null);
      setDescription('');
      setSelectedPolicyOption('__new__');
      setCustomPolicyName('');
      const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message || 'Error processing PDF'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReactivate = async (docId: string, policyName: string, version: number) => {
    if (!window.confirm(`Are you sure you want to rollback to Version ${version} of "${policyName}"? It will become the active policy for employees and AI queries.`)) {
      return;
    }

    try {
      await api.reactivateDocument(docId);
      setStatusMessage({
        type: 'success',
        text: `Rolled back: Version ${version} of "${policyName}" is now active!`
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to restore version: ${err.message}`
      });
    }
  };

  const handleDelete = async (docId: string, filename: string, version: number) => {
    if (!window.confirm(`Are you sure you want to delete Version ${version} of "${filename}"?`)) {
      return;
    }

    try {
      await api.deleteDocument(docId);
      setStatusMessage({
        type: 'success',
        text: `Deleted Version ${version} of "${filename}".`
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to delete document: ${err.message}`
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const displayedDocs = documents.filter(doc => {
    if (viewMode === 'active' && !doc.is_latest) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (doc.policy_name || '').toLowerCase().includes(q) ||
      doc.filename.toLowerCase().includes(q) ||
      (doc.description || '').toLowerCase().includes(q) ||
      doc.uploaded_by.toLowerCase().includes(q)
    );
  });

  const activeCount = documents.filter(d => d.is_latest).length;
  const totalSections = documents.filter(d => d.is_latest).reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const expectedVer = getExpectedVersion();

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Policy Management & Version Control
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem' }}>
            Upload, update, and manage official HR policies. Only the latest active version is indexed for AI inquiry.
          </p>
        </div>

        {/* Quick summary metrics */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Active Policies</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{activeCount}</span>
          </div>

          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Versions</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>{documents.length}</span>
          </div>

          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Indexed AI Chunks</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>{totalSections}</span>
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Upload & Versioning Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <FileUp size={18} color="#2563eb" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            Publish or Update Policy Document
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Provide the policy title and PDF. Selecting an existing policy automatically creates a new version and updates the AI search index.
        </p>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            
            {/* Policy Target (New vs Existing) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Policy Category / Type
              </label>
              <select
                value={selectedPolicyOption}
                onChange={(e) => handlePolicyOptionChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value="__new__">+ Create New Policy</option>
                {existingPolicyNames.map((name) => (
                  <option key={name} value={name}>
                    Update: {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Policy Display Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Policy Display Title
              </label>
              <input
                type="text"
                placeholder="e.g. Company Leave Policy, Remote Work Guidelines"
                value={customPolicyName}
                onChange={(e) => setCustomPolicyName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* PDF File Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Upload PDF Document
              </label>
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.45rem',
                  fontSize: '0.82rem',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Change Notes / Summary */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Version Change Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Updated annual carry-forward allowance for 2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Publishing Context Notice & Submit Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <GitBranch size={15} color="#2563eb" />
              <span>
                Publishing as: <strong style={{ color: '#0f172a' }}>Version {expectedVer}</strong>
                {expectedVer > 1 && (
                  <span style={{ color: '#d97706', marginLeft: '4px' }}>
                    (will supersede Version {expectedVer - 1} and refresh AI vector index)
                  </span>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.4rem',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                opacity: (!selectedFile || isUploading) ? 0.6 : 1,
                cursor: (!selectedFile || isUploading) ? 'default' : 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <FileUp size={15} />
              <span>{isUploading ? 'Indexing & Publishing...' : `Publish Version ${expectedVer}`}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Documents Table Container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Table Toolbar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Segmented View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('active')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                backgroundColor: viewMode === 'active' ? '#ffffff' : 'transparent',
                color: viewMode === 'active' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'active' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Active Policies ({activeCount})
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                backgroundColor: viewMode === 'all' ? '#ffffff' : 'transparent',
                color: viewMode === 'all' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <History size={12} />
              <span>Version History ({documents.length})</span>
            </button>
          </div>

          {/* Search input */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search policies or versions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.35rem 0.65rem 0.35rem 2rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
            Loading policy repository...
          </div>
        ) : displayedDocs.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>
              {searchQuery ? 'No documents match your query' : 'No documents found in this view'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.7rem 1.25rem' }}>Policy Title & File</th>
                <th style={{ padding: '0.7rem 1rem' }}>Version</th>
                <th style={{ padding: '0.7rem 1rem' }}>Indexed Sections</th>
                <th style={{ padding: '0.7rem 1rem' }}>File Size</th>
                <th style={{ padding: '0.7rem 1rem' }}>Published Date</th>
                <th style={{ padding: '0.7rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDocs.map((doc) => {
                const isCurrentActive = doc.is_latest;

                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f8fafc', backgroundColor: isCurrentActive ? '#ffffff' : '#fafbfc' }}>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <FileText size={16} color={isCurrentActive ? '#2563eb' : '#94a3b8'} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: isCurrentActive ? '#0f172a' : '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>{doc.policy_name || doc.filename.replace('.pdf', '')}</span>
                            {isCurrentActive ? (
                              <span style={{
                                fontSize: '0.64rem',
                                fontWeight: 600,
                                padding: '0.05rem 0.35rem',
                                borderRadius: '4px',
                                backgroundColor: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #bbf7d0'
                              }}>
                                Active
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.64rem',
                                fontWeight: 500,
                                padding: '0.05rem 0.35rem',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#64748b'
                              }}>
                                Superseded
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                            {doc.filename}
                            {doc.description && (
                              <span style={{ color: '#475569', marginLeft: '6px' }}>&bull; &ldquo;{doc.description}&rdquo;</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        color: isCurrentActive ? '#1e40af' : '#64748b'
                      }}>
                        v{doc.version}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: isCurrentActive ? '#eff6ff' : '#f1f5f9',
                        color: isCurrentActive ? '#1d4ed8' : '#64748b',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 500
                      }}>
                        <Layers size={11} /> {doc.chunk_count} sections
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                      {formatFileSize(doc.file_size)}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.74rem' }}>
                      {new Date(doc.uploaded_at).toLocaleDateString()} {new Date(doc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <a
                          href={api.getDocumentDownloadUrl(doc.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '0.3rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            textDecoration: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 500
                          }}
                          title="View PDF"
                        >
                          <Download size={12} /> View
                        </a>

                        {!isCurrentActive && (
                          <button
                            onClick={() => handleReactivate(doc.id, doc.policy_name, doc.version)}
                            style={{
                              padding: '0.3rem 0.55rem',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #fed7aa',
                              color: '#c2410c',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                            title="Rollback to this version and re-index for AI"
                          >
                            <RotateCcw size={12} /> Rollback
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(doc.id, doc.filename, doc.version)}
                          style={{
                            padding: '0.3rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                          title="Delete version"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
