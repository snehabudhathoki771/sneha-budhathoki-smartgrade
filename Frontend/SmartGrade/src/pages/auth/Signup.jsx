import axios from "axios";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaChalkboardTeacher,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaUserShield,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/SGlogo.png";

const ROLE_META = {
  Student: { icon: <FaUserGraduate />, bg: "bg-sky-500" },
  Teacher: { icon: <FaChalkboardTeacher />, bg: "bg-fuchsia-500" },
  Admin: { icon: <FaUserShield />, bg: "bg-orange-500" },
};

export default function Signup() {
  const [role, setRole] = useState("Student");
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const roleMeta = useMemo(() => ROLE_META[role], [role]);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      toast.warning("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      toast.info("Creating your account...");

      const response = await axios.post(
        "https://localhost:7247/api/Auth/signup",
        {
          fullName,
          email,
          password,
          role,
        }
      );

      toast.success(response.data || "Account created successfully");
      navigate("/login");
      toast.info("Redirecting to login...");
    } catch (err) {
      toast.error(err.response?.data || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-12">

      {/* Back */}
      <div className="mx-auto mb-8 max-w-md">
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
        {/* Heading */}
        <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">
          Create Account
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Join SmartGrade today
        </p>

        {/* Role */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${roleMeta.bg}`}
            >
              {roleMeta.icon}
            </div>
            <span className="font-semibold text-slate-800">{role}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const order = ["Student", "Teacher", "Admin"];
              setRole(order[(order.indexOf(role) + 1) % order.length]);
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
            handleSignup();
          }}
        >
          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Footer */}
          <div className="pt-4">
            <div className="h-px w-full bg-slate-200" />
            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}