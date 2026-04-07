import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { api } from "../../lib/api";
import { DEMO_TEACHER_ID } from "../../lib/config";
import {
  LayoutDashboard, BookOpen, ClipboardList, BrainCircuit,
  Clock, MessageCircleQuestion, FileText, RefreshCcw, Settings,
  Bell, Search, ChevronRight, LogOut, Menu, X, Sparkles
} from "lucide-react";
import { AIChatbot } from "../AIChatbot";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const baseNavItems = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/teacher" },
  { label: "My Classes", icon: <BookOpen size={18} />, path: "/teacher/classes" },
  { label: "Enter Grades & Comments", icon: <ClipboardList size={18} />, path: "/teacher/grades" },
  { label: "AI Analysis Results", icon: <BrainCircuit size={18} />, path: "/teacher/ai-analysis" },
  { label: "Needs Your Review", icon: <Clock size={18} />, path: "/teacher/pending", badgeKey: "pending" },
  { label: "Parent Questions", icon: <MessageCircleQuestion size={18} />, path: "/teacher/flagged", badgeKey: "flagged" },
  { label: "Reports", icon: <FileText size={18} />, path: "/teacher/reports" },
  { label: "Canvas Sync", icon: <RefreshCcw size={18} />, path: "/teacher/canvas" },
  { label: "Settings", icon: <Settings size={18} />, path: "/teacher/settings" },
];

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [teacher, setTeacher] = useState({ name: "Teacher", initials: "T" });
  const [badges, setBadges] = useState<Record<string, number>>({ pending: 0, flagged: 0 });

  useEffect(() => {
    api.get<{ name: string; initials: string }>(`/teacher/me?teacher_id=${DEMO_TEACHER_ID}`)
      .then(data => setTeacher(data));

    // Fetch live badge counts
    Promise.all([
      api.get<any[]>(`/teacher/ai-analysis?teacher_id=${DEMO_TEACHER_ID}&confidence=low`),
      api.get<any[]>(`/teacher/flagged-questions?teacher_id=${DEMO_TEACHER_ID}`),
    ]).then(([analyses, questions]) => {
      setBadges({
        pending: analyses.filter((a: any) => a.status === "pending").length,
        flagged: questions.filter((q: any) => q.status === "open").length,
      });
    }).catch(() => {});
  }, []);

  const isActive = (path: string) => {
    if (path === "/teacher") return location.pathname === "/teacher";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#2563EB" }}>
              <Sparkles size={16} color="white" />
            </div>
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>EduTrack AI</p>
              <p className="text-xs" style={{ color: "#64748B" }}>Greenwood Primary</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} style={{ color: "#64748B" }} />
          </button>
        </div>

        {/* Teacher info */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: "#2563EB", fontWeight: 600 }}>
              {teacher.initials}
            </div>
            <div>
              <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>{teacher.name}</p>
              <p className="text-xs" style={{ color: "#64748B" }}>Year 5 Teacher</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {baseNavItems.map((item) => {
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 group"
                style={{
                  backgroundColor: isActive(item.path) ? "#EFF6FF" : "transparent",
                  color: isActive(item.path) ? "#2563EB" : "#64748B",
                }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: isActive(item.path) ? "#2563EB" : "#94A3B8" }}>{item.icon}</span>
                  <span className="text-sm" style={{ fontWeight: isActive(item.path) ? 600 : 400 }}>{item.label}</span>
                </div>
                {badgeCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#EF4444", fontWeight: 600 }}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-200">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            <LogOut size={18} style={{ color: "#94A3B8" }} />
            <span className="text-sm" style={{ color: "#64748B" }}>Back to Portal Select</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} style={{ color: "#64748B" }} />
            </button>
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="Search students, reports..."
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm w-64 focus:outline-none focus:ring-2"
                style={{ fontSize: "0.875rem", backgroundColor: "#F8FAFC", color: "#1E293B" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs" style={{ color: "#64748B" }}>Greenwood Primary School</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Term 2, Week 8</p>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell size={18} style={{ color: "#64748B" }} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: "#EF4444" }}></span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs cursor-pointer" style={{ backgroundColor: "#2563EB", fontWeight: 600 }}>
              {teacher.initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* AI Chatbot */}
      <AIChatbot open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} portal="teacher" teacherName={teacher.name} />
    </div>
  );
}
