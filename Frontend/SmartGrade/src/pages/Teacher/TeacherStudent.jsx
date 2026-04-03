import axios from "axios";
import { Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TeacherStudents() {

    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");

    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const BASE_URL = "https://localhost:7247";

    const headers = {
        Authorization: `Bearer ${token}`
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {

            const res = await axios.get(
                "https://localhost:7247/api/teacher/students",
                { headers }
            );

            setStudents(res.data);

        } catch (err) {
            console.error(err);
        }
    };

    const filteredStudents = students.filter((s) =>
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <div className="px-8 pt-1 pb-8 bg-gray-50 min-h-screen">

            <div className="max-w-7xl mx-auto">

                {/* PAGE HEADER */}

                <div className="mb-8">

                </div>

                {/* MAIN CARD */}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

                    {/* HEADER */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-gray-100">

                        <div className="flex items-center gap-3">

                            <div className="bg-green-100 p-2.5 rounded-xl">
                                <Users size={18} className="text-green-600" />
                            </div>

                            <span className="font-medium text-gray-700 text-sm md:text-base">
                                Total Students: <span className="text-gray-900 font-semibold">{students.length}</span>
                            </span>

                        </div>

                        {/* SEARCH */}

                        <div className="relative w-full md:w-72">

                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition"
                            />

                        </div>

                    </div>

                    {/* TABLE */}

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">

                                <tr>

                                    <th className="text-left px-6 py-4 font-semibold">
                                        Student
                                    </th>

                                    <th className="text-left px-6 py-4 font-semibold">
                                        Email
                                    </th>

                                    <th className="text-right px-6 py-4 font-semibold">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredStudents.map((s) => {

                                    const initials = s.fullName
                                        .split(" ")
                                        .map(n => n[0])
                                        .join("")
                                        .toUpperCase();

                                    const imageUrl = s.photoUrl
                                        ? encodeURI(`${BASE_URL}${s.photoUrl}`)
                                        : null;

                                    return (

                                        <tr
                                            key={s.id}
                                            className="border-t border-gray-100 hover:bg-green-50/40 transition"
                                        >

                                            {/* STUDENT */}

                                            <td className="px-6 py-4">

                                                <div className="flex items-center gap-3">

                                                    {imageUrl ? (

                                                        <img
                                                            src={imageUrl}
                                                            alt={s.fullName}
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                            onError={(e) => {
                                                                e.target.src = "/default-avatar.png";
                                                            }}
                                                        />

                                                    ) : (

                                                        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                                                            {initials}
                                                        </div>

                                                    )}

                                                    <div className="font-medium text-gray-800">
                                                        {s.fullName}
                                                    </div>

                                                </div>

                                            </td>

                                            {/* EMAIL */}

                                            <td className="px-6 py-4 text-gray-600">
                                                {s.email}
                                            </td>

                                            {/* ACTION */}

                                            <td className="px-6 py-4 text-right">

                                                <button
                                                    onClick={() => navigate(`/teacher/students/${s.id}`)}
                                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-xl hover:bg-green-50 transition"
                                                >
                                                    View Profile
                                                </button>

                                            </td>

                                        </tr>

                                    );

                                })}

                                {filteredStudents.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan="3"
                                            className="text-center py-14 text-gray-400"
                                        >
                                            No students found
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>

    );

}