import { useState, useEffect } from "react";
import {
  CheckCircle, Edit3, Clock, Globe, BrainCircuit,
  BookOpen, Home, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Info, Zap
} from "lucide-react";
import { api } from "../../lib/api";
import { DEMO_TEACHER_ID } from "../../lib/config";
import { RevisionModal } from "../../components/teacher/RevisionModal";
import { ActivityEditForm } from "../../components/teacher/ActivityEditForm";

type FilterType = "all" | "auto_approved" | "needs_review" | "needs_revision";

const filterTabs: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "auto_approved", label: "Approved" },
  { key: "needs_review", label: "Needs Review" },
  { key: "needs_revision", label: "Needs Revision" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  auto_approved: { label: "Approved",      color: "#10B981", bg: "#F0FDF4", border: "#86EFAC" },
  approved:      { label: "Approved",      color: "#10B981", bg: "#F0FDF4", border: "#86EFAC" },
  published:     { label: "Published",     color: "#10B981", bg: "#F0FDF4", border: "#86EFAC" },
  pending:       { label: "Needs Review",  color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  draft:         { label: "Draft",         color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  needs_revision: { label: "Needs Revision", color: "#EF4444", bg: "#FFF5F5", border: "#FECACA" },
};

const confidenceConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  high: { color: "#10B981", bg: "#D1FAE5", icon: <CheckCircle size={12} />, label: "High Confidence" },
  medium: { color: "#3B82F6", bg: "#DBEAFE", icon: <Info size={12} />, label: "Medium Confidence" },
  low: { color: "#F59E0B", bg: "#FEF3C7", icon: <AlertTriangle size={12} />, label: "Low Confidence" },
};

export function AIAnalysis() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showTranslation, setShowTranslation] = useState<Set<number>>(new Set());
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);

  useEffect(() => {
    api.get<any[]>(`/teacher/ai-analysis?teacher_id=${DEMO_TEACHER_ID}`).then((data) => setAnalyses(data));
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTranslation = (id: number) => {
    setShowTranslation(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleApprove = (id: number) => {
    api.put(`/teacher/ai-analysis/${id}/approve`).then(() => {
      setAnalyses(prev => prev.map(a => a.id === id ? { ...a, status: "approved" } : a));
    });
  };

  const handleRequestRevision = (id: number) => {
    api.put(`/teacher/ai-analysis/${id}/revise`).then(() => {
      setAnalyses(prev => prev.map(a => a.id === id ? { ...a, status: "needs_revision" } : a));
    });
  };

  const handleRevisionSave = (updated: any) => {
    setAnalyses(prev => prev.map(a => a.id === updated.id ? updated : a));
    setEditingReport(null);
  };

  const handleActivitySave = (reportId: number, updatedActivity: any) => {
    setAnalyses(prev => prev.map(a =>
      a.id === reportId
        ? { ...a, activities: a.activities.map((act: any) => act.id === updatedActivity.id ? updatedActivity : act) }
        : a
    ));
    setEditingActivityId(null);
  };

  const normStatus = (s: string | undefined) => (s || "").toLowerCase();

  const getFilterKey = (status: string): FilterType => {
    const s = normStatus(status);
    if (["auto_approved", "published", "approved"].includes(s)) return "auto_approved";
    if (["pending", "draft"].includes(s)) return "needs_review";
    if (s === "needs_revision") return "needs_revision";
    return "needs_review";
  };

  const filtered = analyses.filter(a => filter === "all" || getFilterKey(a.status) === filter);

  const counts = {
    all: analyses.length,
    auto_approved: analyses.filter(a => ["auto_approved", "published", "approved"].includes(normStatus(a.status))).length,
    needs_review: analyses.filter(a => ["pending", "draft"].includes(normStatus(a.status))).length,
    needs_revision: analyses.filter(a => normStatus(a.status) === "needs_revision").length,
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>AI Analysis Results</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
              All AI-generated reports require your review · Approve before sending to parents
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
              <Zap size={14} style={{ color: "#10B981" }} />
              <span className="text-sm" style={{ color: "#065F46", fontWeight: 500 }}>
                {counts.auto_approved} approved
              </span>
            </div>
            {counts.needs_review > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
                <Clock size={14} style={{ color: "#F59E0B" }} />
                <span className="text-sm" style={{ color: "#92400E", fontWeight: 500 }}>
                  {counts.needs_review} needs review
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-6 p-4 rounded-2xl flex items-start gap-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
          <p className="text-sm" style={{ color: "#1E40AF", lineHeight: "1.6" }}>
            <strong>Manual approval required:</strong> All AI-generated reports must be reviewed and approved by you before they are sent to parents. You can edit the content or request a revision if needed.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: filter === tab.key ? "#2563EB" : "white",
                color: filter === tab.key ? "white" : "#64748B",
                border: filter === tab.key ? "none" : "1px solid #E2E8F0",
                fontWeight: filter === tab.key ? 600 : 400
              }}
            >
              {tab.label}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: filter === tab.key ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                  color: filter === tab.key ? "white" : "#94A3B8"
                }}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid gap-5">
          {filtered.map(analysis => {
            const st = normStatus(analysis.status);
            const status = statusConfig[analysis.status] ?? statusConfig[st] ?? statusConfig.pending;
            const confidence = confidenceConfig[analysis.confidence] ?? confidenceConfig.medium;
            const isExpanded = expandedCards.has(analysis.id);
            const showTrans = showTranslation.has(analysis.id);
            const isAutoApproved = ["auto_approved", "published", "approved"].includes(st);
            const isPending = st === "pending";

            return (
              <div
                key={analysis.id}
                className="bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                style={{ borderColor: status.border, backgroundColor: status.bg }}
              >
                {/* Card header */}
                <div className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                      style={{ backgroundColor: analysis.avatarColor, fontWeight: 600 }}>
                      {analysis.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{analysis.student}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 500 }}>
                          {analysis.year}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
                          {analysis.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}`, fontWeight: 500 }}>
                          {isAutoApproved && <Zap size={10} />}
                          {status.label}
                        </span>
                        <span className="text-xs" style={{ color: "#94A3B8" }}>
                          <Clock size={11} className="inline mr-1" />{analysis.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: confidence.bg }}>
                    <span style={{ color: confidence.color }}>{confidence.icon}</span>
                    <span className="text-xs" style={{ color: confidence.color, fontWeight: 500 }}>{confidence.label}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit size={14} style={{ color: "#2563EB" }} />
                    <span className="text-xs" style={{ fontWeight: 600, color: "#2563EB", letterSpacing: "0.05em" }}>AI ANALYSIS</span>
                  </div>
                  {analysis.summary ? (
                    <p className="text-sm mb-3" style={{ color: "#334155", lineHeight: 1.65 }}>
                      {analysis.summary}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(analysis.weakAreas || []).map((area: string) => (
                      <span key={area} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#D97706", fontWeight: 500 }}>
                        ⚠ {area}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <BookOpen size={13} className="shrink-0 mt-0.5" style={{ color: "#64748B" }} />
                    <p className="text-xs" style={{ color: "#64748B" }}>
                      <span style={{ fontWeight: 600, color: "#1E293B" }}>Australian Curriculum:</span> {analysis.curriculumRef}
                    </p>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Home size={13} style={{ color: "#10B981" }} />
                      <span className="text-xs" style={{ fontWeight: 600, color: "#10B981", letterSpacing: "0.05em" }}>RECOMMENDATIONS FOR PARENTS</span>
                    </div>
                    <ul className="space-y-1">
                      {(analysis.recommendations || []).length === 0 ? (
                        <li className="text-xs" style={{ color: "#94A3B8" }}>No bullet recommendations; see summary above.</li>
                      ) : (
                        (analysis.recommendations || []).slice(0, isExpanded ? undefined : 2).map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#64748B" }}>
                          <CheckCircle size={12} className="shrink-0 mt-0.5" style={{ color: "#10B981" }} />
                          {rec}
                        </li>
                      ))
                      )}
                    </ul>
                  </div>

                  {isExpanded && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={12} style={{ color: "#2563EB" }} />
                        <span className="text-xs" style={{ fontWeight: 600, color: "#2563EB", letterSpacing: "0.05em" }}>
                          HOME LEARNING ACTIVITIES
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                          {(analysis.activities || []).length}
                        </span>
                      </div>
                      {(analysis.activities || []).length === 0 ? (
                        <p className="text-xs" style={{ color: "#94A3B8" }}>No activities generated for this report.</p>
                      ) : (
                        <div className="space-y-2">
                          {(analysis.activities || []).map((act: any) => (
                            <div key={act.id} className="rounded-xl border p-3" style={{ backgroundColor: "#FAFAFA", borderColor: "#E2E8F0" }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <p className="text-xs" style={{ fontWeight: 600, color: "#1E293B" }}>{act.title}</p>
                                    {act.type && (
                                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>{act.type}</span>
                                    )}
                                    {act.duration && (
                                      <span className="text-xs" style={{ color: "#94A3B8" }}>{act.duration}</span>
                                    )}
                                    {act.difficulty && (
                                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>{act.difficulty}</span>
                                    )}
                                  </div>
                                  {act.description && (
                                    <p className="text-xs" style={{ color: "#64748B", lineHeight: "1.5" }}>{act.description}</p>
                                  )}
                                </div>
                                {editingActivityId !== act.id && (
                                  <button
                                    onClick={() => setEditingActivityId(act.id)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs hover:bg-blue-50 transition-colors shrink-0"
                                    style={{ borderColor: "#BFDBFE", color: "#2563EB" }}
                                  >
                                    <Edit3 size={11} /> Edit
                                  </button>
                                )}
                              </div>
                              {editingActivityId === act.id && (
                                <ActivityEditForm
                                  activity={act}
                                  onSave={(updated) => handleActivitySave(analysis.id, updated)}
                                  onCancel={() => setEditingActivityId(null)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isExpanded && showTrans && (
                    <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Globe size={12} style={{ color: "#10B981" }} />
                        <span className="text-xs" style={{ fontWeight: 600, color: "#10B981" }}>TRANSLATION PREVIEW (Simplified Chinese)</span>
                      </div>
                      <p className="text-xs" style={{ color: "#065F46" }}>
                        根据本周的评估，{analysis.student.split(" ")[0]}在{analysis.subject}方面需要额外支持。建议家长每天陪同孩子练习15分钟。
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => toggleExpand(analysis.id)}
                    className="flex items-center gap-1.5 text-xs mt-1 hover:underline"
                    style={{ color: "#64748B" }}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? "Show less" : "Show practice preview & more"}
                  </button>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 border-t border-black/5 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => toggleTranslation(analysis.id)}
                    className="flex items-center gap-1.5 text-xs hover:underline"
                    style={{ color: "#64748B" }}
                  >
                    <Globe size={13} />
                    {showTrans ? "Hide translation" : "Preview translation"}
                  </button>

                  {isPending ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingReport(analysis)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm hover:bg-blue-50 transition-colors"
                        style={{ borderColor: "#BFDBFE", color: "#2563EB", fontWeight: 500 }}
                      >
                        <Edit3 size={14} />
                        Edit &amp; Revise
                      </button>
                      <button
                        onClick={() => handleApprove(analysis.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#10B981", fontWeight: 600 }}
                      >
                        <CheckCircle size={14} />
                        Approve &amp; Send
                      </button>
                    </div>
                  ) : isAutoApproved ? (
                    <button
                      onClick={() => setEditingReport(analysis)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs hover:bg-blue-50 transition-colors"
                      style={{ borderColor: "#BFDBFE", color: "#2563EB" }}
                    >
                      <Edit3 size={12} />
                      Edit &amp; Revise
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}`, fontWeight: 500 }}>
                        {status.label}
                      </span>
                      <button
                        onClick={() => setAnalyses(prev => prev.map(a => a.id === analysis.id ? { ...a, status: "pending" } : a))}
                        className="text-xs px-3 py-1.5 rounded-full hover:bg-white/70 transition-colors"
                        style={{ color: "#64748B", border: "1px solid #E2E8F0" }}
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F1F5F9" }}>
              <BrainCircuit size={28} style={{ color: "#94A3B8" }} />
            </div>
            <p style={{ fontWeight: 600, color: "#1E293B" }}>No analyses found</p>
            <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: "#94A3B8" }}>
              {analyses.length === 0
                ? "No AI reports in the database yet. Run your SQL seed (e.g. create_data.sql) or generate a report for a student from the API."
                : "Try the “All” filter, or another tab — counts above show how many are in each category."}
            </p>
          </div>
        )}
      </div>
      {editingReport && (
        <RevisionModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSave={handleRevisionSave}
        />
      )}
    </>
  );
}
