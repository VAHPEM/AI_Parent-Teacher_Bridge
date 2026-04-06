import { useState, useEffect } from "react";
import { CheckCircle, Edit3, Clock, AlertTriangle, Sparkles, Info } from "lucide-react";
import { api } from "../../lib/api";
import { RevisionModal } from "../../components/teacher/RevisionModal";

export function PendingApprovals() {
  const [items, setItems] = useState<any[]>([]);
  const [approving, setApproving] = useState<number | null>(null);
  const [editingReport, setEditingReport] = useState<any | null>(null);

  useEffect(() => {
    // Fetch specifically the low confidence ones or all and filter locally
    api.get<any[]>("/teacher/ai-analysis?confidence=low").then((data) => {
      setItems(data.filter(a => a.status === "pending"));
    });
  }, []);

  const handleApprove = (id: number) => {
    setApproving(id);
    api.put(`/teacher/ai-analysis/${id}/approve`).then(() => {
      setItems(prev => prev.filter(a => a.id !== id));
      setApproving(null);
    });
  };

  const handleRequestRevision = (id: number) => {
    api.put(`/teacher/ai-analysis/${id}/revise`).then(() => {
      setItems(prev => prev.filter(a => a.id !== id));
    });
  };

  const handleRevisionSave = () => {
    // After revising + approving, remove from pending list
    if (editingReport) {
      setItems(prev => prev.filter(a => a.id !== editingReport.id));
    }
    setEditingReport(null);
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Needs Your Review</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
              AI responses with <strong>low confidence</strong> — review and approve before sending to parents
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <AlertTriangle size={14} style={{ color: "#F59E0B" }} />
            <span className="text-sm" style={{ color: "#92400E", fontWeight: 600 }}>{items.length} awaiting review</span>
          </div>
        </div>

        {/* Explanation banner */}
        <div className="mb-6 p-4 rounded-2xl flex items-start gap-3" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <p className="text-sm" style={{ color: "#92400E", lineHeight: "1.6" }}>
            These responses have <strong>low confidence</strong> — the AI didn't have enough data to make an accurate recommendation. You need to manually approve before they're sent to parents. High &amp; medium confidence responses are auto-approved — view them in <strong>AI Analysis Results</strong>.
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
          <div className="space-y-4">
            {items.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border-2 shadow-sm p-5 transition-all ${approving === item.id ? "opacity-50 scale-95" : ""}`}
                style={{ borderColor: "#FDE68A" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: item.avatarColor, fontWeight: 700 }}>
                      {item.avatar}
                    </div>
                    <div>
                      <p className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>{item.student}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>{item.year}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>{item.subject}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: "#FEF3C7", color: "#D97706", fontWeight: 500 }}>
                          <AlertTriangle size={10} />Low Confidence
                        </span>
                        <span className="text-xs" style={{ color: "#94A3B8" }}><Clock size={11} className="inline mr-1" />{item.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all"
                      style={{ backgroundColor: "#10B981", fontWeight: 600 }}
                    >
                      <CheckCircle size={14} />
                      Approve &amp; Send
                    </button>
                    <button
                      onClick={() => setEditingReport(item)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border hover:bg-blue-50 transition-colors"
                      style={{ borderColor: "#BFDBFE", color: "#2563EB", fontWeight: 500 }}
                    >
                      <Edit3 size={14} />
                      Edit &amp; Revise
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#FEF3C7" }}>
                    <p className="text-xs mb-1" style={{ fontWeight: 600, color: "#92400E" }}>Weak Areas Identified</p>
                    <div className="flex flex-wrap gap-1">
                      {item.weakAreas.slice(0, 3).map((a: string) => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "white", color: "#92400E" }}>{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#EFF6FF" }}>
                    <p className="text-xs mb-1" style={{ fontWeight: 600, color: "#1E40AF" }}>
                      <Sparkles size={11} className="inline mr-1" />AI Recommendation Preview
                    </p>
                    <p className="text-xs" style={{ color: "#1E40AF" }}>{item.recommendations[0]}</p>
                  </div>
                </div>
              </div>
            ))}
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
