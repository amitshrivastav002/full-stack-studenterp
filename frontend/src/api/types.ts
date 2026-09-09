// Mirrors com.erp.studenterp.dto / com.erp.studenterp.entity

export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMethod =
  | 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH'
  /** Recorded automatically when a student settles a fee through Razorpay. */
  | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED';
export type FeeType =
  | 'TUITION' | 'ADMISSION' | 'EXAM' | 'HOSTEL'
  | 'TRANSPORT' | 'LIBRARY' | 'OTHER';
export type DocumentType =
  | 'AADHAAR' | 'PHOTO' | 'TENTH_MARKSHEET' | 'TWELFTH_MARKSHEET'
  | 'TRANSFER_CERTIFICATE' | 'MIGRATION_CERTIFICATE' | 'OTHER';
export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const ROLES: Role[] = ['ADMIN', 'FACULTY', 'STUDENT'];

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'PRESENT', 'ABSENT', 'LATE', 'EXCUSED',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI', 'CARD', 'NET_BANKING', 'CASH',
];

export const FEE_TYPES: FeeType[] = [
  'TUITION', 'ADMISSION', 'EXAM', 'HOSTEL', 'TRANSPORT', 'LIBRARY', 'OTHER',
];

export const DOCUMENT_TYPES: DocumentType[] = [
  'AADHAAR', 'PHOTO', 'TENTH_MARKSHEET', 'TWELFTH_MARKSHEET',
  'TRANSFER_CERTIFICATE', 'MIGRATION_CERTIFICATE', 'OTHER',
];

export const DAYS: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
];

// ---------------- auth ----------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Role;
  fullName: string;
  email: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

/** Public sign-up. No role: the server always creates a STUDENT. */
export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
}

/** The ID token Google Identity Services hands back after sign-in. */
export interface GoogleLoginRequest {
  idToken: string;
}

// ---------------- student ----------------

export interface StudentRequest {
  enrollmentNumber: string;
  firstName: string;
  lastName?: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  guardianName?: string;
  guardianMobile?: string;
  semester: number;
  section?: string;
  departmentId: number;
  courseId: number;
}

export interface StudentResponse {
  id: number;
  enrollmentNumber: string;
  firstName: string;
  lastName?: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  guardianName?: string;
  guardianMobile?: string;
  semester: number;
  section?: string;
  photoUrl?: string;
  active: boolean;
  /** Null until the student has been placed on a course. */
  departmentId: number | null;
  departmentName: string | null;
  courseId: number | null;
  courseName: string | null;
}

// ---------------- faculty ----------------

export interface FacultyRequest {
  employeeId: string;
  firstName: string;
  lastName?: string;
  email: string;
  mobileNumber: string;
  dateOfBirth?: string;
  gender?: string;
  designation: string;
  qualification?: string;
  joiningDate?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  departmentId: number;
}

export interface FacultyResponse {
  id: number;
  employeeId: string;
  firstName: string;
  lastName?: string;
  email: string;
  mobileNumber: string;
  dateOfBirth?: string;
  gender?: string;
  designation: string;
  qualification?: string;
  joiningDate?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  photoUrl?: string;
  active: boolean;
  departmentId: number;
  departmentName: string;
}

export interface FacultyAccountRequest {
  facultyId: number;
  email: string;
  password: string;
}

export interface StudentAccountRequest {
  studentId: number;
  email: string;
  password: string;
}

// ---------------- academic structure ----------------

export interface Department {
  id?: number;
  departmentName: string;
  departmentCode?: string;
}

export interface Course {
  id?: number;
  courseName: string;
  duration?: number;
  fees?: number;
}

export interface SubjectRequest {
  subjectCode: string;
  subjectName: string;
  semester: number;
  credits?: number;
  departmentId: number;
  courseId: number;
}

export interface SubjectResponse {
  id: number;
  subjectCode: string;
  subjectName: string;
  semester: number;
  credits?: number;
  active: boolean;
  departmentId: number;
  departmentName: string;
  courseId: number;
  courseName: string;
}

export interface FacultySubjectRequest {
  facultyId: number;
  subjectId: number;
  academicYear: string;
  section: string;
}

export interface FacultySubjectResponse {
  id: number;
  facultyId: number;
  employeeId: string;
  facultyName: string;
  subjectId: number;
  courseName: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  academicYear: string;
  section: string;
  active: boolean;
}

// ---------------- attendance ----------------

