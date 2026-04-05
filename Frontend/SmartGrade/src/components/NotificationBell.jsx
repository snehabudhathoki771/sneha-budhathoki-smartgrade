import { useEffect, useRef, useState } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
    getNotifications,
    getUnreadCount,
    markAllNotificationsRead,
    markNotificationRead,
} from "../services/api";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const navigate = useNavigate();
    const bellRef = useRef();

    useEffect(() => {
        fetchUnreadCount();
        fetchNotifications();

        const interval = setInterval(() => {
            fetchUnreadCount();
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications();

            console.log("Notifications API:", res);

            const data = Array.isArray(res.data)
                ? res.data
                : res.data?.$values || [];

            setNotifications(data);
        } catch (err) {
            console.error("Notification fetch error:", err);
            setNotifications([]);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadCount();

            console.log("Unread count:", res);

            setUnreadCount(res.data);
        } catch (err) {
            console.error("Unread count error:", err);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            await markNotificationRead(notification.id);

            setOpen(false);

            fetchNotifications();
            fetchUnreadCount();

            if (notification.route) {
                if (notification.referenceId) {
                    navigate(`${notification.route}?id=${notification.referenceId}`);
                } else {
                    navigate(notification.route);
                }
            }
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const handleMarkAll = async () => {
        try {
            await markAllNotificationsRead();
            fetchNotifications();
            fetchUnreadCount();
        } catch (err) {
            console.error("Mark all error:", err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";

        const now = new Date();
        const date = new Date(dateString);

        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

        return date.toLocaleDateString();
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case "Exam":
                return "bg-blue-100 text-blue-600";
            case "Warning":
                return "bg-red-100 text-red-600";
            case "Grade":
                return "bg-green-100 text-green-600";
            case "Security":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div ref={bellRef} className="relative">

            {/* BELL BUTTON */}
            <button
                onClick={() => setOpen(!open)}
                className="relative text-slate-600 hover:text-slate-800 transition"
            >
                <FaBell size={20} />

                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* DROPDOWN */}
            {open && (
                <div className="absolute right-0 mt-3 w-[380px] bg-white shadow-xl rounded-2xl border border-slate-200 z-50 overflow-hidden">

                    {/* HEADER */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800 text-lg">
                            Notifications
                        </h3>

                        <div className="flex items-center gap-3">
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleMarkAll}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}

                            <button
                                onClick={() => setOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {/* BODY */}
                    {notifications.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                            No notifications available
                        </p>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-slate-50">

                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer ${
                                        !n.isRead ? "border-l-4 border-emerald-500" : ""
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-3">

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-slate-800 text-sm">
                                                    {n.title}
                                                </h4>

                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeStyle(n.type)}`}>
                                                    {n.type || "General"}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>

                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></span>
                                        )}
                                    </div>

                                    <p className="text-xs text-slate-400 mt-3">
                                        {formatDate(n.createdAt)}
                                    </p>
                                </div>
                            ))}

                        </div>
                    )}
                </div>
            )}

        </div>
    );
}