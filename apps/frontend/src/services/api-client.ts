import type { ApiErrorResponse, ApiResponse } from "@relayops/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

function csrfToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("relayops_csrf="))
    ?.split("=")
    .slice(1)
    .join("=");
}

let refreshPromise: Promise<boolean> | undefined;

async function rawRequest(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  const csrf = csrfToken();
  if (csrf && !["GET", "HEAD"].includes(init.method ?? "GET")) {
    headers.set("x-csrf-token", decodeURIComponent(csrf));
  }
  return fetch(path, { ...init, headers, credentials: "include" });
}

async function tryRefresh(): Promise<boolean> {
  refreshPromise ??= rawRequest("/api/v1/auth/refresh", { method: "POST" })
    .then((response) => response.ok)
    .finally(() => {
      refreshPromise = undefined;
    });
  return refreshPromise;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  let response = await rawRequest(path, init);
  const isAuthRoute = path.includes("/auth/login") || path.includes("/auth/register");

  if (response.status === 401 && !isAuthRoute && !path.includes("/auth/refresh")) {
    if (await tryRefresh()) response = await rawRequest(path, init);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as ApiErrorResponse | undefined;
    throw new ApiError(
      payload?.error.message ?? "The request could not be completed",
      response.status,
      payload?.error.code ?? "UNKNOWN_ERROR",
      payload?.error.details
    );
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }
  return (await response.json()) as ApiResponse<T>;
}
