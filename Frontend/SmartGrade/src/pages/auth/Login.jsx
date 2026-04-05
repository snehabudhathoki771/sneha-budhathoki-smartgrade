import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaChalkboardTeacher,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaUserShield,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../../assets/SGlogo.png";
import { login } from "../../services/authService";

const ROLE_META = {
  Student: { icon: <FaUserGraduate />, bg: "bg-sky-500" },
  Teacher: { icon: <FaChalkboardTeacher />, bg: "bg-fuchsia-500" },
  Admin: { icon: <FaUserShield />, bg: "bg-orange-500" },
};

// Countdown function
const getRemainingTime = (date) => {
  const now = new Date();
  const target = new Date(date);

  const diff = target - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return `${days}d ${hours}h ${minutes}m`;
};

export default function Login() {
  const [role, setRole] = useState("Student");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // STATES
  const [inactiveMessage, setInactiveMessage] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [targetDate, setTargetDate] = useState(null);

  const navigate = useNavigate();
  const roleMeta = useMemo(() => ROLE_META[role], [role]);

  const resetInactiveState = () => {
    setInactiveMessage(null);
    setRemainingTime(null);
    setTargetDate(null);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("Email and password are required");
      return;
    }

    resetInactiveState();

    try {
      setLoading(true);

      const user = await login(email, password);

      const backendRole = (user.role || user.Role)?.toLowerCase();
      const selectedRole = role.toLowerCase();

      if (backendRole !== selectedRole) {
        toast.error("You are trying to login from the wrong role panel.");
        return;
      }

      toast.success("Login successful");

      if (backendRole === "teacher") {
        navigate("/teacher", { replace: true });
      } else if (backendRole === "student") {
        navigate("/student", { replace: true });
      } else if (backendRole === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }

    } catch (err) {

      const message = err.response?.data?.message;
      const remainingSeconds = err.response?.data?.remainingSeconds;

      // Permanent deactivation
      if (message?.toLowerCase().includes("permanently")) {
        setInactiveMessage("Account permanently deactivated. Contact admin.");
      }

      // Temporary deactivation (NEW FIX)
      else if (remainingSeconds) {
        setInactiveMessage("Account temporarily deactivated.");

        const target = new Date(Date.now() + remainingSeconds * 1000);
        setTargetDate(target);
      }

      // General deactivated fallback
      else if (message?.toLowerCase().includes("deactivated")) {
        setInactiveMessage("Account inactive");
      }

      // Invalid credentials
      else if (err.response?.status === 401) {
        toast.error("Invalid email or password");
      }

      else {
        toast.error("Something went wrong. Try again.");
      }

    } finally {
      setLoading(false);
    }
  };

  // TIMER
  useEffect(() => {
    if (!targetDate) return;

    const updateTimer = () => {
      const remaining = getRemainingTime(targetDate);

      if (!remaining) {
        resetInactiveState();
        return;
      }

      setRemainingTime(remaining);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-12">

      {/* Back */}
      <div className="mx-auto mb-8 max-w-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
        >
          <FaArrowLeft />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Card */}
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200">

        <div className="mx-auto h-14 w-14 rounded-full overflow-hidden bg-emerald-100">
          <img
            src={logo}
            alt="SmartGrade Logo"
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">
          Welcome Back
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to your SmartGrade account
        </p>

        {inactiveMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center">
            <p>{inactiveMessage}</p>

            {remainingTime && (
              <p className="text-sm mt-1 font-medium">
                Reactivates in: {remainingTime}
              </p>
            )}
          </div>
        )}

        {/* Role */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${roleMeta.bg}`}>
              {roleMeta.icon}
            </div>
            <span className="font-semibold text-slate-800">{role}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const order = ["Student", "Teacher", "Admin"];
              setRole(order[(order.indexOf(role) + 1) % order.length]);
              resetInactiveState();
            }}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Change
          </button>
        </div>

        {/* Form */}
        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetInactiveState();
              }}
              placeholder="Enter your email"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  resetInactiveState();
                }}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <button
                type="button"
                onClick={() => setShowPw((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPw ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <div className="mt-2 text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="pt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Sign Up
            </Link>
          </p>

        </form>

      </div>

    </div>
  );
}