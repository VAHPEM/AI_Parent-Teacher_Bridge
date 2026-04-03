import { Link } from "react-router";
import { GraduationCap, Users, Sparkles, ChevronRight, Shield, Zap, BarChart3, Globe } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2563EB" }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1E293B" }}>EduTrack AI</p>
              <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Australian School Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm px-3 py-1 rounded-full border border-slate-200" style={{ color: "#64748B" }}>
              🇦🇺 Australian Curriculum Aligned
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <Sparkles size={14} style={{ color: "#2563EB" }} />
          <span className="text-sm" style={{ color: "#2563EB", fontWeight: 500 }}>AI-Powered Student Tracking for Australian Schools</span>
        </div>
        <h1 className="mb-4" style={{ fontSize: "2.75rem", fontWeight: 800, color: "#1E293B", lineHeight: "1.2" }}>
          Smarter Learning,<br />
          <span style={{ color: "#2563EB" }}>Better Outcomes</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-12" style={{ color: "#64748B", lineHeight: "1.7" }}>
          EduTrack AI helps teachers track student progress, generate personalised AI insights, and communicate effectively with parents — all aligned to the Australian Curriculum.
        </p>

        {/* Portal cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {/* Teacher Portal */}
          <Link to="/teacher" className="group bg-white rounded-2xl p-8 border-2 hover:border-blue-400 transition-all duration-200 hover:shadow-lg text-left block" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform" style={{ backgroundColor: "#EFF6FF" }}>
              <GraduationCap size={28} style={{ color: "#2563EB" }} />
            </div>
            <h2 style={{ fontWeight: 700, color: "#1E293B", marginBottom: "0.5rem" }}>Teacher Portal</h2>
            <p className="text-sm mb-6" style={{ color: "#64748B", lineHeight: "1.6" }}>
              Enter grades, review AI-generated insights, approve parent communications, and manage class performance analytics.
            </p>
            <ul className="space-y-2 mb-6">
              {["Grade entry & Canvas sync", "AI analysis & approval workflow", "Flagged parent question management", "Australian Curriculum references"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10B981" }}></div>
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2" style={{ color: "#2563EB" }}>
              <span className="text-sm" style={{ fontWeight: 600 }}>Enter Teacher Portal</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Parent Portal */}
          <Link to="/parent" className="group bg-white rounded-2xl p-8 border-2 hover:border-green-400 transition-all duration-200 hover:shadow-lg text-left block" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform" style={{ backgroundColor: "#ECFDF5" }}>
              <Users size={28} style={{ color: "#10B981" }} />
            </div>
            <h2 style={{ fontWeight: 700, color: "#1E293B", marginBottom: "0.5rem" }}>Parent Portal</h2>
            <p className="text-sm mb-6" style={{ color: "#64748B", lineHeight: "1.6" }}>
              View your child's progress, receive AI-generated learning recommendations, and communicate with teachers directly.
            </p>
            <ul className="space-y-2 mb-6">
              {["Real-time progress tracking", "Personalised home learning activities", "AI chatbot for quick questions", "Multi-language support"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10B981" }}></div>
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2" style={{ color: "#10B981" }}>
              <span className="text-sm" style={{ fontWeight: 600 }}>Enter Parent Portal</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <Shield size={14} />, label: "ACARA Aligned" },
            { icon: <Zap size={14} />, label: "Real-time AI Analysis" },
            { icon: <BarChart3 size={14} />, label: "Progress Tracking" },
            { icon: <Globe size={14} />, label: "Multi-language Support" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm" style={{ color: "#64748B" }}>
              <span style={{ color: "#2563EB" }}>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* Demo school banner */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl p-6 flex items-center gap-4" style={{ backgroundColor: "#1E293B" }}>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <GraduationCap size={24} color="white" />
          </div>
          <div className="flex-1">
            <p className="text-white" style={{ fontWeight: 600 }}>Greenwood Primary School</p>
            <p className="text-sm" style={{ color: "#94A3B8" }}>Demo environment • All data is fictional and for demonstration purposes only</p>
          </div>
          <div className="flex gap-2">
            <Link to="/teacher" className="px-4 py-2 rounded-lg text-sm bg-white/10 text-white hover:bg-white/20 transition-colors" style={{ fontWeight: 500 }}>
              Teacher Demo
            </Link>
            <Link to="/parent" className="px-4 py-2 rounded-lg text-sm text-white hover:bg-white/20 transition-colors" style={{ backgroundColor: "#2563EB", fontWeight: 500 }}>
              Parent Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
