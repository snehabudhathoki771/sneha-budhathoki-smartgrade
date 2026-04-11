import api from "../../services/api";
import {
    CheckCircle,
    FileText,
    Upload
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function BulkUpload() {

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
        }
    }, []);

    useEffect(() => {
        api.get("/teacher/exams")
            .then(res => setExams(res.data))
            .catch(() => toast.error("Failed to load exams"));
    }, []);

    useEffect(() => {
        if (!selectedExam) return;

        api.get(`/teacher/exams/${selectedExam}/subjects`)
            .then(res => setSubjects(res.data))
            .catch(() => toast.error("Failed to load subjects"));
    }, [selectedExam]);

    useEffect(() => {
        if (!selectedSubject) return;

        api.get(`/teacher/subjects/${selectedSubject}/sections`)
            .then(res => setSections(res.data))
            .catch(() => toast.error("Failed to load sections"));
    }, [selectedSubject]);

    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);

    const [selectedExam, setSelectedExam] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePreview = async () => {
        if (!file || !selectedSection) {
            toast.warning("Select section and file first.");
            return;
        }

        const formData = new FormData();
        formData.append("File", file);
        formData.append("SectionId", selectedSection);

        try {
            setLoading(true);
            const res = await api.post(
                "/teacher/bulk-upload-preview",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setPreviewData(res.data);
            toast.success("Preview generated successfully!");

        } catch (err) {
            console.error(err);
            toast.error("Preview failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            await api.post(
                `/teacher/bulk-upload-confirm?sectionId=${selectedSection}`,
                previewData
            );
            toast.success("Bulk upload successful!");

            setPreviewData(null);
            setFile(null);
        } catch (err) {
            console.error(err);
            toast.error("Confirm failed.");
        }
    };

    return (

        <div className="px-8 pt-4 pb-8 bg-gray-50 min-h-screen">

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>

                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-6 text-sm font-medium">

                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={18} />
                        Select Section
                    </div>

                    <div className="h-px flex-1 bg-gray-300" />

                    <div className={`flex items-center gap-2 ${file ? "text-green-600" : "text-gray-400"}`}>
                        <Upload size={18} />
                        Upload File
                    </div>

                    <div className="h-px flex-1 bg-gray-300" />

                    <div className={`flex items-center gap-2 ${previewData ? "text-green-600" : "text-gray-400"}`}>
                        <FileText size={18} />
                        Confirm
                    </div>

                </div>

                {/* Main Card */}
                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 space-y-6">

                    {/* Selection Section */}
                    <div className="grid md:grid-cols-3 gap-4">

                        <select
                            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500"
                            onChange={(e) => setSelectedExam(e.target.value)}
                        >
                            <option value="">Select Exam</option>
                            {exams.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500"
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500"
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="">Select Section</option>
                            {sections.map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                    {sec.name} ({sec.weightage}%)
                                </option>
                            ))}
                        </select>

                    </div>

                    {/* Upload Box */}
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-gray-50">

                        <div className="flex flex-col items-center gap-3">
                            <Upload size={28} className="text-green-600" />

                            <p className="text-gray-600">
                                Upload .CSV or .XLSX file
                            </p>

                            <input
                                type="file"
                                accept=".csv,.xlsx"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="text-sm"
                            />

                            {file && (
                                <p className="text-sm text-green-600 font-medium">
                                    {file.name}
                                </p>
                            )}
                        </div>

                    </div>

                    {/* Preview Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handlePreview}
                            disabled={!file || !selectedSection}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium ${!file || !selectedSection
                                ? "bg-gray-300 text-gray-600"
                                : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                        >
                            {loading ? "Processing..." : "Preview Upload"}
                        </button>
                    </div>

                </div>

                {/* Preview Section */}
                {previewData && (
                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 space-y-6">

                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FileText size={18} />
                            Preview Summary
                        </h2>

                        <div className="grid md:grid-cols-3 gap-4">

                            <div className="bg-gray-50 border rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total Rows</p>
                                <p className="text-xl font-semibold">{previewData.totalRows}</p>
                            </div>

                            <div className="bg-green-50 border rounded-xl p-4">
                                <p className="text-sm text-gray-500">Valid Rows</p>
                                <p className="text-xl font-semibold text-green-600">
                                    {previewData.successfulRows}
                                </p>
                            </div>

                            <div className="bg-red-50 border rounded-xl p-4">
                                <p className="text-sm text-gray-500">Failed Rows</p>
                                <p className="text-xl font-semibold text-red-600">
                                    {previewData.failedRows}
                                </p>
                            </div>

                        </div>

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead>
                                    <tr className="border-b text-gray-400 text-xs uppercase">
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Score</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Error</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {previewData.rowResults.map((row, index) => (
                                        <tr key={index} className="border-t hover:bg-gray-50">

                                            <td className="p-3">{row.studentEmail}</td>
                                            <td className="p-3">{row.score}</td>

                                            <td className="p-3">
                                                {row.isValid ? (
                                                    <span className="text-green-600 font-medium">
                                                        Valid
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 font-medium">
                                                        Invalid
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3 text-red-500 text-sm">
                                                {row.errorMessage}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleConfirm}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 text-sm"
                            >
                                Confirm Upload
                            </button>
                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}