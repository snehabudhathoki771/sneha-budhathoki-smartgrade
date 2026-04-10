import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, Trash2, PlusCircle } from "lucide-react";

export default function AdminGradeConfig() {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [form, setForm] = useState({
        gradeName: "",
        minPercentage: "",
        maxPercentage: "",
        gpaValue: "",
        isActive: true
    });

    const [editingGrade, setEditingGrade] = useState(null);

    // CONFIRM MODAL STATE
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        id: null
    });

    const token = localStorage.getItem("token");

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                "https://localhost:7247/api/admin/grades",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGrades(res.data);
        } catch {
            setMessage("Error loading grades");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!form.gradeName || form.minPercentage === "" || form.maxPercentage === "" || form.gpaValue === "") {
            setMessage("All fields are required");
            return;
        }

        try {
            setLoading(true);
            await axios.post(
                "https://localhost:7247/api/admin/grades",
                form,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setForm({
                gradeName: "",
                minPercentage: "",
                maxPercentage: "",
                gpaValue: "",
                isActive: true
            });
            setMessage("Grade created successfully");
            fetchGrades();
        } catch (err) {
            setMessage(err.response?.data || "Error creating grade");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            setLoading(true);
            await axios.put(
                `https://localhost:7247/api/admin/grades/${editingGrade.id}`,
                editingGrade,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditingGrade(null);
            setMessage("Grade updated successfully");
            fetchGrades();
        } catch {
            setMessage("Error updating grade");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            open: true,
            id
        });
    };

    //  CONFIRM DELETE ACTION
    const confirmDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(
                `https://localhost:7247/api/admin/grades/${confirmModal.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage("Grade deleted successfully");
            fetchGrades();
        } catch {
            setMessage("Error deleting grade");
        } finally {
            setLoading(false);
            setConfirmModal({ open: false, id: null });
        }
    };

    return (
        <div className="min-h-screen bg-white px-6 pt-10 pb-10">

            {message && (
                <div className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md z-50">
                    {message}
                </div>
            )}

            <div className="space-y-10">

                {/* CREATE FORM */}
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">

                    <div className="flex items-center gap-2 mb-6">
                        <PlusCircle size={20} className="text-emerald-600" />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Add Grade
                        </h2>
                    </div>

                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-5">

                        <input
                            type="text"
                            placeholder="Grade (A+)"
                            value={form.gradeName}
                            onChange={(e) => setForm({ ...form, gradeName: e.target.value })}
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />

                        <input
                            type="number"
                            placeholder="Min %"
                            value={form.minPercentage}
                            onChange={(e) => setForm({ ...form, minPercentage: e.target.value })}
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />

                        <input
                            type="number"
                            placeholder="Max %"
                            value={form.maxPercentage}
                            onChange={(e) => setForm({ ...form, maxPercentage: e.target.value })}
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />

                        <input
                            type="number"
                            step="0.01"
                            placeholder="GPA"
                            value={form.gpaValue}
                            onChange={(e) => setForm({ ...form, gpaValue: e.target.value })}
                            className="border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-500 text-white rounded-xl px-4 py-3 hover:bg-emerald-600 transition disabled:opacity-50"
                        >
                            Save
                        </button>

                    </form>
                </div>

                {/* TABLE */}
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">

                    <h2 className="text-xl font-semibold mb-6 text-gray-800">
                        All Grades
                    </h2>

                    {loading ? (
                        <p className="text-gray-400">Loading...</p>
                    ) : (
                        <table className="w-full text-left">

                            <thead>
                                <tr className="border-b border-gray-200 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-4">Grade</th>
                                    <th className="p-4">Min %</th>
                                    <th className="p-4">Max %</th>
                                    <th className="p-4">GPA</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {grades.map((grade) => (

                                    <tr key={grade.id} className="hover:bg-gray-50 transition">

                                        <td className="p-4 font-semibold text-gray-800">
                                            {grade.gradeName}
                                        </td>

                                        <td className="p-4 text-gray-600">
                                            {grade.minPercentage}
                                        </td>

                                        <td className="p-4 text-gray-600">
                                            {grade.maxPercentage}
                                        </td>

                                        <td className="p-4 text-gray-600">
                                            {grade.gpaValue}
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs rounded-full font-semibold ${grade.isActive
                                                    ? "bg-emerald-100 text-emerald-600"
                                                    : "bg-gray-200 text-gray-600"
                                                }`}>
                                                {grade.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            
                                            <div className="flex justify-end items-center gap-3">

                                                <button
                                                    onClick={() => setEditingGrade(grade)}
                                                    className="group p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 hover:scale-105 active:scale-95 transition"
                                                >
                                                    <Pencil size={16} className="text-gray-500 group-hover:text-emerald-600 transition" />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(grade.id)}
                                                    className="group p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-red-300 hover:scale-105 active:scale-95 transition"
                                                >
                                                    <Trash2 size={16} className="text-gray-500 group-hover:text-red-600 transition" />
                                                </button>

                                            </div>
                                            
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>
                    )}
                </div>

                {/* EDIT MODAL */}
                {editingGrade && (
                    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">

                        <div className="bg-white p-8 rounded-2xl w-[420px] shadow-lg">

                            <h2 className="text-xl font-semibold mb-6 text-gray-800">
                                Edit Grade
                            </h2>

                            <input
                                type="text"
                                value={editingGrade.gradeName}
                                onChange={(e) =>
                                    setEditingGrade({ ...editingGrade, gradeName: e.target.value })
                                }
                                className="w-full border border-gray-200 px-4 py-3 rounded-xl mb-4"
                            />

                            <input
                                type="number"
                                value={editingGrade.minPercentage}
                                onChange={(e) =>
                                    setEditingGrade({ ...editingGrade, minPercentage: e.target.value })
                                }
                                className="w-full border border-gray-200 px-4 py-3 rounded-xl mb-4"
                            />

                            <input
                                type="number"
                                value={editingGrade.maxPercentage}
                                onChange={(e) =>
                                    setEditingGrade({ ...editingGrade, maxPercentage: e.target.value })
                                }
                                className="w-full border border-gray-200 px-4 py-3 rounded-xl mb-4"
                            />

                            <input
                                type="number"
                                step="0.01"
                                value={editingGrade.gpaValue}
                                onChange={(e) =>
                                    setEditingGrade({ ...editingGrade, gpaValue: e.target.value })
                                }
                                className="w-full border border-gray-200 px-4 py-3 rounded-xl mb-6"
                            />

                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() => setEditingGrade(null)}
                                    className="px-5 py-2 bg-gray-200 rounded-xl"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleUpdate}
                                    className="px-5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                                >
                                    Update
                                </button>

                            </div>

                        </div>

                    </div>
                )}

                {/* CONFIRM DELETE MODAL */}
                {confirmModal.open && (
                    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-[350px] shadow-lg">

                            <h2 className="text-lg font-semibold mb-4">
                                Confirm Delete
                            </h2>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this grade?
                            </p>

                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() => setConfirmModal({ open: false, id: null })}
                                    className="px-4 py-2 bg-gray-200 rounded-xl"
                                >
                                    No
                                </button>

                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-xl"
                                >
                                    Yes
                                </button>

                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}