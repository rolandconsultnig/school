import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getBasePath } from "./lib/basePath";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { ClassesPage } from "./pages/ClassesPage";
import { AdmissionsPage } from "./pages/AdmissionsPage";
import { AttendancePage } from "./pages/AttendancePage";
import { LmsPage } from "./pages/LmsPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { TeachersPage } from "./pages/TeachersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { StudentHomePage } from "./pages/student/StudentHomePage";
import { StudentCoursesPage } from "./pages/student/StudentCoursesPage";
import { StudentCourseDetailPage } from "./pages/student/StudentCourseDetailPage";
import { StudentAssignmentsPage } from "./pages/student/StudentAssignmentsPage";
import { StudentExamsPage } from "./pages/student/StudentExamsPage";
import { StudentGradebookPage } from "./pages/student/StudentGradebookPage";
import { StudentFeesPage } from "./pages/student/StudentFeesPage";
import { StudentRegisterPage } from "./pages/student/StudentRegisterPage";
import { StudentDocumentsPage } from "./pages/student/StudentDocumentsPage";
import { StudentAttendancePage } from "./pages/student/StudentAttendancePage";
import { StudentLibraryPage } from "./pages/student/StudentLibraryPage";
import { StudentWalletPage } from "./pages/student/StudentWalletPage";
import { StudentAccessPage } from "./pages/student/StudentAccessPage";
import { StudentTransportPage } from "./pages/student/StudentTransportPage";
import { StudentCommunityPage } from "./pages/student/StudentCommunityPage";
import { FinancePage } from "./pages/FinancePage";
import { HrPage } from "./pages/HrPage";
import { LibraryPage } from "./pages/LibraryPage";
import { AccessPage } from "./pages/AccessPage";
import { ExamsPage } from "./pages/ExamsPage";
import { LearnLayout } from "./components/LearnLayout";
import { AncillaryPage } from "./pages/AncillaryPage";
import { PromotionPage } from "./pages/PromotionPage";
import { PublicInquiryPage } from "./pages/apply/PublicInquiryPage";
import { ApplyLoginPage } from "./pages/apply/ApplyLoginPage";
import { ApplyRegisterPage } from "./pages/apply/ApplyRegisterPage";
import { ApplyPortalPage } from "./pages/apply/ApplyPortalPage";
import { PaystackCallbackPage } from "./pages/PaystackCallbackPage";
import { IdCardPage } from "./pages/IdCardPage";
import { StaffGradebookPage } from "./pages/StaffGradebookPage";
import { PtaCommunityPage } from "./pages/PtaCommunityPage";
import { ParentChildPage } from "./pages/ParentChildPage";

function RoleSwitch() {
  const { isStudent, isParent } = useAuth();
  if (isStudent) {
    return (
      <Routes>
        <Route path="/dashboard" element={<StudentHomePage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/learn/courses" element={<StudentCoursesPage />} />
        <Route path="/learn/courses/:courseId" element={<StudentCourseDetailPage />} />
        <Route path="/learn/assignments" element={<StudentAssignmentsPage />} />
        <Route path="/learn/exams" element={<StudentExamsPage />} />
        <Route path="/learn/gradebook" element={<StudentGradebookPage />} />
        <Route path="/services/fees" element={<StudentFeesPage />} />
        <Route path="/services/register" element={<StudentRegisterPage />} />
        <Route path="/services/documents" element={<StudentDocumentsPage />} />
        <Route path="/campus/attendance" element={<StudentAttendancePage />} />
        <Route path="/campus/library" element={<StudentLibraryPage />} />
        <Route path="/campus/wallet" element={<StudentWalletPage />} />
        <Route path="/campus/access" element={<StudentAccessPage />} />
        <Route path="/campus/transport" element={<StudentTransportPage />} />
        <Route path="/community" element={<StudentCommunityPage />} />
        <Route path="/lms" element={<Navigate to="/learn/courses" replace />} />
        <Route path="/gradebook" element={<Navigate to="/learn/gradebook" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }
  if (isParent) {
    return (
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/community" element={<PtaCommunityPage />} />
        <Route path="/children/:studentId" element={<ParentChildPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/students/:studentId" element={<StudentDetailPage />} />
      <Route path="/classes" element={<ClassesPage />} />
      <Route path="/admissions" element={<AdmissionsPage />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="/learn" element={<LearnLayout />}>
        <Route index element={<Navigate to="courses" replace />} />
        <Route path="courses" element={<LmsPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="gradebook" element={<StaffGradebookPage />} />
      </Route>
      <Route path="/lms" element={<Navigate to="/learn/courses" replace />} />
      <Route path="/lms/:courseId" element={<CourseDetailPage />} />
      <Route path="/gradebook" element={<Navigate to="/learn/gradebook" replace />} />
      <Route path="/exams" element={<Navigate to="/learn/exams" replace />} />
      <Route path="/teachers" element={<TeachersPage />} />
      <Route path="/finance" element={<FinancePage />} />
      <Route path="/hr" element={<HrPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/access" element={<AccessPage />} />
      <Route path="/ancillary" element={<AncillaryPage />} />
      <Route path="/promotion" element={<PromotionPage />} />
      <Route path="/id-cards" element={<IdCardPage />} />
      <Route path="/community" element={<PtaCommunityPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      basename={getBasePath() || undefined}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/apply" element={<PublicInquiryPage />} />
          <Route path="/apply/login" element={<ApplyLoginPage />} />
          <Route path="/apply/register" element={<ApplyRegisterPage />} />
          <Route path="/apply/portal" element={<ApplyPortalPage />} />
          <Route path="/paystack/callback" element={<PaystackCallbackPage />} />
          <Route
            element={
              <ProtectedRoute>
                <TenantProvider>
                  <Layout />
                </TenantProvider>
              </ProtectedRoute>
            }
          >
            <Route path="*" element={<RoleSwitch />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
