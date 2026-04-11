import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../../services/api";

import {
  BarChart3,
  Download,
  TrendingUp,
  Trophy,
  Users
} from "lucide-react";

export default function Results() {

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId");

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(examId || "");
  const [results, setResults] = useState([]);
  const [examStatus, setExamStatus] = useState("");

  /* LOAD EXAMS */

  useEffect(() => {

    api.get("/teacher/exams")
      .then((res) => setExams(res.data))
      .catch(() => toast.error("Failed to load exams"));

  }, []);

  /* SYNC URL PARAM */

  useEffect(() => {

    if (examId) {
      setSelectedExam(examId);
    }

  }, [examId]);

  /* LOAD RESULTS */

  useEffect(() => {

    if (!selectedExam) {
      setResults([]);
      return;
    }

    api.get(`/teacher/exams/${selectedExam}/results`)
      .then((res) => {
        const sorted = [...res.data].sort(
          (a, b) => b.overallPercentage - a.overallPercentage
        );
        setResults(sorted);
      })
      .catch(() => toast.error("Failed to load results"));

  }, [selectedExam]);


  /* LOAD EXAM STATUS */

  useEffect(() => {

    if (!selectedExam) {
      setExamStatus("");
      return;
    }

    api.get(`/teacher/exams/${selectedExam}/status`)
      .then((res) => {
        const status = res.data.status || res.data;
        setExamStatus(String(status).toLowerCase());
      })
      .catch(() => setExamStatus(""));

  }, [selectedExam]);

  /* CALCULATIONS */

  const totalStudents = results.length;

  const classAverage =
    totalStudents > 0
      ? (
        results.reduce((sum, r) => sum + r.overallPercentage, 0) /
        totalStudents
      ).toFixed(2)
      : 0;

  const highestScore =
    totalStudents > 0
      ? Math.max(...results.map((r) => r.overallPercentage))
      : 0;

  const passRate =
    totalStudents > 0
      ? (
        (results.filter((r) => r.overallPercentage >= 40).length /
          totalStudents) *
        100
      ).toFixed(0)
      : 0;

  /* GRADE DISTRIBUTION */

  const gradeCounts = {};

  results.forEach((r) => {
    gradeCounts[r.overallGrade] =
      (gradeCounts[r.overallGrade] || 0) + 1;
  });

  const pieData = Object.keys(gradeCounts).map((grade) => ({
    name: grade,
    value: gradeCounts[grade],
  }));

  const COLORS = ["#16a34a", "#2563eb", "#f97316", "#dc2626"];


  const handleExportPDF = async () => {

    if (!selectedExam) return;

    try {

      const response = await api.get(
        `/teacher/exams/${selectedExam}/export-pdf`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ExamResults.pdf");
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const err = JSON.parse(reader.result);

          toast.error(err.message || "PDF export failed");

        } catch {
          toast.error("PDF export failed");
        }
      };
      if (error.response?.data instanceof Blob) {
        reader.readAsText(error.response.data);
      } else {
        toast.error("Something went wrong");
      }

      console.error(error);
    }
  };

  return (

    <div className="p-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      {/* SELECT EXAM */}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">

        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 w-80 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >

          <option value="">Select Exam</option>

          {exams.map((e) => (

            <option key={e.id} value={e.id}>
              {e.name}
            </option>

          ))}

        </select>

      </div>

      {!selectedExam && (

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">

          <div className="flex flex-col items-center">

            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-4">
              <BarChart3 size={26} />
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              Select an exam to view results
            </h2>

            <p className="text-gray-500 text-sm mt-2 max-w-md">
              Choose an exam above to analyze performance, rankings, and grade distribution.
            </p>

          </div>

        </div>

      )}

      {selectedExam && results.length > 0 && (

        <>

          {examStatus !== "published" && (
            <div className="mb-6 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">

              <div className="flex items-center gap-3">

                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
                  !
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Exam not published
                  </p>
                  <p className="text-xs text-red-600">
                    Publish the exam to enable PDF export.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* STATS */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

            <StatCard title="Total Students" value={totalStudents} icon={<Users />} />

            <StatCard title="Class Average" value={`${classAverage}%`} icon={<TrendingUp />} highlight />

            <StatCard title="Highest Score" value={`${highestScore}%`} icon={<Trophy />} highlight />

            <StatCard title="Pass Rate" value={`${passRate}%`} icon={<BarChart3 />} />

          </div>

          {/* CHARTS */}

          <div className="grid lg:grid-cols-2 gap-8 mb-10">

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

              <h2 className="text-xl font-semibold mb-6">
                Student Percentage Overview
              </h2>

              <ResponsiveContainer width="100%" height={320}>

                <BarChart data={results}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="studentName"
                    tickFormatter={(name) => name.split(" ")[0]}
                    interval={0}
                  />

                  <YAxis domain={[0, 100]} />

                  <Tooltip formatter={(value) => `${value}%`} />

                  <Bar
                    dataKey="overallPercentage"
                    fill="#16a34a"
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

              <h2 className="text-xl font-semibold mb-6">
                Grade Distribution
              </h2>

              <ResponsiveContainer width="100%" height={320}>

                <PieChart>

                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >

                    {pieData.map((entry, index) => (

                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />

                    ))}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* TABLE */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-2xl font-semibold">
                Student Rankings
              </h2>

              <button
                onClick={handleExportPDF}
                disabled={examStatus !== "published"}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition 
                  ${examStatus === "published"
                    ? "bg-gray-100 hover:bg-gray-200"
                    : "bg-gray-200 cursor-not-allowed opacity-60"
                  }`}
              >
                <Download size={16} />
                Export PDF
              </button>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b text-gray-500 uppercase text-sm">

                  <tr>
                    <th className="py-3">Rank</th>
                    <th>Student</th>
                    <th className="text-center">Overall %</th>
                    <th className="text-center">Overall GPA</th>
                    <th className="text-center">Overall Grade</th>
                  </tr>

                </thead>

                <tbody>

                  {results.map((r, index) => (

                    <tr
                      key={r.studentId}
                      className="border-b last:border-none hover:bg-gray-50"
                    >

                      <td className="py-4 font-semibold">
                        {index + 1}
                      </td>

                      <td>{r.studentName}</td>

                      <td className="text-center">
                        {r.overallPercentage}%
                      </td>

                      <td className="text-center">
                        {r.overallGPA}
                      </td>

                      <td className="text-center font-semibold">
                        {r.overallGrade}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

    </div>

  );

}

function StatCard({ title, value, icon, highlight }) {

  return (

    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">

      <div>

        <p className="text-gray-500 text-sm">
          {title}
        </p>

        <h3
          className={`text-3xl font-bold ${highlight ? "text-green-600" : "text-gray-800"
            }`}
        >
          {value}
        </h3>

      </div>

      <div className="text-green-600 bg-green-100 p-2 rounded-xl">
        {icon}
      </div>

    </div>

  );

}