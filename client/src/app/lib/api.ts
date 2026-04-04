const BASE_URL = "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json.body as T;
}

export const api = {
  get:    <T>(path: string)              => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST",  body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT",   body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)              => request<T>(path, { method: "DELETE" }),
};
