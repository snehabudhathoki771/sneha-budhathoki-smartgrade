import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";

export default function TeacherLayout() {

  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.includes("students")) return "Students";
    if (location.pathname.includes("exams")) return "Exam Management";
    if (location.pathname.includes("assessment-setup")) return "Assessment Setup";
    if (location.pathname.includes("marks")) return "Enter Marks";
    if (location.pathname.includes("analytics")) return "Weak Area Analytics";
    if (location.pathname.includes("bulk-import")) return "Bulk Upload";
    if (location.pathname.includes("results")) return "Exam Results";
    if (location.pathname.includes("toppers-at-risk")) return "Topper & At-Risk Students";
    if (location.pathname.includes("feedback")) return "Student Feedback";
    if (location.pathname.includes("profile")) return "Teacher Profile";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col bg-gray-50">

        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between bg-white border-b border-gray-200">

          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
            {getTitle()}
          </h1>

          <NotificationBell />

        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </div>

      </div>

    </div>
  );
}