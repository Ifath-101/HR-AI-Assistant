import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Document, User, EmployeeUpdatePayload } from '../types';
import { ChatInterface } from './ChatInterface';
import {
  FileText,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
  Download,
  Edit2,
  Save,
  X,
  FileUp,
  Layers,
  Bot,
  ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'documents' | 'employees'>('assistant');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Employee Edit modal state
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EmployeeUpdatePayload>({});

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const emps = await api.getEmployees();
      setEmployees(emps);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadEmployees();
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
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const newDoc = await api.uploadDocument(selectedFile);
      setStatusMessage({
        type: 'success',
        text: `Successfully uploaded "${newDoc.filename}" (${newDoc.chunk_count} sections indexed)!`
      });
      setSelectedFile(null);
      const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadDocuments();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message || 'Error processing PDF'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? It will be permanently removed from the knowledge base.`)) {
      return;
    }

    try {
      await api.deleteDocument(docId);
      setStatusMessage({
        type: 'success',
        text: `Deleted "${filename}" from knowledge base.`
      });
      loadDocuments();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to delete document: ${err.message}`
      });
    }
  };

  const startEditEmployee = (emp: User) => {
    setEditingEmployee(emp);
    setEditForm({
      department: emp.department,
      designation: emp.designation,
      annual_leave_balance: emp.annual_leave_balance,
      medical_leave_used: emp.medical_leave_used,
      reporting_manager: emp.reporting_manager
    });
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      await api.updateEmployee(editingEmployee.employee_id, editForm);
      setStatusMessage({
        type: 'success',
        text: `Employee record for ${editingEmployee.name} updated successfully!`
      });
      setEditingEmployee(null);
      loadEmployees();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to update employee: ${err.message}`
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const adminQuickPrompts = [
    "What is the annual leave carry-forward rule?",
    "What are the medical certificate requirements?",
    "Give me the details of all the employees",
    "What is the notice period for taking 3 or more leave days?",
    "Who is Jane Doe's reporting manager?",
    "Can employees encash unused annual leave?"
  ];

  const totalSections = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.25rem 2rem' }}>
      
      {/* Page Header & Segmented Tab Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            HR Management Console
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
            AI policy assistant, corporate documents, and employee database records
          </p>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          backgroundColor: '#f1f5f9',
          padding: '0.3rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveTab('assistant')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '9px',
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'assistant' ? '#ffffff' : 'transparent',
              color: activeTab === 'assistant' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'assistant' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Bot size={15} color={activeTab === 'assistant' ? '#2563eb' : '#64748b'} />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '9px',
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'documents' ? '#ffffff' : 'transparent',
              color: activeTab === 'documents' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'documents' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={15} color={activeTab === 'documents' ? '#2563eb' : '#64748b'} />
            <span>Policy Documents</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.05rem 0.4rem',
              borderRadius: '9999px',
              backgroundColor: activeTab === 'documents' ? '#eff6ff' : '#e2e8f0',
              color: activeTab === 'documents' ? '#1d4ed8' : '#475569'
            }}>
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '9px',
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'employees' ? '#ffffff' : 'transparent',
              color: activeTab === 'employees' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'employees' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={15} color={activeTab === 'employees' ? '#2563eb' : '#64748b'} />
            <span>Employee Directory</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.05rem 0.4rem',
              borderRadius: '9999px',
              backgroundColor: activeTab === 'employees' ? '#eff6ff' : '#e2e8f0',
              color: activeTab === 'employees' ? '#1d4ed8' : '#475569'
            }}>
              {employees.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
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

      {/* ======================================================== */}
      {/* TAB 1: AI ASSISTANT (ADMIN ACCESS)                       */}
      {/* ======================================================== */}
      {activeTab === 'assistant' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '1.5rem',
          height: 'calc(100vh - 165px)'
        }}>
          {/* Admin Context & Metric Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            
            {/* Admin Profile Overview */}
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
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: '1px solid #fde68a'
                }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                    {user.name}
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    {user.designation} &bull; <strong style={{ color: '#b45309' }}>Administrator</strong>
                  </p>
                </div>
              </div>

              {/* Quick Admin Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{
                  padding: '0.65rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Policy Documents</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                    {documents.length} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>({totalSections} sections)</span>
                  </div>
                </div>

                <div style={{
                  padding: '0.65rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Total Staff</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                    {employees.length} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>profiles</span>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.75rem',
                backgroundColor: '#fffdf5',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                fontSize: '0.74rem',
                color: '#92400e'
              }}>
                <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                <strong>Admin Privileges Active:</strong> You can query policy rules as well as organization-wide employee records.
              </div>
            </div>

            {/* Admin Suggested Prompts */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem', color: '#0f172a' }}>
                <Bot size={15} color="#2563eb" />
                <h4 style={{ fontSize: '0.84rem', fontWeight: 700 }}>Admin Inquiries</h4>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Sample administrative inquiries to test:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {adminQuickPrompts.map((prompt, idx) => (
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

          </div>

          {/* Assistant Chat Interface */}
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <ChatInterface
              user={user}
              quickPrompts={adminQuickPrompts}
              title="HR Administrative Assistant"
              welcomeTitle={`Hello, ${user.name}`}
              welcomeSubtitle="You have full administrative access. Ask about company policy clauses or query employee records."
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: POLICY DOCUMENTS MANAGEMENT                       */}
      {/* ======================================================== */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Upload Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
              Upload New HR Policy Document
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Upload company policy PDFs to automatically index them for AI question answering.
            </p>

            <form onSubmit={handleUpload} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.55rem',
                    fontSize: '0.82rem',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  opacity: (!selectedFile || isUploading) ? 0.6 : 1,
                  transition: 'background-color 0.15s ease'
                }}
              >
                <FileUp size={15} />
                <span>{isUploading ? 'Processing & Indexing...' : 'Upload & Index'}</span>
              </button>
            </form>

            <div style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.74rem',
              color: '#475569'
            }}>
              💡 <strong>Sample Policies Available:</strong> You can upload additional sample files directly from <code>sample_policies/</code> (e.g. <code>Healthcare_and_Wellness_Benefits.pdf</code> or <code>Remote_Work_and_Workplace_Guidelines.pdf</code>).
            </div>
          </div>

          {/* Documents Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                Corporate Policy Library
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                {documents.length} document{documents.length !== 1 ? 's' : ''} active
              </span>
            </div>

            {documents.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <FileText size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>No documents uploaded yet</p>
                <p style={{ fontSize: '0.76rem' }}>Upload a PDF above to enable AI policy inquiries.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '0.7rem 1.25rem' }}>Document Name</th>
                    <th style={{ padding: '0.7rem 1rem' }}>Indexed Sections</th>
                    <th style={{ padding: '0.7rem 1rem' }}>File Size</th>
                    <th style={{ padding: '0.7rem 1rem' }}>Uploaded By</th>
                    <th style={{ padding: '0.7rem 1rem' }}>Upload Date</th>
                    <th style={{ padding: '0.7rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
                          <FileText size={16} color="#2563eb" />
                          <span>{doc.filename}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 500,
                          fontSize: '0.74rem'
                        }}>
                          <Layers size={11} /> {doc.chunk_count} sections
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        {doc.uploaded_by}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.76rem' }}>
                        {new Date(doc.uploaded_at).toLocaleDateString()} {new Date(doc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <a
                            href={api.getDocumentDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              textDecoration: 'none',
                              fontSize: '0.74rem',
                              fontWeight: 500
                            }}
                            title="View PDF"
                          >
                            <Download size={12} /> View
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id, doc.filename)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.74rem',
                              fontWeight: 500
                            }}
                            title="Delete document"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: EMPLOYEE DIRECTORY & RECORDS                      */}
      {/* ======================================================== */}
      {activeTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                  Employee Directory
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Manage confidential staff profiles, leave allowances, and manager assignments
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.7rem 1.25rem' }}>Employee</th>
                  <th style={{ padding: '0.7rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.7rem 1rem' }}>Department & Designation</th>
                  <th style={{ padding: '0.7rem 1rem' }}>Annual Leave</th>
                  <th style={{ padding: '0.7rem 1rem' }}>Medical Leave</th>
                  <th style={{ padding: '0.7rem 1rem' }}>Reporting Manager</th>
                  <th style={{ padding: '0.7rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.employee_id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {emp.employee_id} &bull; {emp.email}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: emp.role === 'admin' ? '#fef3c7' : '#eff6ff',
                        color: emp.role === 'admin' ? '#92400e' : '#1d4ed8'
                      }}>
                        {emp.role === 'admin' ? 'Admin' : 'Employee'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ color: '#0f172a', fontWeight: 500 }}>{emp.designation}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{emp.department}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: '#1d4ed8' }}>
                        {emp.annual_leave_balance}
                      </span> days left
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#b91c1c' }}>
                          {Math.max(0, 10 - emp.medical_leave_used)}
                        </span>
                        <span style={{ color: '#475569' }}> days left</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        ({emp.medical_leave_used} used of 10)
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                      {emp.reporting_manager}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => startEditEmployee(emp)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#2563eb',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.74rem',
                          fontWeight: 500
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Edit Profile: {editingEmployee.name}
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {editingEmployee.employee_id} &bull; {editingEmployee.email}
                </span>
              </div>
              <button onClick={() => setEditingEmployee(null)}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department || ''}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Designation
                </label>
                <input
                  type="text"
                  value={editForm.designation || ''}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Annual Leave Remaining
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.annual_leave_balance ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, annual_leave_balance: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Medical Leave Used (of 10 days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.medical_leave_used ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, medical_leave_used: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Reporting Manager
                </label>
                <input
                  type="text"
                  value={editForm.reporting_manager || ''}
                  onChange={(e) => setEditForm({ ...editForm, reporting_manager: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#475569',
                    backgroundColor: '#ffffff'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 1rem',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
