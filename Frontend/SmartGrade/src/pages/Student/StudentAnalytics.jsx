import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaChartLine,
  FaBalanceScale,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import { getStudentAnalytics } from "../../services/api";

export default function StudentAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const toastId = toast.loading("Loading analytics...");

    try {
      const res = await getStudentAnalytics();
      setAnalytics(res.data);

      toast.update(toastId, {
        render: "Analytics loaded successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
    } catch {
      toast.update(toastId, {
        render: "Failed to load analytics",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 space-y-6 animate-pulse bg-slate-50 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>

        <div className="h-40 bg-slate-200 rounded-2xl"></div>
      </div>
    );

  if (!analytics) return null;

  const COLORS = ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];

  const subjectData = [
    ...analytics.strongSubjects.map((s) => ({ name: s, value: 80 })),
    ...analytics.weakSubjects.map((s) => ({ name: s, value: 40 })),
  ];

  const sectionData = (analytics.weakSections || []).map((s) => ({
    name: s,
    value: Number((100 / analytics.weakSections.length).toFixed(1)),
  }));

  const consistency =
    analytics.averagePercentage >= 75
      ? "Highly Consistent"
      : analytics.averagePercentage >= 50
        ? "Moderately Consistent"
        : "Needs Improvement";

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen px-8 py-6 max-w-[1400px] mx-auto">

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
          <FaChartLine className="text-emerald-500 text-xl" />
          <div>
            <p className="text-sm text-slate-500">Average Performance</p>
            <h2 className="text-xl font-semibold text-emerald-600">
              {analytics.averagePercentage}%
            </h2>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
          <FaBalanceScale className="text-emerald-500 text-xl" />
          <div>
            <p className="text-sm text-slate-500">Consistency Level</p>
            <h2 className="text-sm font-semibold text-slate-800">
              {consistency}
            </h2>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
          <FaCheckCircle className="text-emerald-500 text-xl" />
          <div>
            <p className="text-sm text-slate-500">Strong Subjects</p>
            <h2 className="text-xl font-semibold text-emerald-600">
              {analytics.strongSubjects.length}
            </h2>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3">
          <FaExclamationTriangle className="text-red-500 text-xl" />
          <div>
            <p className="text-sm text-slate-500">Weak Subjects</p>
            <h2 className="text-xl font-semibold text-red-500">
              {analytics.weakSubjects.length}
            </h2>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold mb-4 text-slate-800">
            Strong Subjects
          </h3>

          {analytics.strongSubjects.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No strong subjects yet.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.strongSubjects.map((s, i) => (
                <div
                  key={i}
                  className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-200 hover:shadow-md transition"
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold mb-4 text-slate-800">
            Weak Subjects
          </h3>

          {analytics.weakSubjects.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No weak subjects.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.weakSubjects.map((s, i) => (
                <div
                  key={i}
                  className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200 hover:shadow-md transition"
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold mb-4 text-slate-800">
            Subject Performance Overview
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={subjectData}
              margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
            >
              <XAxis
                dataKey="name"
                angle={-15}
                textAnchor="end"
                interval={0}
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold mb-4 text-slate-800">
            Weak Section Distribution
          </h3>

          {sectionData.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No weak sections.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={sectionData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={({ percent }) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                >
                  {sectionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#EF4444", "#F87171", "#FCA5A5"][index % 3]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Insight */}
      <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
        <h3 className="text-lg font-semibold mb-3">
          Personalized Suggestion
        </h3>
        <p className="leading-7 opacity-90">
          {analytics.insight}
        </p>
      </div>

      {/* Weekly Focus */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Recommended Focus This Week
        </h3>
        <ul className="space-y-3 text-sm text-slate-600">
          <li>Revise all weak subjects for at least 2 hours</li>
          <li>Practice low-performing weak sections</li>
          <li>Strengthen strong subjects to maintain consistency</li>
        </ul>
      </div>
    </div>
  );
}