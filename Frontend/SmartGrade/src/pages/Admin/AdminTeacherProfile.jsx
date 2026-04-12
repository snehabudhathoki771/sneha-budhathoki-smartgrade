import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function AdminTeacherProfile() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const { id } = useParams();

    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);

    const BASE_URL = import.meta.env.VITE_API_URL || "";

    const fetchTeacher = async () => {

        try {

            const res = await api.get(`/admin/teachers/${id}`);

            setTeacher(res.data);

        } catch {

            toast.error("Failed to load teacher details");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        fetchTeacher();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">

                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">

                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="space-y-3">
                            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>

                </div>

            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="flex items-center justify-center h-60 text-gray-500">
                Teacher not found
            </div>
        );
    }

    const imageUrl = `${BASE_URL}/teacher/profile-image/${teacher.id}`;
    return (

        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center">

                <div>

                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

            </div>

            {/* PROFILE CARD */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* TOP */}
                <div className="flex items-center gap-6 p-6 border-b border-gray-100">

                    <img
                        src={imageUrl}
                        alt="Teacher"
                        className="w-20 h-20 rounded-full object-cover border"
                    />
                    <div>

                        <h2 className="text-lg font-semibold text-gray-800">
                            {teacher.fullName}
                        </h2>

                        <p className="text-gray-500 text-sm">
                            {teacher.email}
                        </p>

                    </div>

                </div>

                {/* DETAILS */}
                <div className="p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <DetailItem label="Full Name" value={teacher.fullName} />
                        <DetailItem label="Email" value={teacher.email} />
                        <DetailItem label="Phone" value={teacher.phone} />
                        <DetailItem label="Gender" value={teacher.gender} />
                        <DetailItem
                            label="Date of Birth"
                            value={
                                teacher.dateOfBirth
                                    ? teacher.dateOfBirth.split("T")[0]
                                    : "Not provided"
                            }
                        />
                        <DetailItem label="Address" value={teacher.address} />

                    </div>

                </div>

            </div>

        </div>

    );

}


/* REUSABLE DETAIL ITEM */
function DetailItem({ label, value }) {
    return (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-white transition">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-medium text-gray-800">
                {value || "Not provided"}
            </p>
        </div>
    );
}