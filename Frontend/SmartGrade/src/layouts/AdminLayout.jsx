import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../pages/Admin/AdminSidebar";
import NotificationBell from "../components/NotificationBell";

export default function AdminLayout() {

    const location = useLocation();

    const getTitle = () => {

        const path = location.pathname;

        if (path.includes("/admin/users")) return "User Management";

        if (path.includes("/admin/students/")) return "Student Profile";

        if (path.includes("/admin/teachers/")) return "Teacher Profile";

        if (path.includes("grades")) return "Grade Configuration";

        if (path.includes("exams")) return "All Exams";

        if (path.includes("analytics")) return "Analytics Dashboard";

        if (path.includes("audit-logs")) return "System Audit Logs";

        return "Dashboard";
    };

    return (
        <div className="flex h-screen overflow-hidden bg-white">

            {/* ================= SIDEBAR ================= */}
            <AdminSidebar />

            {/* ================= MAIN ================= */}
            <div className="flex-1 flex flex-col">

                {/* ================= HEADER ================= */}
                <div className="h-16 px-8 flex items-center justify-between bg-white border-b border-gray-200">

                    {/* PAGE TITLE */}
                    <h1 className="text-2xl font-semibold text-gray-800">
                        {getTitle()}
                    </h1>

                    {/* RIGHT SECTION */}
                    <div className="flex items-center gap-6">

                        {/* NOTIFICATION BELL */}
                        <NotificationBell />

                    </div>

                </div>

                {/* ================= PAGE CONTENT ================= */}
                <div className="flex-1 overflow-y-auto px-10 py-6">
                    <Outlet />
                </div>

            </div>

        </div>
    );
}