import { Link } from 'react-router-dom';
import {
  adminLeaves, dashboards, faculty as facultyApi, fees as feesApi,
  students as studentsApi,
} from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import { NoticeBoard } from '../../components/NoticeBoard';
import {
  Alert, Badge, Card, EmptyState, PageHeader, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { date, fullName, money, titleCase } from '../../lib/format';

export default function AdminDashboard() {
  // One call covers every headline number; the tables below still need detail.
  const stats = useAsync(() => dashboards.admin(), []);
  const students = useAsync(() => studentsApi.list({ page: 0, size: 5 }), []);
  const faculty = useAsync(() => facultyApi.list({ page: 0, size: 5 }), []);
  const structures = useAsync(() => feesApi.structures(), []);
  const pendingLeaves = useAsync(() => adminLeaves.list('PENDING'), []);

  const anyError = stats.error || students.error || faculty.error;

  return (
    <>
      <PageHeader
        title="Administration"
        subtitle="Institution-wide overview."
      />

      {anyError && <Alert>{anyError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={stats.data?.totalStudents ?? '—'}
          hint="Active enrolment records"
        />
        <StatCard
          label="Faculty"
          value={stats.data?.totalFaculty ?? '—'}
          hint="Active staff records"
        />
        <StatCard
          label="Departments"
          value={stats.data?.totalDepartments ?? '—'}
          hint={`${stats.data?.totalCourses ?? '—'} course(s), ${stats.data?.totalSubjects ?? '—'} subject(s)`}
        />
        <StatCard
          label="Pending leave"
          value={stats.data?.pendingLeaves ?? '—'}
          tone={(stats.data?.pendingLeaves ?? 0) > 0 ? 'warning' : 'positive'}
          hint="Awaiting a decision"
        />
        <StatCard
          label="Fees collected"
          value={money(stats.data?.feesCollected)}
          tone="positive"
          hint={`${money(stats.data?.feesBilled)} billed`}
        />
        <StatCard
          label="Fees outstanding"
          value={money(stats.data?.feesOutstanding)}
          tone={(stats.data?.feesOutstanding ?? 0) > 0 ? 'warning' : 'positive'}
        />
        <StatCard
          label="Attendance today"
          value={`${stats.data?.attendanceTodayPercent ?? 0}%`}
          hint={`${stats.data?.attendanceMarkedToday ?? 0} period record(s) marked`}
        />
        <StatCard
          label="Campus services"
          value={`${stats.data?.hostelResidents ?? 0} / ${stats.data?.transportRiders ?? 0}`}
          hint={`Hostel / transport · ${stats.data?.booksOnLoan ?? 0} book(s) on loan`}
        />
      </div>

      <NoticeBoard
        className="mt-6"
        title="Latest notices"
        notices={stats.data?.latestNotices ?? null}
        loading={stats.loading}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title="Recent students"
          actions={
            <Link to="/admin/students" className="text-sm font-medium text-brand-600 hover:underline">
              Manage
            </Link>
          }
        >
          {students.loading ? <Spinner /> : (students.data?.content ?? []).length === 0 ? (
            <EmptyState title="No students yet" hint="Add your first student record." />
          ) : (
            <Table head={['Enrollment', 'Name', 'Course', 'Sem']}>
              {students.data!.content.map((student) => (
                <tr key={student.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {student.enrollmentNumber}
                  </Td>
                  <Td className="font-medium text-slate-900">
                    {fullName(student.firstName, student.lastName)}
                  </Td>
                  <Td className="text-xs">{student.courseName}</Td>
                  <Td className="tabular-nums">{student.semester}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Recent faculty"
          actions={
            <Link to="/admin/faculty" className="text-sm font-medium text-brand-600 hover:underline">
              Manage
            </Link>
          }
        >
          {faculty.loading ? <Spinner /> : (faculty.data?.content ?? []).length === 0 ? (
            <EmptyState title="No faculty yet" hint="Add your first staff record." />
          ) : (
            <Table head={['Employee ID', 'Name', 'Department', 'Designation']}>
              {faculty.data!.content.map((member) => (
                <tr key={member.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">{member.employeeId}</Td>
                  <Td className="font-medium text-slate-900">
                    {fullName(member.firstName, member.lastName)}
                  </Td>
                  <Td className="text-xs">{member.departmentName}</Td>
                  <Td className="text-xs">{member.designation}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Fee structures"
          actions={
            <Link to="/admin/fees" className="text-sm font-medium text-brand-600 hover:underline">
              Manage
            </Link>
          }
        >
          {structures.loading ? <Spinner /> : (structures.data ?? []).length === 0 ? (
            <EmptyState title="No fee structures" hint="Define one to start billing." />
          ) : (
            <Table head={['Course', 'Sem', 'Type', 'Amount']}>
              {structures.data!.slice(0, 6).map((row) => (
                <tr key={row.id}>
                  <Td className="font-medium text-slate-900">{row.courseName}</Td>
                  <Td className="tabular-nums">{row.semester}</Td>
                  <Td><Badge tone="blue">{titleCase(row.feeType)}</Badge></Td>
                  <Td className="tabular-nums">{money(row.amount)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Pending leave requests"
          actions={
            <Link to="/admin/leaves" className="text-sm font-medium text-brand-600 hover:underline">
              Review
            </Link>
          }
        >
          {pendingLeaves.loading ? <Spinner /> : (pendingLeaves.data ?? []).length === 0 ? (
            <EmptyState title="Nothing awaiting review" />
          ) : (
            <Table head={['Student', 'From', 'To', 'Status']}>
              {pendingLeaves.data!.slice(0, 6).map((leave) => (
                <tr key={leave.id}>
                  <Td>
                    <span className="font-medium text-slate-900">{leave.studentName}</span>
                    <span className="block text-xs text-slate-400">
                      {leave.enrollmentNumber}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{date(leave.fromDate)}</Td>
                  <Td className="whitespace-nowrap text-xs">{date(leave.toDate)}</Td>
                  <Td><Badge tone="amber">{titleCase(leave.status)}</Badge></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
