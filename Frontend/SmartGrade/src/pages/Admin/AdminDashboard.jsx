import api from "../../services/api";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  UserCheck,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [passFail, setPassFail] = useState(null);
  const [subjectAvg, setSubjectAvg] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const overview = await api.get("/admin/dashboard-overview");

        const passFailRes = await api.get("/admin/analytics/pass-fail", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const subjectAvgRes = await api.get("/admin/analytics/average-score-subject", {
          headers: { Authorization: `Bearer ${token}` }         }
        );

        setData(overview.data);
        setPassFail(passFailRes.data);
        setSubjectAvg(subjectAvgRes.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };

    fetchDashboard();
  }, []);

  if (!data || !passFail) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500 text-lg bg-gradient-to-br from-gray-50 to-gray-100">
        Loading Dashboard...
      </div>
    );
  }

  const pieData = [
    { name: "Passed", value: passFail.passed },
    { name: "Failed", value: passFail.failed }
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  /* ================= GROUP BY EXAM ================= */

  const grouped = (data.charts?.subjectFailureRanking || []).reduce((acc, item) => {

    const examName = item.exam || "Unknown Exam"; // ✅ FIX

    if (!acc[examName]) {
      acc[examName] = [];
    }

    acc[examName].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="mb-10"></div>

      {/* ================= SYSTEM STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard title="Total Students" value={data.stats.totalStudents} icon={<Users size={18} />} />
        <StatCard title="Total Teachers" value={data.stats.totalTeachers} icon={<UserCheck size={18} />} />
        <StatCard title="Total Exams" value={data.stats.totalExams} icon={<FileText size={18} />} />
        <StatCard title="Published Exams" value={data.stats.publishedExams} icon={<CheckCircle size={18} />} />

      </div>

      {/* ================= PERFORMANCE ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <PerformanceCard
          title="System Average"
          value={`${data.performance.systemAverage.toFixed(2)}%`}
          color="bg-gradient-to-r from-green-500 to-emerald-600"
          icon={<TrendingUp size={18} />}
        />

        <PerformanceCard
          title="At-Risk Students"
          value={data.performance.atRiskStudents}
          color="bg-gradient-to-r from-red-500 to-rose-600"
          icon={<AlertTriangle size={18} />}
        />

      </div>

      {/* ================= SUBJECT FAILURE ================= */}
      <div className="space-y-4">

        <h2 className="text-xl font-semibold text-gray-800">
          Subject Failure Ranking (Term-wise)
        </h2>

        {Object.keys(grouped).map((exam, index) => (

          <div
            key={index}
            className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 p-6 shadow-lg space-y-5"
          >

            <h3 className="text-md font-semibold text-gray-700">
              {exam}
            </h3>

            {grouped[exam]
              .sort((a, b) => (b.failureRate || 0) - (a.failureRate || 0)) // ✅ FIX
              .slice(0, 5)
              .map((s, i) => (
                <ProgressRow
                  key={i}
                  label={s.subject || "Unknown Subject"} // ✅ FIX
                  value={s.failureRate}
                />
              ))}

          </div>

        ))}

      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PIE */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-lg">

          <h2 className="text-xl font-semibold mb-5 text-gray-800">
            Pass vs Fail Distribution
          </h2>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>

              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>

              <Tooltip formatter={(value) => `${value} students`} />
              <Legend />

            </PieChart>
          </ResponsiveContainer>

        </div>

        {/* BAR */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-lg">

          <h2 className="text-xl font-semibold mb-5 text-gray-800">
            Average Score by Subject
          </h2>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={subjectAvg}
              margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
            >

              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

              <XAxis
                dataKey="subject"
                angle={-25}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 12 }}
              />

              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />

              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />

              <Legend />

              <Bar
                dataKey="averageScore"
                fill="#22C55E"
                radius={[10, 10, 0, 0]}
                name="Average %"
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}


/* ================= STAT CARD ================= */
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 px-6 py-5 flex items-center justify-between min-h-[100px] shadow-md hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col justify-center">
        <div className="text-gray-500 text-xs font-medium tracking-wide">{title}</div>
        <div className="text-2xl font-semibold text-gray-800 mt-2">{value}</div>
      </div>
      <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-600 shadow-inner">
        {icon}
      </div>
    </div>
  );
}


/* ================= PERFORMANCE CARD ================= */
function PerformanceCard({ title, value, color, icon }) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 px-6 py-5 flex items-center justify-between min-h-[100px] shadow-md hover:shadow-xl transition">
      <div>
        <div className="text-gray-500 text-xs font-medium tracking-wide">{title}</div>
        <div className="text-2xl font-semibold text-gray-800 mt-2">{value}</div>
      </div>
      {icon && (
        <div className={`h-11 w-11 flex items-center justify-center rounded-2xl text-white shadow-md ${color}`}>
          {icon}
        </div>
      )}
    </div>
  );
}


/* ================= PROGRESS ROW ================= */
function ProgressRow({ label, value }) {

  const safeValue = value || 0;

  return (
    <div>
      <div className="flex justify-between mb-2">

        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>

        <span className="text-xs text-gray-500">
          {safeValue === 0 ? "No failures" : `${safeValue.toFixed(1)}%`}
        </span>

      </div>

      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">

        <div
          className="bg-gradient-to-r from-red-500 to-rose-500 h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${safeValue}%` }}
        />

      </div>
    </div>
  );
}