import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBook,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaDownload,
  FaCommentDots,
  FaStar
} from "react-icons/fa";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import { getStudentDashboard, getStudentResults, downloadExamReport } from "../../services/api";
import { toast } from "react-toastify";

export default function StudentDashboard() {

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {

      const res = await getStudentDashboard();
      setData(res.data);

    } catch (err) {

      setError("Failed to load dashboard");
      toast.error("Failed to load dashboard");

    } finally {

      setLoading(false);
    }
  };

  const handleViewLatestResult = () => {
    navigate("/student/results");
  };

  const handleDownloadReport = async () => {
    const toastId = "latest-report-download";

    try {
      if (!toast.isActive(toastId)) {
        toast.info("Preparing latest report...", { toastId });
      }

      const resultsRes = await getStudentResults();
      const exams = resultsRes.data;

      if (!exams || exams.length === 0) {
        toast.update(toastId, {
          render: "No reports available",
          type: "error",
          autoClose: 3000
        });
        return;
      }

      const latestTrendExam =
        data.performanceTrend?.length
          ? data.performanceTrend[data.performanceTrend.length - 1]
          : null;

      if (!latestTrendExam) {
        toast.update(toastId, {
          render: "No latest exam found",
          type: "error",
          autoClose: 3000
        });
        return;
      }

      const latestExam = exams.find(
        exam => exam.examName === latestTrendExam.examName
      );

      if (!latestExam) {
        toast.update(toastId, {
          render: "Latest report not found",
          type: "error",
          autoClose: 3000
        });
        return;
      }

      const res = await downloadExamReport(latestExam.examId);

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${latestExam.examName}_Report.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: "Latest report downloaded successfully",
        type: "success",
        autoClose: 3000
      });
    } catch (err) {
      toast.update(toastId, {
        render: "Failed to download latest report",
        type: "error",
        autoClose: 3000
      });
    }
  };

  const handleReadFeedback = () => {
    navigate("/student/feedback");

  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse bg-slate-50 min-h-screen">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6 font-medium shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          No data available
        </div>
      </div>
    );
  }

  const gpaDifference = data.gpaDifference ?? 0;
  const hasTrend =
    data.previousGPA !== null && data.previousGPA !== undefined;
  const isImproved = gpaDifference > 0;
  const isDeclined = gpaDifference < 0;

  const statusBadgeClass =
    data.status === "Topper"
      ? "bg-emerald-100 text-emerald-600"
      : data.status === "At Risk"
        ? "bg-red-100 text-red-600"
        : "bg-green-100 text-green-600";

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">

      {/* HERO SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-3">
              <FaGraduationCap className="text-emerald-500" />
              Welcome back, {data.fullName}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {data.motivationMessage ||
                "Track your academic growth and improve consistently."}
            </p>
          </div>

          <div
            className={`px-4 py-2 rounded-full text-xs font-semibold ${statusBadgeClass}`}
          >
            {data.status}
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

        {/* GPA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <FaChartLine size={18} />
            GPA
          </div>

          <h2 className="text-2xl font-semibold mt-3 text-slate-800">{data.gpa}</h2>

          {hasTrend && (
            <div className="mt-2 text-sm flex items-center gap-2">
              {isImproved && (
                <>
                  <FaArrowUp className="text-emerald-500" />
                  <span className="text-emerald-500">
                    +{Math.abs(gpaDifference)}
                  </span>
                </>
              )}

              {isDeclined && (
                <>
                  <FaArrowDown className="text-red-500" />
                  <span className="text-red-500">
                    -{Math.abs(gpaDifference)}
                  </span>
                </>
              )}

              {!isImproved && !isDeclined && (
                <>
                  <FaMinus className="text-slate-400" />
                  <span>No change</span>
                </>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-1">
            Compared to previous exam
          </p>
        </div>

        {/* Percentage */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <FaBook size={18} />
            Percentage
          </div>
          <h2 className="text-2xl font-semibold mt-3 text-slate-800">{data.percentage}%</h2>
        </div>

        {/* Exams */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <FaGraduationCap size={18} />
            Exams
          </div>
          <h2 className="text-2xl font-semibold mt-3 text-slate-800">{data.totalExams}</h2>
        </div>

        {/* Weak Subjects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <FaExclamationTriangle size={18} />
            Weak
          </div>
          <h2 className="text-2xl font-semibold mt-3 text-red-500">
            {data.weakSubjects?.length || 0}
          </h2>
        </div>

        {/* Strong Subjects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <FaStar size={18} />
            Strong
          </div>
          <h2 className="text-2xl font-semibold mt-3 text-emerald-500">
            {data.strongSubjects?.length || 0}
          </h2>
        </div>

      </div>

      {/* PERFORMANCE TREND */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Performance Trend
        </h2>

        {data.performanceTrend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="examName" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#10b981"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm">
            No trend data available yet.
          </p>
        )}
      </div>

      {/* SUMMARY */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 text-slate-700">
        You have completed{" "}
        <span className="font-semibold">{data.totalExams}</span> exams
        with an overall performance of{" "}
        <span className="font-semibold">{data.percentage}%</span> and a
        GPA of <span className="font-semibold">{data.gpa}</span>.
      </div>

      {/* WEAK SUBJECTS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FaExclamationTriangle className="text-yellow-500" />
          Weak Subjects
        </h2>

        {data.weakSubjects?.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <FaCheckCircle />
            No weak subjects detected. Your performance is strong.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.weakSubjects.map((subject, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-sm transition"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700">
                    {subject.name}
                  </span>
                  <span className="font-semibold text-red-500">
                    {subject.percentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-red-500 h-2.5 rounded-full"
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Suggested: 3 extra study hours this week
                </p>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* STRONG SUBJECTS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FaStar className="text-emerald-500" />
          Strong Subjects
        </h2>

        {data.strongSubjects?.length === 0 ? (
          <div className="text-slate-500 text-sm">
            No strong subjects yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.strongSubjects.map((subject, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
              >
                {subject}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleViewLatestResult}
          className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg text-white rounded-xl p-4 font-medium flex items-center justify-center gap-2 transition"
        >
          <FaChartLine />
          View Latest Result
        </button>

        <button
          onClick={handleDownloadReport}
          className="bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg text-white rounded-xl p-4 font-medium flex items-center justify-center gap-2 transition"
        >
          <FaDownload />
          Download Report
        </button>

        <button
          onClick={handleReadFeedback}
          className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg text-white rounded-xl p-4 font-medium flex items-center justify-center gap-2 transition"
        >
          <FaCommentDots />
          Read Feedback
        </button>
      </div>

      {/* AI INSIGHT */}
      <div className="bg-emerald-600 text-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
        <h2 className="text-lg font-semibold">
          AI Study Recommendation
        </h2>
        <p className="text-sm mt-2 opacity-90 leading-6">
          Focus more on your weak subjects and revise consistently based
          on the trend chart. Your biggest growth opportunity lies in
          improving low-performing subjects this week.
        </p>
      </div>

    </div>
  );
}