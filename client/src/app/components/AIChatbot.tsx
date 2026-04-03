import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, CheckCircle, Info, AlertTriangle, Flag, Sparkles, Bot } from "lucide-react";

type ConfidenceLevel = "high" | "medium" | "low" | "sensitive";
type Portal = "teacher" | "parent";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  confidence?: ConfidenceLevel;
  timestamp: string;
}

const confidenceConfig: Record<ConfidenceLevel, { color: string; bg: string; icon: React.ReactNode; label: string; description: string }> = {
  high: {
    color: "#10B981",
    bg: "#D1FAE5",
    icon: <CheckCircle size={13} />,
    label: "High Confidence",
    description: "AI is responding directly"
  },
  medium: {
    color: "#3B82F6",
    bg: "#DBEAFE",
    icon: <Info size={13} />,
    label: "Medium Confidence",
    description: "Response includes disclaimer"
  },
  low: {
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: <AlertTriangle size={13} />,
    label: "Low Confidence",
    description: "Flagged for teacher review"
  },
  sensitive: {
    color: "#EF4444",
    bg: "#FEE2E2",
    icon: <Flag size={13} />,
    label: "Sensitive Topic",
    description: "Deferred to teacher"
  }
};

const teacherResponses: { keywords: string[]; response: string; confidence: ConfidenceLevel }[] = [
  {
    keywords: ["pending", "approval", "review"],
    response: "You currently have 5 pending approvals. I've flagged Noah Williams (English), Jackson Brown (Mathematics), and Lucas Davis (HASS) as priorities based on urgency and parent engagement scores.",
    confidence: "high"
  },
  {
    keywords: ["flagged", "question", "parent"],
    response: "There are 3 parent questions requiring your input: 1) Sarah Williams - urgent wellbeing concern about Noah, 2) Michelle Brown - family circumstances affecting Jackson, 3) David Chen - extension program inquiry for Olivia. The first two are marked urgent.",
    confidence: "high"
  },
  {
    keywords: ["class", "average", "performance"],
    response: "This week's class performance: 11 students above expected, 12 at expected level, 3 approaching, 2 below expected. This is an improvement from Week 5 where only 8 were above expected. The trend is positive overall.",
    confidence: "high"
  },
  {
    keywords: ["noah", "williams"],
    response: "Noah Williams (Year 5A) current status: C grade in English, C+ in Mathematics. Three flagged learning concerns: Reading Comprehension, Focus & Attention, Verbal Communication. His parent has also submitted an urgent wellbeing question today. Recommend reviewing flagged questions section.",
    confidence: "high"
  },
  {
    keywords: ["canvas", "sync", "lms"],
    response: "Last Canvas sync was completed 2 hours ago. All grade data is current. The next scheduled sync is tonight at 11pm AEST. Would you like to trigger a manual sync now?",
    confidence: "medium"
  },
  {
    keywords: ["report", "generate", "term"],
    response: "I can help prepare term report templates. Note: I'll generate draft content based on entered grades and AI analysis, but you'll need to review and approve all content before reports are sent to parents. Shall I prepare a draft for your review?",
    confidence: "medium"
  }
];

const parentResponses: { keywords: string[]; response: string; confidence: ConfidenceLevel }[] = [
  {
    keywords: ["grade", "marks", "score"],
    response: "Noah received a C+ in Mathematics and C in English this week (Term 2, Week 8). His Mathematics has shown improvement — up from a C last week. Ms. Thompson has noted he's working hard and making good progress with multiplication.",
    confidence: "high"
  },
  {
    keywords: ["homework", "home", "practice", "help"],
    response: "Based on Noah's current learning areas, Ms. Thompson recommends: ✓ 15 minutes of reading together each evening, ✓ Times tables practice (try the 'Times Tables Rockstars' app), ✓ Discuss story events after reading to build comprehension. These are personalised to Noah's needs this term.",
    confidence: "high"
  },
  {
    keywords: ["attend", "absence", "missing"],
    response: "Noah's attendance this term is 92% (23 out of 25 days attended). He has had 2 absences recorded. Regular attendance is important — consistent school attendance is linked to better academic outcomes. If you have concerns, please contact the school office.",
    confidence: "high"
  },
  {
    keywords: ["bully", "friend", "social", "upset", "sad"],
    response: "I want to make sure Noah gets the right support here. This is something Ms. Thompson should address directly with you. I've flagged your concern as urgent for her immediate attention. She will contact you within 24 hours. If this is an emergency, please call the school directly on (03) 9555 0100.",
    confidence: "sensitive"
  },
  {
    keywords: ["extension", "gifted", "advanced", "bored"],
    response: "Extension program eligibility is assessed by Ms. Thompson based on sustained performance across all subjects. I don't have enough information to advise on this — I've flagged your question for Ms. Thompson's review. She'll be in touch with you soon.",
    confidence: "low"
  },
  {
    keywords: ["teacher", "contact", "call", "meeting"],
    response: "You can contact Ms. Thompson via: 📧 Email: j.thompson@greenwoodps.edu.au | 📞 School: (03) 9555 0100 | 📅 Parent-teacher meetings: Book via the school app. Ms. Thompson's available consultation times are Tuesdays 3:30-4:30pm and Thursdays 3:30-4:30pm.",
    confidence: "high"
  }
];

