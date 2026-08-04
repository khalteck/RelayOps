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
  try {
    return await fetch(path, { ...init, headers, credentials: "include" });
  } catch {
    throw new ApiError(
      "We couldn’t reach RelayOps. Check your connection and try again.",
      0,
      "NETWORK_ERROR"
    );
  }
}

async function readJson(response: Response): Promise<unknown> {
  const body = await response.text();
  if (!body.trim()) return undefined;

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  if (typeof payload !== "object" || payload === null || !("error" in payload)) return false;
  const error = payload.error;
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    "code" in error &&
    typeof error.code === "string"
  );
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
    const payload = await readJson(response);
    throw new ApiError(
      isApiErrorResponse(payload) ? payload.error.message : "The request could not be completed",
      response.status,
      isApiErrorResponse(payload) ? payload.error.code : "UNKNOWN_ERROR",
      isApiErrorResponse(payload) ? payload.error.details : undefined
    );
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  const payload = await readJson(response);
  if (!isApiResponse<T>(payload)) {
    throw new ApiError(
      "We couldn’t complete that request. Please try again.",
      response.status,
      "INVALID_RESPONSE"
    );
  }
  return payload;
}
