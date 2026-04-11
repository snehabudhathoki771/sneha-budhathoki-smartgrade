import { BarChart3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function AddMarks() {

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [marksData, setMarksData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const inputRefs = useRef([]);

  const safeGet = async (url, setter) => {
    try {
      const res = await api.get(url);
      setter(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setErrorMessage("Failed to load data.");
      }
    }
  };

  const resetSelection = () => {
    setSelectedExam("");
    setSelectedSubject("");
    setSelectedSection("");
    setSubjects([]);
    setSections([]);
    setMarksData([]);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetMarks = () => {
    setMarksData(
      students.map((s) => ({
        studentId: s.id,
        marksObtained: "",
      }))
    );
  };

  useEffect(() => {
    safeGet("/teacher/exams", setExams);
  }, []);

  useEffect(() => {

    if (!selectedExam) {
      setSubjects([]);
      setSelectedSubject("");
      setSections([]);
      setSelectedSection("");
      return;
    }

    safeGet(
      `/teacher/exams/${selectedExam}/subjects`, setSubjects);

    setSelectedSubject("");
    setSelectedSection("");

  }, [selectedExam]);

  useEffect(() => {

    if (!selectedSubject) {
      setSections([]);
      setSelectedSection("");
      return;
    }

    safeGet(`/teacher/subjects/${selectedSubject}/sections`, setSections);

  }, [selectedSubject]);

  useEffect(() => {

    safeGet("/teacher/students", (data) => {

      setStudents(data);

      setMarksData(
        data.map((s) => ({
          studentId: s.id,
          marksObtained: "",
        }))
      );

    });

  }, []);

  useEffect(() => {

    if (!selectedSection) return;

    api.get(`/teacher/marks/${selectedSection}`)
      .then((res) => {

        const existingMarks = res.data;

        setMarksData(() =>
          students.map((student) => {

            const existing = existingMarks.find(
              (m) => m.studentId === student.id
            );

            return {
              studentId: student.id,
              marksObtained: existing ? existing.marksObtained : "",
            };

          })
        );

      })
      .catch(() => {

        setMarksData(
          students.map((s) => ({
            studentId: s.id,
            marksObtained: "",
          }))
        );

      });

  }, [selectedSection, students]);

  const selectedSectionObj = sections.find(
    (s) => s.id === Number(selectedSection)
  );

  const handleChange = (studentId, value) => {

    if (!selectedSectionObj) return;

    const numericValue = Number(value);

    if (isNaN(numericValue)) return;
    if (numericValue < 0) return;
    if (numericValue > selectedSectionObj.maxMarks) return;

    setMarksData((prev) =>
      prev.map((m) =>
        m.studentId === studentId
          ? { ...m, marksObtained: value }
          : m
      )
    );

  };

  const handleKeyDown = (e, index) => {

    if (e.key === "Enter") {

      e.preventDefault();

      const nextInput = inputRefs.current[index + 1];

      if (nextInput) {
        nextInput.focus();
      }

    }

  };

  const enteredCount = marksData.filter(
    (m) => m.marksObtained !== ""
  ).length;

  const handleSave = async () => {

    if (!selectedExam || !selectedSubject || !selectedSection) {
      setErrorMessage("Please select exam, subject and section.");
      return;
    }

    const validMarks = marksData.filter(
      (m) => m.marksObtained !== ""
    );

    if (validMarks.length === 0) {
      setErrorMessage("Enter at least one mark.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {

      const payload = validMarks.map(m => ({
        studentId: Number(m.studentId),
        examId: Number(selectedExam),
        subjectId: Number(selectedSubject),
        sectionId: Number(selectedSection),
        marksObtained: Number(m.marksObtained),
        maxMarks: Number(selectedSectionObj.maxMarks)
      }));

      const res = await api.post(
        "/teacher/marks/bulk",
        payload
      );

      setSuccessMessage(
        `Inserted: ${res.data.inserted} | Skipped: ${res.data.skipped}`
      );

    } catch (err) {

      console.error(err);

      if (err.response?.data) {
        setErrorMessage(err.response.data);
      } else {
        setErrorMessage("Error saving marks.");
      }

    }

    setLoading(false);

  };

  return (

    <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto">

        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm">
            {successMessage}
          </div>
        )}

        {/* FILTER CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">

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

            <select
              disabled={!selectedExam}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              disabled={!selectedSubject}
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Section</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.maxMarks})
                </option>
              ))}
            </select>

            <button
              onClick={resetSelection}
              className="border border-gray-300 text-gray-700 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition text-sm"
            >
              Clear
            </button>

            <button
              onClick={handleSave}
              disabled={loading || enteredCount === 0}
              className="bg-green-600 text-white rounded-xl px-4 py-2.5 hover:bg-green-700 transition text-sm"
            >
              {loading ? "Saving..." : "Save"}
            </button>

          </div>

        </div>

        {/* MARKS TABLE */}
        {!selectedSectionObj ? (

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

            <div className="max-w-md mx-auto">

              <div className="mb-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <BarChart3 size={24} />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Ready to Enter Marks
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                Select an exam, subject, and section above to start entering student marks.
              </p>

              <p className="text-xs text-gray-400">
                Tip: Press Enter to quickly move between inputs while entering marks.
              </p>

            </div>

          </div>

        ) : (

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            <div className="mb-4 flex justify-between items-center">

              <button
                onClick={resetMarks}
                className="border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-100 text-sm"
              >
                Reset Marks
              </button>

              <p className="text-sm text-gray-500">
                Max Marks: {selectedSectionObj.maxMarks} | {enteredCount} entered
              </p>

            </div>

            <div className="max-h-[500px] overflow-y-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b text-gray-400 uppercase text-xs">
                    <th className="pb-4 text-left">Student</th>
                    <th className="pb-4 text-left">Marks</th>
                    <th className="pb-4 text-left">%</th>
                    <th className="pb-4 text-left">Grade</th>
                    <th className="pb-4 text-left">GPA</th>
                  </tr>
                </thead>

                <tbody>

                  {students.map((student, index) => {

                    const studentMark =
                      marksData.find(
                        (m) => m.studentId === student.id
                      )?.marksObtained || "";

                    const percentage =
                      studentMark !== ""
                        ? (
                          (Number(studentMark) /
                            selectedSectionObj.maxMarks) *
                          100
                        ).toFixed(1)
                        : null;

                    const grade = "Pending";
                    const gpa = "Pending";

                    return (

                      <tr key={student.id} className="border-t hover:bg-gray-50">

                        <td className="py-4 font-medium">
                          {student.fullName}
                        </td>

                        <td className="py-4">
                          <input
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="number"
                            min="0"
                            max={selectedSectionObj.maxMarks}
                            step="0.01"
                            value={studentMark}
                            className="border border-gray-200 rounded-xl px-3 py-1.5 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            onChange={(e) =>
                              handleChange(student.id, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(e, index)}
                          />
                        </td>

                        <td className="py-4">
                          {percentage ? `${percentage}%` : "-"}
                        </td>

                        <td className="py-4">{grade}</td>

                        <td className="py-4 text-green-600 font-semibold">
                          {gpa}
                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}