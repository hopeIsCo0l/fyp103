/** Extract a readable message from axios/FastAPI errors (detail string, validation array, or HTTP status). */
export function getApiErrorMessage(
  err: unknown,
  fallback: string,
  networkFallback?: string,
): string {
  const ax = err as {
    response?: { status?: number; data?: unknown };
    code?: string;
    message?: string;
  };
  const data = ax.response?.data;
  const status = ax.response?.status;
  if (data && typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      if (status && status >= 500) return fallback;
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'object' && item !== null && 'msg' in item) {
            const loc = 'loc' in item && Array.isArray((item as { loc?: unknown }).loc)
              ? ` (${(item as { loc: unknown[] }).loc.filter((x) => x !== 'body').join('.')})`
              : '';
            return `${String((item as { msg?: string }).msg)}${loc}`;
          }
          return String(item);
        })
        .join(', ');
    }
  }
  if (status === 401) {
    return 'Your session is invalid or expired. Please sign in again.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'The requested resource was not found.';
  }
  if (status === 429) {
    return 'Too many requests. Please try again later.';
  }
  if (status && status >= 500) {
    return fallback;
  }
  if (typeof data === 'string' && data.trim()) {
    return data.slice(0, 200);
  }
  if (status) {
    return `Request failed (HTTP ${status})`;
  }
  if (ax?.code === 'ERR_NETWORK' || ax?.message?.includes('Network Error')) {
    return networkFallback ?? fallback;
  }
  return fallback;
}
