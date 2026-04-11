import {
    BarChart3,
    BookOpen,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    SlidersHorizontal,
    Users
} from "lucide-react";
import logo from "../../assets/SGlogo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function AdminSidebar() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const baseClass =
        "relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900";

    const activeClass =
        "bg-emerald-50 text-emerald-600 shadow-sm";

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="h-screen w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">

            {/* LOGO / TITLE */}
            <div className="px-6 py-6 border-b border-slate-200 flex items-center gap-3">

                {/* LOGO */}
                <div className="h-10 w-10 rounded-full overflow-hidden bg-emerald-100">
                    <img
                        src={logo}
                        alt="SmartGrade Logo"
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* TEXT */}
                <div>
                    <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                        Smart<span className="text-emerald-500">Grade</span>
                    </h1>

                    <p className="text-xs text-slate-500">
                        Admin Panel
                    </p>
                </div>

            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">

                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <LayoutDashboard size={18} />
                            Dashboard
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <Users size={18} />
                            Manage Users
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/grades"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <SlidersHorizontal size={18} />
                            Grade Configuration
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/exams"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <BookOpen size={18} />
                            All Exams
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/analytics"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <BarChart3 size={18} />
                            Analytics
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/audit-logs"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <ClipboardList size={18} />
                            Audit Logs
                        </>
                    )}
                </NavLink>

            </nav>

            {/* LOGOUT (MATCHED EXACTLY LIKE STUDENT SIDEBAR) */}
            <div className="mt-auto px-4 pb-6">

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                    <LogOut size={18} />
                    Logout
                </button>

            </div>

        </div>
    );
}

export default AdminSidebar;