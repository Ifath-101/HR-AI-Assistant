export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  department: string;
  designation: string;
  annual_leave_balance: number;
  medical_leave_used: number;
  reporting_manager: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DemoAccount {
  role: string;
  email: string;
  password: string;
  label: string;
}

export interface Document {
  id: string;
  filename: string;
  policy_name: string;
  version: number;
  is_latest: boolean;
  description?: string;
  file_size: number;
  chunk_count: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Citation {
  filename: string;
  policy_name?: string;
  version?: number;
  page: number;
  text_snippet: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  is_personalized?: boolean;
  citations?: Citation[];
  employee_context_used?: Partial<User> | null;
  timestamp?: string;
}

export interface EmployeeUpdatePayload {
  department?: string;
  designation?: string;
  annual_leave_balance?: number;
  medical_leave_used?: number;
  reporting_manager?: string;
}

