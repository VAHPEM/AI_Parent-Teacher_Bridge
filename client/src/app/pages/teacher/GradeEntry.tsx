import { useState, useEffect } from "react";
import { RefreshCcw, Save, Send, Info, CheckCircle, Search, X, ClipboardList } from "lucide-react";
import { api } from "../../lib/api";
import { DEMO_TEACHER_ID } from "../../lib/config";

const subjects = ["English", "Mathematics", "Science", "HASS", "Health & PE"];
const weeks = ["Week 6", "Week 7", "Week 8"];
const participations = ["Excellent", "Good", "Satisfactory", "Needs Improvement"];
const concernTags = [
  "Reading Comprehension", "Written Expression", "Numeracy", "Problem Solving",
  "Verbal Communication", "Time Management", "Focus & Attention"
];

const gradeColors: Record<string, { bg: string; color: string }> = {
  A:   { bg: "#D1FAE5", color: "#065F46" },
  "B+":{ bg: "#DBEAFE", color: "#1E40AF" },
  B:   { bg: "#DBEAFE", color: "#1E40AF" },
  "C+":{ bg: "#FEF3C7", color: "#92400E" },
  C:   { bg: "#FEF3C7", color: "#92400E" },
  D:   { bg: "#FEE2E2", color: "#991B1B" },
  E:   { bg: "#FEE2E2", color: "#7F1D1D" },
};

function gradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C+";
  if (score >= 50) return "C";
  if (score >= 40) return "D";
  return "E";
}

interface Assessment {
  id: number;
  assessment_name: string;
  assessment_type: string | null;
  max_score: number | null;
  week_number: number | null;
  term: string | null;
}

interface StudentEntry {
  id: number;
  student_id: number;
  name: string;
  initials: string;
  score: number;
  participation: string;
  comment: string;
  concerns: string[];
}