export interface AttendanceItemRequest {
  studentId: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceRequest {
  facultySubjectId: number;
  attendanceDate: string;
  students: AttendanceItemRequest[];
}

export interface AttendanceResponse {
  id: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  facultySubjectId: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceStudentResponse {
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  semester: number;
  section?: string;
}

export interface StudentAttendanceSummary {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  excusedClasses: number;
  attendancePercentage: number;
  lowAttendance: boolean;
}

// ---------------- exams ----------------

export interface ExamRequest {
  examName: string;
  examDate: string;
  semester: number;
  academicYear: string;
  courseId: number;
}

export interface ExamResponse {
  id: number;
  examName: string;
  examDate: string;
  semester: number;
  academicYear: string;
  courseId: number;
  courseName: string;
}

export interface ExamSubjectRequest {
  subjectId: number;
  maxMarks: number;
  passMarks: number;
}

export interface ExamSubjectResponse {
  id: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  passMarks: number;
}

export interface StudentMarkRequest {
  studentId: number;
  marksObtained: number;
}

export interface StudentMarkResponse {
  id: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  examSubjectId: number;
  subjectName: string;
  maxMarks: number;
  passMarks: number;
  marksObtained: number;
  passed: boolean;
}

export interface StudentExamResultResponse {
  examId: number;
  examName: string;
  academicYear: string;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  result: string;
  marks: StudentMarkResponse[];
}

// ---------------- timetable ----------------

export interface TimetableRequest {
  courseId: number;
  semester: number;
  section: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subjectId: number;
  facultyId: number;
  room: string;
  academicYear: string;
}

export interface TimetableResponse {
  id: number;
  courseId: number;
  courseName: string;
  semester: number;
  section: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  facultyId: number;
  facultyName: string;
  room: string;
  academicYear: string;
}

// ---------------- fees ----------------

export interface FeeStructureRequest {
  courseId: number;
  semester: number;
  feeType: FeeType;
  amount: number;
  academicYear: string;
}

export interface FeeStructureResponse {
  id: number;
  courseId: number;
  courseName: string;
  semester: number;
  feeType: FeeType;
  amount: number;
  academicYear: string;
  active: boolean;
}

export interface StudentFeeResponse {
  id: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  feeStructureId: number;
  feeType: FeeType;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: PaymentStatus;
}

export interface FeePaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
}

export interface FeePaymentResponse {
  id: number;
  studentFeeId: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  transactionId: string;
  amount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status: PaymentStatus;
  remarks?: string;
}

export interface FeeReceiptResponse {
  receiptNumber: string;
  transactionId: string;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  courseName: string;
  semester: number;
  feeType: string;
  paymentAmount: number;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentDate: string;
  remarks?: string;
}

export interface StudentFeeDashboardResponse {
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  pendingFeeCount: number;
  partialFeeCount: number;
  paidFeeCount: number;
  fees: StudentFeeResponse[];
}

export interface RazorpayOrderRequest {
  studentFeeId: number;
  amount: number;
}

export interface RazorpayOrderResponse {
  keyId: string;
  orderId: string;
  amountInPaise: number;
  currency: string;
  studentFeeId: number;
}

/** Student checkout: the method is fixed to ONLINE server-side, so it is absent here. */
export interface StudentRazorpayVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  remarks?: string;
}

export interface RazorpayPaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod: PaymentMethod;
  remarks?: string;
}

/** Gateway health for the office. Carries a masked key and never the secret. */
export interface RazorpayStatusResponse {
  configured: boolean;
  /** Last four characters of the live key id, or null when unconfigured. */
  keyIdHint: string | null;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  collectedAmount: number;
  pendingAmount: number;
}

/** One Razorpay order as the office reconciles it. */
export interface RazorpayOrderSummaryResponse {
  id: number;
  razorpayOrderId: string;
  amount: number;
  /** False means the order was opened but never settled - usually abandoned. */
  completed: boolean;
  createdAt: string;
  studentFeeId: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  feeType: FeeType;
  academicYear: string;
}

// ---------------- leaves ----------------

