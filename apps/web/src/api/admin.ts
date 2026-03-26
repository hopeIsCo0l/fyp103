import { api } from './client';

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface UserListResponse {
  items: UserOut[];
  total: number;
  page: number;
  size: number;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  role: 'recruiter' | 'admin';
}

export interface UpdateUserPayload {
  role?: string;
  is_active?: boolean;
  is_email_verified?: boolean;
  full_name?: string;
}

export interface AuditLogOut {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata_json: string | null;
  created_at: string | null;
}

export interface AuditLogListResponse {
  items: AuditLogOut[];
  total: number;
  page: number;
  size: number;
}

export interface StatsResponse {
  total_users: number;
  candidates: number;
  recruiters: number;
  admins: number;
  verified_users: number;
  active_sessions: number;
  signups_today: number;
}

export async function getUsers(params: {
  search?: string;
  role?: string;
  page?: number;
  size?: number;
}): Promise<UserListResponse> {
  const { data } = await api.get('/admin/users', { params });
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<UserOut> {
  const { data } = await api.post('/admin/users', payload);
  return data;
}

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<UserOut> {
  const { data } = await api.patch(`/admin/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
}

export async function getAuditLogs(params: {
  action?: string;
  actor_id?: string;
  page?: number;
  size?: number;
}): Promise<AuditLogListResponse> {
  const { data } = await api.get('/admin/audit-logs', { params });
  return data;
}

export async function getStats(): Promise<StatsResponse> {
  const { data } = await api.get('/admin/stats');
  return data;
}
