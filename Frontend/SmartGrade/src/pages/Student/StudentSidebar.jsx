import {
    BarChart3,
    FileText,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    User
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/SGlogo.png";

function StudentSidebar() {

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
        navigate("/login"); localStorage.clear();
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
                        Student Panel
                    </p>
                </div>

            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">

                {/* Dashboard */}
                <NavLink
                    to="/student/dashboard"
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

                {/* Results */}
                <NavLink
                    to="/student/results"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <FileText size={18} />
                            Results & Reports
                        </>
                    )}
                </NavLink>

                {/* Analytics */}
                <NavLink
                    to="/student/analytics"
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

                {/* Feedback */}
                <NavLink
                    to="/student/feedback"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <MessageSquare size={18} />
                            Feedback
                        </>
                    )}
                </NavLink>

                {/* Profile */}
                <NavLink
                    to="/student/profile"
                    className={({ isActive }) =>
                        `${baseClass} ${isActive ? activeClass : ""}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-500"></span>
                            )}
                            <User size={18} />
                            Profile
                        </>
                    )}
                </NavLink>

            </nav>

            {/* LOGOUT */}
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

export default StudentSidebar;