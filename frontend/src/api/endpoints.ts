import { api } from './client';
import type {
  AttendanceRequest, AttendanceResponse, AttendanceStudentResponse,
  Course, Department, ExamRequest, ExamResponse, ExamSubjectRequest,
  ExamSubjectResponse, FacultyAccountRequest, FacultyRequest, FacultyResponse,
  FacultySubjectRequest, FacultySubjectResponse, FeePaymentRequest,
  FeePaymentResponse, FeeReceiptResponse, FeeStructureRequest,
  FeeStructureResponse, LeaveDecisionRequest, LeaveStatus, LoginRequest,
  LoginResponse, Page, RazorpayOrderRequest, RazorpayOrderResponse,
  RazorpayOrderSummaryResponse, RazorpayPaymentVerificationRequest,
  RazorpayStatusResponse, RegisterRequest, SignupRequest,
  StudentAttendanceSummary, StudentDocumentResponse,
  StudentExamResultResponse, StudentFeeDashboardResponse, StudentFeeResponse,
  StudentLeaveRequest, StudentLeaveResponse, StudentMarkRequest,
  StudentRazorpayVerificationRequest,
  StudentMarkResponse, StudentRequest, StudentResponse, SubjectRequest,
  SubjectResponse, TimetableRequest, TimetableResponse, DocumentType,
  AdminDashboardResponse, AssignmentRequest, AssignmentResponse,
  AssignmentSubmissionResponse, BookIssueRequest, BookIssueResponse,
  BookIssueStatus, BookRequest, BookResponse, ChangePasswordRequest,
  FacultyDashboardResponse, GradeSubmissionRequest, HostelAllocationRequest,
  HostelAllocationResponse, HostelRoomRequest, HostelRoomResponse,
  MessageResponse, NoticeRequest, NoticeResponse, ProfileResponse,
  StudentDashboardResponse, TransportAssignmentRequest,
  TransportAssignmentResponse, TransportRouteRequest, TransportRouteResponse,
  TransportStopRequest, TransportStopResponse,
} from './types';

interface PageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export const auth = {
  login: (body: LoginRequest) => api.post<LoginResponse>('/api/auth/login', body),
  /** Admin-only: the backend refuses this for anyone who is not signed in as ADMIN. */
  register: (body: RegisterRequest) =>
    api.post<MessageResponse>('/api/auth/register', body),
  /** Public self-service. Always creates a STUDENT account. */
  signup: (body: SignupRequest) =>
    api.post<MessageResponse>('/api/auth/signup', body),
};

export const students = {
  create: (body: StudentRequest) => api.post<StudentResponse>('/api/students', body),
  list: (params: PageParams = {}) =>
    api.get<Page<StudentResponse>>('/api/students', { ...params }),
  search: (keyword: string) =>
    api.get<StudentResponse[]>('/api/students/search', { keyword }),
  get: (id: number) => api.get<StudentResponse>(`/api/students/${id}`),
  update: (id: number, body: StudentRequest) =>
    api.put<StudentResponse>(`/api/students/${id}`, body),
  remove: (id: number) => api.delete<string>(`/api/students/${id}`),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<StudentResponse>(`/api/students/${id}/photo`, form);
  },
};

export const documents = {
  list: (studentId: number) =>
    api.get<StudentDocumentResponse[]>(`/api/students/${studentId}/documents`),
  upload: (studentId: number, type: DocumentType, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<StudentDocumentResponse>(
      `/api/students/${studentId}/documents`, form, { type },
    );
  },
  download: (studentId: number, documentId: number, name: string) =>
    api.download(`/api/students/${studentId}/documents/${documentId}/file`, name),
  remove: (studentId: number, documentId: number) =>
    api.delete<string>(`/api/students/${studentId}/documents/${documentId}`),
};

