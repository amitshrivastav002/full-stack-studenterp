import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { HOME_FOR_ROLE, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import type { NavItem } from './components/Layout';
import type { Role } from './api/types';
import { Spinner } from './components/ui';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Notices from './pages/Notices';

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminFaculty = lazy(() => import('./pages/admin/Faculty'));
const AdminAcademics = lazy(() => import('./pages/admin/Academics'));
const AdminSubjects = lazy(() => import('./pages/admin/Subjects'));
const AdminAssignments = lazy(() => import('./pages/admin/Assignments'));
const AdminTimetable = lazy(() => import('./pages/admin/Timetable'));
const AdminExams = lazy(() => import('./pages/admin/Exams'));
const AdminFees = lazy(() => import('./pages/admin/Fees'));
const AdminLeaves = lazy(() => import('./pages/admin/Leaves'));
const AdminNotices = lazy(() => import('./pages/admin/Notices'));
const AdminLibrary = lazy(() => import('./pages/admin/Library'));
const AdminHostel = lazy(() => import('./pages/admin/Hostel'));
const AdminTransport = lazy(() => import('./pages/admin/Transport'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminAttendance = lazy(() => import('./pages/admin/Attendance'));

const FacultyDashboard = lazy(() => import('./pages/faculty/Dashboard'));
const FacultyAttendance = lazy(() => import('./pages/faculty/Attendance'));
const FacultyTimetable = lazy(() => import('./pages/faculty/Timetable'));
const FacultyLeaves = lazy(() => import('./pages/faculty/Leaves'));
const FacultyAssignments = lazy(() => import('./pages/faculty/Assignments'));

const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const StudentLibrary = lazy(() => import('./pages/student/Library'));
const StudentCampus = lazy(() => import('./pages/student/Campus'));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const StudentResults = lazy(() => import('./pages/student/Results'));
const StudentTimetable = lazy(() => import('./pages/student/Timetable'));
const StudentFees = lazy(() => import('./pages/student/Fees'));
const StudentLeaves = lazy(() => import('./pages/student/Leaves'));

function PageFallback() {
  return (
    <div className="flex justify-center py-12">
      <Spinner />
    </div>
  );
}

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={HOME_FOR_ROLE[session.role]} replace />;
  return <>{children}</>;
}

function LandingRoute() {
  const { session } = useAuth();
  if (session) return <Navigate to={HOME_FOR_ROLE[session.role]} replace />;
  return <Landing />;
}

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/faculty', label: 'Faculty' },
  { to: '/admin/academics', label: 'Departments & Courses' },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/assignments', label: 'Subject Allocation' },
  { to: '/admin/timetable', label: 'Timetable' },
  { to: '/admin/attendance', label: 'Attendance' },
  { to: '/admin/exams', label: 'Examinations' },
  { to: '/admin/fees', label: 'Fees' },
  { to: '/admin/leaves', label: 'Leave Requests' },
  { to: '/admin/notices', label: 'Notices' },
  { to: '/admin/library', label: 'Library' },
  { to: '/admin/hostel', label: 'Hostel' },
  { to: '/admin/transport', label: 'Transport' },
  { to: '/admin/users', label: 'Portal Accounts' },
  { to: '/admin/profile', label: 'My Profile' },
];

const FACULTY_NAV: NavItem[] = [
  { to: '/faculty', label: 'Dashboard', end: true },
  { to: '/faculty/attendance', label: 'Attendance' },
  { to: '/faculty/assignments', label: 'Assignments' },
  { to: '/faculty/timetable', label: 'Timetable' },
  { to: '/faculty/leaves', label: 'Leave Requests' },
  { to: '/faculty/notices', label: 'Notices' },
  { to: '/faculty/profile', label: 'My Profile' },
];

const STUDENT_NAV: NavItem[] = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/attendance', label: 'Attendance' },
  { to: '/student/assignments', label: 'Assignments' },
  { to: '/student/results', label: 'Results' },
  { to: '/student/timetable', label: 'Timetable' },
  { to: '/student/fees', label: 'Fees' },
  { to: '/student/leaves', label: 'Leave' },
  { to: '/student/library', label: 'Library' },
  { to: '/student/campus', label: 'Hostel & Transport' },
  { to: '/student/notices', label: 'Notices' },
  { to: '/student/profile', label: 'My Profile' },
];

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin"
        element={
          <RequireRole role="ADMIN">
            <Layout items={ADMIN_NAV} area="Administration" />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="faculty" element={<AdminFaculty />} />
        <Route path="academics" element={<AdminAcademics />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="timetable" element={<AdminTimetable />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="fees" element={<AdminFees />} />
        <Route path="leaves" element={<AdminLeaves />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="library" element={<AdminLibrary />} />
        <Route path="hostel" element={<AdminHostel />} />
        <Route path="transport" element={<AdminTransport />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/faculty"
        element={
          <RequireRole role="FACULTY">
            <Layout items={FACULTY_NAV} area="Faculty Portal" />
          </RequireRole>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="attendance" element={<FacultyAttendance />} />
        <Route path="assignments" element={<FacultyAssignments />} />
        <Route path="timetable" element={<FacultyTimetable />} />
        <Route path="leaves" element={<FacultyLeaves />} />
        <Route path="notices" element={<Notices />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/student"
        element={
          <RequireRole role="STUDENT">
            <Layout items={STUDENT_NAV} area="Student Portal" />
          </RequireRole>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="leaves" element={<StudentLeaves />} />
        <Route path="library" element={<StudentLibrary />} />
        <Route path="campus" element={<StudentCampus />} />
        <Route path="notices" element={<Notices />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
