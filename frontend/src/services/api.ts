import { AuthResponse, DemoAccount, Document, EmployeeUpdatePayload, User } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('peoplesphere_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem('peoplesphere_token');
    localStorage.removeItem('peoplesphere_user');
    window.dispatchEvent(new Event('auth-expired'));
  }
  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<AuthResponse>(res);
    localStorage.setItem('peoplesphere_token', data.access_token);
    localStorage.setItem('peoplesphere_user', JSON.stringify(data.user));
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<User>(res);
  },

  async getDemoAccounts(): Promise<DemoAccount[]> {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    return handleResponse<DemoAccount[]>(res);
  },

  logout(): void {
    localStorage.removeItem('peoplesphere_token');
    localStorage.removeItem('peoplesphere_user');
  },

  // Document Management & Policies
  async getDocuments(latestOnly?: boolean): Promise<Document[]> {
    const query = latestOnly !== undefined ? `?latest_only=${latestOnly}` : '';
    const res = await fetch(`${API_BASE}/documents${query}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<Document[]>(res);
  },

  async getPolicyNames(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/documents/policies`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<string[]>(res);
  },

  async uploadDocument(file: File, policyName?: string, description?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (policyName && policyName.trim()) {
      formData.append('policy_name', policyName.trim());
    }
    if (description && description.trim()) {
      formData.append('description', description.trim());
    }

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse<Document>(res);
  },

  async reactivateDocument(id: string): Promise<Document> {
    const res = await fetch(`${API_BASE}/documents/${id}/reactivate`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<Document>(res);
  },

  async deleteDocument(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ message: string; id: string }>(res);
  },

  getDocumentDownloadUrl(docId: string): string {
    const token = localStorage.getItem('peoplesphere_token');
    return `${API_BASE}/documents/${docId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // Employee Records
  async getEmployees(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<User[]>(res);
  },

  async getMyRecord(): Promise<User> {
    const res = await fetch(`${API_BASE}/employees/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<User>(res);
  },

  async updateEmployee(employeeId: string, updates: EmployeeUpdatePayload): Promise<User> {
    const res = await fetch(`${API_BASE}/employees/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<User>(res);
  },

  // Assistant Chat
  async sendChatMessage(
    question: string,
    history: { role: string; content: string }[]
  ): Promise<{
    answer: string;
    is_personalized: boolean;
    citations: { filename: string; page: number; text_snippet: string }[];
    employee_context_used?: Partial<User> | null;
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ question, history }),
    });
    return handleResponse(res);
  },

  async getChatHistory(): Promise<{
    id: number;
    role: 'user' | 'assistant';
    content: string;
    is_personalized: boolean;
    citations: { filename: string; page: number; text_snippet: string }[];
    created_at: string;
  }[]> {
    const res = await fetch(`${API_BASE}/chat/history`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async clearChatHistory(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/chat/history`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },
};
