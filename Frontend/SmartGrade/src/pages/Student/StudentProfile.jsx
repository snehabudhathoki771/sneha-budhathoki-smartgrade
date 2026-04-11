import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaUserCircle,
  FaShieldAlt,
  FaCheckCircle
} from "react-icons/fa";

export default function StudentProfile() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    guardianName: "",
    guardianPhone: "",
    photoUrl: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/student/profile");

      setProfile({
        fullName: res.data.fullName || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
        dateOfBirth: res.data.dateOfBirth
          ? res.data.dateOfBirth.split("T")[0]
          : "",
        gender: res.data.gender || "",
        guardianName: res.data.guardianName || "",
        guardianPhone: res.data.guardianPhone || "",
        photoUrl: res.data.photoUrl || ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
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

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      toast.info("Updating profile...");

      const formData = new FormData();

      formData.append("FullName", profile.fullName);
      formData.append("Phone", profile.phone);
      formData.append("Address", profile.address);
      formData.append("Gender", profile.gender);
      formData.append("GuardianName", profile.guardianName);
      formData.append("GuardianPhone", profile.guardianPhone);

      if (profile.dateOfBirth) {
        const isoDate = new Date(profile.dateOfBirth).toISOString();
        formData.append("DateOfBirth", isoDate);
      }

      if (photo) {
        formData.append("Photo", photo);
      }

      await api.put("/student/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Profile updated successfully");
      fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse bg-slate-50 min-h-screen">
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "U";

  const completionFields = [
    profile.fullName,
    profile.phone,
    profile.address,
    profile.dateOfBirth,
    profile.gender,
    profile.guardianName,
    profile.guardianPhone
  ];

  const completionPercentage = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen p-6">
      {/* Hero Identity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24">
              {profile.photoUrl || photo ? (
                <img
                  src={
                    photo
                      ? URL.createObjectURL(photo)
                      : `${import.meta.env.VITE_API_URL}${profile.photoUrl}`
                  }
                  alt="profile"
                  className="w-24 h-24 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xl">
                  {initials}
                </div>
              )}

              <label className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full cursor-pointer shadow-md hover:bg-emerald-700 transition">
                <FaCamera className="text-white text-sm" />
                <input
                  type="file"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {profile.fullName || "Student Profile"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {profile.email}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Manage your identity and personal information
              </p>
            </div>
          </div>

          <div className="min-w-[220px]">
            <p className="text-sm text-slate-500 mb-2">
              Profile Completion
            </p>
            <div className="w-full bg-slate-200 h-3 rounded-full">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium mt-2 text-slate-700">
              {completionPercentage}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-slate-500">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">Email</label>
            <input
              type="text"
              value={profile.email}
              disabled
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 bg-slate-100 text-slate-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">Phone</label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={profile.dateOfBirth}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">Gender</label>
            <select
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-500">Address</label>
            <textarea
              name="address"
              value={profile.address}
              onChange={handleChange}
              rows="3"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">
              Guardian Name
            </label>
            <input
              type="text"
              name="guardianName"
              value={profile.guardianName}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500">
              Guardian Phone
            </label>
            <input
              type="text"
              name="guardianPhone"
              value={profile.guardianPhone}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaShieldAlt className="text-emerald-600" />
              <p className="font-medium text-slate-700">
                Account Security
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Your email is protected and managed securely by the system.
            </p>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 transition shadow-sm disabled:opacity-70"
            >
              {saving ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}