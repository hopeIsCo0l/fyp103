import { api } from './client';

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_email_verified?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setAuthTokens = (tokens: TokenResponse) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const signup = async (data: SignupPayload) => {
  const res = await api.post<{ message: string; email: string }>('/auth/signup', {
    ...data,
    role: data.role || 'candidate',
  });
  return res.data;
};

export const resendOtp = async (email: string) => {
  const res = await api.post<{ message: string }>('/auth/resend-otp', { email });
  return res.data;
};

export const verifyEmail = async (email: string, otp: string) => {
  const res = await api.post<{ user: User; access_token: string; refresh_token: string; token_type: string }>(
    '/auth/verify-email',
    { email, otp }
  );
  return res.data;
};

export const signin = async (data: SigninPayload) => {
  const res = await api.post<TokenResponse>('/auth/signin', data);
  return res.data;
};

export const requestLoginOtp = async (email: string) => {
  const res = await api.post<{ message: string }>('/auth/request-login-otp', { email });
  return res.data;
};

export const verifyLoginOtp = async (email: string, otp: string) => {
  const res = await api.post<TokenResponse>('/auth/verify-login-otp', { email, otp });
  return res.data;
};

export const refreshToken = async (refresh_token: string) => {
  const res = await api.post<TokenResponse>('/auth/refresh', { refresh_token });
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (token: string, new_password: string) => {
  const res = await api.post<{ message: string }>('/auth/reset-password', { token, new_password });
  return res.data;
};

export const logoutApi = async () => {
  const refresh = getRefreshToken();
  if (!refresh) return;
  await api.post('/auth/logout', { refresh_token: refresh });
};

export const getMe = async () => {
  const res = await api.get<User>('/auth/me');
  return res.data;
};
