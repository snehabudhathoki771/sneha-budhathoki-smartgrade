import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Clock,
  Users
} from "lucide-react";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchDashboard();
  }, [navigate]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/teacher/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard error:", err);

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      } else {
        toast.error("Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAF9]">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (!data && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAF9]">
        <p className="text-gray-500 text-lg">No data available.</p>
      </div>
    );
  }

  // Get latest exam name
  const subjectData = data.subjectAverages ?? [];
  const trendData = data.trend ?? [];
  const weakAreas = data.weakAreas ?? [];
  const atRiskStudents = data.atRiskStudents ?? [];

  return (
    <div className="px-6 py-8 bg-[#F7FAF9] min-h-screen">

      <div className="max-w-7xl mx-auto space-y-10">

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

          <StatCard title="Total Exams" value={data.totalExams ?? 0} Icon={BookOpen} />
          <StatCard title="Total Students" value={data.totalStudents ?? 0} Icon={Users} />
          <StatCard title="Overall Average" value={`${data.averageScore ?? 0}%`} highlight Icon={BarChart3} />
          <StatCard title="At-Risk Students" value={data.atRiskCount ?? 0} danger Icon={AlertTriangle} />
          <StatCard title="Pending Results" value={data.pendingResults ?? 0} Icon={Clock} />

        </div>

        {/* ================= CHART ================= */}
        <div className="bg-white rounded-2xl shadow-sm p-7">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* SUBJECT */}
            <div>
              <h2 className="text-lg font-semibold mb-6 text-gray-800">
                Subject-wise Average
              </h2>

              {subjectData.length === 0 ? (
                <p className="text-gray-500">No subject data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={subjectData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>

                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                    <XAxis
                      dataKey="subject"
                      stroke="#6B7280"
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.split(" ")[0]}
                    />

                    <YAxis
                      domain={[0, 100]}
                      stroke="#6B7280"
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "10px",
                      }}
                      labelStyle={{ color: "#374151", fontWeight: "500" }}
                      formatter={(value) => [`${value}%`, "Average"]}
                      labelFormatter={(label) => label}
                    />

                    <Bar
                      dataKey="average"
                      fill="#22C55E"
                      radius={[8, 8, 0, 0]}
                    />

                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* TREND */}
            <div>
              <h2 className="text-lg font-semibold mb-6 text-gray-800">
                Performance Trend
              </h2>

              {trendData.length === 0 ? (
                <p className="text-gray-500">No trend data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="exam" stroke="#6B7280" />
                    <YAxis domain={[0, 100]} stroke="#6B7280" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="average"
                      stroke="#22C55E"
                      fill="#22C55E"
                      fillOpacity={0.12}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>

        </div>

        {/* ================= WEAK AREA ================= */}
        <div className="bg-white rounded-2xl shadow-sm p-7">

          <h2 className="text-lg font-semibold mb-6 text-gray-800">
            Weak Area Analytics
          </h2>

          {weakAreas.length === 0 ? (
            <p className="text-gray-500">No section analytics available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weakAreas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="section" stroke="#6B7280" />
                <YAxis domain={[0, 100]} stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="average" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-2xl shadow-sm p-7">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* TOP */}
            <div>

              <h2 className="text-lg font-semibold mb-6 text-gray-800">
                Top Performers
              </h2>

              {!data.topStudents || data.topStudents.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No student results available yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-400 uppercase text-xs">
                      <th className="py-3 text-left">Rank</th>
                      <th className="py-3 text-left">Student</th>
                      <th className="py-3 text-left">Average %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topStudents.map((s, i) => (
                      <tr key={s.studentId} className="border-b last:border-0">
                        <td className="py-3">{i + 1}</td>
                        <td className="py-3">{s.studentName}</td>
                        <td className="py-3 text-green-600 font-semibold">
                          {s.overallPercentage ?? 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>

            {/* AT RISK */}
            <div>

              <h2 className="text-lg font-semibold mb-6 text-gray-800">
                At-Risk Students
              </h2>

              {atRiskStudents.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No at-risk students detected.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-400 uppercase text-xs">
                      <th className="py-3 text-left">Student</th>
                      <th className="py-3 text-left">Average %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRiskStudents.map((s) => (
                      <tr key={s.studentId} className="border-b last:border-0">
                        <td className="py-3">{s.studentName}</td>
                        <td className="py-3 text-red-500 font-semibold">
                          {s.overallPercentage ?? 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ================= STAT CARD ================= */

function StatCard({ title, value, highlight, danger, Icon }) {

  return (

    <div className="bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center hover:shadow-md transition">

      <div>
        <p className="text-gray-500 text-sm">{title}</p>

        <h3 className={`text-xl font-semibold ${highlight ? "text-green-600" :
          danger ? "text-red-500" :
            "text-gray-800"
          }`}>
          {value}
        </h3>
      </div>

      {Icon && (
        <div className={`p-3 rounded-xl ${highlight ? "bg-green-100 text-green-600" :
          danger ? "bg-red-100 text-red-500" :
            "bg-gray-100 text-gray-600"
          }`}>
          <Icon size={20} />
        </div>
      )}

    </div>

  );
}