export interface StudentLeaveRequest {
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface StudentLeaveResponse {
  id: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  reviewerEmail?: string;
  reviewedAt?: string;
  reviewerComment?: string;
  appliedAt: string;
}

export interface LeaveDecisionRequest {
  status: LeaveStatus;
  reviewerComment?: string;
}

// ---------------- documents ----------------

export interface StudentDocumentResponse {
  id: number;
  originalFileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  documentType: DocumentType;
}

// ---------------- paging ----------------

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ================================================================
// Self service, notices and dashboards
// ================================================================

export interface ProfileResponse {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  studentId?: number;
  enrollmentNumber?: string;
  semester?: number;
  section?: string;
  courseName?: string;
  facultyId?: number;
  employeeId?: string;
  designation?: string;
  departmentName?: string;
  mobileNumber?: string;
  photoUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export type NoticeAudience = 'ALL' | 'STUDENTS' | 'FACULTY';

export const NOTICE_AUDIENCES: NoticeAudience[] = ['ALL', 'STUDENTS', 'FACULTY'];

export interface NoticeRequest {
  title: string;
  content: string;
  audience: NoticeAudience;
  publishDate: string;
  expiryDate?: string | null;
  pinned: boolean;
}

export interface NoticeResponse {
  id: number;
  title: string;
  content: string;
  audience: NoticeAudience;
  pinned: boolean;
  publishDate: string;
  expiryDate?: string;
  publishedBy?: string;
  createdAt?: string;
}

export interface AdminDashboardResponse {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalDepartments: number;
  totalSubjects: number;
  pendingLeaves: number;
  feesBilled: number;
  feesCollected: number;
  feesOutstanding: number;
  attendanceTodayPercent: number;
  attendanceMarkedToday: number;
  booksOnLoan: number;
  hostelResidents: number;
  transportRiders: number;
  latestNotices: NoticeResponse[];
}

export interface FacultyDashboardResponse {
  facultyName: string;
  employeeId: string;
  departmentName?: string;
  allocatedSubjects: number;
  assignmentsSet: number;
  submissionsAwaitingGrading: number;
  pendingLeaveRequests: number;
  classesToday: TimetableResponse[];
  latestNotices: NoticeResponse[];
}

export interface StudentDashboardResponse {
  studentName: string;
  enrollmentNumber: string;
  courseName?: string;
  semester?: number;
  section?: string;
  attendancePercent: number;
  periodsAttended: number;
  periodsHeld: number;
  feesOutstanding: number;
  assignmentsDue: number;
  booksHeld: number;
  hostelRoom?: string;
  transportRoute?: string;
  pendingLeaves: number;
  classesToday: TimetableResponse[];
  latestNotices: NoticeResponse[];
}

// ================================================================
// Assignments
// ================================================================

export type SubmissionStatus = 'SUBMITTED' | 'LATE' | 'GRADED';

export interface AssignmentRequest {
  facultySubjectId: number;
  title: string;
  description?: string;
  dueDate: string;
  maxMarks: number;
}

export interface AssignmentResponse {
  id: number;
  facultySubjectId: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  semester: number;
  section?: string;
  academicYear?: string;
  facultyName: string;
  title: string;
  description?: string;
  dueDate: string;
  maxMarks: number;
  attachmentName?: string;
  overdue: boolean;
  submissionCount?: number;
  gradedCount?: number;
  mySubmission?: AssignmentSubmissionResponse | null;
  createdAt?: string;
}

export interface AssignmentSubmissionResponse {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  fileName: string;
  submittedAt: string;
  remarks?: string;
  status: SubmissionStatus;
  marksObtained?: number;
  maxMarks: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface GradeSubmissionRequest {
  marksObtained: number;
  feedback?: string;
}

// ================================================================
// Library
// ================================================================

export type BookIssueStatus = 'ISSUED' | 'RETURNED';

export interface BookRequest {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  category?: string;
  shelfLocation?: string;
  totalCopies: number;
}

export interface BookResponse {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  category?: string;
  shelfLocation?: string;
  totalCopies: number;
  availableCopies: number;
  active: boolean;
}

export interface BookIssueRequest {
  bookId: number;
  studentId: number;
  dueDate: string;
  remarks?: string;
}

export interface BookIssueResponse {
  id: number;
  bookId: number;
  isbn: string;
  bookTitle: string;
  author: string;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  issuedOn: string;
  dueDate: string;
  returnedOn?: string;
  fineAmount?: number;
  status: BookIssueStatus;
  overdue: boolean;
  daysOverdue: number;
  remarks?: string;
}

// ================================================================
// Hostel
// ================================================================

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';

export const ROOM_TYPES: RoomType[] = ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'];

export interface HostelRoomRequest {
  blockName: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  feePerYear?: number | null;
}

export interface HostelRoomResponse {
  id: number;
  blockName: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  occupied: number;
  available: number;
  feePerYear?: number;
  active: boolean;
}

export interface HostelAllocationRequest {
  studentId: number;
  roomId: number;
  remarks?: string;
}

export interface HostelAllocationResponse {
  id: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  roomId: number;
  blockName: string;
  roomNumber: string;
  roomType: RoomType;
  feePerYear?: number;
  allocatedOn: string;
  vacatedOn?: string;
  remarks?: string;
  active: boolean;
}

// ================================================================
// Transport
// ================================================================

export interface TransportRouteRequest {
  routeCode: string;
  routeName: string;
  vehicleNumber?: string;
  driverName?: string;
  driverMobile?: string;
  capacity: number;
  farePerYear?: number | null;
}

export interface TransportRouteResponse {
  id: number;
  routeCode: string;
  routeName: string;
  vehicleNumber?: string;
  driverName?: string;
  driverMobile?: string;
  capacity: number;
  occupied: number;
  available: number;
  farePerYear?: number;
  active: boolean;
  stops: TransportStopResponse[];
}

export interface TransportStopRequest {
  stopName: string;
  pickupTime?: string | null;
  dropTime?: string | null;
}

export interface TransportStopResponse {
  id: number;
  routeId: number;
  stopName: string;
  pickupTime?: string;
  dropTime?: string;
}

export interface TransportAssignmentRequest {
  studentId: number;
  routeId: number;
  stopId?: number | null;
}

export interface TransportAssignmentResponse {
  id: number;
  studentId: number;
  enrollmentNumber: string;
  studentName: string;
  routeId: number;
  routeCode: string;
  routeName: string;
  vehicleNumber?: string;
  driverName?: string;
  driverMobile?: string;
  stopId?: number;
  stopName?: string;
  pickupTime?: string;
  farePerYear?: number;
  assignedOn: string;
  releasedOn?: string;
  active: boolean;
}

