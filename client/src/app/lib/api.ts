/**
 * FastAPI returns `ApiResponse`: { body, message }.
 * Dev: Vite proxies `/api` → backend (see vite.config.ts).
 * Prod / custom: set `VITE_API_URL` (e.g. http://localhost:8000), no `/api` prefix.
 */

export type ApiEnvelope<T> = {
  body: T;
  message?: string | null;
};

function getBaseUrl(): string {
  const env = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (env) return env;
  return "/api";
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: string | string[] };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) return j.detail.map((d) => String(d)).join(", ");
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function apiGetJson<T>(path: string): Promise<ApiEnvelope<T>> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as ApiEnvelope<T>;
}

export async function apiPostJson<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<ApiEnvelope<TResponse>> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as ApiEnvelope<TResponse>;
}

export async function apiPatchJson<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<ApiEnvelope<TResponse>> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as ApiEnvelope<TResponse>;
}

/** Latest teacher-approved AI report (Postgres), or null. */
export type ApprovedReportDto = {
  id: number;
  student_id: number;
  week_number: number;
  term: string | null;
  summary: string | null;
  strengths: unknown;
  support_areas: unknown;
  recommendations: unknown;
  risk_level: string | null;
} | null;

export async function fetchParentReport(
  studentId: number
): Promise<ApprovedReportDto> {
  const { body } = await apiGetJson<ApprovedReportDto>(
    `/parent/report/${studentId}`
  );
  return body ?? null;
}

export async function postParentChat(
  studentId: number,
  message: string
): Promise<string> {
  const { body } = await apiPostJson<{ message: string }, { reply: string }>(
    `/parent/chat/${studentId}`,
    { message }
  );
  return body?.reply?.trim() || "";
}

// --- Teacher: AI reports workflow ---

export type StudentBrief = { id: number; name: string };

export type PendingAiReportDto = {
  id: number;
  student_id: number;
  student_name: string;
  week_number: number;
  term: string | null;
  summary: string | null;
  strengths: unknown;
  support_areas: unknown;
  recommendations: unknown;
  risk_level: string | null;
  status: string | null;
};

export async function fetchTeacherStudents(): Promise<StudentBrief[]> {
  const { body } = await apiGetJson<StudentBrief[]>("/teacher/students");
  return Array.isArray(body) ? body : [];
}

export async function postTeacherGenerateReport(
  studentId: number
): Promise<{ report_id: number; student_id: number }> {
  const { body } = await apiPostJson<
    Record<string, never>,
    { report_id: number; student_id: number }
  >(`/teacher/generate-report/${studentId}`, {});
  return body as { report_id: number; student_id: number };
}

export async function fetchPendingAiReports(): Promise<PendingAiReportDto[]> {
  const { body } = await apiGetJson<PendingAiReportDto[]>(
    "/teacher/ai-reports/pending"
  );
  return Array.isArray(body) ? body : [];
}

export async function patchAiReportDraft(
  reportId: number,
  patch: {
    summary?: string;
    strengths?: string[];
    support_areas?: string[];
    recommendations?: string[];
  }
): Promise<void> {
  await apiPatchJson<typeof patch, { report_id: number }>(
    `/teacher/ai-reports/${reportId}`,
    patch
  );
}

export async function postTeacherApproveReport(reportId: number): Promise<void> {
  await apiPostJson<Record<string, never>, { report_id: number }>(
    `/teacher/approve-report/${reportId}`,
    {}
  );
}
