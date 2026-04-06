import { useState } from "react";
import { X, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

interface ReportData {
  id: number;
  student: string;
  subject?: string;
  summary?: string;
  recommendations: string[];
  weakAreas: string[];
  curriculumRef?: string;
  teacher_notes?: string;
}

interface Props {
  report: ReportData;
  onClose: () => void;
  onSave: (updated: any) => void;
}

export function RevisionModal({ report, onClose, onSave }: Props) {
  const [summary, setSummary] = useState(report.summary ?? "");
  const [recommendations, setRecommendations] = useState<string[]>(
    report.recommendations.length > 0 ? [...report.recommendations] : [""]
  );
  const [supportAreas, setSupportAreas] = useState<string[]>(
    report.weakAreas.length > 0 ? [...report.weakAreas] : [""]
  );
  const [curriculumRef, setCurriculumRef] = useState(report.curriculumRef ?? "");
  const [teacherNotes, setTeacherNotes] = useState(report.teacher_notes ?? "");
  const [saving, setSaving] = useState(false);

  const updateListItem = (
    list: string[],
    setList: (v: string[]) => void,
    index: number,
    value: string
  ) => {
    const next = [...list];
    next[index] = value;
    setList(next);
  };

  const addListItem = (list: string[], setList: (v: string[]) => void) => {
    setList([...list, ""]);
  };

  const removeListItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    if (list.length === 1) return;
    setList(list.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put<any>(`/teacher/ai-analysis/${report.id}/revise-content`, {
        summary: summary.trim() || null,
        recommendations: recommendations.filter(r => r.trim()),
        support_areas: supportAreas.filter(a => a.trim()),
        curriculum_ref: curriculumRef.trim() || null,
        teacher_notes: teacherNotes.trim() || null,
      });
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 style={{ fontWeight: 700, color: "#1E293B", fontSize: "1rem" }}>
              Edit AI Report
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              {report.student}{report.subject ? ` · ${report.subject}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <X size={16} style={{ color: "#64748B" }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Summary */}
          <div>
            <label className="block text-xs mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
              AI Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ color: "#1E293B", lineHeight: "1.6" }}
              placeholder="AI-generated summary of the student's performance..."
            />
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-xs mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
              Recommendations for Parents
            </label>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={rec}
                    onChange={(e) => updateListItem(recommendations, setRecommendations, i, e.target.value)}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ color: "#1E293B" }}
                    placeholder={`Recommendation ${i + 1}`}
                  />
                  <button
                    onClick={() => removeListItem(recommendations, setRecommendations, i)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                    disabled={recommendations.length === 1}
                  >
                    <Trash2 size={14} style={{ color: recommendations.length === 1 ? "#CBD5E1" : "#EF4444" }} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addListItem(recommendations, setRecommendations)}
              className="flex items-center gap-1.5 mt-2 text-xs hover:underline"
              style={{ color: "#2563EB" }}
            >
              <Plus size={13} /> Add recommendation
            </button>
          </div>

          {/* Support Areas / Weak Areas */}
          <div>
            <label className="block text-xs mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
              Support Areas (Weak Areas)
            </label>
            <div className="space-y-2">
              {supportAreas.map((area, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={area}
                    onChange={(e) => updateListItem(supportAreas, setSupportAreas, i, e.target.value)}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ color: "#1E293B" }}
                    placeholder={`Area ${i + 1}`}
                  />
                  <button
                    onClick={() => removeListItem(supportAreas, setSupportAreas, i)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                    disabled={supportAreas.length === 1}
                  >
                    <Trash2 size={14} style={{ color: supportAreas.length === 1 ? "#CBD5E1" : "#EF4444" }} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addListItem(supportAreas, setSupportAreas)}
              className="flex items-center gap-1.5 mt-2 text-xs hover:underline"
              style={{ color: "#2563EB" }}
            >
              <Plus size={13} /> Add area
            </button>
          </div>

          {/* Curriculum Ref */}
          <div>
            <label className="block text-xs mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
              Curriculum Reference
            </label>
            <input
              value={curriculumRef}
              onChange={(e) => setCurriculumRef(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ color: "#1E293B" }}
              placeholder="e.g. ACMNA123, ACELY456"
            />
          </div>

          {/* Teacher Notes */}
          <div>
            <label className="block text-xs mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
              Teacher Notes{" "}
              <span style={{ color: "#94A3B8", fontWeight: 400 }}>(internal — not sent to parents)</span>
            </label>
            <textarea
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ color: "#1E293B" }}
              placeholder="Optional notes for your own reference..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            style={{ color: "#64748B", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#10B981", fontWeight: 600 }}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            {saving ? "Saving..." : "Save & Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
