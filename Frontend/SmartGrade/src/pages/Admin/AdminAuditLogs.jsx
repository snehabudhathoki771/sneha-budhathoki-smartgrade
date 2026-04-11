import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function AdminAuditLogs() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;


    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get("/admin/audit-logs");

            setLogs(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch audit logs.");
        }
    };

    const filteredLogs = logs.filter(
        (log) =>
            (log.action || "").toLowerCase().includes(search.toLowerCase()) ||
            (log.performedBy || "").toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

    const changePage = (page) => {
        setCurrentPage(page);
    };

    const getBadgeColor = (action) => {
        if (action.toLowerCase().includes("delete"))
            return "bg-red-100 text-red-600";
        if (action.toLowerCase().includes("publish"))
            return "bg-emerald-100 text-emerald-600";
        if (action.toLowerCase().includes("mark"))
            return "bg-blue-100 text-blue-600";
        if (action.toLowerCase().includes("update"))
            return "bg-yellow-100 text-yellow-700";
        return "bg-gray-100 text-gray-600";
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center">

                <div>
                </div>

                {/* SEARCH */}
                <div className="relative w-[280px]">
                    <Search
                        size={18}
                        className="absolute top-3 left-3 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                <table className="min-w-full text-sm">

                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-6 py-4 font-semibold">Action</th>
                            <th className="text-left px-6 py-4 font-semibold">Performed By</th>
                            <th className="text-left px-6 py-4 font-semibold">Details</th>
                            <th className="text-left px-6 py-4 font-semibold">Timestamp</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                        {currentLogs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-12 text-gray-400">
                                    No audit logs found.
                                </td>
                            </tr>
                        ) : (
                            currentLogs.map((log) => (

                                <tr
                                    key={log.id}
                                    className="hover:bg-gray-50 transition"
                                >

                                    <td className="px-6 py-5">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(log.action)}`}
                                        >
                                            {log.action}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 font-medium text-gray-700">
                                        {log.performedBy}
                                    </td>

                                    <td className="px-6 py-5 text-gray-600">
                                        {log.details}
                                    </td>

                                    <td className="px-6 py-5 text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>

                                </tr>

                            ))
                        )}

                    </tbody>

                </table>

                {/* PAGINATION */}
                <div className="flex justify-between items-center px-6 py-5 border-t bg-gray-50">

                    <p className="text-sm text-gray-500">
                        Page {totalPages === 0 ? 0 : currentPage} of {totalPages || 0}
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
                                    ? "bg-emerald-500 text-white"
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