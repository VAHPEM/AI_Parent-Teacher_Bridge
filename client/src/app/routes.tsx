import { createBrowserRouter, Outlet } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { TeacherDashboard } from "./pages/teacher/Dashboard";
import { GradeEntry } from "./pages/teacher/GradeEntry";
import { AIAnalysis } from "./pages/teacher/AIAnalysis";
import { FlaggedQuestions } from "./pages/teacher/FlaggedQuestions";
import { MyClasses } from "./pages/teacher/MyClasses";
import { PendingApprovals } from "./pages/teacher/PendingApprovals";
import { Reports } from "./pages/teacher/Reports";
import { CanvasSync } from "./pages/teacher/CanvasSync";
import { TeacherSettings } from "./pages/teacher/TeacherSettings";
import { ParentDashboard } from "./pages/parent/ParentDashboard";
import { ParentProgress } from "./pages/parent/ParentProgress";
import { ParentActivities } from "./pages/parent/ParentActivities";
import { ParentMessages } from "./pages/parent/ParentMessages";
import { ParentAIChat } from "./pages/parent/ParentAIChat";
import { ParentQuestions } from "./pages/parent/ParentQuestions";
import { ParentSettings } from "./pages/parent/ParentSettings";
import { TeacherLayout } from "./components/layout/TeacherLayout";
import { ParentLayout } from "./components/layout/ParentLayout";
import { LanguageProvider } from "./context/LanguageContext";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      <div className="text-center">
        <p style={{ fontSize: "4rem", fontWeight: 800, color: "#2563EB" }}>404</p>
        <p style={{ fontWeight: 600, color: "#1E293B", fontSize: "1.25rem" }}>Page not found</p>
        <a href="/" className="mt-4 inline-block text-sm" style={{ color: "#2563EB" }}>← Back to home</a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  
  // Teacher Portal
  {
    path: "/teacher",
    element: <TeacherLayout><Outlet /></TeacherLayout>,
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: "classes", element: <MyClasses /> },
      { path: "grades", element: <GradeEntry /> },
      { path: "ai-analysis", element: <AIAnalysis /> },
      { path: "pending", element: <PendingApprovals /> },
      { path: "flagged", element: <FlaggedQuestions /> },
      { path: "reports", element: <Reports /> },
      { path: "canvas", element: <CanvasSync /> },
      { path: "settings", element: <TeacherSettings /> },
    ],
  },
  
  // Parent Portal
  {
    path: "/parent",
    element: <LanguageProvider><ParentLayout><Outlet /></ParentLayout></LanguageProvider>,
    children: [
      { index: true, element: <ParentDashboard /> },
      { path: "progress", element: <ParentProgress /> },
      { path: "activities", element: <ParentActivities /> },
      { path: "messages", element: <ParentMessages /> },
      { path: "ai-chat", element: <ParentAIChat /> },
      { path: "questions", element: <ParentQuestions /> },
      { path: "settings", element: <ParentSettings /> },
    ],
  },
  
  // 404
  { path: "*", element: <NotFound /> },
]);
