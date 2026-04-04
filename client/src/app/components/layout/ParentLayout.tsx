import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard, TrendingUp, BookOpen, Settings,
  Bell, Menu, X, Sparkles, LogOut, Bot, HelpCircle
} from "lucide-react";
import { AIChatbot } from "../AIChatbot";
import { ParentChildProvider, useActiveChild } from "../../context/ParentChildContext";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Home", icon: <LayoutDashboard size={18} />, path: "/parent" },
  { label: "Progress & Grades", icon: <TrendingUp size={18} />, path: "/parent/progress" },
  { label: "Learning Activities", icon: <BookOpen size={18} />, path: "/parent/activities" },
  { label: "AI Assistant", icon: <Bot size={18} />, path: "/parent/ai-chat" },
  { label: "Ask a Teacher", icon: <HelpCircle size={18} />, path: "/parent/questions" },
  { label: "Settings", icon: <Settings size={18} />, path: "/parent/settings" },
];

interface ParentLayoutProps {
  children: React.ReactNode;
}

function ParentLayoutInner({ children }: ParentLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { activeChild, children: allChildren, setActiveChildId } = useActiveChild();
  const isActive = (path: string) => {
    if (path === "/parent") return location.pathname === "/parent";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#10B981" }}>
              <Sparkles size={16} color="white" />
            </div>
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>EduTrack AI</p>
              <p className="text-xs" style={{ color: "#64748B" }}>Parent Portal</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} style={{ color: "#64748B" }} />
          </button>
        </div>

        {/* Children switcher */}
        <div className="border-b border-slate-100" style={{ backgroundColor: "#F0FDF4" }}>
          <p className="text-xs px-5 pt-3 pb-2" style={{ color: "#64748B", fontWeight: 500 }}>MY CHILDREN</p>
          {allChildren.map(child => {
            const isActive = child.id === activeChild?.id;
            return (
              <button
                key={child.id}
                onClick={() => setActiveChildId(child.id)}
                className="w-full flex items-center gap-3 px-5 py-2.5 transition-colors text-left"
                style={{ backgroundColor: isActive ? "#D1FAE5" : "transparent" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                  style={{ backgroundColor: child.color, fontWeight: 700 }}
                >
                  {child.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: 600, color: isActive ? "#065F46" : "#1E293B" }}>
                    {child.name}
                  </p>
                  <p className="text-xs" style={{ color: "#64748B" }}>{child.year} · {child.teacher}</p>
                </div>
                {isActive && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "#10B981", color: "white", fontWeight: 600 }}>
                    Active
                  </span>
                )}
              </button>
            );
          })}
          <div className="pb-2" />
        </div>

        {/* Parent info */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: "#10B981", fontWeight: 700 }}>
              SW
            </div>
            <div>
              <p className="text-sm" style={{ fontWeight: 500, color: "#1E293B" }}>Sarah Williams</p>
              <p className="text-xs" style={{ color: "#64748B" }}>Parent / Guardian</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
              style={{
                backgroundColor: isActive(item.path) ? "#ECFDF5" : "transparent",
                color: isActive(item.path) ? "#10B981" : "#64748B",
              }}
            >
              <span style={{ color: isActive(item.path) ? "#10B981" : "#94A3B8" }}>{item.icon}</span>
              <span className="text-sm" style={{ fontWeight: isActive(item.path) ? 600 : 400 }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* School info */}
        <div className="px-5 py-3 border-t border-slate-100" style={{ backgroundColor: "#F8FAFC" }}>
          <p className="text-xs" style={{ color: "#64748B", fontWeight: 500 }}>Greenwood Primary School</p>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Term 2, Week 8 · 2026</p>
        </div>

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
            <div className="hidden sm:block">
              <p className="text-sm" style={{ fontWeight: 600, color: "#1E293B" }}>Greenwood Primary School</p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Viewing: <span style={{ color: activeChild?.color, fontWeight: 600 }}>{activeChild?.name}</span> · {activeChild?.year} · {activeChild?.teacher}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell size={18} style={{ color: "#64748B" }} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }}></span>
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs cursor-pointer shrink-0"
                style={{ backgroundColor: activeChild?.color ?? "#64748B", fontWeight: 700 }}
              >
                {activeChild?.initials}
              </div>
              <span className="text-sm hidden sm:block" style={{ fontWeight: 500, color: "#1E293B" }}>{activeChild?.firstName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <AIChatbot open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} portal="parent" />
    </div>
  );
}

export function ParentLayout({ children }: ParentLayoutProps) {
  return (
    <ParentChildProvider>
      <ParentLayoutInner>{children}</ParentLayoutInner>
    </ParentChildProvider>
  );
}