export const faculty = {
  create: (body: FacultyRequest) => api.post<FacultyResponse>('/api/admin/faculty', body),
  list: (params: PageParams = {}) =>
    api.get<Page<FacultyResponse>>('/api/admin/faculty', { ...params }),
  search: (keyword: string) =>
    api.get<FacultyResponse[]>('/api/admin/faculty/search', { keyword }),
  get: (id: number) => api.get<FacultyResponse>(`/api/admin/faculty/${id}`),
  update: (id: number, body: FacultyRequest) =>
    api.put<FacultyResponse>(`/api/admin/faculty/${id}`, body),
  remove: (id: number) => api.delete<string>(`/api/admin/faculty/${id}`),
  createAccount: (body: FacultyAccountRequest) =>
    api.post<string>('/api/admin/faculty-accounts', body),
};

export const departments = {
  list: () => api.get<Department[]>('/api/admin/departments'),
  create: (body: Department) => api.post<Department>('/api/admin/departments', body),
};

export const courses = {
  list: () => api.get<Course[]>('/api/admin/courses'),
  create: (body: Course) => api.post<Course>('/api/admin/courses', body),
};

export const subjects = {
  create: (body: SubjectRequest) => api.post<SubjectResponse>('/api/admin/subjects', body),
  get: (id: number) => api.get<SubjectResponse>(`/api/admin/subjects/${id}`),
  list: (courseId: number, semester: number) =>
    api.get<SubjectResponse[]>('/api/admin/subjects', { courseId, semester }),
  update: (id: number, body: SubjectRequest) =>
    api.put<SubjectResponse>(`/api/admin/subjects/${id}`, body),
  remove: (id: number) => api.delete<string>(`/api/admin/subjects/${id}`),
};

export const facultySubjects = {
  assign: (body: FacultySubjectRequest) =>
    api.post<FacultySubjectResponse>('/api/admin/faculty-subjects', body),
  byFaculty: (facultyId: number) =>
    api.get<FacultySubjectResponse[]>(`/api/admin/faculty-subjects/faculty/${facultyId}`),
  remove: (assignmentId: number) =>
    api.delete<string>(`/api/admin/faculty-subjects/${assignmentId}`),
};

export const exams = {
  create: (body: ExamRequest) => api.post<ExamResponse>('/api/admin/exams', body),
  list: (courseId: number, semester: number, academicYear: string) =>
    api.get<ExamResponse[]>('/api/admin/exams', { courseId, semester, academicYear }),
  addSubject: (examId: number, body: ExamSubjectRequest) =>
    api.post<ExamSubjectResponse>(`/api/admin/exams/${examId}/subjects`, body),
  subjects: (examId: number) =>
    api.get<ExamSubjectResponse[]>(`/api/admin/exams/${examId}/subjects`),
  saveMark: (examSubjectId: number, body: StudentMarkRequest) =>
    api.put<StudentMarkResponse>(`/api/admin/exams/subjects/${examSubjectId}/marks`, body),
  results: (examId: number) =>
    api.get<StudentExamResultResponse[]>(`/api/admin/exams/${examId}/results`),
  studentResult: (examId: number, studentId: number) =>
    api.get<StudentExamResultResponse>(
      `/api/admin/exams/${examId}/students/${studentId}/result`,
    ),
};

export const timetable = {
  create: (body: TimetableRequest) => api.post<TimetableResponse>('/api/admin/timetable', body),
  update: (id: number, body: TimetableRequest) =>
    api.put<TimetableResponse>(`/api/admin/timetable/${id}`, body),
  remove: (id: number) => api.delete<string>(`/api/admin/timetable/${id}`),
  forClass: (courseId: number, semester: number, section: string, academicYear: string) =>
    api.get<TimetableResponse[]>('/api/admin/timetable', {
      courseId, semester, section, academicYear,
    }),
  forFaculty: (facultyId: number, academicYear: string) =>
    api.get<TimetableResponse[]>(`/api/admin/timetable/faculty/${facultyId}`, { academicYear }),
};

