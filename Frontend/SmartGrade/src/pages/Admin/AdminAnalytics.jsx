import axios from "axios";
import { useEffect, useMemo, useState } from "react";
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
    YAxis
} from "recharts";
import {
    FaChartBar,
    FaClipboardList,
    FaGraduationCap,
    FaUsers
} from "react-icons/fa";

function ChartCard({ title, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">

            <h2 className="text-base font-semibold text-gray-700 mb-4">
                {title}
            </h2>

            <div className="h-[300px]">
                {children}
            </div>

        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 flex items-center justify-between hover:shadow-md transition">

            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                    {value}
                </h3>
            </div>

            <div className={`p-3 rounded-xl bg-white shadow-sm ${color}`}>
                {icon}
            </div>

        </div>
    );
}

export default function AdminAnalytics() {
    const [examsPerYear, setExamsPerYear] = useState([]);
    const [passFail, setPassFail] = useState({ passed: 0, failed: 0 });
    const [avgSubject, setAvgSubject] = useState([]);
    const [teacherPerf, setTeacherPerf] = useState([]);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const [examsRes, passRes, subjectRes, teacherRes] =
                await Promise.all([
                    axios.get(
                        "https://localhost:7247/api/admin/analytics/exams-per-year",
                        { headers }
                    ),
                    axios.get(
                        "https://localhost:7247/api/admin/analytics/pass-fail",
                        { headers }
                    ),
                    axios.get(
                        "https://localhost:7247/api/admin/analytics/average-score-subject",
                        { headers }
                    ),
                    axios.get(
                        "https://localhost:7247/api/admin/analytics/teacher-performance",
                        { headers }
                    )
                ]);

            setExamsPerYear(examsRes.data);
            setPassFail(passRes.data);
            setAvgSubject(subjectRes.data);
            setTeacherPerf(teacherRes.data);
        } catch (err) {
            toast.error("Failed to load analytics data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            toast.info("Preparing report...");

            const response = await axios.get(
                "https://localhost:7247/api/admin/analytics/report",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    responseType: "blob"
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "SmartGrade_Analytics_Report.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Report downloaded successfully");
        } catch (err) {
            toast.error("Failed to download report.");
            console.error(err);
        }
    };

    const passFailData = [
        { name: "Passed", value: passFail.passed || 0 },
        { name: "Failed", value: passFail.failed || 0 }
    ];

    const filteredTeachers = useMemo(() => {
        return teacherPerf.filter(
            (teacher) => teacher.averageScore > 0
        );
    }, [teacherPerf]);

    const totalExams = examsPerYear.reduce(
        (sum, item) => sum + item.count,
        0
    );

    const totalStudents = passFail.passed + passFail.failed;

    const passRate =
        totalStudents > 0
            ? `${Math.round((passFail.passed / totalStudents) * 100)}%`
            : "0%";

    const overallAverage =
        avgSubject.length > 0
            ? Math.round(
                avgSubject.reduce(
                    (sum, item) => sum + item.averageScore,
                    0
                ) / avgSubject.length
            )
            : 0;

    const COLORS = ["#10b981", "#ef4444"];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-52">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-400 mt-4">
                        Loading analytics dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">

                <div>
            
                </div>

                <button
                    onClick={handleDownloadPDF}
                    className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl shadow-sm hover:bg-emerald-600 hover:shadow-md transition"
                >
                    Download Report
                </button>

            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                <StatCard
                    title="Total Exams"
                    value={totalExams}
                    icon={<FaClipboardList />}
                    color="text-emerald-600"
                />

                <StatCard
                    title="Total Evaluations"
                    value={totalStudents}
                    icon={<FaUsers />}
                    color="text-blue-500"
                />

                <StatCard
                    title="Pass Rate"
                    value={passRate}
                    icon={<FaGraduationCap />}
                    color="text-green-500"
                />

                <StatCard
                    title="Average Score"
                    value={overallAverage}
                    icon={<FaChartBar />}
                    color="text-orange-400"
                />

            </div>

            {/* ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <ChartCard title="Exams Per Academic Year">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={examsPerYear}>
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Pass / Fail Distribution">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={passFailData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                label
                            >
                                {passFailData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

            </div>

            {/* SUBJECT */}
            <ChartCard title="Average Score Per Subject">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={avgSubject}
                        margin={{ top: 10, right: 20, left: 20, bottom: 50 }}
                    >
                        <XAxis
                            dataKey="subject"
                            angle={-20}
                            textAnchor="end"
                            interval={0}
                            height={60}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* TEACHER */}
            <ChartCard title="Teacher Performance Overview">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={filteredTeachers}
                        margin={{ top: 10, right: 20, left: 20, bottom: 50 }}
                    >
                        <XAxis
                            dataKey="teacherName"
                            angle={-20}
                            textAnchor="end"
                            interval={0}
                            height={60}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

        </div>
    );
}