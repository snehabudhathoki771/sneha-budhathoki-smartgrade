import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function SubjectManagement() {
  const { examId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  //  FETCH SUBJECTS
  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `https://localhost:7247/api/teacher/exams/${examId}/subjects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  //  Add or update subject 
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(
          `https://localhost:7247/api/teacher/subjects/${editingId}`,
          { name: subjectName },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          "https://localhost:7247/api/teacher/subject",
          {
            name: subjectName,
            examId: Number(examId),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setSubjectName("");
      setEditingId(null);

      await fetchSubjects();

    } catch (err) {
      console.error(err);
    }
  };

  //  DELETE SUBJECT 
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;

    try {
      await axios.delete(
        `https://localhost:7247/api/teacher/subjects/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchSubjects();
    } catch (err) {
      console.error(err);
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

    </div>
  );
}