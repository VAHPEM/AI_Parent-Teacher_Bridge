import { useState, useEffect } from "react";
import { BookOpen, Calculator, FlaskConical, GraduationCap, Sparkles, CheckCircle, Star, Clock, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useParentChild } from "../../context/ParentChildContext";
import { api } from "../../lib/api";

const SUBJECT_COLORS: Record<string, { color: string; bg: string }> = {
  "English":     { color: "#2563EB", bg: "#EFF6FF" },
  "Mathematics": { color: "#10B981", bg: "#ECFDF5" },
  "Science":     { color: "#8B5CF6", bg: "#EDE9FE" },
  "HASS":        { color: "#F59E0B", bg: "#FEF3C7" },
  "Health & PE": { color: "#EF4444", bg: "#FEE2E2" },
};

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  "English":     <BookOpen size={18} />,
  "Mathematics": <Calculator size={18} />,
  "Science":     <FlaskConical size={18} />,
  "HASS":        <GraduationCap size={18} />,
  "Health & PE": <GraduationCap size={18} />,
};

const confidenceConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  high:   { label: "Approved by Teacher", color: "#10B981", bg: "#D1FAE5", icon: <CheckCircle size={12} /> },
  medium: { label: "AI Suggested",        color: "#3B82F6", bg: "#DBEAFE", icon: <Sparkles size={12} /> },
};

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  Easy:   { color: "#10B981", bg: "#D1FAE5" },
  Medium: { color: "#F59E0B", bg: "#FEF3C7" },
  Hard:   { color: "#EF4444", bg: "#FEE2E2" },
};

interface Activity {
  id: number;
  subject: string;
  title: string;
  type: string;
  duration: string;
  difficulty: string;
  description: string;
  steps: string[];
  questions: string[];
  confidence: string;
  completed: boolean;
  curriculumRef: string;
}

export function ParentActivities() {
  const { activeChild: student } = useParentChild();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [filterSubject, setFilterSubject] = useState("All");

  useEffect(() => {
    if (!student) return;
    api.get<Activity[]>(`/parent/activities/${student.id}`).then(data => {
      setActivities(data);
      setCompleted(new Set(data.filter(a => a.completed).map(a => a.id)));
    });
  }, [student?.id]);

  const toggleComplete = (id: number) => {
    api.put(`/parent/activities/${id}/complete`).catch(() => {});
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const subjects = ["All", "English", "Mathematics", "Science"];
  const filtered = filterSubject === "All" ? activities : activities.filter(a => a.subject === filterSubject);
  const completedCount = activities.filter(a => completed.has(a.id)).length;
  const firstName = student?.firstName ?? "your child";

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>Learning Activities for Home</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>AI-generated activities personalised for {firstName} · Approved by Ms. Thompson</p>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star size={16} style={{ color: "#F59E0B" }} />
              <span style={{ fontWeight: 600, color: "#1E293B" }}>This Week's Progress</span>
            </div>
            <span className="text-sm" style={{ color: "#64748B" }}>{completedCount} of {activities.length} activities completed</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: activities.length ? `${(completedCount / activities.length) * 100}%` : "0%", backgroundColor: "#10B981" }} />
          </div>
          {activities.length > 0 && completedCount === activities.length && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "#065F46" }}>
              <CheckCircle size={15} style={{ color: "#10B981" }} />
              <span style={{ fontWeight: 500 }}>All activities completed this week! Excellent work, {firstName}! 🎉</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => setFilterSubject(sub)}
              className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: filterSubject === sub ? "#2563EB" : "white",
                color: filterSubject === sub ? "white" : "#64748B",
                border: filterSubject === sub ? "none" : "1px solid #E2E8F0",
                fontWeight: filterSubject === sub ? 600 : 400
              }}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Activity cards */}
        <div className="space-y-4">
          {filtered.map(activity => {
            const isCompleted = completed.has(activity.id);
            const isExpanded = expanded.has(activity.id);
            const conf = confidenceConfig[activity.confidence] ?? confidenceConfig.medium;
            const diff = difficultyConfig[activity.difficulty] ?? { color: "#94A3B8", bg: "#F1F5F9" };
            const sc = SUBJECT_COLORS[activity.subject] ?? { color: "#64748B", bg: "#F1F5F9" };
            const icon = SUBJECT_ICONS[activity.subject] ?? <BookOpen size={18} />;
            const questions: string[] = activity.questions ?? [];

            return (
              <div key={activity.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                style={{ opacity: isCompleted ? 0.8 : 1 }}>
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: sc.bg }}>
                      <span style={{ color: sc.color }}>{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 500 }}>
                              {activity.subject}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg, color: diff.color, fontWeight: 500 }}>
                              {activity.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: conf.bg, color: conf.color, fontWeight: 500 }}>
                              {conf.icon}{conf.label}
                            </span>
                            {isCompleted && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 500 }}>
                                <CheckCircle size={11} />Done!
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>{activity.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#94A3B8" }}>
                              <Clock size={11} />{activity.duration}
                            </span>
                            <span className="text-xs" style={{ color: "#94A3B8" }}>{activity.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleComplete(activity.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-80"
                            style={{
                              backgroundColor: isCompleted ? "#D1FAE5" : "#EFF6FF",
                              color: isCompleted ? "#065F46" : "#2563EB",
                              fontWeight: 600,
                              border: `1px solid ${isCompleted ? "#A7F3D0" : "#BFDBFE"}`
                            }}
                          >
                            {isCompleted ? <><CheckCircle size={13} />Done</> : <><Play size={13} />Mark Done</>}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm mt-2" style={{ color: "#64748B", lineHeight: "1.6" }}>{activity.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(activity.id)}
                    className="flex items-center gap-1.5 text-xs mt-3 hover:underline"
                    style={{ color: sc.color, fontWeight: 500 }}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? "Hide steps" : "Show steps & questions"}
                  </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#64748B" }}>HOW TO DO IT</p>
                        <ol className="space-y-2">
                          {(activity.steps ?? []).map((step: string, i: number) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: "#374151" }}>
                              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white mt-0.5" style={{ backgroundColor: sc.color, fontSize: "10px", fontWeight: 700 }}>
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {questions.length > 0 && (
                        <div>
                          <p className="text-xs mb-2" style={{ fontWeight: 600, color: "#64748B" }}>DISCUSSION QUESTIONS</p>
                          <div className="space-y-2">
                            {questions.map((q: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", color: "#374151" }}>
                                <span style={{ color: sc.color, fontWeight: 700 }}>Q{i + 1}.</span>
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                      <Sparkles size={11} style={{ color: sc.color }} />
                      <span>Australian Curriculum: {activity.curriculumRef}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