const defaultResponse = {
  teacher: "I can help you with student grades, pending approvals, parent questions, and class performance data. Try asking about specific students, class averages, or flagged questions!",
  parent: "I can help you understand Noah's grades, homework recommendations, attendance, and how to contact Ms. Thompson. What would you like to know?"
};

function getResponse(input: string, portal: Portal): { response: string; confidence: ConfidenceLevel } {
  const lower = input.toLowerCase();
  const responses = portal === "teacher" ? teacherResponses : parentResponses;

  for (const item of responses) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return { response: item.response, confidence: item.confidence };
    }
  }

  return { response: defaultResponse[portal], confidence: "medium" };
}

interface AIChatbotProps {
  open: boolean;
  onToggle: () => void;
  portal: Portal;
}

export function AIChatbot({ open, onToggle, portal }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: portal === "teacher"
        ? "Hello Ms. Thompson! I'm your EduTrack AI assistant. I can help you review student performance, manage pending approvals, and respond to parent questions. What would you like to know?"
        : "Hello! I'm the EduTrack AI assistant for Greenwood Primary. I can help you understand Noah's progress, homework recommendations, and how to connect with Ms. Thompson. How can I help?",
      confidence: "high",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const { response, confidence } = getResponse(input, portal);
      const aiMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: response,
        confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const suggestedQuestions = portal === "teacher"
    ? ["What's pending review?", "Show flagged parent questions", "How is the class performing?"]
    : ["What grade did Noah get?", "What homework should we do?", "How do I contact Ms. Thompson?"];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-105"
        style={{ backgroundColor: "#2563EB" }}
      >
        {open ? <X size={22} color="white" /> : <MessageCircle size={22} color="white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <span className="text-white" style={{ fontSize: "8px" }}>AI</span>
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-slate-200" style={{ height: "520px" }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#2563EB" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={15} color="white" />
              </div>
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 600 }}>EduTrack AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  <p className="text-blue-100 text-xs">Active • Greenwood Primary</p>
                </div>
              </div>
            </div>
            <button onClick={onToggle} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Confidence legend */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
            {Object.entries(confidenceConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bg }}>
                <span style={{ color: config.color }}>{config.icon}</span>
                <span className="text-xs" style={{ color: config.color, fontWeight: 500 }}>{config.label}</span>
              </div>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: "#EFF6FF" }}>
                    <Bot size={12} style={{ color: "#2563EB" }} />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className="px-3 py-2 rounded-2xl text-sm"
                    style={{
                      backgroundColor: msg.role === "user" ? "#2563EB" : "#F1F5F9",
                      color: msg.role === "user" ? "white" : "#1E293B",
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      lineHeight: "1.5"
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.confidence && msg.role === "assistant" && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: confidenceConfig[msg.confidence].bg }}>
                      <span style={{ color: confidenceConfig[msg.confidence].color }}>
                        {confidenceConfig[msg.confidence].icon}
                      </span>
                      <span className="text-xs" style={{ color: confidenceConfig[msg.confidence].color, fontWeight: 500 }}>
                        {confidenceConfig[msg.confidence].description}
                      </span>
                    </div>
                  )}
                  <span className="text-xs" style={{ color: "#94A3B8" }}>{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
                  <Bot size={12} style={{ color: "#2563EB" }} />
                </div>
                <div className="px-3 py-2 rounded-2xl" style={{ backgroundColor: "#F1F5F9" }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ backgroundColor: "#94A3B8", animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          <div className="px-3 py-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => { setInput(q); }}
                className="text-xs px-2.5 py-1.5 rounded-full border border-slate-200 whitespace-nowrap hover:border-blue-300 hover:bg-blue-50 transition-colors shrink-0"
                style={{ color: "#64748B" }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask EduTrack AI..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                style={{ color: "#1E293B", backgroundColor: "#F8FAFC" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ backgroundColor: "#2563EB" }}
              >
                <Send size={15} color="white" />
              </button>
            </div>
            <p className="text-xs text-center mt-2" style={{ color: "#94A3B8" }}>
              AI responses are reviewed by teachers before action
            </p>
          </div>
        </div>
      )}
    </>
  );
}
