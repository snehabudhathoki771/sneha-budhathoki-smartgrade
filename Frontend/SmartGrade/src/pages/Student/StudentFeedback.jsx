import { useEffect, useState } from "react";
import { getStudentFeedback } from "../../services/api";
import {
    FaCommentDots,
    FaStar,
    FaCheckCircle,
    FaExclamationTriangle,
    FaClock
} from "react-icons/fa";

export default function StudentFeedback() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const res = await getStudentFeedback();

            const data = Array.isArray(res.data)
                ? res.data
                : res.data?.$values || [];

            const sortedData = [...data].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            setFeedbacks(sortedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
            minute: "2-digit"
        });
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={`text-sm ${
                            star <= rating ? "opacity-100" : "opacity-20"
                        }`}
                    />
                ))}
            </div>
        );
    };

    const avgRating =
        feedbacks.length > 0
            ? (
                  feedbacks.reduce((sum, f) => sum + f.rating, 0) /
                  feedbacks.length
              ).toFixed(1)
            : 0;

    const improvementAlerts = feedbacks.filter(
        (f) => f.rating <= 2
    ).length;

    const latestDate =
        feedbacks.length > 0
            ? formatDate(feedbacks[0].createdAt)
            : "N/A";

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse bg-slate-50 min-h-screen">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="h-24 bg-slate-200 rounded-2xl"></div>
                    <div className="h-24 bg-slate-200 rounded-2xl"></div>
                    <div className="h-24 bg-slate-200 rounded-2xl"></div>
                    <div className="h-24 bg-slate-200 rounded-2xl"></div>
                </div>

                <div className="space-y-4">
                    <div className="h-32 bg-slate-200 rounded-2xl"></div>
                    <div className="h-32 bg-slate-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 bg-slate-50 min-h-screen px-8 py-6 max-w-[1400px] mx-auto">

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
                    <FaCommentDots className="text-emerald-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Total Feedback</p>
                        <h2 className="text-xl font-semibold text-slate-800">
                            {feedbacks.length}
                        </h2>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
                    <FaStar className="text-amber-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Average Rating</p>
                        <h2 className="text-xl font-semibold text-slate-800">
                            {avgRating}
                        </h2>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
                    <FaExclamationTriangle className="text-red-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Improvement Alerts</p>
                        <h2 className="text-xl font-semibold text-red-600">
                            {improvementAlerts}
                        </h2>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
                    <FaClock className="text-emerald-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Latest</p>
                        <h2 className="text-sm font-semibold text-slate-800">
                            {latestDate}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {feedbacks.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm">
                    <FaCommentDots className="mx-auto text-3xl mb-4 text-slate-400" />
                    No feedback available yet.
                </div>
            )}

            {/* Feedback List */}
            <div className="space-y-5">
                {feedbacks.map((f, index) => {
                    const feedbackType =
                        f.rating >= 4
                            ? "Excellent"
                            : f.rating >= 3
                            ? "Good"
                            : "Needs Improvement";

                    const badgeClass =
                        f.rating >= 4
                            ? "bg-emerald-100 text-emerald-700"
                            : f.rating >= 3
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-700";

                    return (
                        <div
                            key={f.id}
                            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                        >
                            {/* Header */}
                            <div className="flex flex-wrap justify-between items-start gap-3">
                                <div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-800">
                                            {f.examName || "Exam Feedback"}
                                        </h3>

                                        {index === 0 && (
                                            <span className="mt-1 inline-block px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">
                                                Latest
                                            </span>
                                        )}
                                    </div>

                                    {f.subject && (
                                        <p className="text-sm text-slate-500 mt-2">
                                            Subject: {f.subject}
                                        </p>
                                    )}
                                </div>

                                <div className="text-right">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}
                                    >
                                        {feedbackType}
                                    </span>

                                    <p className="text-xs text-slate-400 mt-2">
                                        {formatDate(f.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="mt-4">
                                {renderStars(f.rating)}
                            </div>

                            {/* Message */}
                            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <p className="text-slate-700 leading-relaxed">
                                    {f.message}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="mt-4 border-t pt-4">
                                <p className="text-sm text-slate-500">
                                    Recommended action:
                                </p>

                                <div className="mt-2 flex items-center gap-2 text-sm">
                                    {f.rating >= 4 ? (
                                        <>
                                            <FaCheckCircle className="text-emerald-600" />
                                            <span className="text-emerald-700">
                                                Maintain performance and continue revision.
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <FaExclamationTriangle className="text-amber-600" />
                                            <span className="text-amber-700">
                                                Focus on weak areas and revise concepts.
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}