import { useState, useEffect } from "react";
import { Send, Clock, CheckCircle, ChevronDown, ChevronUp, Plus, X, Shield, BookOpen, Lightbulb, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParentChild } from "../../context/ParentChildContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import { DEMO_PARENT_ID } from "../../lib/config";

const priorityConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  red: { label: "Wellbeing / Safety", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: <Shield size={12} /> },
  orange: { label: "Academic Concern", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: <BookOpen size={12} /> },
  yellow: { label: "General", color: "#92400E", bg: "#FEFCE8", border: "#FEF08A", icon: <Lightbulb size={12} /> },
};

type Thread = {
  id: number;
  subject: string;
  teacher: string;
  teacherInitials: string;
  teacherColor: string;
  status: string;
  priority: string;
  createdAt: string;
  messages: Array<{ id: number | string; from: string; content: string; timestamp: string }>;
};

function teacherInitials(name: string): string {
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}

export function ParentQuestions() {
  const { activeChild: student, parent } = useParentChild();
  const { t } = useTranslation("questions");
  const { t: tCommon } = useTranslation("common");
  const { language } = useLanguage();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [followUps, setFollowUps] = useState<Record<number, string>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ subject: "", content: "", priority: "orange" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const teacherName = student?.teacher ?? "Teacher";

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    api.get<any[]>(`/parent/questions/${student.id}?parent_id=${DEMO_PARENT_ID}`).then((data) => {
      const mapped = data.map((q) => ({
        id: q.id,
        subject: q.subject ?? "General",
        teacher: teacherName,
        teacherInitials: teacherInitials(teacherName),
        teacherColor: "#2563EB",
        status: q.status === "answered" ? "answered" : "pending",
        priority: q.priority,
        createdAt: new Date(q.createdAt).toLocaleDateString(),
        messages: [
          { id: `q-${q.id}`, from: "parent", content: q.content, timestamp: new Date(q.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
          ...q.replies.map((r: any) => ({
            id: r.id,
            from: r.from_type === "parent" ? "parent" : "teacher",
            content: r.content,
            timestamp: new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          })),
        ],
      }));
      setThreads(mapped);
      if (mapped.length > 0) setExpandedId(mapped[0].id);
      setLoading(false);
    });
  }, [student?.id, language, teacherName]);

  const handleFollowUp = (threadId: number) => {
    const text = followUps[threadId];
    if (!text?.trim()) return;
    api.post(`/parent/questions/${threadId}/followup?parent_id=${DEMO_PARENT_ID}`, { content: text }).then(() => {
      setThreads(prev => prev.map(t =>
        t.id === threadId
          ? { ...t, status: "pending", messages: [...t.messages, { id: Date.now(), from: "parent", content: text, timestamp: tCommon("just_now") }] }
          : t
      ));
      setFollowUps(prev => ({ ...prev, [threadId]: "" }));
    });
  };

  const handleNewQuestion = () => {
    if (!newQuestion.subject.trim() || !newQuestion.content.trim() || !student) return;
    setSubmitting(true);
    api.post<{ question_id: number; status: string }>(`/parent/questions/${student.id}?parent_id=${DEMO_PARENT_ID}`, newQuestion)
      .then((res) => {
        const newThread: Thread = {
          id: res.question_id,
          subject: newQuestion.subject,
          teacher: student?.teacher ?? "Teacher",
          teacherInitials: teacherInitials(student?.teacher ?? "Teacher"),
          teacherColor: "#2563EB",
          status: "pending",
          priority: newQuestion.priority,
          createdAt: tCommon("just_now"),
          messages: [{ id: `q-${res.question_id}`, from: "parent", content: newQuestion.content, timestamp: tCommon("just_now") }],
        };
        setThreads(prev => [newThread, ...prev]);
        setNewQuestion({ subject: "", content: "", priority: "orange" });
        setShowNewForm(false);
        setSubmitting(false);
        setExpandedId(newThread.id);
      })
      .catch(() => setSubmitting(false));
  };

  if (!student || loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm" style={{ color: "#94A3B8" }}>{tCommon("loading")}</p>
    </div>
  );

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1E293B" }}>{t("title")}</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
              {t("subtitle", { firstName: student.firstName })}
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
          >
            <Plus size={16} />
            {t("new_question_btn")}
          </button>
        </div>

        {/* New question form */}
        {showNewForm && (
          <div className="mb-6 bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>{t("new_question_title")}</h2>
              <button onClick={() => setShowNewForm(false)}>
                <X size={18} style={{ color: "#94A3B8" }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ fontWeight: 500, color: "#64748B" }}>{t("subject_label")}</label>
                <input
                  type="text"
                  value={newQuestion.subject}
                  onChange={e => setNewQuestion(p => ({ ...p, subject: e.target.value }))}
                  placeholder={t("subject_placeholder", { firstName: student.firstName })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}
                />
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ fontWeight: 500, color: "#64748B" }}>{t("category_label")}</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(priorityConfig) as [string, typeof priorityConfig[string]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNewQuestion(p => ({ ...p, priority: key }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all"
                      style={{
                        backgroundColor: newQuestion.priority === key ? cfg.bg : "white",
                        borderColor: newQuestion.priority === key ? cfg.border : "#E2E8F0",
                        color: newQuestion.priority === key ? cfg.color : "#64748B",
                        fontWeight: newQuestion.priority === key ? 600 : 400,
                      }}
                    >
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ fontWeight: 500, color: "#64748B" }}>{t("question_label")}</label>
                <textarea
                  value={newQuestion.content}
                  onChange={e => setNewQuestion(p => ({ ...p, content: e.target.value }))}
                  placeholder={t("question_placeholder")}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                  style={{ color: "#64748B" }}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleNewQuestion}
                  disabled={!newQuestion.subject.trim() || !newQuestion.content.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white hover:opacity-90 transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
                >
                  <Send size={14} />
                  {submitting ? t("sending") : t("send_to_teacher")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Threads list */}
        <div className="space-y-3">
          {threads.map(thread => {
            const priority = priorityConfig[thread.priority] ?? priorityConfig.yellow;
            const isExpanded = expandedId === thread.id;
            const lastMsg = thread.messages[thread.messages.length - 1];

            return (
              <div
                key={thread.id}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                style={{ borderColor: thread.status === "pending" ? priority.border : "#E2E8F0" }}
              >
                {/* Thread header — always visible */}
                <button
                  className="w-full px-5 py-4 flex items-start gap-3 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : thread.id)}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-0.5" style={{ backgroundColor: thread.teacherColor, fontWeight: 700 }}>
                    {thread.teacherInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{thread.subject}</p>
                      {thread.status === "pending" && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: "#FEF3C7", color: "#D97706", fontWeight: 500 }}>
                          <Clock size={10} />{t("awaiting_reply")}
                        </span>
                      )}
                      {thread.status === "answered" && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 500 }}>
                          <CheckCircle size={10} />{t("answered")}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: priority.bg, color: priority.color, fontWeight: 500 }}>
                        <span style={{ color: priority.color }}>{priority.icon}</span>
                        {t(`priority.${thread.priority}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs" style={{ color: "#64748B" }}>{thread.teacher}</p>
                      <span style={{ color: "#CBD5E1" }}>·</span>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{thread.createdAt}</p>
                      <span style={{ color: "#CBD5E1" }}>·</span>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{t("message_count", { count: thread.messages.length })}</p>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs mt-1 truncate" style={{ color: "#64748B" }}>
                        {lastMsg.from === "teacher" ? `${thread.teacherInitials}: ` : t("you_prefix")}{lastMsg.content}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 mt-1">
                    {isExpanded ? <ChevronUp size={16} style={{ color: "#94A3B8" }} /> : <ChevronDown size={16} style={{ color: "#94A3B8" }} />}
                  </div>
                </button>

                {/* Expanded thread */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Messages */}
                    <div className="px-5 py-4 space-y-4">
                      {thread.messages.map((msg, idx) => (
                        <div key={msg.id} className="flex gap-3">
                          {msg.from === "teacher" ? (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-0.5" style={{ backgroundColor: thread.teacherColor, fontWeight: 700 }}>
                              {thread.teacherInitials}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-0.5" style={{ backgroundColor: "#10B981", fontWeight: 700 }}>
                              SW
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs" style={{ fontWeight: 600, color: "#1E293B" }}>
                                {msg.from === "teacher" ? thread.teacher : `${parent?.name} (${tCommon("you")})`}
                              </span>
                              {idx === 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>{tCommon("original_question")}</span>
                              )}
                              <span className="text-xs" style={{ color: "#94A3B8" }}>{msg.timestamp}</span>
                            </div>
                            <div
                              className="p-3 rounded-xl text-sm"
                              style={{
                                backgroundColor: msg.from === "teacher" ? "#F0FDF4" : "#F8FAFC",
                                border: `1px solid ${msg.from === "teacher" ? "#86EFAC" : "#E2E8F0"}`,
                                color: "#1E293B",
                                lineHeight: "1.7",
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pending notice */}
                      {thread.status === "pending" && (
                        <div className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                          <Clock size={13} style={{ color: "#D97706" }} />
                          <p className="text-xs" style={{ color: "#92400E" }}>
                            {t("pending_notice", { teacher: thread.teacher })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Follow-up input */}
                    <div className="px-5 pb-4 border-t border-slate-100 pt-4">
                      <p className="text-xs mb-2" style={{ fontWeight: 500, color: "#64748B" }}>
                        <MessageSquare size={12} className="inline mr-1" />
                        {thread.status === "answered" ? t("follow_up_label") : t("add_context_label")}
                      </p>
                      <div className="flex gap-2">
                        <textarea
                          value={followUps[thread.id] || ""}
                          onChange={e => setFollowUps(prev => ({ ...prev, [thread.id]: e.target.value }))}
                          placeholder={thread.status === "answered" ? t("follow_up_placeholder") : t("add_details_placeholder")}
                          rows={2}
                          className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                          style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleFollowUp(thread.id); } }}
                        />
                        <button
                          onClick={() => handleFollowUp(thread.id)}
                          disabled={!followUps[thread.id]?.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white hover:opacity-90 transition-all disabled:opacity-40 self-end"
                          style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
                        >
                          <Send size={14} />
                          {tCommon("send")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {threads.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F1F5F9" }}>
              <MessageSquare size={28} style={{ color: "#94A3B8" }} />
            </div>
            <p style={{ fontWeight: 600, color: "#1E293B" }}>{t("no_questions_title")}</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "#94A3B8" }}>{t("no_questions_subtitle", { firstName: student.firstName })}</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all mx-auto"
              style={{ backgroundColor: "#2563EB", fontWeight: 600 }}
            >
              <Plus size={16} />{t("ask_teacher_btn")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
