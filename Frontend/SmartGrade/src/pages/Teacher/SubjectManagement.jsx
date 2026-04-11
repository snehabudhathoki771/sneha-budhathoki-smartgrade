import api from "../../services/api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function SubjectManagement() {

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const { examId } = useParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // CONFIRM MODAL STATE
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null
  });

  // FETCH SUBJECTS
  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/teacher/exams/${examId}/subjects`);
      setSubjects(res.data);

      setSubjects([...res.data]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      fetchSubjects();
    }
  }, [examId]);

  // Add or update subject 
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/teacher/subjects/${editingId}`, {
          name: subjectName
        });
        toast.success("Subject updated");
      } else {
        await api.post("/teacher/subject", {
          name: subjectName,
          examId: Number(examId),
        });
        toast.success("Subject added");
      }

      setSubjectName("");
      setEditingId(null);

      await fetchSubjects();

    } catch (err) {
      console.error(err);
    }
  };

  // UPDATED DELETE
  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      id
    });
  };

  // CONFIRM DELETE
  const confirmDelete = async () => {
    try {
      await api.delete(`/teacher/subjects/${confirmModal.id}`);
      toast.success("Subject deleted");

      await fetchSubjects();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModal({ open: false, id: null });
    }
  };

  const handleEdit = (subject) => {
    setSubjectName(subject.name);
    setEditingId(subject.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setSubjectName("");
    setEditingId(null);
  };

  return (
    <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-6 flex justify-end">

          <button
            onClick={() => navigate("/teacher/exams")}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-100 transition"
          >
            ← Back
          </button>

        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">

            <input
              type="text"
              placeholder="Subject Name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
              required
            />

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition text-sm font-medium"
            >
              {editingId ? "Update" : "Add Subject"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-300 transition text-sm"
              >
                Cancel
              </button>
            )}

          </form>

        </div>

        {/* SUBJECT LIST */}
        {loading ? (
          <p className="text-gray-500">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-gray-400">
            No subjects added yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            {subjects.map((subject) => (

              <div
                key={subject.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
              >

                <h3 className="text-base font-semibold text-gray-800">
                  {subject.name}
                </h3>

                <div className="mt-5 flex gap-3">

                  <button
                    onClick={() => handleEdit(subject)}
                    className="flex-1 py-2 text-sm rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="flex-1 py-2 text-sm rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

      {/* CONFIRM MODAL */}
      {confirmModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Confirmation
            </h2>

            <p className="text-gray-600 mb-6">
              Delete this subject?
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