export const fees = {
  createStructure: (body: FeeStructureRequest) =>
    api.post<FeeStructureResponse>('/api/admin/fees/structures', body),
  structures: () => api.get<FeeStructureResponse[]>('/api/admin/fees/structures'),
  assign: (studentId: number, feeStructureId: number) =>
    api.post<StudentFeeResponse>(
      `/api/admin/fees/students/${studentId}/assign`, undefined, { feeStructureId },
    ),
  studentFees: (studentId: number) =>
    api.get<StudentFeeResponse[]>(`/api/admin/fees/students/${studentId}`),
  pay: (studentFeeId: number, body: FeePaymentRequest) =>
    api.post<FeePaymentResponse>(
      `/api/admin/fees/student-fees/${studentFeeId}/payments`, body,
    ),
  payments: (studentFeeId: number) =>
    api.get<FeePaymentResponse[]>(`/api/admin/fees/student-fees/${studentFeeId}/payments`),
  receipt: (paymentId: number) =>
    api.get<FeeReceiptResponse>(`/api/admin/fees/payments/${paymentId}/receipt`),
  downloadReceipt: (paymentId: number) =>
    api.download(
      `/api/admin/fees/payments/${paymentId}/receipt/pdf`,
      `receipt-${paymentId}.pdf`,
    ),
  createOrder: (body: RazorpayOrderRequest) =>
    api.post<RazorpayOrderResponse>('/api/admin/fees/razorpay/orders', body),
  verifyPayment: (body: RazorpayPaymentVerificationRequest) =>
    api.post<FeePaymentResponse>('/api/admin/fees/razorpay/verify', body),
  razorpayStatus: () =>
    api.get<RazorpayStatusResponse>('/api/admin/fees/razorpay/status'),
  razorpayOrders: () =>
    api.get<RazorpayOrderSummaryResponse[]>('/api/admin/fees/razorpay/orders'),
};

/**
 * Attendance for any class in the college. Same shapes as the faculty calls,
 * but not scoped to one lecturer's allocations.
 */
export const adminAttendance = {
  assignments: () =>
    api.get<FacultySubjectResponse[]>('/api/admin/attendance/assignments'),
  students: (assignmentId: number) =>
    api.get<AttendanceStudentResponse[]>(
      `/api/admin/attendance/assignments/${assignmentId}/students`,
    ),
  attendanceFor: (assignmentId: number, date: string) =>
    api.get<AttendanceResponse[]>(
      `/api/admin/attendance/assignments/${assignmentId}`, { date },
    ),
  mark: (body: AttendanceRequest) =>
    api.post<AttendanceResponse[]>('/api/admin/attendance', body),
};

export const adminLeaves = {
  list: (status?: LeaveStatus) =>
    api.get<StudentLeaveResponse[]>('/api/admin/leaves', { status }),
  decide: (leaveId: number, body: LeaveDecisionRequest) =>
    api.put<StudentLeaveResponse>(`/api/admin/leaves/${leaveId}/decision`, body),
};

export const facultyPortal = {
  me: () => api.get<FacultyResponse>('/api/faculty/me'),
  mySubjects: () => api.get<FacultySubjectResponse[]>('/api/faculty/subjects'),
  timetable: (academicYear: string) =>
    api.get<TimetableResponse[]>('/api/faculty/timetable', { academicYear }),
  attendanceStudents: (assignmentId: number) =>
    api.get<AttendanceStudentResponse[]>(
      `/api/faculty/attendance/assignments/${assignmentId}/students`,
    ),
  markAttendance: (body: AttendanceRequest) =>
    api.post<AttendanceResponse[]>('/api/faculty/attendance', body),
  attendanceFor: (assignmentId: number, date: string) =>
    api.get<AttendanceResponse[]>(
      `/api/faculty/attendance/assignments/${assignmentId}`, { date },
    ),
  leaves: (status?: LeaveStatus) =>
    api.get<StudentLeaveResponse[]>('/api/faculty/leaves', { status }),
  decideLeave: (leaveId: number, body: LeaveDecisionRequest) =>
    api.put<StudentLeaveResponse>(`/api/faculty/leaves/${leaveId}/decision`, body),
};

