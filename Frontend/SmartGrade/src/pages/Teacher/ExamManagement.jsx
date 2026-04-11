import {
  FileBarChart2,
  Pencil,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function ExamManagement() {

  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    academicYear: ""
  });
  const [editingExamId, setEditingExamId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchExams = async () => {
    try {
      setLoading(true);

      const res = await api.get("/teacher/exams");

      setExams(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingExamId) {
        await api.put(`/teacher/exam/${editingExamId}`, form);
        toast.success("Exam updated");
        setEditingExamId(null);
      } else {
        await api.post("/teacher/exam", form);
        toast.success("Exam created");
      }

      setForm({ name: "", academicYear: "" });
      fetchExams();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save exam");
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      type: "delete",
      id,
      message: "Delete this exam?"
    });
  };

  const handlePublish = (id) => {
    setConfirmModal({
      type: "publish",
      id,
      message: "Publish this exam?"
    });
  };

  const handleUnpublish = (id) => {
    setConfirmModal({
      type: "unpublish",
      id,
      message: "Unpublish this exam?"
    });
  };

  const handleEdit = (exam) => {
    setForm({
      name: exam.name,
      academicYear: exam.academicYear
    });
    setEditingExamId(exam.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto">

        <div className="mb-6"></div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">

          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editingExamId ? "Edit Exam" : "Create New Exam"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">

            <input
              type="text"
              placeholder="Exam Name (e.g. Mid-Term)"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition"
              required
            />

            <input
              type="text"
              placeholder="Academic Year (e.g. 2025-2026)"
              value={form.academicYear}
              onChange={(e) =>
                setForm({ ...form, academicYear: e.target.value })
              }
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition"
              required
            />

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition text-sm font-medium"
            >
              {editingExamId ? "Update Exam" : "+ Create Exam"}
            </button>

          </form>

        </div>

        {loading ? (
          <p className="text-gray-500">Loading exams...</p>
        ) : exams.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
            No exams created yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">

            {exams.map((exam) => (

              <div
                key={exam.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
              >

                <div className="flex justify-between items-start">

                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      {exam.name}
                    </h3>

                    <p className="text-gray-500 text-sm">
                      {exam.academicYear}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(exam.createdAt).toLocaleDateString()}
                    </p>

                    {exam.publishedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Published: {new Date(exam.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${exam.status === "Published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {exam.status}
                  </span>

                </div>

                <div className="mt-5 space-y-3">

                  <button
                    disabled={exam.status === "Published"}
                    onClick={() =>
                      exam.status !== "Published" &&
                      navigate(`/teacher/exams/${exam.id}/subjects`)
                    }
                    className={`w-full py-2.5 rounded-xl text-sm transition ${exam.status === "Published"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                  >
                    Manage Subjects
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/teacher/results?examId=${exam.id}`)
                    }
                    className="w-full border border-green-600 text-green-600 py-2.5 rounded-xl hover:bg-green-600 hover:text-white transition flex items-center justify-center gap-2 text-sm"
                  >
                    <FileBarChart2 size={18} />
                    View Results
                  </button>

                  {exam.status === "Draft" ? (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      className="w-full bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition text-sm"
                    >
                      Publish Results
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(exam.id)}
                      className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-100 transition text-sm"
                    >
                      Unpublish Results
                    </button>
                  )}

                  <div className="flex gap-3">

                    <button
                      disabled={exam.status === "Published"}
                      onClick={() =>
                        exam.status !== "Published" && handleEdit(exam)
                      }
                      className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm ${exam.status === "Published"
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      disabled={exam.status === "Published"}
                      onClick={() =>
                        exam.status !== "Published" && handleDelete(exam.id)
                      }
                      className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm ${exam.status === "Published"
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "border border-red-300 text-red-600 hover:bg-red-50"
                        }`}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div className="bg-white p-7 rounded-3xl w-[380px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200">

            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Action
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  try {
                    if (confirmModal.type === "delete") {
                      await api.delete(`/teacher/exams/${confirmModal.id}`);
                      toast.success("Exam deleted");
                    }

                    if (confirmModal.type === "publish") {
                      await api.put(`/teacher/exams/${confirmModal.id}/publish`);
                      toast.success("Exam published");
                    }

                    if (confirmModal.type === "unpublish") {
                      await api.put(`/teacher/exams/${confirmModal.id}/unpublish`);
                      toast.success("Exam unpublished");
                    }

                    fetchExams();
                    setConfirmModal(null);
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to load exams");
                  }
                }}
                
                className={`px-5 py-2 rounded-xl text-white transition ${confirmModal.type === "delete"
                  ? "bg-red-500 hover:bg-red-600"
                  : confirmModal.type === "publish"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-orange-500 hover:bg-orange-600"
                  }`}
              >
                Confirm
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}