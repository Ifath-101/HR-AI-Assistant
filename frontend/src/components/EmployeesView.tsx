import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, EmployeeUpdatePayload } from '../types';
import {
  Users,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';

interface EmployeesViewProps {
  onCountChange?: (count: number) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ onCountChange }) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit employee modal state
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EmployeeUpdatePayload>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const emps = await api.getEmployees();
      setEmployees(emps);
      if (onCountChange) {
        onCountChange(emps.length);
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

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
    if (!editingEmployee || isSaving) return;

    setIsSaving(true);
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
        text: `Failed to update employee: ${err.message || 'Server error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      maxWidth: '1200px',
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
            Employee Directory
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem' }}>
            Manage staff profiles, department assignments, and annual/medical leave entitlements
          </p>
        </div>

        {/* Quick Count Metric */}
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Staff</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{employees.length}</span>
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

      {/* Directory Table Container */}
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
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
            Staff Records ({employees.length})
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, ID, or dept..."
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
            Loading employee records...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>No employees found</p>
            <p style={{ fontSize: '0.76rem' }}>Try clearing your search query.</p>
          </div>
        ) : (
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
              {filteredEmployees.map((emp) => (
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
                    </span> days remaining
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontWeight: 700, color: '#b91c1c' }}>
                      {emp.medical_leave_used}
                    </span> days used
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
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Employee Modal */}
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
                    Annual Leave Balance
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
                    Medical Leave Used
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
                  disabled={isSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 1rem',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