export const studentPortal = {
  feeDashboard: () =>
    api.get<StudentFeeDashboardResponse>('/api/student/fees/dashboard'),
  /** The backend re-checks that the fee belongs to the signed-in student. */
  createFeeOrder: (body: RazorpayOrderRequest) =>
    api.post<RazorpayOrderResponse>('/api/student/fees/razorpay/orders', body),
  verifyFeePayment: (body: StudentRazorpayVerificationRequest) =>
    api.post<FeePaymentResponse>('/api/student/fees/razorpay/verify', body),
  feePayments: (studentFeeId: number) =>
    api.get<FeePaymentResponse[]>(
      `/api/student/fees/student-fees/${studentFeeId}/payments`,
    ),
  feeReceipt: (paymentId: number) =>
    api.get<FeeReceiptResponse>(`/api/student/fees/payments/${paymentId}/receipt`),
  downloadFeeReceipt: (paymentId: number) =>
    api.download(
      `/api/student/fees/payments/${paymentId}/receipt/pdf`,
      `fee-receipt-${paymentId}.pdf`,
    ),
  attendance: (studentId: number) =>
    api.get<StudentAttendanceSummary[]>(`/api/student/attendance/${studentId}`),
  results: () => api.get<StudentExamResultResponse[]>('/api/student/exams/results'),
  timetable: (academicYear: string) =>
    api.get<TimetableResponse[]>('/api/student/timetable', { academicYear }),
  leaves: () => api.get<StudentLeaveResponse[]>('/api/student/leaves'),
  applyLeave: (body: StudentLeaveRequest) =>
    api.post<StudentLeaveResponse>('/api/student/leaves', body),
};

// ================================================================
// Self service â€” available to every signed-in role
// ================================================================

export const me = {
  profile: () => api.get<ProfileResponse>('/api/me'),
  /** Every signed-in role may set its own photo. */
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<ProfileResponse>('/api/me/photo', form);
  },
  photoObjectUrl: () => api.objectUrl('/api/me/photo'),
  notices: () => api.get<NoticeResponse[]>('/api/me/notices'),
  changePassword: (body: ChangePasswordRequest) =>
    api.put<MessageResponse>('/api/me/password', body),
};

export const notices = {
  list: () => api.get<NoticeResponse[]>('/api/admin/notices'),
  create: (body: NoticeRequest) => api.post<NoticeResponse>('/api/admin/notices', body),
  update: (id: number, body: NoticeRequest) =>
    api.put<NoticeResponse>(`/api/admin/notices/${id}`, body),
  remove: (id: number) => api.delete<MessageResponse>(`/api/admin/notices/${id}`),
};

export const dashboards = {
  admin: () => api.get<AdminDashboardResponse>('/api/admin/dashboard'),
  faculty: (academicYear?: string) =>
    api.get<FacultyDashboardResponse>('/api/faculty/dashboard', { academicYear }),
  student: (academicYear?: string) =>
    api.get<StudentDashboardResponse>('/api/student/dashboard', { academicYear }),
};

// ================================================================
// Assignments
// ================================================================

export const facultyAssignments = {
  list: () => api.get<AssignmentResponse[]>('/api/faculty/assignments'),
  create: (body: AssignmentRequest) =>
    api.post<AssignmentResponse>('/api/faculty/assignments', body),
  update: (id: number, body: AssignmentRequest) =>
    api.put<AssignmentResponse>(`/api/faculty/assignments/${id}`, body),
  remove: (id: number) => api.delete<MessageResponse>(`/api/faculty/assignments/${id}`),
  submissions: (assignmentId: number) =>
    api.get<AssignmentSubmissionResponse[]>(
      `/api/faculty/assignments/${assignmentId}/submissions`,
    ),
  grade: (submissionId: number, body: GradeSubmissionRequest) =>
    api.put<AssignmentSubmissionResponse>(
      `/api/faculty/assignments/submissions/${submissionId}/grade`, body,
    ),
  downloadSubmission: (submissionId: number, name: string) =>
    api.download(`/api/faculty/assignments/submissions/${submissionId}/file`, name),
};

export const studentAssignments = {
  list: () => api.get<AssignmentResponse[]>('/api/student/assignments'),
  submit: (assignmentId: number, file: File, remarks?: string) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<AssignmentSubmissionResponse>(
      `/api/student/assignments/${assignmentId}/submission`, form, { remarks },
    );
  },
  downloadSubmission: (submissionId: number, name: string) =>
    api.download(`/api/student/assignments/submissions/${submissionId}/file`, name),
};

