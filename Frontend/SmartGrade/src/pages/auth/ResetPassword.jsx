import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token"); // read token from URL
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await api.post("/Auth/reset-password", {
        token: token,
        newPassword: newPassword,
      });

      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err.response?.data || "Reset failed. Token may be expired."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-2 text-center">
          Reset Password
        </h2>

        <p className="text-sm text-slate-500 mb-6 text-center">
          Enter your new password below
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        {message && (
          <p className="text-green-600 text-sm mb-3 text-center">{message}</p>
        )}

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-70"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}