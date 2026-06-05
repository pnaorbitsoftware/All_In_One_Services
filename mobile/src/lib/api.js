import { API_URL } from "../config/api";

export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
export const AUTH_REQUEST_TIMEOUT_MS = 45000;

async function parseApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { message: text || fallbackMessage };
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    token,
    signal,
    method = body ? "POST" : "GET",
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  } = options;
  const headers = { Accept: "application/json" };
  const controller = new AbortController();
  let didTimeout = false;
  let timeoutId;
  let externalAbortHandler;

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);
  }

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else if (typeof signal.addEventListener === "function") {
      externalAbortHandler = () => controller.abort();
      signal.addEventListener("abort", externalAbortHandler, { once: true });
    }
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (didTimeout) {
      throw new Error("Request timed out. The Render backend may be waking up. Please try again in a minute.");
    }

    if (error?.name === "AbortError") {
      throw new Error("Request was cancelled. Please try again.");
    }

    throw new Error(`Cannot reach ServiceHub server at ${API_URL}. Check your internet connection and try again.`);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (signal && externalAbortHandler && typeof signal.removeEventListener === "function") {
      signal.removeEventListener("abort", externalAbortHandler);
    }
  }

  const data = await parseApiResponse(response, "Request failed.");
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
