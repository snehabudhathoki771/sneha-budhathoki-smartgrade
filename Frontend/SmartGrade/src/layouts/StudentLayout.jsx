import { Outlet, useLocation } from "react-router-dom";
import StudentSidebar from "../pages/Student/StudentSidebar";
import NotificationBell from "../components/NotificationBell";

export default function StudentLayout() {

  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.includes("results")) return "Results & Reports";
    if (location.pathname.includes("analytics")) return "Analytics";
    if (location.pathname.includes("feedback")) return "Feedback";
    if (location.pathname.includes("profile")) return "Profile";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <StudentSidebar />

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