// ================================================================
// Library
// ================================================================

export const library = {
  books: (keyword?: string) =>
    api.get<BookResponse[]>('/api/admin/library/books', { keyword }),
  createBook: (body: BookRequest) =>
    api.post<BookResponse>('/api/admin/library/books', body),
  updateBook: (id: number, body: BookRequest) =>
    api.put<BookResponse>(`/api/admin/library/books/${id}`, body),
  removeBook: (id: number) =>
    api.delete<MessageResponse>(`/api/admin/library/books/${id}`),
  issues: (status?: BookIssueStatus) =>
    api.get<BookIssueResponse[]>('/api/admin/library/issues', { status }),
  issue: (body: BookIssueRequest) =>
    api.post<BookIssueResponse>('/api/admin/library/issues', body),
  returnBook: (issueId: number) =>
    api.put<BookIssueResponse>(`/api/admin/library/issues/${issueId}/return`),
  studentIssues: (studentId: number) =>
    api.get<BookIssueResponse[]>(`/api/admin/library/students/${studentId}/issues`),
};

export const studentLibrary = {
  myBooks: () => api.get<BookIssueResponse[]>('/api/student/library/my-books'),
  catalogue: (keyword?: string) =>
    api.get<BookResponse[]>('/api/student/library/catalogue', { keyword }),
};

// ================================================================
// Hostel and transport
// ================================================================

export const hostel = {
  rooms: () => api.get<HostelRoomResponse[]>('/api/admin/hostel/rooms'),
  createRoom: (body: HostelRoomRequest) =>
    api.post<HostelRoomResponse>('/api/admin/hostel/rooms', body),
  updateRoom: (id: number, body: HostelRoomRequest) =>
    api.put<HostelRoomResponse>(`/api/admin/hostel/rooms/${id}`, body),
  removeRoom: (id: number) =>
    api.delete<MessageResponse>(`/api/admin/hostel/rooms/${id}`),
  allocations: (activeOnly = true) =>
    api.get<HostelAllocationResponse[]>('/api/admin/hostel/allocations', { activeOnly }),
  allocate: (body: HostelAllocationRequest) =>
    api.post<HostelAllocationResponse>('/api/admin/hostel/allocations', body),
  vacate: (allocationId: number) =>
    api.put<HostelAllocationResponse>(
      `/api/admin/hostel/allocations/${allocationId}/vacate`,
    ),
};

export const transport = {
  routes: () => api.get<TransportRouteResponse[]>('/api/admin/transport/routes'),
  createRoute: (body: TransportRouteRequest) =>
    api.post<TransportRouteResponse>('/api/admin/transport/routes', body),
  updateRoute: (id: number, body: TransportRouteRequest) =>
    api.put<TransportRouteResponse>(`/api/admin/transport/routes/${id}`, body),
  removeRoute: (id: number) =>
    api.delete<MessageResponse>(`/api/admin/transport/routes/${id}`),
  addStop: (routeId: number, body: TransportStopRequest) =>
    api.post<TransportStopResponse>(`/api/admin/transport/routes/${routeId}/stops`, body),
  removeStop: (stopId: number) =>
    api.delete<MessageResponse>(`/api/admin/transport/stops/${stopId}`),
  assignments: (activeOnly = true) =>
    api.get<TransportAssignmentResponse[]>('/api/admin/transport/assignments', { activeOnly }),
  assign: (body: TransportAssignmentRequest) =>
    api.post<TransportAssignmentResponse>('/api/admin/transport/assignments', body),
  release: (assignmentId: number) =>
    api.put<TransportAssignmentResponse>(
      `/api/admin/transport/assignments/${assignmentId}/release`,
    ),
};

export const studentCampus = {
  hostel: () => api.get<HostelAllocationResponse[]>('/api/student/hostel'),
  transport: () => api.get<TransportAssignmentResponse[]>('/api/student/transport'),
};

