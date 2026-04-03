import { useState, useRef, useEffect } from "react";
import { Send, Mail, Clock, CheckCircle, Sparkles, ChevronDown, Bot, AlertCircle } from "lucide-react";
import { parentTeachers } from "../../data/mockData";
import { useActiveChild } from "../../context/ParentChildContext";

type View = "teacher" | "ai";

const aiResponses: Record<string, string> = {
  default: "Hi! I'm the EduTrack AI assistant. I can help you with Noah's learning progress, suggest home activities, or explain assessment results. What would you like to know?",
  grade: "Noah received a C+ in Mathematics this week (Week 8, Term 2). His score was 62% — an improvement from last week's C grade, particularly in basic operations. Keep encouraging him!",
  math: "For Mathematics: Noah is at C+ (62%) in Week 8. I recommend: daily times tables practice (10 mins), the Khan Academy Kids app, and real-world maths like counting items at the supermarket.",
  english: "For English: Noah received a C in Week 8. I recommend: reading together for 15 minutes each evening, practising retelling stories in his own words, and using vocabulary flashcards for new words.",
  homework: "Based on Noah's current assessments, I recommend: 1) Daily times tables practice (10 mins), 2) Reading together for 15 minutes each evening, 3) Khan Academy Kids app for engaging maths practice. These align with his identified learning areas.",
  wellbeing: "I understand this is an important concern. For student wellbeing and safety matters, I've flagged this question for Ms. Thompson to respond to directly. If urgent, please contact the school on (03) 9555 0100.",
  bullying: "This needs to be handled directly by the teacher. I've sent a notification to Ms. Thompson about your concern. She will be in touch within 24 hours. If urgent, please call (03) 9555 0100.",
  extension: "This question requires teacher assessment. Based on Noah's current grades (C/C+), I don't have enough data to make this recommendation. Ms. Thompson is best placed to evaluate — I've flagged your question for her review.",
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("bullying") || lower.includes("bully") || lower.includes("mean")) return aiResponses.bullying;
  if (lower.includes("wellbeing") || lower.includes("upset") || lower.includes("school")) return aiResponses.wellbeing;
  if (lower.includes("maths") || lower.includes("math") || lower.includes("multiplication") || lower.includes("number")) return aiResponses.math;
  if (lower.includes("english") || lower.includes("reading") || lower.includes("writing")) return aiResponses.english;
  if (lower.includes("homework") || lower.includes("home") || lower.includes("activities") || lower.includes("practise")) return aiResponses.homework;
  if (lower.includes("grade") || lower.includes("score") || lower.includes("result") || lower.includes("mark")) return aiResponses.grade;
  if (lower.includes("extension") || lower.includes("gifted") || lower.includes("advanced")) return aiResponses.extension;
  return "Thanks for your question! Based on Noah's learning data, I'd recommend continuing the daily reading and maths activities. If you have a specific question about a subject or assessment, I'm happy to help with more detail!";
}

const quickQuestions = [
  "How is Noah going in Maths?",
  "What home activities should I do with Noah?",
  "How is his English going?",
  "Should Noah be in extension classes?",
];

