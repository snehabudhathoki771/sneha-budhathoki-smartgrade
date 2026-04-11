import api from "../../services/api";
import { useEffect, useMemo, useState } from "react";
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

import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Trophy
} from "lucide-react";

export default function ToppersAtRisk() {

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [toppers, setToppers] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/teacher/exams")
      .then((res) => setExams(res.data))
      .catch(() => toast.error("Failed to load exams"));
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setToppers([]);
      setAtRisk([]);
      setResults([]);
      return;
    }

    setLoading(true);

    Promise.all([
      api.get(`/teacher/exams/${selectedExam}/toppers`),
      api.get(`/teacher/exams/${selectedExam}/at-risk`),
      api.get(`/teacher/exams/${selectedExam}/results`)
    ])
      .then(([toppersRes, atRiskRes, resultsRes]) => {
        setToppers(toppersRes.data);
        setAtRisk(atRiskRes.data);
        setResults(resultsRes.data);
      })
      .catch(() => {
        toast.error("Failed to load analysis");
        setToppers([]);
        setAtRisk([]);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const highestScore =
    toppers.length > 0
      ? Math.max(...toppers.map((t) => t.overallPercentage))
      : 0;

  const lowestScore =
    atRisk.length > 0
      ? Math.min(...atRisk.map((s) => s.overallPercentage))
      : 0;

  const subjectComparison = useMemo(() => {
    if (!results.length) return [];

    const subjectMap = {};

    results.forEach((student) => {
      student.subjects.forEach((sub) => {
        if (!subjectMap[sub.subjectName]) {
          subjectMap[sub.subjectName] = {
            topperScores: [],
            atRiskScores: [],
          };
        }

        if (toppers.some((t) => t.studentId === student.studentId)) {
          subjectMap[sub.subjectName].topperScores.push(sub.percentage);
        }

        if (atRisk.some((a) => a.studentId === student.studentId)) {
          subjectMap[sub.subjectName].atRiskScores.push(sub.percentage);
        }
      });
    });

    return Object.keys(subjectMap).map((subject) => {
      const topperAvg =
        subjectMap[subject].topperScores.length > 0
          ? subjectMap[subject].topperScores.reduce((a, b) => a + b, 0) /
          subjectMap[subject].topperScores.length
          : 0;

      const atRiskAvg =
        subjectMap[subject].atRiskScores.length > 0
          ? subjectMap[subject].atRiskScores.reduce((a, b) => a + b, 0) /
          subjectMap[subject].atRiskScores.length
          : 0;

      return {
        subject,
        toppers: Number(topperAvg.toFixed(2)),
        atRisk: Number(atRiskAvg.toFixed(2)),
      };
    });
  }, [results, toppers, atRisk]);

  const allStudents = [...toppers, ...atRisk];

  const gradeCounts = {};
  allStudents.forEach((s) => {
    gradeCounts[s.overallGrade] =
      (gradeCounts[s.overallGrade] || 0) + 1;
  });

  const pieData = Object.keys(gradeCounts).map((grade) => ({
    name: grade,
    value: gradeCounts[grade],
  }));

  const COLORS = ["#16a34a", "#22c55e", "#facc15", "#ef4444"];

  return (

    <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div>

        </div>

        {/* SELECT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 w-72 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <Trophy size={24} />
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                Select an exam to view analysis
              </h2>

              <p className="text-gray-500 text-sm mt-2 max-w-md">
                Choose an exam to analyze top performers and identify at-risk students.
              </p>

            </div>

          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
            Loading analysis...
          </div>
        )}

        {selectedExam && !loading && (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Top Performers" value={toppers.length} icon={<Trophy />} color="text-green-600" />
              <StatCard title="At-Risk Students" value={atRisk.length} icon={<AlertTriangle />} color="text-red-600" />
              <StatCard title="Highest Score" value={`${highestScore.toFixed(1)}%`} icon={<TrendingUp />} color="text-green-600" />
              <StatCard title="Lowest Score" value={`${lowestScore.toFixed(1)}%`} icon={<TrendingDown />} color="text-red-600" />
            </div>

            {/* CHARTS */}
            <div className="grid lg:grid-cols-2 gap-6">

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">
                  Subject-wise: Toppers vs At-Risk Avg
                </h2>

                {subjectComparison.length === 0 ? (
                  <p className="text-gray-400">No subject data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={subjectComparison} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="subject" width={120} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar dataKey="toppers" fill="#16a34a" />
                      <Bar dataKey="atRisk" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">
                  Grade Distribution
                </h2>

                {pieData.length === 0 ? (
                  <p className="text-gray-400">No grade data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" label>
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* LISTS */}
            <div className="grid lg:grid-cols-2 gap-6">
              <SimpleList title="Top Performers" data={toppers} positive />
              <SimpleList title="At-Risk Students" data={atRisk} />
            </div>
          </>
        )}

      </div>

    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className={`text-2xl font-semibold ${color}`}>
          {value}
        </h3>
      </div>
      <div className={`${color} bg-green-100 p-2 rounded-xl`}>{icon}</div>
    </div>
  );
}

function SimpleList({ title, data, positive }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className={`text-lg font-semibold mb-4 ${positive ? "text-green-600" : "text-red-600"}`}>
        {title}
      </h2>

      {data.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          No data available.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((s) => (
            <div key={s.studentId} className="flex justify-between border-b border-gray-100 pb-2 hover:bg-gray-50 px-2 py-2 rounded-lg transition">
              <span>{s.studentName}</span>
              <span className={`font-semibold ${positive ? "text-green-600" : "text-red-600"}`}>
                {s.overallPercentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}