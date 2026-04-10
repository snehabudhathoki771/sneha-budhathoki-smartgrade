import api from "../../services/api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function AdminExamDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);

    // NEW CONFIRM MODAL STATE
    const [confirmModal, setConfirmModal] = useState(false);

    const fetchExam = async () => {
        try {
            const res = await api.get(`/admin/exams/${id}`);
            setExam(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load exam details.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchExam();
    }, [id]);

    //  UPDATED DELETE
    const handleDelete = () => {

        // BLOCK IF PUBLISHED
        if (exam?.status?.toLowerCase() === "published") {
            toast.warning("To delete this exam, please unpublish it first.");
            return;
        }

        setConfirmModal(true);
    };

    //  CONFIRM DELETE
    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/exams/${id}`);
            toast.success("Exam deleted successfully");

            navigate("/admin/exams");
        } catch {
            toast.error("Failed to delete exam.");
        } finally {
            setConfirmModal(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            await api.put(`/admin/exams/${id}/unpublish`, {});

            toast.success("Exam unpublished successfully");
            fetchExam();

        } catch {
            toast.error("Failed to unpublish exam.");
        }
    };

    const handlePublish = async () => {
        try {
            await api.put(`/admin/exams/${id}/publish`, {});

            fetchExam();
            toast.success("Exam published successfully");

        } catch {
            toast.error("Failed to publish exam.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-40">
                <p className="text-gray-500">Loading exam details...</p>
            </div>
        );

    if (!exam)
        return (
            <div className="text-center text-red-500">
                Exam not found.
            </div>
        );

    return (
        <div className="space-y-10">

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">
                        {exam.name}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Detailed overview and lifecycle control
                    </p>
                </div>

                <button
                    onClick={() => navigate("/admin/exams")}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-xl transition shadow-sm"
                >
                    ← Back
                </button>
            </div>

            {/* Exam Info Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-5">
                <div className="flex justify-between">
                    <span className="font-medium text-gray-600">
                        Academic Year
                    </span>
                    <span className="text-gray-800">
                        {exam.academicYear}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium text-gray-600">
                        Status
                    </span>
                    <span
                        className={`px-4 py-1 text-xs rounded-full font-semibold ${exam.status === "Published"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                            }`}
                    >
                        {exam.status}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium text-gray-600">
                        Teacher
                    </span>
                    <span className="text-gray-800">
                        {exam.teacherName}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium text-gray-600">
                        Created
                    </span>
                    <span className="text-gray-800">
                        {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
                </div>

                {exam.publishedAt && (
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-600">
                            Published
                        </span>
                        <span className="text-gray-800">
                            {new Date(exam.publishedAt).toLocaleDateString()}
                        </span>
                    </div>
                )}
            </div>

            {/* Subjects Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                    Subjects
                </h2>

                {exam.subjects?.length === 0 ? (
                    <p className="text-gray-500">
                        No subjects added.
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {exam.subjects?.map((s) => (
                            <li
                                key={s.id}
                                className="border border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition"
                            >
                                {s.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">

                {exam.status !== "Published" && (
                    <button
                        onClick={handlePublish}
                        className="bg-[#4F6D6D] hover:bg-[#3E5858] text-white px-6 py-3 rounded-xl shadow-sm transition"
                    >
                        Force Publish
                    </button>
                )}

                {exam.status === "Published" && (
                    <button
                        onClick={handleUnpublish}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl shadow-sm transition"
                    >
                        Force Unpublish
                    </button>
                )}

                <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-sm transition"
                >
                    Delete Exam
                </button>
            </div>

            {/* CONFIRM MODAL */}
            {confirmModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">

                        <h2 className="text-xl font-semibold mb-4">
                            Confirmation
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this exam?
                        </p>

                        <div className="flex justify-end gap-3">

                            <button
                                onClick={() => setConfirmModal(false)}
                                className="px-5 py-2 rounded-xl bg-gray-200"
                            >
                                No
                            </button>

                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2 rounded-xl bg-red-500 text-white"
                            >
                                Yes
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}