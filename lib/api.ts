import "server-only";
import { createApiToken } from "./api-token";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const baseUrl = process.env.BACKEND_API_URL;

  if (!baseUrl) {
    throw new Error("BACKEND_API_URL is missing");
  }

  if (!endpoint.startsWith("/") || endpoint.startsWith("//")) {
    throw new Error("Invalid API endpoint");
  }

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = await createApiToken();

    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
    redirect: "error",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || `API request failed: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}