import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function TeacherStudentProfile() {

  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      const res = await api.get(`/teacher/students/${id}/full-profile`);
      setData(res.data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load student profile. Please try again.");
    }
  };

  if (!data) {
    return <div className="px-6 pt-3 text-sm text-gray-500">Loading...</div>;
  }

  const {
    student = {},
    subjects = [],
    strongSubjects = [],
    weakSubjects = [],
    average = 0,
    consistency = "N/A"
  } = data || {};

  const imageUrl = student.photoUrl
    ? encodeURI(`${BASE}${student.photoUrl}`)
    : null;

  const initials = (student.fullName || "U")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  const getStatus = () => {
    if (!average) return "Average";
    if (average >= 85) return "Topper";
    if (average < 50) return "At Risk";
    return "Average";
  };

  const status = getStatus();

  const groupedByTerm = {};

  subjects.forEach((sub) => {
    const term = sub.examName || "Unknown Term";

    if (!groupedByTerm[term]) {
      groupedByTerm[term] = [];
    }

    groupedByTerm[term].push(sub);
  });

  const getUniqueSubjects = (list) => {
    const map = {};
    list.forEach((s) => {
      map[s.subject] = s;
    });
    return Object.values(map);
  };

  const groupedSubjects = Object.values(
    subjects.reduce((acc, curr) => {
      if (!acc[curr.subject]) {
        acc[curr.subject] = {
          subject: curr.subject,
          total: 0,
          count: 0
        };
      }
      acc[curr.subject].total += curr.percentage;
      acc[curr.subject].count += 1;
      return acc;
    }, {})
  ).map(s => ({
    subject: s.subject,
    percentage: (s.total / s.count).toFixed(1)
  }));

  return (

    <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => navigate("/teacher/students")}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-100 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* 🔥 TOP SUMMARY STRIP */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl px-6 py-5 shadow-sm flex justify-between items-center">

          <div className="flex items-center gap-4">

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="student"
                className="w-14 h-14 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white text-green-600 flex items-center justify-center font-semibold">
                {initials}
              </div>
            )}

            <div>
              <p className="text-lg font-semibold">{student.fullName}</p>
              <p className="text-sm opacity-90">{student.email}</p>
            </div>

          </div>

          <div className="flex gap-8 text-right">

            <div>
              <p className="text-xs opacity-80">Average</p>
              <p className="text-xl font-semibold">{average}%</p>
            </div>

            <div>
              <p className="text-xs opacity-80">Consistency</p>
              <p className="text-sm">{consistency}</p>
            </div>

            <div>
              <p className="text-xs opacity-80">Status</p>
              <p className="text-sm font-semibold">{status}</p>
            </div>

          </div>

        </div>

        {/* PROFILE DETAILS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

          <div>
            <p className="text-gray-400">Phone</p>
            <p className="font-medium">{student.phone || "-"}</p>
          </div>

          <div>
            <p className="text-gray-400">Gender</p>
            <p className="font-medium">{student.gender || "-"}</p>
          </div>

          <div>
            <p className="text-gray-400">Address</p>
            <p className="font-medium">{student.address || "-"}</p>
          </div>

          <div>
            <p className="text-gray-400">Guardian</p>
            <p className="font-medium">{student.guardianName || "-"}</p>
          </div>

        </div>

        {/* STRONG / WEAK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
            <h3 className="text-sm font-semibold mb-4 text-gray-700">
              Strong Subjects
            </h3>

            <div className="flex flex-wrap gap-2">
              {strongSubjects.map((s, i) => (
                <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
            <h3 className="text-sm font-semibold mb-4 text-gray-700">
              Weak Subjects
            </h3>

            <div className="flex flex-wrap gap-2">
              {weakSubjects.map((s, i) => (
                <span key={i} className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* TERM-WISE (UPDATED TO 2-COLUMN GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {Object.entries(groupedByTerm).map(([term, list]) => {

            const unique = getUniqueSubjects(list);

            return (
              <div key={term} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 h-full">

                <h3 className="text-sm font-semibold mb-3 text-gray-800">
                  {term}
                </h3>

                <div className="space-y-2">

                  {unique.map((sub, i) => {

                    const isWeak = sub.percentage < 40;

                    return (
                      <div
                        key={i}
                        className={`px-4 py-2 rounded-lg text-sm ${isWeak
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-700"
                          }`}
                      >
                        {sub.subject} — {sub.percentage}%
                      </div>
                    );
                  })}

                </div>

              </div>
            );

          })}

        </div>

        {/* SUBJECT PERFORMANCE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">

          <h3 className="text-sm font-semibold mb-4 text-gray-700">
            Subject Performance Overview
          </h3>

          {groupedSubjects.map((sub, i) => (

            <div key={i} className="mb-4">

              <div className="flex justify-between text-sm mb-1">
                <span>{sub.subject}</span>
                <span>{sub.percentage}%</span>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${sub.percentage}%` }}
                />
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}