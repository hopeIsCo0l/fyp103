import axios from 'axios';

// In dev, default to same-origin `/api` (Vite proxy) so API calls work whether you open the app
// at localhost or 127.0.0.1. Setting VITE_API_URL to http://localhost:8000/api breaks requests
// from 127.0.0.1 (cross-origin). Production builds can set VITE_API_URL explicitly.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:8000/api');
const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, string>)['Content-Type'];
  }
  return config;
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function getRefreshedAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  isRefreshing = true;
  refreshPromise = axios
    .post<{ access_token: string; refresh_token?: string }>(`${API_BASE}/auth/refresh`, {
      refresh_token: refreshToken,
    })
    .then((res) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refresh_token);
      }
      return res.data.access_token;
    })
    .catch(() => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | { _retry?: boolean; headers?: Record<string, string> }
      | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const token = await getRefreshedAccessToken();
      if (token) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);
