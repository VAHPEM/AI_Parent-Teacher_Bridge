import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, Sparkles, Info, Loader2 } from "lucide-react";
import { Link } from "react-router";
import {
  fetchPendingAiReports,
  patchAiReportDraft,
  postTeacherApproveReport,
  type PendingAiReportDto,
} from "../../lib/api";

function formatListField(v: unknown): string {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function PendingApprovals() {
  const [items, setItems] = useState<PendingAiReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await fetchPendingAiReports();
      setItems(list);
      const next: Record<number, string> = {};
      list.forEach((r) => {
        next[r.id] = r.summary ?? "";
      });
      setSummaries(next);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (id: number) => {
    setSavingId(id);
    setBanner(null);
    try {
      await patchAiReportDraft(id, { summary: summaries[id] ?? "" });
      setBanner("Changes saved.");
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setBanner(null);
    try {
      const text = summaries[id]?.trim();
      if (text) {
        await patchAiReportDraft(id, { summary: text });
      }
      await postTeacherApproveReport(id);
      setBanner("Report approved — parents can now see it and ask the AI assistant about it.");
      await load();
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Needs Your Review</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
              AI-generated <strong>parent reports</strong> stay here until you approve. Parents only get AI answers grounded on an <strong>approved</strong> report.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <Clock size={14} style={{ color: "#F59E0B" }} />
            <span className="text-sm" style={{ color: "#92400E", fontWeight: 600 }}>{items.length} pending</span>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-2xl flex items-start gap-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
          <p className="text-sm" style={{ color: "#1E40AF", lineHeight: "1.6" }}>
            Edit the summary if needed, click <strong>Save changes</strong>, then <strong>Approve &amp; publish</strong>.{" "}
            <Link to="/teacher/reports" className="underline font-semibold">Generate another report</Link> from Reports.
          </p>
        </div>

        {banner && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
            {banner}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
            <Loader2 className="animate-spin" size={18} /> Loading pending reports…
          </div>
        ) : loadError ? (
          <p className="text-sm p-4 rounded-xl" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>{loadError}</p>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#D1FAE5" }}>
              <CheckCircle size={28} style={{ color: "#10B981" }} />
            </div>
            <p style={{ fontWeight: 700, color: "#1E293B", fontSize: "1.1rem" }}>No drafts waiting</p>
            <p className="text-sm mt-2" style={{ color: "#64748B" }}>
              Generate an AI parent report from{" "}
              <Link to="/teacher/reports" className="underline font-medium" style={{ color: "#2563EB" }}>Reports</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border-2 shadow-sm p-5 transition-all"
                style={{ borderColor: "#FDE68A" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>{item.student_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                        Week {item.week_number}{item.term ? ` · ${item.term}` : ""}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
                        Risk: {item.risk_level ?? "—"}
                      </span>
                      <span className="text-xs" style={{ color: "#94A3B8" }}><Clock size={11} className="inline mr-1" />Pending approval</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSave(item.id)}
                      disabled={savingId === item.id || approvingId === item.id}
                      className="px-4 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                      style={{ fontWeight: 600, color: "#334155" }}
                    >
                      {savingId === item.id ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id)}
                      disabled={savingId === item.id || approvingId === item.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all disabled:opacity-50"
                      style={{ backgroundColor: "#10B981", fontWeight: 600 }}
                    >
                      <CheckCircle size={14} />
                      {approvingId === item.id ? "Publishing…" : "Approve & publish"}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs block mb-1" style={{ fontWeight: 600, color: "#64748B" }}>Parent summary (editable)</label>
                  <textarea
                    value={summaries[item.id] ?? ""}
                    onChange={(e) => setSummaries((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    rows={5}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ color: "#1E293B" }}
                  />
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <p className="text-xs mb-1" style={{ fontWeight: 600, color: "#475569" }}>Strengths</p>
                    <p className="text-xs" style={{ color: "#64748B", lineHeight: 1.5 }}>{formatListField(item.strengths)}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#EFF6FF" }}>
                    <p className="text-xs mb-1" style={{ fontWeight: 600, color: "#1E40AF" }}>
                      <Sparkles size={11} className="inline mr-1" />Support areas &amp; recs
                    </p>
                    <p className="text-xs" style={{ color: "#1E40AF", lineHeight: 1.5 }}>
                      <strong>Support:</strong> {formatListField(item.support_areas)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#1E40AF", lineHeight: 1.5 }}>
                      <strong>Home:</strong> {formatListField(item.recommendations)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
