import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function ChangePassword() {
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast.warning("All fields are required");
            return;
        }

        if (newPassword.length < 6) {
            toast.warning("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            await api.post("/Auth/change-password", {
                newPassword: newPassword,
            });

            toast.success("Password changed successfully");

            // clear old login
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/login");

        } catch (err) {
            console.error(err);
            toast.error("Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
            >
                <h2 className="text-xl font-semibold text-slate-800 mb-2 text-center">
                    Change Password
                </h2>

                <p className="text-sm text-slate-500 mb-6 text-center">
                    You must change your temporary password
                </p>

                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 mb-4 border border-slate-300 rounded-xl text-sm"
                />

                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 mb-4 border border-slate-300 rounded-xl text-sm"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
                >
                    {loading ? "Please wait..." : "Update Password"}
                </button>
            </form>
        </div>
    );
}