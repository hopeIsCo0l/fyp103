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
  if (data && typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
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
  if (typeof data === 'string' && data.trim()) {
    return data.slice(0, 200);
  }
  if (ax.response?.status) {
    return `Request failed (HTTP ${ax.response.status})`;
  }
  if (ax?.code === 'ERR_NETWORK' || ax?.message?.includes('Network Error')) {
    return networkFallback ?? fallback;
  }
  return fallback;
}
