import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/lib/tokenStorage";
import type { AccessTokensResponse } from "./types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const { data } = await axios.post<AccessTokensResponse>(
    `${import.meta.env.VITE_API_URL}/users/refresh-token`,
    { refreshToken },
  );

  tokenStorage.setTokens(data.accessToken, data.refreshToken);

  return data.accessToken;
}

/** Broadcast so the app shell can react (e.g. redirect to /login) when the session truly ends. */
export function onSessionExpired(callback: () => void): () => void {
  window.addEventListener("flow:session-expired", callback);
  return () => window.removeEventListener("flow:session-expired", callback);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.includes("/users/login") ||
      originalRequest?.url?.includes("/users/register") ||
      originalRequest?.url?.includes("/users/refresh-token");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthEndpoint) {
      originalRequest._retried = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        const newAccessToken = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch {
        tokenStorage.clear();
        window.dispatchEvent(new Event("flow:session-expired"));
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = "Beklenmeyen bir hata oluştu."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; title?: string } | undefined;
    return data?.detail ?? data?.title ?? fallback;
  }

  return fallback;
}
