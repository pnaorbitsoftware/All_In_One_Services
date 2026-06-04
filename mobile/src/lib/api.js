import { API_URL } from "../config/api";

async function parseApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { message: text || fallbackMessage };
}

export async function apiRequest(path, options = {}) {
  const { body, token, signal, method = body ? "POST" : "GET" } = options;
  const headers = { Accept: "application/json" };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new Error(`Network error. Backend not reachable at ${API_URL}. Start backend, use same Wi-Fi, then rebuild if your computer IP changed.`);
  }

  const data = await parseApiResponse(response, "Request failed.");
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
