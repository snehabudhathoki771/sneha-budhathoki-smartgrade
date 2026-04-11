import { Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function Feedback() {

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [subject, setSubject] = useState("");
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      if (!toast.isActive("init-load")) {
        toast.info("Loading data...", { toastId: "init-load" });
      }

      setLoading(true);

      const studentsRes = await api.get("/teacher/students");

      const examsRes = await api.get("/teacher/exams");

      setStudents(studentsRes.data);
      setExams(examsRes.data);

      await loadFeedback();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const res = await api.get("/feedback");

      setFeedbackList(res.data);

      if (!toast.isActive("feedback-success")) {
        toast.success("Feedback loaded successfully", {
          toastId: "feedback-success",
        });
      }
    } catch (error) {
      toast.error("Failed to load feedback");
      console.error("Error loading feedback:", error);
    }
  };

  const handleSubmit = async () => {

    if (!selectedStudent || !selectedExam || !message.trim()) {
      toast.warning("Please select student, exam and write message.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/feedback", {
        studentId: parseInt(selectedStudent),
        examId: parseInt(selectedExam),
        subject: subject || null,
        rating: rating || null,
        message: message.trim(),
      });

      toast.success("Feedback sent successfully.");

      setSelectedStudent("");
      setSelectedExam("");
      setSubject("");
      setRating("");
      setMessage("");

      await loadFeedback();
    } catch (error) {
      toast.error("Failed to send feedback");
      console.error("Error sending feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      id
    });
  };

  const confirmDelete = async () => {
    try {
      toast.info("Deleting feedback...");

      await api.delete(`/feedback/${confirmModal.id}`);
      toast.success("Feedback deleted");

      await loadFeedback();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Failed to delete feedback.");
    } finally {
      setConfirmModal({ open: false, id: null });
    }
  };

  return (

    <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto space-y-6">

        <div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">
            Write Feedback
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-4">

            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>

            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Exam</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Rating</option>
              <option value="5">Excellent</option>
              <option value="4">Good</option>
              <option value="3">Average</option>
              <option value="2">Needs Improvement</option>
              <option value="1">Poor</option>
            </select>
          </div>

          <textarea
            placeholder="Write your feedback for the student..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-xl text-sm transition"
          >
            <Send size={16} />
            {submitting ? "Sending..." : "Send Feedback"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Recent Feedback
          </h2>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
              Loading feedback...
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
              No feedback available.
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex justify-between items-start hover:shadow-md transition"
                >
                  <div>
                    <div className="font-semibold text-gray-800">
                      {f.studentName} • {f.examName}
                    </div>

                    {f.subject && (
                      <div className="text-sm text-green-600 mt-1">
                        Subject: {f.subject}
                      </div>
                    )}

                    {f.rating && (
                      <div className="text-sm text-amber-600 mt-1">
                        Rating: {f.rating}
                      </div>
                    )}

                    <p className="text-gray-700 mt-2">
                      {f.message}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(f.id)}
                    className="border border-red-300 text-red-600 hover:bg-red-50 p-2 rounded-xl transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {confirmModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Confirmation
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this feedback?
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setConfirmModal({ open: false, id: null })}
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