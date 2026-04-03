import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AssessmentSetup() {

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`
  };

  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [sectionName, setSectionName] = useState("");
  const [weightage, setWeightage] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

  const fetchExams = async () => {
    try {
      const res = await axios.get(
        "https://localhost:7247/api/teacher/exams",
        { headers }
      );
      setExams(res.data);
    } catch {
      toast.error("Failed to load exams");
    }
  };

  const fetchSubjects = async (examId) => {
    try {
      const res = await axios.get(
        `https://localhost:7247/api/teacher/exams/${examId}/subjects`,
        { headers }
      );
      setSubjects(res.data);
    } catch {
      toast.error("Failed to load subjects");
    }
  };

  const fetchSections = async (subjectId) => {
    try {
      const res = await axios.get(
        `https://localhost:7247/api/teacher/subjects/${subjectId}/sections`,
        { headers }
      );
      setSections(res.data);
    } catch {
      toast.error("Failed to load sections");
      setSections([]);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSubjects(selectedExam);
      setSelectedSubject("");
      setSections([]);
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedSubject) fetchSections(selectedSubject);
  }, [selectedSubject]);

  const totalWeight = sections.reduce(
    (sum, sec) => sum + sec.weightage,
    0
  );

  const totalMarks = sections.reduce(
    (sum, sec) => sum + sec.maxMarks,
    0
  );

  const isStructureValid = totalWeight === 100;

  const resetForm = () => {
    setSectionName("");
    setWeightage("");
    setMaxMarks("");
    setEditingId(null);
  };

  const resetSelection = () => {
    setSelectedExam("");
    setSelectedSubject("");
    setSubjects([]);
    setSections([]);
    resetForm();
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!selectedSubject)
      return toast.warning("Please select exam and subject.");

    if (!sectionName.trim())
      return toast.warning("Section name is required.");

    if (weightage <= 0 || weightage > 100)
      return toast.warning("Weightage must be between 1 and 100.");

    if (maxMarks <= 0)
      return toast.warning("Max marks must be greater than 0.");

    if (!editingId && totalWeight + Number(weightage) > 100)
      return toast.warning("Total weightage cannot exceed 100%.");

    setLoading(true);

    try {

      if (editingId) {

        await axios.put(
          `https://localhost:7247/api/teacher/sections/${editingId}`,
          {
            name: sectionName.trim(),
            weightage: Number(weightage),
            maxMarks: Number(maxMarks)
          },
          { headers }
        );
        toast.success("Section updated successfully");
        setEditingId(null);

      } else {

        await axios.post(
          "https://localhost:7247/api/teacher/section",
          {
            name: sectionName.trim(),
            weightage: Number(weightage),
            maxMarks: Number(maxMarks),
            subjectId: Number(selectedSubject)
          },
          { headers }
        );
        toast.success("Section added successfully");

      }

      resetForm();
      fetchSections(selectedSubject);

    } catch (error) {

      toast.error(error.response?.data || "Error saving section.");

    }

    setLoading(false);

  };

  const handleDelete = async (id) => {

    if (!window.confirm("Delete this section?")) return;

    try {
      toast.info("Deleting section...");
      await axios.delete(
        `https://localhost:7247/api/teacher/sections/${id}`,
        { headers }
      );
      toast.success("Section deleted successfully");
    } catch (error) {
      toast.error(error.response?.data || "Error deleting section.");
    }

    fetchSections(selectedSubject);

  };

  const handleEdit = (section) => {

    setSectionName(section.name);
    setWeightage(section.weightage);
    setMaxMarks(section.maxMarks);
    setEditingId(section.id);

  };

  return (

    <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          
        </div>

        {/* SELECT CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">

          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <button
            onClick={resetSelection}
            className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition text-sm"
          >
            Clear
          </button>

        </div>

        {/* FORM CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">

            <input
              type="text"
              placeholder="Section Name"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />

            <input
              type="number"
              placeholder="Max Marks"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              required
            />

            <input
              type="number"
              placeholder="Weightage %"
              value={weightage}
              onChange={(e) => setWeightage(e.target.value)}
              className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition text-sm"
            >
              {editingId ? "Update" : "Add"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition text-sm"
              >
                Cancel
              </button>
            )}

          </form>

        </div>

        {/* TABLE CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          <h2 className="text-base font-semibold mb-4 text-gray-800">
            Sections
          </h2>

          {sections.length === 0 ? (

            <p className="text-gray-500">
              No sections added yet.
            </p>

          ) : (

            <>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-b text-gray-400 uppercase text-xs">

                      <th className="pb-4">Section</th>
                      <th className="pb-4 text-center">Max Marks</th>
                      <th className="pb-4 text-center">Weightage</th>
                      <th className="pb-4 text-center">Actions</th>

                    </tr>

                  </thead>

                  <tbody>

                    {sections.map((sec) => (

                      <tr key={sec.id} className="border-t hover:bg-gray-50">

                        <td className="py-4">{sec.name}</td>

                        <td className="py-4 text-center">
                          {sec.maxMarks}
                        </td>

                        <td className="py-4 text-center">
                          {sec.weightage}%
                        </td>

                        <td className="py-4 text-center space-x-2">

                          <button
                            onClick={() => handleEdit(sec)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(sec.id)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              <div className="mt-6 p-5 rounded-xl border border-gray-100 bg-gray-50">

                <p className="text-sm">Total Sections: {sections.length}</p>
                <p className="text-sm">Total Marks: {totalMarks}</p>

                <p className={`text-sm ${isStructureValid ? "text-green-600" : "text-red-600"}`}>
                  Total Weightage: {totalWeight}%
                </p>

                {!isStructureValid && (
                  <p className="text-red-500 text-xs mt-2">
                    Total weightage must equal 100%.
                  </p>
                )}

              </div>

            </>

          )}

        </div>

      </div>

    </div>

  );

}