export function GradeEntry() {
  const [activeSubject, setActiveSubject] = useState("English");
  const [selectedClass, setSelectedClass] = useState("Year 5A");
  const [selectedWeek, setSelectedWeek] = useState("Week 8");
  const [autoSend, setAutoSend] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [classesList, setClassesList] = useState<{ id: number; name: string }[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [entries, setEntries] = useState<StudentEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ id: number; name: string }[]>(`/teacher/classes?teacher_id=${DEMO_TEACHER_ID}`).then(data => {
      setClassesList(data);
      if (data.length > 0) setSelectedClass(data[0].name);
    });
  }, []);

  const classId = classesList.find(c => c.name === selectedClass)?.id ?? null;

  // Fetch assessments when class/week/subject changes
  useEffect(() => {
    if (classId === null) return;
    const weekNum = parseInt(selectedWeek.replace(/\D/g, "")) || 8;
    api.get<Assessment[]>(
      `/teacher/assessments?class_id=${classId}&week=${weekNum}&subject=${encodeURIComponent(activeSubject)}&term=Term%202`
    ).then(data => {
      setAssessments(data);
      setSelectedAssessmentId(data.length > 0 ? data[0].id : null);
    });
    setEntries([]);
  }, [classId, selectedWeek, activeSubject]);

  // Fetch student entries when assessment or class changes
  useEffect(() => {
    if (selectedAssessmentId === null || classId === null) {
      setEntries([]);
      return;
    }
    const weekNum = parseInt(selectedWeek.replace(/\D/g, "")) || 8;
    api.get<any[]>(
      `/teacher/grade-entry?class_id=${classId}&assessment_id=${selectedAssessmentId}&week=${weekNum}&subject=${encodeURIComponent(activeSubject)}&term=Term%202`
    ).then(data => {
      setEntries(data.map((d: any) => ({
        ...d,
        score:         d.score ?? 0,
        participation: d.participation || "Satisfactory",
        comment:       d.comment || "",
        concerns:      d.concerns || [],
      })));
    });
  }, [selectedAssessmentId, classId, selectedWeek, activeSubject]);

  const updateEntry = (id: number, field: keyof StudentEntry, value: string | number | string[]) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const toggleConcern = (entryId: number, concern: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e;
      const hasIt = e.concerns.includes(concern);
      return { ...e, concerns: hasIt ? e.concerns.filter(c => c !== concern) : [...e.concerns, concern] };
    }));
  };

  const buildPayload = (weekNum: number) => ({
    class_id:      classId,
    assessment_id: selectedAssessmentId!,
    week:          weekNum,
    term:          "Term 2",
    subject:       activeSubject,
    entries,
  });

  const handleSaveDraft = () => {
    if (!selectedAssessmentId) return;
    const weekNum = parseInt(selectedWeek.replace(/\D/g, "")) || 8;
    api.post("/teacher/grade-entry/draft", buildPayload(weekNum)).then(() => {
      setSavedDraft(true);
      setTimeout(() => setSavedDraft(false), 3000);
    });
  };

  const handleSubmit = () => {
    if (!selectedAssessmentId) return;
    const weekNum = parseInt(selectedWeek.replace(/\D/g, "")) || 8;
    api.post(`/teacher/grade-entry/submit?teacher_id=${DEMO_TEACHER_ID}`, buildPayload(weekNum)).then(() => {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    });
  };

  const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId) ?? null;
  const maxScore = selectedAssessment?.max_score ?? 100;
  const filteredEntries = entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page title */}
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Enter Assessment Grades & Comments</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Grade entry per assessment — weekly record is auto-calculated via weighted average</p>
        </div>

        {/* Top controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm" style={{ color: "#64748B", fontWeight: 500 }}>Class:</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                style={{ color: "#1E293B", backgroundColor: "white" }}
              >
                {classesList.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm" style={{ color: "#64748B", fontWeight: 500 }}>Week:</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                style={{ color: "#1E293B", backgroundColor: "white" }}
              >
                {weeks.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 transition-colors" style={{ color: "#64748B" }}>
            <RefreshCcw size={15} />
            Sync from Canvas
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
              Synced 2h ago
            </span>
          </button>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className="px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeSubject === subject ? "#2563EB" : "white",
                color:            activeSubject === subject ? "white" : "#64748B",
                border:           activeSubject === subject ? "none" : "1px solid #E2E8F0",
                fontWeight:       activeSubject === subject ? 600 : 400,
              }}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* Assessment selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} style={{ color: "#2563EB" }} />
              <span className="text-sm font-medium" style={{ color: "#1E293B" }}>Assessment:</span>
            </div>

            {assessments.length === 0 ? (
              <span className="text-sm" style={{ color: "#94A3B8" }}>
                No assessments for {activeSubject} — {selectedWeek}. Ask admin to create assessments.
              </span>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {assessments.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAssessmentId(a.id)}
                    className="px-3 py-1.5 rounded-xl text-sm border transition-all"
                    style={{
                      backgroundColor: selectedAssessmentId === a.id ? "#EFF6FF" : "white",
                      color:            selectedAssessmentId === a.id ? "#2563EB" : "#64748B",
                      borderColor:      selectedAssessmentId === a.id ? "#BFDBFE" : "#E2E8F0",
                      fontWeight:       selectedAssessmentId === a.id ? 600 : 400,
                    }}
                  >
                    {a.assessment_name}
                    {a.assessment_type && (
                      <span className="ml-1.5 text-xs opacity-60">({a.assessment_type})</span>
                    )}
                    {a.max_score && (
                      <span className="ml-1.5 text-xs opacity-60">/{a.max_score}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedAssessment && (
              <div className="ml-auto text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>
                Scores out of <strong>{maxScore}</strong> · Weekly record auto-calculated (weighted avg)
              </div>
            )}
          </div>
        </div>

        {/* Student table */}
        {selectedAssessmentId !== null && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 style={{ fontWeight: 600, color: "#1E293B" }}>
                  {selectedAssessment?.assessment_name} — {activeSubject} — {selectedClass} — {selectedWeek}
                </h2>
                <p className="text-sm" style={{ color: "#64748B" }}>
                  {filteredEntries.length} of {entries.length} students
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search student..."
                    className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48"
                    style={{ color: "#1E293B", backgroundColor: "#F8FAFC" }}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <X size={13} style={{ color: "#94A3B8" }} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                  <Info size={13} />
                  AI analysis generated after submission
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: "1100px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC" }}>
                    {["Student", "Score (0–100)", "Grade", "Participation", "Assessment Comment", "Learning Concerns"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs" style={{ color: "#94A3B8", fontWeight: 600, letterSpacing: "0.05em" }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors align-top">
                      {/* Student */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                            style={{ backgroundColor: "#2563EB", fontWeight: 600 }}>
                            {entry.initials}
                          </div>
                          <span className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>{entry.name}</span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={entry.score}
                          onChange={e => updateEntry(entry.id, "score", Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-16 text-sm px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
                          style={{ color: "#1E293B" }}
                        />
                      </td>

                      {/* Grade — auto-calculated */}
                      <td className="px-4 py-4">
                        {(() => {
                          const g = gradeFromScore(entry.score);
                          const c = gradeColors[g] || { bg: "#F1F5F9", color: "#64748B" };
                          return (
                            <span className="px-2.5 py-1 rounded-lg text-sm font-semibold"
                              style={{ backgroundColor: c.bg, color: c.color }}>
                              {g}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Participation (per-week) */}
                      <td className="px-4 py-4">
                        <select
                          value={entry.participation}
                          onChange={e => updateEntry(entry.id, "participation", e.target.value)}
                          className="text-sm px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer max-w-36"
                          style={{ color: "#1E293B", backgroundColor: "white" }}
                        >
                          {participations.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </td>

                      {/* Assessment Comment */}
                      <td className="px-4 py-4">
                        <textarea
                          value={entry.comment}
                          onChange={e => updateEntry(entry.id, "comment", e.target.value)}
                          rows={2}
                          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                          style={{ color: "#1E293B", backgroundColor: "#F8FAFC", minWidth: "220px" }}
                          placeholder="Comment for this assessment..."
                        />
                      </td>

                      {/* Concerns (per-week) */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5" style={{ maxWidth: "240px" }}>
                          {concernTags.map(tag => {
                            const selected = entry.concerns.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleConcern(entry.id, tag)}
                                className="text-xs px-2 py-0.5 rounded-full border transition-all"
                                style={{
                                  backgroundColor: selected ? "#FEE2E2" : "#F8FAFC",
                                  color:           selected ? "#991B1B" : "#94A3B8",
                                  borderColor:     selected ? "#FECACA" : "#E2E8F0",
                                  fontWeight:      selected ? 500 : 400,
                                }}
                              >
                                {selected && <span className="mr-0.5">×</span>}
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
              style={{ backgroundColor: autoSend ? "#2563EB" : "#CBD5E1" }}
              onClick={() => setAutoSend(!autoSend)}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: autoSend ? "22px" : "4px" }}
              />
            </div>
            <span className="text-sm" style={{ color: "#64748B" }}>Auto-send to parents after AI approval</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={!selectedAssessmentId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "#64748B", fontWeight: 500 }}
            >
              <Save size={15} />
              {savedDraft ? "Draft Saved!" : "Save Draft"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedAssessmentId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
            >
              <Send size={15} />
              {submitted ? "Submitted for AI Analysis! ✓" : "Submit for AI Analysis"}
            </button>
          </div>
        </div>

        {submitted && (
          <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "#D1FAE5", border: "1px solid #A7F3D0" }}>
            <CheckCircle size={18} style={{ color: "#10B981" }} />
            <div>
              <p className="text-sm" style={{ color: "#065F46", fontWeight: 600 }}>Submitted for AI Analysis!</p>
              <p className="text-xs" style={{ color: "#047857" }}>
                Weekly record updated via weighted average. AI is now generating personalised recommendations.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
