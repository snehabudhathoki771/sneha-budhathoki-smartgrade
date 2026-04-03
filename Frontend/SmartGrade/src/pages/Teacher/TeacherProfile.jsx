import axios from "axios";
import { useEffect, useState } from "react";

export default function TeacherProfile() {

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        photoUrl: ""
    });

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {

        try {

            const res = await axios.get(
                "https://localhost:7247/api/teacher/profile",
                { headers }
            );

            setProfile({
                ...res.data,
                dateOfBirth: res.data.dateOfBirth
                    ? res.data.dateOfBirth.split("T")[0]
                    : ""
            });

        } catch (err) {

            console.error("Failed to load teacher profile");

        } finally {

            setLoading(false);

        }
    };

    const handleChange = (e) => {

        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handlePhotoChange = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const formData = new FormData();
        formData.append("photo", file);

        try {

            setUploading(true);

            const res = await axios.post(
                "https://localhost:7247/api/teacher/profile/photo",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setProfile(prev => ({
                ...prev,
                photoUrl: res.data.photoUrl
            }));

        } catch {

            alert("Photo upload failed");

        } finally {

            setUploading(false);

        }

    };

    const handleSubmit = async () => {

        try {

            setUpdating(true);

            const payload = {
                fullName: profile.fullName,
                phone: profile.phone || null,
                address: profile.address || null,
                gender: profile.gender || null,
                dateOfBirth:
                    profile.dateOfBirth && profile.dateOfBirth !== ""
                        ? profile.dateOfBirth
                        : null
            };

            await axios.put(
                "https://localhost:7247/api/teacher/profile",
                payload,
                { headers }
            );

            alert("Profile updated successfully.");

        } catch {

            alert("Failed to update profile.");

        } finally {

            setUpdating(false);

        }
    };

    if (loading) {

        return (

            <div className="px-10 pt-6 pb-10 space-y-6 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">

                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
                <div className="h-40 bg-gray-200 rounded-2xl"></div>

            </div>

        );

    }

    return (

        <div className="px-10 pt-6 pb-10 bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">

            {/* TOP PROFILE CARD */}

            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-gray-100 p-8 mb-8 flex justify-between items-center transition hover:shadow-xl">

                <div className="flex items-center gap-5">

                    <label className="cursor-pointer relative group">

                        <img
                            src={
                                profile.photoUrl
                                    ? `https://localhost:7247${profile.photoUrl}`
                                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            }
                            onError={(e) => {
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                            }}
                            alt="profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />

                        <div className="absolute bottom-1 right-1 w-9 h-9 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M3 7h4l2-2h6l2 2h4v12H3V7z"
                                />
                                <circle cx="12" cy="13" r="3" />
                            </svg>

                        </div>

                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />

                    </label>

                    <div>

                        <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
                            {profile.fullName}
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            {profile.email}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                            Upload photo or update your details
                        </p>

                        {uploading && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                                Uploading...
                            </p>
                        )}

                    </div>

                </div>

                <div className="w-64">

                    <p className="text-sm text-gray-500 mb-2 font-medium">
                        Profile Completion
                    </p>

                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full w-full"></div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                        100% complete
                    </p>

                </div>

            </div>

            {/* FORM */}

            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-gray-100 p-8">

                <div className="grid md:grid-cols-2 gap-6">

                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Full Name
                        </label>
                        <input
                            name="fullName"
                            value={profile.fullName}
                            onChange={handleChange}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Email
                        </label>
                        <input
                            value={profile.email}
                            disabled
                            className="mt-2 w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Phone
                        </label>
                        <input
                            name="phone"
                            value={profile.phone || ""}
                            onChange={handleChange}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={profile.dateOfBirth || ""}
                            onChange={handleChange}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Gender
                        </label>
                        <select
                            name="gender"
                            value={profile.gender || ""}
                            onChange={handleChange}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                </div>

                <div className="mt-8">
                    <label className="text-sm font-medium text-gray-600">
                        Address
                    </label>
                    <textarea
                        name="address"
                        value={profile.address || ""}
                        onChange={handleChange}
                        rows="4"
                        className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition"
                    ></textarea>
                </div>

                {/* BUTTON */}

                <div className="mt-8 flex justify-end">

                    <button
                        onClick={handleSubmit}
                        disabled={updating}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition disabled:bg-gray-400"
                    >
                        {updating ? "Updating..." : "Update Profile"}
                    </button>

                </div>

            </div>

        </div>

    );

}