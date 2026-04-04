import { useState, useEffect } from "react";
import {
  AlertTriangle, Clock, Send, Edit3, Phone, MessageSquare,
  CheckCircle, Flag, ChevronDown, User, Shield, BookOpen,
  Lightbulb, Bot, RotateCcw, X, Bell
} from "lucide-react";
import { api } from "../../lib/api";

type FilterType = "urgent" | "pending" | "answered" | "all";

const priorityConfig: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string;
  flagColor: string; flagBg: string;
}> = {
  red: {
    label: "Wellbeing / Safety",
    color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444",
    flagColor: "#EF4444", flagBg: "#FEE2E2"
  },
  orange: {
    label: "Academic Concern",
    color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B",
    flagColor: "#D97706", flagBg: "#FEF3C7"
  },
  yellow: {
    label: "General Clarification",
    color: "#D97706", bg: "#FEFCE8", border: "#FEF08A", dot: "#FBBF24",
    flagColor: "#92400E", flagBg: "#FEF9C3"
  },
};

const responseTemplates = [
  "Thank you for your message. I'll look into this and get back to you shortly.",
  "I appreciate you sharing this concern. Let's schedule a time to discuss this in detail.",
  "Thank you for reaching out. Your child is doing well and I'm happy to provide more information.",
  "I take all concerns very seriously and will investigate this matter promptly.",
  "This is a great question! I'll be happy to explain in more detail.",
];

interface QuestionState {
  id: number;
  status: "open" | "answered";
  editedResponse: string;
  showEditor: boolean;
  showTemplates: boolean;
  callScheduled: boolean;
}