export function ParentMessages() {
  const { activeChild: student } = useActiveChild();
  const [view, setView] = useState<View>("teacher");
  const [selectedTeacherId, setSelectedTeacherId] = useState(1);
  const [teacherData, setTeacherData] = useState(parentTeachers);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  const [aiMessages, setAiMessages] = useState([
    { id: 1, from: "ai", content: aiResponses.default, timestamp: "Just now" }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const teacherBottomRef = useRef<HTMLDivElement>(null);

  const selectedTeacher = teacherData.find(t => t.id === selectedTeacherId)!;

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiTyping]);

  useEffect(() => {
    teacherBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTeacherId, teacherData]);

  const handleSendToTeacher = () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const msg = { id: selectedTeacher.messages.length + 1, from: "parent", content: newMessage, timestamp: "Just now", status: "sent" };
    setTimeout(() => {
      setTeacherData(prev => prev.map(t => t.id === selectedTeacherId ? { ...t, messages: [...t.messages, msg] } : t));
      setSending(false);
      setSent(true);
      setNewMessage("");
      setTimeout(() => setSent(false), 3000);
    }, 800);
  };

  const handleSendToAI = () => {
    if (!aiInput.trim()) return;
    const question = aiInput;
    setAiMessages(prev => [...prev, { id: prev.length + 1, from: "user", content: question, timestamp: "Just now" }]);
    setAiInput("");
    setAiTyping(true);
    setTimeout(() => {
      setAiMessages(prev => [...prev, { id: prev.length + 1, from: "ai", content: getAIResponse(question), timestamp: "Just now" }]);
      setAiTyping(false);
    }, 1200);
  };

  return (
    <>
      <div className="flex" style={{ height: "calc(100vh - 57px)" }}>

        {/* Left sidebar */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>Conversations</h2>
          </div>

          {/* AI Chat */}
          <button
            onClick={() => setView("ai")}
            className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 transition-colors text-left w-full"
            style={{ backgroundColor: view === "ai" ? "#EFF6FF" : "transparent" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563EB" }}>
              <Bot size={18} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm truncate" style={{ fontWeight: 600, color: view === "ai" ? "#2563EB" : "#1E293B" }}>EduTrack AI Assistant</p>
                <span className="text-xs px-1.5 py-0.5 rounded-full ml-1 shrink-0" style={{ backgroundColor: "#DBEAFE", color: "#2563EB", fontWeight: 600 }}>AI</span>
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "#64748B" }}>Ask anything about {student.firstName}</p>
            </div>
          </button>

          {/* Teacher list */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs uppercase" style={{ color: "#94A3B8", fontWeight: 500, letterSpacing: "0.05em" }}>{student.firstName}'S TEACHERS</p>
          </div>
          {teacherData.map(teacher => (
            <button
              key={teacher.id}
              onClick={() => { setView("teacher"); setSelectedTeacherId(teacher.id); }}
              className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 transition-colors text-left w-full"
              style={{ backgroundColor: view === "teacher" && selectedTeacherId === teacher.id ? "#F0FDF4" : "transparent" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0" style={{ backgroundColor: teacher.color, fontWeight: 700 }}>
                {teacher.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm truncate" style={{ fontWeight: 600, color: view === "teacher" && selectedTeacherId === teacher.id ? "#065F46" : "#1E293B" }}>
                    {teacher.name}
                  </p>
                  {teacher.unread > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ml-1 shrink-0" style={{ backgroundColor: "#10B981", fontWeight: 700 }}>
                      {teacher.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: "#64748B" }}>{teacher.subject}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {view === "ai" ? (
            <>
              {/* AI header */}
              <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2563EB" }}>
                  <Bot size={16} color="white" />
                </div>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>EduTrack AI Assistant</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <p className="text-xs" style={{ color: "#64748B" }}>Always available</p>
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="mx-5 mt-4 p-3 rounded-xl flex items-start gap-2 shrink-0" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
                <p className="text-xs" style={{ color: "#1E40AF", lineHeight: "1.5" }}>
                  The AI can answer questions about {student.firstName}'s learning progress, homework, and activities. Sensitive questions will be forwarded to {student.firstName === 'Ella' ? 'her' : 'his'} teacher.
                </p>
              </div>

              {/* Quick questions */}
              <div className="px-5 pt-3 shrink-0">
                <p className="text-xs mb-2" style={{ color: "#94A3B8", fontWeight: 500 }}>SUGGESTED QUESTIONS</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map(q => (
                    <button
                      key={q}
                      onClick={() => setAiInput(q.replace(/Noah/g, student.firstName).replace(/\bhis\b/g, student.firstName === 'Ella' ? 'her' : 'his'))}
                      className="text-xs px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      style={{ color: "#64748B" }}
                    >
                      {q.replace(/Noah/g, student.firstName).replace(/\bhis\b/g, student.firstName === 'Ella' ? 'her' : 'his')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {aiMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
                    {msg.from === "ai" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: "#2563EB" }}>
                        <Bot size={14} color="white" />
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col ${msg.from === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className="px-4 py-3 text-sm"
                        style={{
                          backgroundColor: msg.from === "user" ? "#2563EB" : "white",
                          color: msg.from === "user" ? "white" : "#1E293B",
                          borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          lineHeight: "1.6",
                          border: msg.from === "ai" ? "1px solid #E2E8F0" : "none",
                          boxShadow: msg.from === "ai" ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
                        }}
                      >
                        {msg.content.replace(/Noah/g, student.firstName).replace(/\bhis\b/g, student.firstName === 'Ella' ? 'her' : 'his').replace(/\bHis\b/g, student.firstName === 'Ella' ? 'Her' : 'His')}
                      </div>
                      <span className="text-xs mt-1" style={{ color: "#94A3B8" }}>{msg.timestamp}</span>
                    </div>
                    {msg.from === "user" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1" style={{ backgroundColor: "#10B981", fontWeight: 700 }}>
                        SW
                      </div>
                    )}
                  </div>
                ))}
                {aiTyping && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563EB" }}>
                      <Bot size={14} color="white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-200 bg-white">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={aiBottomRef} />
              </div>

              {/* AI input */}
              <div className="border-t border-slate-200 bg-white px-5 py-4 shrink-0">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendToAI()}
                    placeholder={`Ask the AI about ${student.firstName}...`}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ backgroundColor: "#F8FAFC", color: "#1E293B" }}
                  />
                  <button
                    onClick={handleSendToAI}
                    disabled={!aiInput.trim() || aiTyping}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40"
                    style={{ backgroundColor: "#2563EB" }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Teacher header */}
              <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0" style={{ backgroundColor: selectedTeacher.color, fontWeight: 700 }}>
                    {selectedTeacher.initials}
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{selectedTeacher.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs" style={{ color: "#64748B" }}>{selectedTeacher.subject} · {selectedTeacher.year}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs" style={{ color: "#64748B" }}>{selectedTeacher.responseTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex gap-4 text-xs" style={{ color: "#64748B" }}>
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} style={{ color: "#2563EB" }} />
                    <span>{selectedTeacher.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: "#F59E0B" }} />
                    <span>{selectedTeacher.consultHours}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {selectedTeacher.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === "parent" ? "justify-end" : "justify-start"} gap-2.5`}>
                    {msg.from === "teacher" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1" style={{ backgroundColor: selectedTeacher.color, fontWeight: 700 }}>
                        {selectedTeacher.initials}
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col ${msg.from === "parent" ? "items-end" : "items-start"}`}>
                      <div
                        className="px-4 py-3 text-sm"
                        style={{
                          backgroundColor: msg.from === "parent" ? "#10B981" : "white",
                          color: msg.from === "parent" ? "white" : "#1E293B",
                          borderRadius: msg.from === "parent" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          lineHeight: "1.6",
                          border: msg.from === "teacher" ? "1px solid #E2E8F0" : "none",
                          boxShadow: msg.from === "teacher" ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
                        }}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs" style={{ color: "#94A3B8" }}>{msg.timestamp}</span>
                        {msg.from === "parent" && (
                          <CheckCircle size={11} style={{ color: msg.status === "read" ? "#10B981" : "#94A3B8" }} />
                        )}
                      </div>
                    </div>
                    {msg.from === "parent" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1" style={{ backgroundColor: "#10B981", fontWeight: 700 }}>
                        SW
                      </div>
                    )}
                  </div>
                ))}
                <div ref={teacherBottomRef} />
              </div>

              {/* Compose */}
              <div className="border-t border-slate-200 bg-white px-5 py-4 shrink-0">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setNewMessage(prev => prev || `Hi ${selectedTeacher.name.split(" ")[0]}, `)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border hover:bg-blue-50 transition-colors"
                    style={{ borderColor: "#BFDBFE", color: "#2563EB", fontWeight: 500 }}
                  >
                    <Sparkles size={12} />AI Draft
                  </button>
                  <button
                    onClick={() => setShowTopics(!showTopics)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "#E2E8F0", color: "#64748B" }}
                  >
                    <ChevronDown size={12} />Quick Topics
                  </button>
                </div>

                {showTopics && (
                  <div className="mb-3 p-3 rounded-xl border border-slate-200" style={{ backgroundColor: "#F8FAFC" }}>
                    <p className="text-xs mb-2" style={{ color: "#64748B", fontWeight: 500 }}>QUICK TOPICS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "How is Noah progressing overall?",
                        "I have a concern about Noah's wellbeing",
                        "Can we schedule a parent-teacher meeting?",
                        "Question about assessment grades",
                        "Feedback on home learning activities",
                      ].map(topic => (
                        <button
                          key={topic}
                          onClick={() => { setNewMessage(topic); setShowTopics(false); }}
                          className="text-xs px-2.5 py-1 rounded-full border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                          style={{ color: "#64748B" }}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedTeacher.name.split(" ").slice(-1)[0]}...`}
                    rows={2}
                    className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 resize-none"
                    style={{ color: "#1E293B", backgroundColor: "#F8FAFC" }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendToTeacher(); } }}
                  />
                  <button
                    onClick={handleSendToTeacher}
                    disabled={!newMessage.trim() || sending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white hover:opacity-90 transition-all disabled:opacity-40 self-end"
                    style={{ backgroundColor: "#10B981", fontWeight: 600 }}
                  >
                    <Send size={14} />
                    {sending ? "Sending..." : sent ? "Sent ✓" : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
