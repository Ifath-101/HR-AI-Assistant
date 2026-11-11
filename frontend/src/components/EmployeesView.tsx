import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, EmployeeUpdatePayload, EmployeeCreatePayload } from '../types';
import {
  Users,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock
} from 'lucide-react';

interface EmployeesViewProps {
  onCountChange?: (count: number) => void;
}

const DEPARTMENTS = [
  'Software Engineering',
  'Human Resources',
  'Product & Design',
  'Finance & Operations',
  'Marketing & Growth',
  'Data & AI',
  'Legal & Compliance'
];

export const EmployeesView: React.FC<EmployeesViewProps> = ({ onCountChange }) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit employee modal state
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EmployeeUpdatePayload>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add employee modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<EmployeeCreatePayload>({
    name: '',
    email: '',
    role: 'employee',
    employee_id: '',
    department: 'Software Engineering',
    designation: '',
    annual_leave_balance: 20,
    medical_leave_used: 0,
    reporting_manager: 'HR Administrator',
    initial_password: 'Employee@123',
    admin_verification_password: ''
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

  const openAddModal = async () => {
    setAddError(null);
    let nextId = '';
    try {
      nextId = await api.getNextEmployeeId('employee');
    } catch {
      nextId = 'EMP010';
    }
    setAddForm({
      name: '',
      email: '',
      role: 'employee',
      employee_id: nextId,
      department: 'Software Engineering',
      designation: '',
      annual_leave_balance: 20,
      medical_leave_used: 0,
      reporting_manager: 'HR Administrator',
      initial_password: 'Employee@123',
      admin_verification_password: ''
    });
    setIsAddModalOpen(true);
  };

  const handleRoleChangeInAdd = async (newRole: 'employee' | 'admin') => {
    try {
      const nextId = await api.getNextEmployeeId(newRole);
      setAddForm(prev => ({
        ...prev,
        role: newRole,
        employee_id: nextId,
        admin_verification_password: ''
      }));
    } catch {
      setAddForm(prev => ({
        ...prev,
        role: newRole,
        admin_verification_password: ''
      }));
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;

    if (addForm.role === 'admin' && !addForm.admin_verification_password?.trim()) {
      setAddError('Security verification required: Enter your current HR Manager password to grant administrative privileges.');
      return;
    }

    setIsSubmittingAdd(true);
    setAddError(null);
    try {
      const created = await api.createEmployee(addForm);
      setStatusMessage({
        type: 'success',
        text: `New ${created.role === 'admin' ? 'HR Administrator' : 'Staff Member'} ${created.name} (${created.employee_id}) added successfully!`
      });
      setIsAddModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create employee');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const startEditEmployee = (emp: User) => {
    setEditingEmployee(emp);
    setEditError(null);
    setEditForm({
      department: emp.department,
      designation: emp.designation,
      annual_leave_balance: emp.annual_leave_balance,
      medical_leave_used: emp.medical_leave_used,
      reporting_manager: emp.reporting_manager,
      role: emp.role,
      admin_verification_password: ''
    });
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || isSaving) return;

    // Check if promoting to admin without verification
    if (
      editForm.role === 'admin' &&
      editingEmployee.role !== 'admin' &&
      !editForm.admin_verification_password?.trim()
    ) {
      setEditError('Security verification required: Enter your current HR Manager password to promote this user to Administrator.');
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await api.updateEmployee(editingEmployee.employee_id, editForm);
      setStatusMessage({
        type: 'success',
        text: `Employee record for ${editingEmployee.name} updated successfully!`
      });
      setEditingEmployee(null);
      loadEmployees();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
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
            Manage staff profiles, department assignments, leave quotas, and administrative permissions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Quick Count Metric */}
          <div style={{
            padding: '0.45rem 0.9rem',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <span style={{ fontSize: '0.66rem', color: '#64748b', display: 'block' }}>Total Staff</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{employees.length}</span>
          </div>

          {/* Add Employee Button */}
          <button
            onClick={openAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.05rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(37,99,235,0.25)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <UserPlus size={15} /> Add New Employee
          </button>
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
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
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

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, ID, role, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.38rem 0.65rem 0.38rem 2rem',
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
            <p style={{ fontSize: '0.76rem' }}>Try clearing your search query or add a new team member.</p>
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
                <tr key={emp.employee_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>{emp.employee_id}</span>
                      <span>&bull;</span>
                      <span>{emp.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {emp.role === 'admin' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        backgroundColor: '#f5f3ff',
                        color: '#6d28d9',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        border: '1px solid #ddd6fe'
                      }}>
                        <Shield size={11} /> Admin
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 500,
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        border: '1px solid #e2e8f0'
                      }}>
                        Staff
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{emp.department}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{emp.designation}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>
                      {emp.annual_leave_balance}
                    </span> days remaining
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontWeight: 700, color: '#b91c1c' }}>
                      {emp.medical_leave_used}
                    </span> days used
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                    {emp.reporting_manager || <span style={{ color: '#94a3b8' }}>None</span>}
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

      {/* Add New Employee Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(3px)',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.65rem',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                  <UserPlus size={19} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    Add New Employee
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Provision staff directory profile & access credentials
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message inside Modal */}
            {addError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.78rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Role Selection Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Account Role & Permissions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleRoleChangeInAdd('employee')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: addForm.role === 'employee' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: addForm.role === 'employee' ? '#eff6ff' : '#ffffff',
                      color: addForm.role === 'employee' ? '#1d4ed8' : '#64748b',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Users size={14} /> Staff Employee
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChangeInAdd('admin')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: addForm.role === 'admin' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                      backgroundColor: addForm.role === 'admin' ? '#f5f3ff' : '#ffffff',
                      color: addForm.role === 'admin' ? '#6d28d9' : '#64748b',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <ShieldCheck size={14} /> HR Administrator
                  </button>
                </div>
              </div>

              {/* Step-Up Security Verification Notice (Industry Practice) */}
              {addForm.role === 'admin' && (
                <div style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400e', fontWeight: 600, fontSize: '0.78rem' }}>
                    <ShieldAlert size={15} color="#d97706" />
                    <span>Step-Up Authentication Required (Privilege Escalation)</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#b45309', margin: 0, lineHeight: 1.45 }}>
                    In accordance with enterprise access controls, granting HR Administrator privileges allows full oversight of confidential staff records and policy management. Please confirm your current HR Manager password.
                  </p>
                  <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                    <Lock size={13} color="#94a3b8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      placeholder="Confirm your current HR Manager password"
                      value={addForm.admin_verification_password || ''}
                      onChange={(e) => setAddForm({ ...addForm, admin_verification_password: e.target.value })}
                      required={addForm.role === 'admin'}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem 0.45rem 2.1rem',
                        borderRadius: '7px',
                        border: '1px solid #fcd34d',
                        backgroundColor: '#ffffff',
                        fontSize: '0.8rem',
                        color: '#0f172a'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Basic Details: Name and Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maya Lin"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
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
                    Work Email *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. mlin@peoplesphere.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
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

              {/* Employee ID and Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder={addForm.role === 'admin' ? 'ADM002' : 'EMP010'}
                    value={addForm.employee_id || ''}
                    onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Department *
                  </label>
                  <select
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Designation and Reporting Manager */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Designation / Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    required
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
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. David Vance"
                    value={addForm.reporting_manager || ''}
                    onChange={(e) => setAddForm({ ...addForm, reporting_manager: e.target.value })}
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

              {/* Initial Password and Annual Leave Balance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Initial Temporary Password
                  </label>
                  <input
                    type="text"
                    value={addForm.initial_password || ''}
                    onChange={(e) => setAddForm({ ...addForm, initial_password: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Annual Leave Entitlement (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={addForm.annual_leave_balance}
                    onChange={(e) => setAddForm({ ...addForm, annual_leave_balance: parseInt(e.target.value) || 0 })}
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

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#475569',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1.15rem',
                    backgroundColor: addForm.role === 'admin' ? '#7c3aed' : '#2563eb',
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: isSubmittingAdd ? 'default' : 'pointer',
                    opacity: isSubmittingAdd ? 0.7 : 1
                  }}
                >
                  <UserPlus size={14} />
                  {isSubmittingAdd ? 'Provisioning...' : addForm.role === 'admin' ? 'Provision Administrator' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(3px)',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.65rem',
            width: '100%',
            maxWidth: '500px',
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
              <button
                onClick={() => setEditingEmployee(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>

            {editError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.78rem',
                marginBottom: '0.85rem'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Role Modification */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Role & Permissions
                </label>
                <select
                  value={editForm.role || 'employee'}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'employee' | 'admin' })}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="employee">Staff Employee (Standard Access)</option>
                  <option value="admin">HR Administrator (Elevated Full Access)</option>
                </select>
              </div>

              {/* If elevating role to admin, show Step-Up Verification */}
              {editForm.role === 'admin' && editingEmployee.role !== 'admin' && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400e', fontWeight: 600, fontSize: '0.76rem' }}>
                    <ShieldAlert size={14} color="#d97706" />
                    <span>Admin Promotion Verification Required</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#b45309', margin: 0 }}>
                    Enter your current HR Manager password to verify this administrative promotion.
                  </p>
                  <input
                    type="password"
                    placeholder="Your current HR Manager password"
                    value={editForm.admin_verification_password || ''}
                    onChange={(e) => setEditForm({ ...editForm, admin_verification_password: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #fcd34d',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem'
                    }}
                  />
                </div>
              )}

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
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
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
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: isSaving ? 'default' : 'pointer',
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
