import { useState, useRef, useEffect } from "react";
import { Send, Bot, AlertCircle, Sparkles, Plus, MessageSquare, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParentChild } from "../../context/ParentChildContext";
import { api } from "../../lib/api";
import { DEMO_PARENT_ID } from "../../lib/config";
import i18n from "i18next";

const suggestedQuestions = [
  "How is Noah going in Maths?",
  "What home activities should I do with Noah?",
  "How is his English going?",
  "How is his Science going?",
];

interface Message {
  id: number;
  role: "parent" | "ai";
  content: string;
  created_at: string;
}

interface Session {
  id: number;
  title: string;
  language: string;
  created_at: string;
}

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function groupSessions(sessions: Session[]): { label: string; items: Session[] }[] {
  const groups: { label: string; items: Session[] }[] = [];
  for (const s of sessions) {
    const label = formatSessionDate(s.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(s);
    else groups.push({ label, items: [s] });
  }
  return groups;
}

export function ParentAIChat() {
  const { activeChild: student } = useParentChild();
  const { t } = useTranslation("ai-chat");
  const { t: tCommon } = useTranslation("common");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount — never auto-create
  useEffect(() => {
    if (!student) return;
    api.get<Session[]>(`/parent/chat/sessions/${student.id}?parent_id=${DEMO_PARENT_ID}`)
      .then(data => {
        setSessions(data);
        if (data.length > 0) loadSession(data[0].id);
      })
      .catch(() => {});
  }, [student?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const loadSession = (sessionId: number) => {
    if (!student) return;
    setActiveSessionId(sessionId);
    api.get<Message[]>(`/parent/chat/sessions/${student.id}/messages?session_id=${sessionId}&parent_id=${DEMO_PARENT_ID}`)
      .then(data => setMessages(data))
      .catch(() => setMessages([]));
  };

  const deleteSession = (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    api.delete(`/parent/chat/sessions/${sessionId}?parent_id=${DEMO_PARENT_ID}`)
      .then(() => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
      })
      .catch(() => {});
  };

  const createNewSession = () => {
    if (!student) return;
    // If current session is empty, just clear messages and keep it (no new session needed)
    if (activeSessionId !== null && messages.length === 0) {
      setInput("");
      return;
    }
    api.post<Session>(`/parent/chat/sessions/${student.id}?parent_id=${DEMO_PARENT_ID}&language=${i18n.language}`, {})
      .then(session => {
        setSessions(prev => [session, ...prev]);
        setActiveSessionId(session.id);
        setMessages([]);
        setInput("");
      })
      .catch(() => {});
  };

  const ensureSession = (): Promise<number> => {
    if (activeSessionId !== null) return Promise.resolve(activeSessionId);
    return api.post<Session>(`/parent/chat/sessions/${student!.id}?parent_id=${DEMO_PARENT_ID}&language=${i18n.language}`, {})
      .then(session => {
        setSessions(prev => [session, ...prev]);
        setActiveSessionId(session.id);
        return session.id;
      });
  };

  const handleSend = (text?: string) => {
    const question = text || input;
    if (!question.trim() || !student) return;

    const optimistic: Message = { id: Date.now(), role: "parent", content: question, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setInput("");
    setTyping(true);

    ensureSession().then(sessionId => {
      // Update sidebar title optimistically if this is the first message
      setSessions(prev => prev.map(s =>
        s.id === sessionId && s.title === "New Chat" ? { ...s, title: question.slice(0, 60) } : s
      ));

      api.post<{ reply: string; session_id?: number }>(`/parent/chat/${student.id}?parent_id=${DEMO_PARENT_ID}`, { message: question, session_id: sessionId })
        .then(res => {
          if (typeof res.session_id === "number") setActiveSessionId(res.session_id);
          setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", content: res.reply, created_at: new Date().toISOString() }]);
        })
        .catch(() => {
          setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", content: t("error_message"), created_at: new Date().toISOString() }]);
        })
        .finally(() => setTyping(false));
    }).catch(() => setTyping(false));
  };

  if (!student) return null;

  const sessionGroups = groupSessions(sessions);

  return (
    <div className="flex" style={{ height: "calc(100vh - 57px)" }}>

      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50"
            style={{ color: "#2563EB", border: "1px solid #BFDBFE", backgroundColor: "#EFF6FF" }}
          >
            <Plus size={15} />
            {t("new_chat") || "New Chat"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sessionGroups.length === 0 && (
            <p className="text-xs text-center mt-6" style={{ color: "#94A3B8" }}>No conversations yet</p>
          )}
          {sessionGroups.map(group => (
            <div key={group.label}>
              <p className="text-xs px-4 py-2 font-medium" style={{ color: "#94A3B8" }}>{group.label}</p>
              {group.items.map(session => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className="group w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ backgroundColor: session.id === activeSessionId ? "#EFF6FF" : "transparent" }}
                >
                  <MessageSquare size={13} className="shrink-0" style={{ color: session.id === activeSessionId ? "#2563EB" : "#94A3B8" }} />
                  <span className="text-xs truncate flex-1" style={{ color: session.id === activeSessionId ? "#1E3A5F" : "#64748B", fontWeight: session.id === activeSessionId ? 600 : 400 }}>
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={12} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563EB" }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "#1E293B" }}>{t("title")}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-xs" style={{ color: "#64748B" }}>{t("status")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 p-3 rounded-xl flex items-start gap-2 shrink-0" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
          <p className="text-xs" style={{ color: "#1E40AF", lineHeight: "1.6" }}
            dangerouslySetInnerHTML={{ __html: t("info_banner", { firstName: student.firstName, pronoun: student.firstName === "Ella" ? "her" : "his" }) }} />
        </div>

        {/* Suggested questions — only when no messages */}
        {messages.length === 0 && (
          <div className="px-6 pt-4 shrink-0">
            <p className="text-xs mb-2 font-medium" style={{ color: "#94A3B8", letterSpacing: "0.05em" }}>{t("suggested_label")}</p>
            <div className="flex flex-wrap gap-2">
              {(t("suggested_questions", { returnObjects: true, firstName: student.firstName, pronoun: student.firstName === "Ella" ? "her" : "his" }) as string[]).map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  style={{ color: "#64748B" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {activeSessionId === null && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Bot size={32} style={{ color: "#CBD5E1" }} />
              <p className="text-sm" style={{ color: "#94A3B8" }}>{t("new_chat") || "Start a new conversation"}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "parent" ? "justify-end" : "justify-start"} gap-2.5`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: "#2563EB" }}>
                  <Bot size={14} color="white" />
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${msg.role === "parent" ? "items-end" : "items-start"}`}>
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    backgroundColor: msg.role === "parent" ? "#2563EB" : "white",
                    color: msg.role === "parent" ? "white" : "#1E293B",
                    borderRadius: msg.role === "parent" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    lineHeight: "1.7",
                    border: msg.role === "ai" ? "1px solid #E2E8F0" : "none",
                    boxShadow: msg.role === "ai" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {msg.content}
                </div>
              </div>
              {msg.role === "parent" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1" style={{ backgroundColor: "#10B981", fontWeight: 700 }}>
                  {student.initials}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563EB" }}>
                <Bot size={14} color="white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-200 bg-white">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 shrink-0">
          <div className="flex gap-3 items-center">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-300" style={{ backgroundColor: "#F8FAFC" }}>
              <Sparkles size={15} style={{ color: "#2563EB", flexShrink: 0 }} />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder={t("input_placeholder", { firstName: student.firstName })}
                className="flex-1 text-sm bg-transparent focus:outline-none"
                style={{ color: "#1E293B" }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || typing || !activeSessionId}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-all disabled:opacity-40"
              style={{ backgroundColor: "#2563EB" }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
