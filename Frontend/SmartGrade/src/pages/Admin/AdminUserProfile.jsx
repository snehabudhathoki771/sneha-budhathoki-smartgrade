import { useEffect, useState } from "react";
import api from "../../services/api";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminUserProfile() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const { id } = useParams();

    const [user, setUser] = useState(null);

    const BASE_URL = import.meta.env.VITE_API_URL || "";

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {

        try {

            const res = await api.get(`/admin/students/${id}`);

            setUser(res.data);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load user profile");

        }

    };

    if (!user) {
        return (
            <div className="flex justify-center items-center h-60 text-gray-500 text-lg">
                Loading...
            </div>
        );
    }

    const imageUrl = user.photoUrl
        ? encodeURI(`${BASE_URL}${user.photoUrl}?t=${Date.now()}`)
        : null;

    const initials = (user.fullName || "U")
        .split(" ")
        .map(n => n?.[0] || "")
        .join("")
        .toUpperCase();

    return (

        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">

                <div>

                </div>

                <button
                    onClick={() => navigate("/admin/users")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

            </div>

            {/* MAIN CARD */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* PROFILE HEADER */}
                <div className="flex items-center gap-6 p-6 border-b border-gray-100">

                    {/* IMAGE */}
                    <div>

                        {imageUrl ? (

                            <img
                                src={imageUrl}
                                alt="user"
                                className="w-20 h-20 rounded-full object-cover border"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                }}
                            />

                        ) : (

                            <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-semibold">
                                {initials}
                            </div>

                        )}

                    </div>

                    {/* NAME */}
                    <div>

                        <p className="text-lg font-semibold text-gray-800">
                            {user.fullName}
                        </p>

                        <p className="text-gray-500 text-sm">
                            {user.email}
                        </p>

                    </div>

                </div>

                {/* DETAILS */}
                <div className="p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <DetailItem label="Full Name" value={user.fullName} />
                        <DetailItem label="Email" value={user.email} />
                        <DetailItem label="Phone" value={user.phone} />
                        <DetailItem label="Gender" value={user.gender} />
                        <DetailItem label="Address" value={user.address} />
                        <DetailItem label="Guardian Name" value={user.guardianName} />
                        <DetailItem label="Guardian Phone" value={user.guardianPhone} />

                    </div>

                </div>

            </div>

        </div>

    );

}


/* CLEAN DETAIL ITEM */
function DetailItem({ label, value }) {
    return (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-white transition">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-medium text-gray-800">
                {value || "-"}
            </p>
        </div>
    );
}