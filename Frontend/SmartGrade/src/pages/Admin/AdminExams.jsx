import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash2, Eye, Search } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    // FILTER STATES
    const [search, setSearch] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const examsPerPage = 10;

    const navigate = useNavigate();

    const fetchExams = async () => {
        try {
            const res = await axios.get(
                "https://localhost:7247/api/admin/exams",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setExams(res.data);
        } catch {
            toast.error("Failed to load exams.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    // UNIQUE FILTER VALUES
    const uniqueYears = [...new Set(exams.map(e => e.academicYear))];
    const uniqueTeachers = [...new Set(exams.map(e => e.teacherName))];

    // FILTER LOGIC
    const filteredExams = useMemo(() => {
        return exams.filter(exam =>
            exam.name.toLowerCase().includes(search.toLowerCase()) &&
            (selectedYear === "" || exam.academicYear === selectedYear) &&
            (selectedTeacher === "" || exam.teacherName === selectedTeacher) &&
            (selectedStatus === "" || exam.status === selectedStatus)
        );
    }, [exams, search, selectedYear, selectedTeacher, selectedStatus]);

    // RESET PAGE WHEN FILTER CHANGES
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedYear, selectedTeacher, selectedStatus]);

    // PAGINATION CALCULATIONS
    const totalPages = Math.ceil(filteredExams.length / examsPerPage);
    const indexOfLastExam = currentPage * examsPerPage;
    const indexOfFirstExam = indexOfLastExam - examsPerPage;
    const currentExams = filteredExams.slice(indexOfFirstExam, indexOfLastExam);

    const changePage = (page) => {
        setCurrentPage(page);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this exam permanently?")) return;

        try {
            toast.info("Deleting exam...");
            await axios.delete(
                `https://localhost:7247/api/admin/exams/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            toast.success("Exam deleted successfully");
            fetchExams();
        } catch {
            toast.error("Failed to delete exam.");
        }
    };

    const handleUnpublish = async (id) => {
        if (!window.confirm("Force unpublish this exam?")) return;

        try {
            toast.info("Unpublishing exam...");
            await axios.put(
                `https://localhost:7247/api/admin/exams/${id}/unpublish`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            toast.success("Exam unpublished successfully");
            fetchExams();
        } catch {
            toast.error("Failed to unpublish exam.");
        }
    };

    const handlePublish = async (id) => {
        try {
            toast.info("Publishing exam...");
            await axios.put(
                `https://localhost:7247/api/admin/exams/${id}/publish`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            toast.success("Exam published successfully");
            fetchExams();
        } catch {
            toast.error("Failed to publish exam.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-52">
                <div className="animate-pulse text-gray-400 text-lg">
                    Loading exams...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col gap-2"></div>

            {/* FILTER BAR */}
            <div className="grid md:grid-cols-4 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">

                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search exam..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                </div>

                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    <option value="">All Years</option>
                    {uniqueYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    <option value="">All Teachers</option>
                    {uniqueTeachers.map(teacher => (
                        <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    <option value="">All Status</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                </select>

            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead className="bg-gray-50">
                            <tr className="text-xs uppercase tracking-wider text-gray-400">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Exam Name</th>
                                <th className="px-6 py-4">Year</th>
                                <th className="px-6 py-4">Teacher</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {currentExams.map((exam) => (

                                <tr key={exam.id} className="hover:bg-gray-50 transition">

                                    <td className="px-6 py-5 text-gray-500 font-medium">
                                        {exam.id}
                                    </td>

                                    <td className="px-6 py-5 font-semibold text-gray-800">
                                        {exam.name}
                                    </td>

                                    <td className="px-6 py-5 text-gray-600">
                                        {exam.academicYear}
                                    </td>

                                    <td className="px-6 py-5 text-gray-600">
                                        {exam.teacherName}
                                    </td>

                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${exam.status === "Published"
                                                ? "bg-emerald-100 text-emerald-600"
                                                : "bg-yellow-100 text-yellow-600"
                                            }`}>
                                            {exam.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 text-gray-500">
                                        {new Date(exam.createdAt).toLocaleDateString()}
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex justify-end items-center gap-3">

                                            {/* VIEW */}
                                            <button
                                                onClick={() => navigate(`/admin/exams/${exam.id}`)}
                                                className="group p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
                                            >
                                                <Eye
                                                    size={16}
                                                    className="text-gray-500 group-hover:text-emerald-600 transition"
                                                />
                                            </button>

                                            {/* TOGGLE (REAL SWITCH STYLE) */}
                                            <button
                                                onClick={() =>
                                                    exam.status === "Published"
                                                        ? handleUnpublish(exam.id)
                                                        : handlePublish(exam.id)
                                                }
                                                className={`relative w-11 h-6 rounded-full transition ${exam.status === "Published"
                                                        ? "bg-emerald-500"
                                                        : "bg-gray-300"
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition ${exam.status === "Published"
                                                            ? "translate-x-5"
                                                            : ""
                                                        }`}
                                                />
                                            </button>

                                            {/* DELETE */}
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="group p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-red-300 transition"
                                            >
                                                <Trash2
                                                    size={16}
                                                    className="text-gray-500 group-hover:text-red-600 transition"
                                                />
                                            </button>

                                        </div>
                                    </td>

                                </tr>

                            ))}

                            {currentExams.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-16 text-gray-400">
                                        No exams found.
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                {/* PAGINATION */}
                <div className="flex justify-between items-center px-6 py-5 border-t bg-gray-50">

                    <p className="text-sm text-gray-500">
                        Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                    </p>

                    <div className="flex gap-2">

                        <button
                            disabled={currentPage === 1}
                            onClick={() => changePage(currentPage - 1)}
                            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                            Prev
                        </button>

                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => changePage(index + 1)}
                                className={`px-4 py-2 rounded-xl ${currentPage === index + 1
                                        ? "bg-emerald-500 text-white shadow-md"
                                        : "bg-gray-200 hover:bg-gray-300"
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => changePage(currentPage + 1)}
                            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                            Next
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}