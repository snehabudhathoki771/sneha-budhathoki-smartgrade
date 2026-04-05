import axios from "axios";
import { BookUser, Eye, GraduationCap, KeyRound, Pencil, Search, Shield, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {

    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;
    const [resetUserId, setResetUserId] = useState(null);
    const [resetPassword, setResetPassword] = useState("");

    const [message, setMessage] = useState(null);

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "",
    });

    const [editingUser, setEditingUser] = useState(null);

    const [editForm, setEditForm] = useState({
        fullName: "",
        email: "",
        role: "",
    });

    const token = localStorage.getItem("token");
    const currentUserId = Number(localStorage.getItem("userId"));

    const fetchUsers = async () => {

        try {

            setLoading(true);

            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/users`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setUsers(res.data);

        } catch (err) {

            console.error(err);
            setMessage("Error loading users");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {

        if (message) {

            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);

        }

    }, [message]);

    const filteredUsers = useMemo(() => {

        return users.filter((user) => {

            const matchesSearch =
                user.fullName.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase()) ||
                user.role.toLowerCase().includes(search.toLowerCase());

            const matchesRole =
                roleFilter === "All" || user.role === roleFilter;

            return matchesSearch && matchesRole;

        });

    }, [users, search, roleFilter]);

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;

    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    const [deactivateUserId, setDeactivateUserId] = useState(null);
    const [deactivateDays, setDeactivateDays] = useState(null);

    const changePage = (page) => {
        setCurrentPage(page);
    };

    const handleCreate = async (e) => {

        e.preventDefault();

        if (!form.role) {
            setMessage("Please choose a role");
            return;
        }

        try {

            setLoading(true);

            await axios.post(
                `${import.meta.env.VITE_API_URL}/admin/users`,
                form,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setForm({
                fullName: "",
                email: "",
                password: "",
                role: "",
            });

            setMessage("User created successfully");

            fetchUsers();

        } catch (err) {

            setMessage(err.response?.data || "Error creating user");

        } finally {

            setLoading(false);

        }

    };

    const openResetModal = (id) => {
        setResetUserId(id);
    };

    const handleResetPassword = async () => {

        if (!resetPassword) {
            setMessage("Password cannot be empty");
            return;
        }

        try {

            setLoading(true);

            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/users/${resetUserId}/reset-password`,
                { newPassword: resetPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage("Password reset successful");

            setResetUserId(null);
            setResetPassword("");

        } catch (err) {

            setMessage("Error resetting password");

        } finally {

            setLoading(false);

        }

    };

    const handleDeactivate = async () => {
        try {
            setLoading(true);

            console.log("Sending days:", deactivateDays);

            //ALWAYS send object
            const payload = {
                days: deactivateDays
            };

            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/users/${deactivateUserId.id}/deactivate`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setMessage("User deactivated successfully");
            setDeactivateUserId(null);
            setDeactivateDays(null);

            fetchUsers();

        } catch (err) {
            console.error("FULL ERROR:", err.response?.data || err);
            setMessage("Error deactivating user");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {

        setEditingUser(user);

        setEditForm({
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        });

    };

    const handleUpdate = async () => {

        if (!editForm.role) {

            setMessage("Please choose a role");

            return;

        }

        if (editingUser.id === currentUserId) {

            setMessage("You cannot change your own role.");

            return;

        }

        if (!window.confirm("Are you sure you want to change this user's role?")) {

            return;

        }

        try {

            setLoading(true);

            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/users/${editingUser.id}`,
                editForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setEditingUser(null);

            setMessage("User updated successfully");

            fetchUsers();

        } catch (err) {

            setMessage(err.response?.data || "Error updating user");

        } finally {

            setLoading(false);

        }

    };

    const roleIcon = (role) => {
        if (role === "Admin") return <Shield size={14} className="mr-1" />;
        if (role === "Teacher") return <BookUser size={14} className="mr-1" />;
        if (role === "Student") return <GraduationCap size={14} className="mr-1" />;
        return null;
    };

    const avatarColor = (name) => {
        const colors = ["bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-orange-500", "bg-purple-500"];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (

        <div>

            {message && (

                <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-2xl shadow-xl z-50">

                    {message}

                </div>

            )}

            <div className="space-y-6">

                <div className="mb-10"></div>

                <div className="mb-8 flex flex-col md:flex-row gap-4">

                    <div className="relative flex-1">

                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />

                        <input
                            type="text"
                            placeholder="Search by name, email or role..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm"
                        />

                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-white/80 backdrop-blur-md border border-gray-200 px-4 py-3 rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm"
                    >

                        <option value="All">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Student">Student</option>

                    </select>

                </div>

                <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-gray-100 mb-10">

                    <div className="flex items-center gap-2 mb-6">

                        <UserPlus size={20} className="text-green-600" />

                        <h2 className="text-xl font-semibold text-gray-800">
                            Create New User
                        </h2>

                    </div>

                    <form
                        onSubmit={handleCreate}
                        className="grid grid-cols-1 md:grid-cols-4 gap-5"
                    >

                        <input
                            type="text"
                            placeholder="Full Name"
                            value={form.fullName}
                            onChange={(e) =>
                                setForm({ ...form, fullName: e.target.value })
                            }
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                            required
                            disabled={loading}
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                            required
                            disabled={loading}
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                            required
                            disabled={loading}
                        />

                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({ ...form, role: e.target.value })
                            }
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none"
                            required
                            disabled={loading}
                        >

                            <option value="">Choose Role</option>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">Admin</option>

                        </select>

                        <div className="md:col-span-4 flex justify-end">

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50"
                            >
                                Create User
                            </button>

                        </div>

                    </form>

                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">

                    <h2 className="text-xl font-semibold mb-6 text-gray-800">
                        All Users
                    </h2>

                    {loading ? (

                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                            ))}
                        </div>

                    ) : (

                        <>

                            <div className="overflow-x-auto">

                                <table className="w-full text-left">

                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">

                                        <tr>

                                            <th className="p-4">User</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Role</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Action</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {currentUsers.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8 text-gray-400">
                                                    No users found
                                                </td>
                                            </tr>
                                        )}

                                        {currentUsers.map((user) => {

                                            const initials = user.fullName
                                                .split(" ")
                                                .map(n => n[0])
                                                .join("")
                                                .toUpperCase();

                                            return (

                                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-transparent transition">

                                                    <td className="p-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                                                {user.photoUrl ? (
                                                                    <img
                                                                        src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${user.photoUrl}`}
                                                                        alt={user.fullName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className={`w-full h-full ${avatarColor(user.fullName)} text-white flex items-center justify-center text-sm font-semibold`}>
                                                                        {initials}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div>

                                                                <p className="font-medium text-gray-800">
                                                                    {user.fullName}
                                                                </p>

                                                                <p className="text-xs text-gray-500">
                                                                    ID: {user.id}
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td className="p-4 text-gray-600">
                                                        {user.email}
                                                    </td>

                                                    <td className="p-4">

                                                        <span className="px-3 py-1 text-xs rounded-full font-medium bg-emerald-50 text-emerald-600 flex items-center w-fit gap-1">
                                                            {roleIcon(user.role)}
                                                            {user.role}
                                                        </span>

                                                    </td>

                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">

                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 w-fit
                                                        ${user.isActive
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-200 text-gray-600"
                                                                }`}>

                                                                <span className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-gray-400"}`} />

                                                                {user.isActive ? "Active" : "Inactive"}

                                                            </span>

                                                            {!user.isActive && user.deactivatedUntil && (
                                                                <span className="text-xs text-gray-400">
                                                                    Until: {new Date(user.deactivatedUntil).toLocaleDateString()}
                                                                </span>
                                                            )}

                                                        </div>
                                                    </td>

                                                    <td className="p-4">
                                                        <div className="flex justify-end items-center gap-2">

                                                            <button
                                                                onClick={() =>
                                                                    user.role === "Student"
                                                                        ? navigate(`/admin/students/${user.id}`)
                                                                        : navigate(`/admin/teachers/${user.id}`)
                                                                }
                                                                className="group p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                                                                title="View"
                                                            >
                                                                <Eye size={16} className="text-blue-600 group-hover:scale-110 transition" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleEdit(user)}
                                                                className="group p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={16} className="text-emerald-600 group-hover:scale-110 transition" />
                                                            </button>

                                                            <button
                                                                onClick={() => setResetUserId(user.id)}
                                                                className="group p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                                                                title="Reset Password"
                                                            >
                                                                <KeyRound size={16} className="text-yellow-600 group-hover:scale-110 transition" />
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    if (user.id === currentUserId) {
                                                                        setMessage("You cannot deactivate yourself");
                                                                        return;
                                                                    }
                                                                    setDeactivateUserId(user);
                                                                }}
                                                                className="group p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                                                                title="Manage Status"
                                                            >
                                                                <Shield size={16} className="text-orange-600 group-hover:scale-110 transition" />
                                                            </button>

                                                        </div>
                                                    </td>

                                                </tr>

                                            );

                                        })}

                                    </tbody>

                                </table>

                            </div>

                            <div className="flex justify-between items-center mt-8">

                                <p className="text-sm text-gray-500">
                                    Page {totalPages === 0 ? 0 : currentPage} of {totalPages || 0}
                                </p>

                                <div className="flex gap-2">

                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => changePage(currentPage - 1)}
                                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
                                    >
                                        Prev
                                    </button>

                                    {Array.from({ length: totalPages }, (_, index) => (

                                        <button
                                            key={index}
                                            onClick={() => changePage(index + 1)}
                                            className={`px-4 py-2 rounded-lg ${currentPage === index + 1
                                                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md"
                                                : "bg-gray-200 hover:bg-gray-300"
                                                }`}
                                        >
                                            {index + 1}
                                        </button>

                                    ))}

                                    <button
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => changePage(currentPage + 1)}
                                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
                                    >
                                        Next
                                    </button>

                                </div>

                            </div>

                        </>

                    )}

                </div>

                {deactivateUserId && (
                    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

                        <div className="bg-white p-8 rounded-3xl w-[420px] shadow-2xl border border-gray-100">

                            <h2 className="text-lg font-semibold mb-2 text-gray-800">
                                {deactivateUserId.isActive ? "Deactivate User" : "Activate User"}
                            </h2>

                            <p className="text-sm text-gray-500 mb-5">
                                {deactivateUserId.isActive
                                    ? "Choose duration or make it permanent."
                                    : "This user is currently inactive. You can activate them."}
                            </p>

                            {deactivateUserId.isActive && (
                                <select
                                    value={deactivateDays === null ? "" : deactivateDays}
                                    onChange={(e) =>
                                        setDeactivateDays(e.target.value === "" ? null : Number(e.target.value))
                                    }
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl mb-5 focus:ring-2 focus:ring-emerald-400 outline-none"
                                >
                                    <option value="">Permanent</option>
                                    <option value="2">2 Days</option>
                                    <option value="3">3 Days</option>
                                    <option value="7">7 Days</option>
                                </select>
                            )}

                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() => setDeactivateUserId(null)}
                                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>

                                {deactivateUserId.isActive ? (
                                    <button
                                        onClick={handleDeactivate}
                                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg"
                                    >
                                        Deactivate
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            await axios.put(
                                                `${import.meta.env.VITE_API_URL}/admin/users/${deactivateUserId.id}/activate`,
                                                {},
                                                { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            setDeactivateUserId(null);
                                            fetchUsers();
                                        }}
                                        className="px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                                    >
                                        Activate
                                    </button>
                                )}


                            </div>

                        </div>

                    </div>
                )}

                {editingUser && (
                    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

                        <div className="bg-white p-8 rounded-3xl w-[460px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200">

                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Edit User
                                </h2>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-gray-400 hover:text-gray-600 text-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">

                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.fullName}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, fullName: e.target.value })
                                        }
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-400 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, email: e.target.value })
                                        }
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-400 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Role
                                    </label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, role: e.target.value })
                                        }
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-400 outline-none"
                                    >
                                        <option value="">Choose Role</option>
                                        <option value="Student">Student</option>
                                        <option value="Teacher">Teacher</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 mt-8">

                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleUpdate}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:shadow-lg transition"
                                >
                                    Save Changes
                                </button>

                            </div>

                        </div>
                    </div>
                )}

                {resetUserId && (
                    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

                        <div className="bg-white p-8 rounded-3xl w-[420px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200">

                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Reset Password
                                </h2>
                                <button
                                    onClick={() => setResetUserId(null)}
                                    className="text-gray-400 hover:text-gray-600 text-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Input */}
                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    placeholder="Enter strong password..."
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none"
                                />

                                <p className="text-xs text-gray-400 mt-1">
                                    Must be secure and hard to guess
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 mt-8">

                                <button
                                    onClick={() => setResetUserId(null)}
                                    className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleResetPassword}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md hover:shadow-lg transition"
                                >
                                    Reset Password
                                </button>

                            </div>

                        </div>
                    </div>
                )}
            </div>

        </div>

    );
}