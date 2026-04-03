import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// PUBLIC PAGES
import LandingPage from "./pages/LandingPage";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import Signup from "./pages/auth/Signup";

// TEACHER PAGES
import AddMarks from "./pages/Teacher/AddMarks";
import AssessmentSetup from "./pages/Teacher/AssessmentSetup";
import TeacherDashboard from "./pages/Teacher/Dashboard";
import ExamManagement from "./pages/Teacher/ExamManagement";
import Feedback from "./pages/Teacher/Feedback";
import Results from "./pages/Teacher/Results";
import SubjectManagement from "./pages/Teacher/SubjectManagement";
import TeacherProfile from "./pages/Teacher/TeacherProfile";
import TeacherStudents from "./pages/Teacher/TeacherStudent";
import TeacherSubjectAnalytics from "./pages/Teacher/TeacherSubjectAnalytics";
import ToppersAtRisk from "./pages/Teacher/ToppersAtRisk";
import TeacherStudentProfile from "./pages/Teacher/TeacherStudentProfile";  

// STUDENT PAGES
import StudentAnalytics from "./pages/Student/StudentAnalytics";
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentFeedback from "./pages/Student/StudentFeedback";
import StudentNotifications from "./pages/Student/StudentNotifications";
import StudentProfile from "./pages/Student/StudentProfile";
import StudentResultsAndReports from "./pages/Student/StudentResultsAndReports";

// ADMIN PAGES
import AdminLayout from "./layouts/AdminLayout";
import AdminAnalytics from "./pages/Admin/AdminAnalytics";
import AdminAuditLogs from "./pages/Admin/AdminAuditLogs";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminExamDetails from "./pages/Admin/AdminExamDetails";
import AdminExams from "./pages/Admin/AdminExams";
import AdminGradeConfig from "./pages/Admin/AdminGradeConfig";
import AdminTeacherProfile from "./pages/Admin/AdminTeacherProfile";
import AdminUserProfile from "./pages/Admin/AdminUserProfile";
import AdminUsers from "./pages/Admin/AdminUsers";


// LAYOUTS
import StudentLayout from "./layouts/StudentLayout";
import TeacherLayout from "./layouts/TeacherLayout";

// PROTECTION
import ProtectedRoute from "./components/ProtectedRoute";
import BulkUpload from "./pages/Teacher/BulkUpload";
export default function App() {
  return (
    <>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* TEACHER ROUTES */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="exams" element={<ExamManagement />} />
          <Route path="assessment-setup" element={<AssessmentSetup />} />
          <Route path="marks" element={<AddMarks />} />
          <Route path="analytics" element={<TeacherSubjectAnalytics />} />
          <Route path="bulk-import" element={<BulkUpload />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:examId" element={<Results />} />
          <Route path="toppers-at-risk" element={<ToppersAtRisk />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="exams/:examId/subjects" element={<SubjectManagement />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="/teacher/students/:id" element={<TeacherStudentProfile />} />
        </Route>

        {/* STUDENT ROUTES */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="results" element={<StudentResultsAndReports />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="feedback" element={<StudentFeedback />} />
          <Route path="results-and-reports" element={<StudentResultsAndReports />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="exams/:id" element={<AdminExamDetails />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="grades" element={<AdminGradeConfig />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="students/:id" element={<AdminUserProfile />} />
          <Route path="teachers/:id" element={<AdminTeacherProfile />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Login />} />

      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </>
  );
}