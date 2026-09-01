import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

let refreshToken: string | null = null;
let onRefreshed: ((tokens: Tokens) => void) | null = null;
let onRefreshFailed: (() => void) | null = null;

export function setAuthTokens(tokens: Tokens | null): void {
  refreshToken = tokens?.refreshToken ?? null;
  if (tokens?.accessToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function setTokenRefreshHandlers(handlers: {
  onRefreshed: (tokens: Tokens) => void;
  onRefreshFailed: () => void;
}): void {
  onRefreshed = handlers.onRefreshed;
  onRefreshFailed = handlers.onRefreshFailed;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshToken) throw new Error('No refresh token available');
  const { data } = await axios.post<Tokens>(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
    refreshToken,
  });
  setAuthTokens(data);
  onRefreshed?.(data);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/api/auth/');

    if (error.response?.status !== 401 || !original || original._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      onRefreshFailed?.();
      return Promise.reject(refreshError);
    }
  }
);

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined;
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
