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
  token_type: string;
}

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
  const res = await api.post<{ user: User; access_token: string; token_type: string }>(
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

export const getMe = async () => {
  const res = await api.get<User>('/auth/me');
  return res.data;
};
