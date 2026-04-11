import { useEffect, useState, useRef } from "react";
import {
    FaBookOpen,
    FaChartLine,
    FaChevronDown,
    FaChevronUp,
    FaTrophy,
    FaFileDownload,
    FaClock,
    FaCheckCircle,
    FaExclamationTriangle
} from "react-icons/fa";
import { toast } from "react-toastify";
import { getStudentResults, downloadExamReport } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function StudentResultsAndReports() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const [results, setResults] = useState([]);
    const [openExam, setOpenExam] = useState(null);
    const [activeTab, setActiveTab] = useState("results");
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchResults();
    }, []);

    const fetchResults = async () => {
        const toastId = "results-loading";

        try {
            if (!toast.isActive(toastId)) {
                toast.info("Loading results...", { toastId });
            }

            const res = await getStudentResults();
            setResults(res.data);

            toast.update(toastId, {
                render: "Results loaded",
                type: "success",
                autoClose: 3000
            });
        } catch (err) {
            toast.update(toastId, {
                render: "Failed to load results",
                type: "error",
                autoClose: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (examId, examName) => {
        const toastId = `download-${examId}`;

        try {
            if (!toast.isActive(toastId)) {
                toast.info("Downloading report...", { toastId });
            }

            const res = await downloadExamReport(examId);

            // check if response is empty or invalid
            if (!res || !res.data || res.data.byteLength === 0) {
                toast.update(toastId, {
                    render: "Report not available for this exam",
                    type: "warning",
                    autoClose: 3000
                });
                return;
            }

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${examName}_Report.pdf`;
            document.body.appendChild(link);

            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

            toast.update({
                render: "Report downloaded successfully",
                type: "success",
                autoClose: 3000
            });

        } catch (err) {
            console.error(err);

            if (err.response?.status === 404) {
                toast.update(toastId, {
                    render: "Report not available for this exam",
                    type: "warning",
                    autoClose: 3000
                });
            } else {
                toast.update(toastId, {
                    render: "Failed to download report",
                    type: "error",
                    autoClose: 3000
                });
            }
        }
    };

    const calculateSubjectTotal = (sections) => {
        const totalObtained = sections.reduce(
            (sum, sec) => sum + (sec.marksObtained || 0),
            0
        );

        const totalMax = sections.reduce(
            (sum, sec) => sum + (sec.maxMarks || 0),
            0
        );

        const percentage =
            totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        return {
            totalObtained,
            totalMax,
            percentage: Number(percentage.toFixed(2)),
        };
    };

    const calculateExamTotal = (subjects) => {
        let totalObtained = 0;
        let totalMax = 0;

        subjects.forEach((sub) => {
            const subjectTotal = calculateSubjectTotal(sub.sections);
            totalObtained += subjectTotal.totalObtained;
            totalMax += subjectTotal.totalMax;
        });

        const percentage =
            totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        return {
            totalObtained,
            totalMax,
            percentage: Number(percentage.toFixed(2)),
        };
    };

    if (loading) {
        return (
            <div className="p-6 pt-2 space-y-6 bg-slate-50 min-h-screen">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="h-28 bg-slate-200 rounded-2xl"></div>
                    <div className="h-28 bg-slate-200 rounded-2xl"></div>
                    <div className="h-28 bg-slate-200 rounded-2xl"></div>
                    <div className="h-28 bg-slate-200 rounded-2xl"></div>
                </div>
                <div className="h-14 bg-slate-200 rounded-xl w-72"></div>
                <div className="h-40 bg-slate-200 rounded-2xl"></div>
            </div>
        );
    }

    const bestScore =
        results.length > 0
            ? Math.max(
                ...results.map(
                    (r) => calculateExamTotal(r.subjects).percentage
                )
            )
            : 0;

    const avgScore =
        results.length > 0
            ? (
                results.reduce(
                    (sum, r) =>
                        sum + calculateExamTotal(r.subjects).percentage,
                    0
                ) / results.length
            ).toFixed(1)
            : 0;

    const latestExam =
        results.length > 0 ? results[results.length - 1].examName : "N/A";

    return (
        <div className="space-y-8 bg-slate-50 min-h-screen px-8 py-6 max-w-[1400px] mx-auto">

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-3 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <FaBookOpen className="text-emerald-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Total Exams</p>
                        <h2 className="text-xl font-semibold text-slate-800">{results.length}</h2>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-3 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <FaTrophy className="text-amber-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Best Score</p>
                        <h2 className="text-xl font-semibold text-slate-800">{bestScore}%</h2>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-3 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <FaChartLine className="text-emerald-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Average</p>
                        <h2 className="text-xl font-semibold text-slate-800">{avgScore}%</h2>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-3 min-h-[90px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                    <FaClock className="text-emerald-500 text-xl" />
                    <div>
                        <p className="text-sm text-slate-500">Latest</p>
                        <h2 className="text-xl font-semibold text-slate-800">{latestExam}</h2>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit shadow-sm">
                <button
                    onClick={() => setActiveTab("results")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === "results"
                        ? "bg-white shadow text-emerald-600"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    Detailed Results
                </button>

                <button
                    onClick={() => setActiveTab("reports")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === "reports"
                        ? "bg-white shadow text-emerald-600"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    Report Cards
                </button>
            </div>

            {/* RESULTS TAB */}
            {activeTab === "results" &&
                results.map((exam, index) => {
                    const examTotal = calculateExamTotal(exam.subjects);
                    const isOpen = openExam === index;

                    const sortedSubjects = [...exam.subjects].sort(
                        (a, b) =>
                            calculateSubjectTotal(b.sections).percentage -
                            calculateSubjectTotal(a.sections).percentage
                    );

                    const strongestSubject = sortedSubjects[0];
                    const weakestSubject =
                        sortedSubjects[sortedSubjects.length - 1];

                    return (
                        <div
                            key={index}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                        >
                            <div
                                onClick={() =>
                                    setOpenExam(isOpen ? null : index)
                                }
                                className="px-6 py-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"
                            >
                                <div>
                                    <h2 className="font-semibold text-lg text-slate-800">
                                        {exam.examName}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {examTotal.totalObtained} / {examTotal.totalMax} ({examTotal.percentage}%)
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span
                                        className={`px-3 py-1 text-xs rounded-full font-medium ${examTotal.percentage >= 40
                                            ? "bg-emerald-100 text-emerald-600"
                                            : "bg-red-100 text-red-600"
                                            }`}
                                    >
                                        {examTotal.percentage >= 40 ? "Pass" : "Fail"}
                                    </span>

                                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </div>

                            {isOpen && (
                                <div className="border-t p-6 space-y-6">

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                                            <p className="text-sm text-slate-500">Strongest Subject</p>
                                            <h4 className="font-semibold text-emerald-600">
                                                {strongestSubject.subjectName}
                                            </h4>
                                        </div>

                                        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                                            <p className="text-sm text-slate-500">Needs Focus</p>
                                            <h4 className="font-semibold text-red-600">
                                                {weakestSubject.subjectName}
                                            </h4>
                                        </div>
                                    </div>

                                    {exam.subjects.map((subject, i) => {
                                        const subjectTotal =
                                            calculateSubjectTotal(subject.sections);

                                        return (
                                            <div
                                                key={i}
                                                className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:shadow-sm transition"
                                            >
                                                <div className="flex justify-between mb-2 text-sm">
                                                    <span className="font-medium text-slate-700">
                                                        {subject.subjectName}
                                                    </span>
                                                    <span className="text-slate-600 font-medium">
                                                        {subjectTotal.percentage}%
                                                    </span>
                                                </div>

                                                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${subjectTotal.percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        onClick={() =>
                                            handleDownload(
                                                exam.examId,
                                                exam.examName
                                            )
                                        }
                                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 hover:shadow-md transition"
                                    >
                                        <FaFileDownload />
                                        Download Report
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

            {/* REPORT TAB */}
            {activeTab === "reports" && (
                <div className="grid md:grid-cols-2 gap-6">
                    {results.map((exam, index) => {
                        const examTotal = calculateExamTotal(exam.subjects);

                        return (
                            <div
                                key={index}
                                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-semibold text-lg text-slate-800">
                                        {exam.examName}
                                    </h2>

                                    <span className="text-sm font-semibold text-emerald-600">
                                        {examTotal.percentage}%
                                    </span>
                                </div>

                                <p className="text-sm text-slate-500">
                                    Total Subjects: {exam.subjects.length}
                                </p>

                                <p className="text-xs text-slate-400 mt-1 mb-4">
                                    Official academic transcript report
                                </p>

                                <button
                                    onClick={() =>
                                        handleDownload(
                                            exam.examId,
                                            exam.examName
                                        )
                                    }
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 hover:shadow-md transition"
                                >
                                    <FaFileDownload />
                                    Download Report
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}