export function FlaggedQuestions() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});

  useEffect(() => {
    api.get<any[]>("/teacher/flagged-questions").then((data) => {
      setQuestions(data);
      setQuestionStates(
        Object.fromEntries(
          data.map((q: any) => [q.id, {
            id: q.id,
            status: "open" as const,
            editedResponse: q.aiSuggestedResponse,
            showEditor: false,
            showTemplates: false,
            callScheduled: false,
          }])
        )
      );
    });
  }, []);

  const updateState = (id: number, updates: Partial<QuestionState>) => {
    setQuestionStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const handleSendAI = (id: number) => {
    const q = questions.find(q => q.id === id);
    if (!q) return;
    api.post(`/teacher/flagged-questions/${id}/respond`, { response: q.aiSuggestedResponse, method: "ai" }).then(() => {
      updateState(id, { status: "answered", showEditor: false });
    });
  };

  const handleSendEdited = (id: number) => {
    const state = questionStates[id];
    api.post(`/teacher/flagged-questions/${id}/respond`, { response: state.editedResponse, method: "edited_ai" }).then(() => {
      updateState(id, { status: "answered", showEditor: false });
    });
  };

  const handleScheduleCall = (id: number) => {
    api.post(`/teacher/flagged-questions/${id}/schedule-call`, {}).then(() => {
      updateState(id, { callScheduled: true });
      setTimeout(() => updateState(id, { callScheduled: false }), 3000);
    });
  };

  const handleApplyTemplate = (id: number, template: string) => {
    updateState(id, {
      editedResponse: template,
      showTemplates: false,
      showEditor: true
    });
  };

  const urgentCount = questions.filter((q: any) => q.priority === "red" && questionStates[q.id]?.status === "open").length;
  const pendingCount = questions.filter((q: any) => q.priority !== "red" && questionStates[q.id]?.status === "open").length;
  const answeredCount = questions.filter((q: any) => questionStates[q.id]?.status === "answered").length;

  const filteredData = questions.filter((q: any) => {
    const state = questionStates[q.id];
    if (filter === "urgent") return q.priority === "red" && state?.status === "open";
    if (filter === "pending") return q.priority !== "red" && state?.status === "open";
    if (filter === "answered") return state?.status === "answered";
    return true;
  });

  const filterTabs: { key: FilterType; label: string; count: number; color?: string }[] = [
    { key: "all", label: "All", count: questions.length },
    { key: "urgent", label: "Urgent", count: urgentCount, color: "#EF4444" },
    { key: "pending", label: "Pending", count: pendingCount, color: "#F59E0B" },
    { key: "answered", label: "Answered", count: answeredCount, color: "#10B981" },
  ];

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>
                Parent Questions — Needs Your Input
              </h1>
              <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
                These questions were flagged by AI as requiring teacher review before responding
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA" }}>
              <Bell size={14} style={{ color: "#EF4444" }} />
              <span className="text-sm" style={{ color: "#EF4444", fontWeight: 600 }}>
                {urgentCount} urgent · Requires immediate attention
              </span>
            </div>
          </div>
        </div>

        {/* Priority legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { icon: <Shield size={13} />, label: "Wellbeing / Safety", color: "#EF4444", bg: "#FEE2E2" },
            { icon: <BookOpen size={13} />, label: "Academic Concern", color: "#D97706", bg: "#FEF3C7" },
            { icon: <Lightbulb size={13} />, label: "General Clarification", color: "#92400E", bg: "#FEF9C3" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: item.bg, color: item.color, fontWeight: 500 }}>
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
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
                  backgroundColor: filter === tab.key ? "rgba(255,255,255,0.25)" : (tab.color ? `${tab.color}20` : "#F1F5F9"),
                  color: filter === tab.key ? "white" : (tab.color || "#94A3B8"),
                  fontWeight: 600
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Question cards */}
        <div className="space-y-4">
          {filteredData.map((q: any) => {
            const state = questionStates[q.id];
            const priority = priorityConfig[q.priority] ?? priorityConfig.yellow;
            const isAnswered = state?.status === "answered";

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                style={{
                  borderLeftColor: priority.dot,
                  border: `1px solid ${priority.border}`,
                  borderLeftWidth: "4px",
                  opacity: isAnswered ? 0.75 : 1
                }}
              >
                {/* Card top */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Parent info */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                        style={{ backgroundColor: q.avatarColor, fontWeight: 700 }}
                      >
                        {q.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>{q.parentName}</span>
                          <span className="text-xs" style={{ color: "#94A3B8" }}>re:</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 500 }}>
                            <User size={10} className="inline mr-1" />
                            {q.childName}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: priority.flagBg, color: priority.flagColor, fontWeight: 500 }}
                          >
                            {priority.label}
                          </span>
                          {isAnswered && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 500 }}>
                              <CheckCircle size={10} className="inline mr-1" />Answered
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={12} style={{ color: "#94A3B8" }} />
                          <span className="text-xs" style={{ color: "#94A3B8" }}>Asked {q.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Flag reason */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0" style={{ backgroundColor: priority.bg, border: `1px solid ${priority.border}` }}>
                      <span>{q.flagIcon}</span>
                      <span className="text-xs" style={{ color: priority.color, fontWeight: 500 }}>{q.flagReason}</span>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <p className="text-sm" style={{ color: "#1E293B", lineHeight: "1.7", fontStyle: "italic" }}>
                      "{q.question}"
                    </p>
                  </div>

                  {/* AI Flag badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7" }}>
                      <AlertTriangle size={12} style={{ color: "#D97706" }} />
                      <span className="text-xs" style={{ color: "#92400E", fontWeight: 500 }}>
                        AI flagged · Requires teacher review before responding
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Suggested Response */}
                <div className="px-5 pb-4">
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #BFDBFE" }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#EFF6FF" }}>
                      <div className="flex items-center gap-2">
                        <Bot size={14} style={{ color: "#2563EB" }} />
                        <span className="text-xs" style={{ fontWeight: 600, color: "#2563EB" }}>AI SUGGESTED RESPONSE</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateState(q.id, { showTemplates: !state?.showTemplates })}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                          style={{ color: "#2563EB" }}
                        >
                          <ChevronDown size={12} />
                          Templates
                        </button>
                        <button
                          onClick={() => updateState(q.id, {
                            showEditor: !state?.showEditor,
                            editedResponse: q.aiSuggestedResponse
                          })}
                          className="p-1 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 size={13} style={{ color: "#2563EB" }} />
                        </button>
                      </div>
                    </div>

                    {/* Templates dropdown */}
                    {state?.showTemplates && (
                      <div className="border-b border-blue-100" style={{ backgroundColor: "#F0F7FF" }}>
                        {responseTemplates.map((template, i) => (
                          <button
                            key={i}
                            onClick={() => handleApplyTemplate(q.id, template)}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 transition-colors border-b border-blue-100/50 last:border-0"
                            style={{ color: "#1E293B" }}
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    )}

                    {state?.showEditor ? (
                      <div className="p-4" style={{ backgroundColor: "white" }}>
                        <textarea
                          value={state.editedResponse}
                          onChange={e => updateState(q.id, { editedResponse: e.target.value })}
                          rows={4}
                          className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 resize-none"
                          style={{ color: "#1E293B", backgroundColor: "#F8FAFC" }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs" style={{ color: "#94A3B8" }}>
                            {state.editedResponse.length} characters
                          </span>
                          <button
                            onClick={() => updateState(q.id, { showEditor: false })}
                            className="text-xs"
                            style={{ color: "#94A3B8" }}
                          >
                            <X size={12} className="inline mr-1" />Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3" style={{ backgroundColor: "white" }}>
                        <p className="text-sm" style={{ color: "#374151", lineHeight: "1.7" }}>
                          {state?.editedResponse || q.aiSuggestedResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {!isAnswered ? (
                  <div className="px-5 pb-5 flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSendAI(q.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#2563EB", color: "white", fontWeight: 600 }}
                      >
                        <Send size={14} />
                        Send AI Response
                      </button>
                      <button
                        onClick={() => {
                          updateState(q.id, { showEditor: true });
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border hover:bg-slate-50 transition-colors"
                        style={{ borderColor: "#2563EB", color: "#2563EB", fontWeight: 500 }}
                      >
                        <Edit3 size={14} />
                        Edit & Send
                      </button>
                      {state?.showEditor && (
                        <button
                          onClick={() => handleSendEdited(q.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: "#10B981", color: "white", fontWeight: 600 }}
                        >
                          <CheckCircle size={14} />
                          Send Edited
                        </button>
                      )}
                      <button
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border hover:bg-slate-50 transition-colors"
                        style={{ borderColor: "#E2E8F0", color: "#64748B", fontWeight: 500 }}
                        onClick={() => updateState(q.id, { showEditor: true, editedResponse: "" })}
                      >
                        <MessageSquare size={14} />
                        Write Custom
                      </button>
                    </div>
                    <button
                      onClick={() => handleScheduleCall(q.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border hover:bg-green-50 transition-colors"
                      style={{ borderColor: state?.callScheduled ? "#10B981" : "#E2E8F0", color: state?.callScheduled ? "#10B981" : "#64748B", fontWeight: 500 }}
                    >
                      <Phone size={14} />
                      {state?.callScheduled ? "Call Scheduled ✓" : "Schedule Call"}
                    </button>
                  </div>
                ) : (
                  <div className="px-5 pb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#D1FAE5" }}>
                      <CheckCircle size={14} style={{ color: "#10B981" }} />
                      <span className="text-sm" style={{ color: "#065F46", fontWeight: 500 }}>Response sent to {q.parentName}</span>
                    </div>
                    <button
                      onClick={() => updateState(q.id, { status: "open" })}
                      className="flex items-center gap-1.5 text-xs hover:underline"
                      style={{ color: "#94A3B8" }}
                    >
                      <RotateCcw size={12} />
                      Undo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F1F5F9" }}>
              <Flag size={28} style={{ color: "#94A3B8" }} />
            </div>
            <p style={{ fontWeight: 600, color: "#1E293B" }}>No questions in this category</p>
            <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
              {filter === "answered" ? "No questions have been answered yet" : "All questions in this category have been handled"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
