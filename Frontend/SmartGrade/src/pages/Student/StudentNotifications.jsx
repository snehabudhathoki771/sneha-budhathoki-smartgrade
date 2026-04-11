import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/api";

export default function StudentNotifications() {

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {

      const res = await getNotifications();

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.$values || [];

      setNotifications(data);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load notifications");
      setNotifications([]);

    } finally {
      toast.dismiss();
      setLoading(false);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        fetchNotifications();
      } catch (err) {
        toast.error("Failed to update notification");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 bg-slate-50 min-h-screen">
        <div className="h-10 w-48 bg-slate-200 rounded"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen px-8 py-6 max-w-[900px] mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">
          Notifications
        </h1>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Empty */}
      {notifications.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm">
          No notifications available
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer ${!n.isRead ? "ring-1 ring-emerald-200" : ""
              }`}
          >
            <div className="flex justify-between items-start gap-3">

              <div>
                <h3 className="font-semibold text-lg text-slate-800">
                  {n.title}
                  <span className="text-xs text-slate-400 ml-2">
                    ({n.type || "General"})
                  </span>
                </h3>

                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2"></span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-3">
              {formatDate(n.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}