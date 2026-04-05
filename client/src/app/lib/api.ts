const BASE_URL = "http://localhost:8000";

function messageFromErrorPayload(json: Record<string, unknown>): string {
  if (typeof json.message === "string" && json.message) return json.message;
  const d = json.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0] as Record<string, unknown>;
    if (typeof first.msg === "string") return first.msg;
  }
  return "Request failed";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (!res.ok) throw new Error(text.slice(0, 200) || res.statusText);
      throw new Error("Invalid JSON from server");
    }
  }
  if (!res.ok) throw new Error(messageFromErrorPayload(json));
  return json.body as T;
}

export const api = {
  get:    <T>(path: string)              => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST",  body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT",   body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)              => request<T>(path, { method: "DELETE" }),
};
