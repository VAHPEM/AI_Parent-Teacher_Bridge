import { useState, useEffect } from "react";
import {
  CheckCircle, Edit3, Clock, Globe, BrainCircuit,
  BookOpen, Home, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Info, Zap
} from "lucide-react";
import { api } from "../../lib/api";
import { DEMO_TEACHER_ID } from "../../lib/config";
import { RevisionModal } from "../../components/teacher/RevisionModal";
import { ActivityEditForm } from "../../components/teacher/ActivityEditForm";

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Needs Review", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
};

const confidenceConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  high:   { color: "#10B981", bg: "#D1FAE5", icon: <CheckCircle size={12} />, label: "High Confidence" },
  medium: { color: "#3B82F6", bg: "#DBEAFE", icon: <Info size={12} />,        label: "Medium Confidence" },
  low:    { color: "#F59E0B", bg: "#FEF3C7", icon: <AlertTriangle size={12} />, label: "Low Confidence" },
};

export function PendingApprovals() {
  const [items, setItems] = useState<any[]>([]);
  const [approving, setApproving] = useState<number | null>(null);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showTranslation, setShowTranslation] = useState<Set<number>>(new Set());
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);

  useEffect(() => {
    api.get<any[]>(`/teacher/ai-analysis?teacher_id=${DEMO_TEACHER_ID}`).then((data) => {
      setItems(data.filter((a) => a.status === "pending"));
    });
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
    setApproving(id);
    api.put(`/teacher/ai-analysis/${id}/approve`).then(() => {
      setItems(prev => prev.filter(a => a.id !== id));
      setApproving(null);
    });
  };

  const handleRevisionSave = () => {
    if (editingReport) {
      setItems(prev => prev.filter(a => a.id !== editingReport.id));
    }
    setEditingReport(null);
  };

  const handleActivitySave = (reportId: number, updatedActivity: any) => {
    setItems(prev => prev.map(a =>
      a.id === reportId
        ? { ...a, activities: a.activities.map((act: any) => act.id === updatedActivity.id ? updatedActivity : act) }
        : a
    ));
    setEditingActivityId(null);
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Needs Your Review</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
              All AI-generated reports — review and approve before sending to parents
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
              <Clock size={14} style={{ color: "#F59E0B" }} />
              <span className="text-sm" style={{ color: "#92400E", fontWeight: 600 }}>{items.length} awaiting review</span>
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="mb-6 p-4 rounded-2xl flex items-start gap-3" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <p className="text-sm" style={{ color: "#92400E", lineHeight: "1.6" }}>
            All AI-generated reports require your review before they're sent to parents.
            Check the summary, recommendations and activities, then approve or request a revision.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#D1FAE5" }}>
              <CheckCircle size={28} style={{ color: "#10B981" }} />
            </div>
            <p style={{ fontWeight: 700, color: "#1E293B", fontSize: "1.1rem" }}>All caught up!</p>
            <p className="text-sm mt-2" style={{ color: "#64748B" }}>No responses awaiting review. Great work!</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {items.map(item => {
              const status = statusConfig.pending;
              const confidence = confidenceConfig[item.confidence] ?? confidenceConfig.low;
              const isExpanded = expandedCards.has(item.id);
              const showTrans = showTranslation.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all flex flex-col ${approving === item.id ? "opacity-50 scale-95" : ""}`}
                  style={{ borderColor: status.border, backgroundColor: status.bg }}
                >
                  {/* Card header */}
                  <div className="px-5 py-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                        style={{ backgroundColor: item.avatarColor, fontWeight: 600 }}>
                        {item.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{item.student}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 500 }}>
                            {item.year}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
                            {item.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}`, fontWeight: 500 }}>
                            {status.label}
                          </span>
                          <span className="text-xs" style={{ color: "#94A3B8" }}>
                            <Clock size={11} className="inline mr-1" />{item.timestamp}
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
                    {item.summary && (
                      <p className="text-sm mb-3" style={{ color: "#334155", lineHeight: 1.65 }}>{item.summary}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(item.weakAreas || []).map((area: string) => (
                        <span key={area} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#D97706", fontWeight: 500 }}>
                          ⚠ {area}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                      <BookOpen size={13} className="shrink-0 mt-0.5" style={{ color: "#64748B" }} />
                      <p className="text-xs" style={{ color: "#64748B" }}>
                        <span style={{ fontWeight: 600, color: "#1E293B" }}>Australian Curriculum:</span> {item.curriculumRef}
                      </p>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Home size={13} style={{ color: "#10B981" }} />
                        <span className="text-xs" style={{ fontWeight: 600, color: "#10B981", letterSpacing: "0.05em" }}>RECOMMENDATIONS FOR PARENTS</span>
                      </div>
                      <ul className="space-y-1">
                        {(item.recommendations || []).length === 0 ? (
                          <li className="text-xs" style={{ color: "#94A3B8" }}>No bullet recommendations; see summary above.</li>
                        ) : (
                          (item.recommendations || []).slice(0, isExpanded ? undefined : 2).map((rec: string, i: number) => (
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
                            {(item.activities || []).length}
                          </span>
                        </div>
                        {(item.activities || []).length === 0 ? (
                          <p className="text-xs" style={{ color: "#94A3B8" }}>No activities generated for this report.</p>
                        ) : (
                          <div className="space-y-2">
                            {(item.activities || []).map((act: any) => (
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
                                    onSave={(updated) => handleActivitySave(item.id, updated)}
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
                          根据本周的评估，{item.student.split(" ")[0]}在{item.subject}方面需要额外支持。建议家长每天陪同孩子练习15分钟。
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center gap-1.5 text-xs mt-1 hover:underline"
                      style={{ color: "#64748B" }}
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isExpanded ? "Show less" : "Show activities & more"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 border-t border-black/5 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => toggleTranslation(item.id)}
                      className="flex items-center gap-1.5 text-xs hover:underline"
                      style={{ color: "#64748B" }}
                    >
                      <Globe size={13} />
                      {showTrans ? "Hide translation" : "Preview translation"}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingReport(item)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm hover:bg-blue-50 transition-colors"
                        style={{ borderColor: "#BFDBFE", color: "#2563EB", fontWeight: 500 }}
                      >
                        <Edit3 size={14} />
                        Edit &amp; Revise
                      </button>
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#10B981", fontWeight: 600 }}
                      >
                        <Zap size={14} />
                        Approve &amp; Send
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
