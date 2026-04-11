import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    GraduationCap,
    Lightbulb,
    Search
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function TeacherSubjectAnalytics() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState("");

    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");

    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");


    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {

            const res = await api.get("/teacher/exams");
            setExams(res.data);

        } catch (err) {
            
            console.error(err);
            toast.error("Failed to load exams. Please try again.");
        }
    };

    const fetchSubjects = async (examId) => {
        try {
            const res = await api.get(`/teacher/exams/${examId}/subjects`);
            setSubjects(res.data);

        } catch (err) {

            console.error(err);
            setSubjects([]);
            toast.error("Failed to load subjects. Please try again.");
        }
    };

    const fetchAnalytics = async (subjectId) => {
        try {
            setLoading(true);
            setSearchTerm("");

            const res = await api.get(`/teacher/subjects/${subjectId}/analytics`);
            setAnalytics(res.data);

        } catch (err) {

            console.error(err);
            toast.error("Failed to load analytics. Please try again.");
            setAnalytics([]);

        } finally {

            setLoading(false);
        }
    };

    const handleExamChange = (e) => {
        const examId = e.target.value;

        setSelectedExam(examId);
        setSelectedSubject("");
        setAnalytics([]);
        setSearchTerm("");

        if (examId) {
            fetchSubjects(examId);
        } else {
            setSubjects([]);
        }
    };

    const handleSubjectChange = (e) => {
        const subjectId = e.target.value;

        setSelectedSubject(subjectId);
        setAnalytics([]);
        setSearchTerm("");

        if (subjectId) {
            fetchAnalytics(subjectId);
        }
    };

    const filteredAnalytics = useMemo(() => {
        return analytics.filter(student =>
            student.studentName
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [analytics, searchTerm]);

    const clearSearch = () => {
        setSearchTerm("");
    };

    return (

        <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex items-center gap-3">

                    <div>

                    </div>
                </div>

                {/* EXAM SELECTOR */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <GraduationCap size={16} /> Select Exam
                    </label>
                    <select
                        value={selectedExam}
                        onChange={handleExamChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">Choose an exam</option>
                        {exams.map(exam => (
                            <option key={exam.id} value={exam.id}>
                                {exam.name} ({exam.academicYear})
                            </option>
                        ))}
                    </select>
                </div>

                {/* SUBJECT SELECTOR */}
                {selectedExam && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <BookOpen size={16} /> Select Subject
                        </label>
                        <select
                            value={selectedSubject}
                            onChange={handleSubjectChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Choose a subject</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* SEARCH */}
                {!loading && selectedSubject && analytics.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex gap-3 items-center">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 outline-none text-sm"
                            />

                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition text-sm"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* EMPTY BEFORE SELECT ( FIXED PREMIUM VERSION) */}
                {!selectedExam && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">

                        <div className="flex flex-col items-center">

                            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-4 shadow-sm">
                                <BarChart3 size={28} />
                            </div>

                            <h2 className="text-lg font-semibold text-gray-800">
                                Start by selecting an exam
                            </h2>

                            <p className="text-gray-500 text-sm mt-2 max-w-md">
                                Choose an exam first to analyze subject-level weak areas and student performance insights.
                            </p>

                        </div>

                    </div>
                )}

                {/* LOADING */}
                {loading && (
                    <div className="grid md:grid-cols-2 gap-5">
                        {[1, 2].map((item) => (
                            <div key={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse space-y-4">
                                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                <div className="space-y-2">
                                    <div className="h-2 bg-gray-200 rounded"></div>
                                    <div className="h-2 bg-gray-200 rounded"></div>
                                    <div className="h-2 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ANALYTICS CARDS */}
                {!loading && selectedSubject && filteredAnalytics.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-5">
                        {filteredAnalytics.map(student => (
                            <div
                                key={student.studentId}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-center">
                                    <h2 className="font-semibold text-gray-800">
                                        {student.studentName}
                                    </h2>
                                    <span className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-medium">
                                        <AlertTriangle size={14} />
                                        {student.weakestSection}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-500">
                                    Lowest Score:{" "}
                                    <span className="font-semibold text-gray-800">
                                        {student.lowestPercentage}%
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {student.sectionBreakdown.map((section, index) => (
                                        <div key={index}>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>{section.section}</span>
                                                <span>{section.percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-2 rounded-full">
                                                <div
                                                    className={`h-2 rounded-full ${section.percentage < 40
                                                        ? "bg-red-500"
                                                        : section.percentage < 60
                                                            ? "bg-yellow-400"
                                                            : "bg-green-500"
                                                        }`}
                                                    style={{ width: `${section.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-start gap-2 bg-green-50 p-3 rounded-xl text-xs text-green-700 border border-green-100">
                                    <Lightbulb size={16} />
                                    <span>{student.suggestion}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* NO SEARCH RESULT */}
                {!loading && selectedSubject && analytics.length > 0 && filteredAnalytics.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                        No students match your search.
                    </div>
                )}

                {/* NO DATA */}
                {!loading && selectedSubject && analytics.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                        No analytics data available for this subject.
                    </div>
                )}

            </div>

        </div>

    );
}