// Lightweight wrapper around fetch() for the AgentPay backend API.
// Centralises base URL resolution and error handling so call sites stay
// small.

import { resolveApiBase } from "./resolveApiBase";

// Resolved at module load time so any misconfiguration surfaces during boot
// rather than at the first fetch.
const API_BASE = resolveApiBase();

export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  // Spread `init` first so caller-provided top-level keys win, then re-apply
  // `headers` so our default `Content-Type: application/json` is preserved
  // unless the caller explicitly overrides it via `init.headers`.
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json()) as T | ApiError;
  if (!res.ok) {
    const err = new Error((body as ApiError).message);
    throw Object.assign(err, body as ApiError);
  }
  return body as T;
}

export const apiGet = <T>(path: string) => apiFetch<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });
