import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  faculty as facultyApi, facultySubjects, subjects as subjectsApi,
} from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useLookups } from '../../lib/useLookups';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, Table, Td,
} from '../../components/ui';
import { currentAcademicYear, fullName } from '../../lib/format';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AdminAssignments() {
  const [facultyId, setFacultyId] = useState(0);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const staff = useAsync(
    () => facultyApi.list({ page: 0, size: 200, sortBy: 'firstName', sortDir: 'asc' }),
    [],
  );

  const assignments = useAsync(
    () => facultySubjects.byFaculty(facultyId),
    [facultyId],
    facultyId > 0,
  );

  async function remove(assignmentId: number, label: string) {
    if (!window.confirm(`Remove the allocation for ${label}?`)) return;
    setError('');
    try {
      await facultySubjects.remove(assignmentId);
      setNotice('Allocation removed.');
      assignments.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const staffList = staff.data?.content ?? [];

  return (
    <>
      <PageHeader
        title="Subject allocation"
        subtitle="Assign subjects to faculty for a section and academic year. Attendance is marked against these allocations."
        actions={
          <Button onClick={() => setOpen(true)} disabled={staffList.length === 0}>
            New allocation
          </Button>
        }
      />

      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {staff.error && <Alert>{staff.error}</Alert>}

      <Card>
        <div className="mb-4 max-w-md">
          <Field label="Faculty member" required>
            <Select
              value={facultyId}
              onChange={(e) => setFacultyId(Number(e.target.value))}
              disabled={staff.loading}
            >
              <option value={0} disabled>Select a faculty member</option>
              {staffList.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.employeeId} — {fullName(member.firstName, member.lastName)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {facultyId === 0 ? (
          <EmptyState
            title="Choose a faculty member"
            hint="Their current subject allocations will be listed here."
          />
        ) : assignments.loading ? <Spinner /> : assignments.error ? (
          <Alert>{assignments.error}</Alert>
        ) : (assignments.data ?? []).length === 0 ? (
          <EmptyState
            title="No allocations"
            hint="Use “New allocation” to assign a subject."
          />
        ) : (
          <Table head={[
            'Allocation ID', 'Subject', 'Semester', 'Section', 'Academic year', 'Status', 'Actions',
          ]}>
            {assignments.data!.map((row) => (
              <tr key={row.id}>
                <Td className="tabular-nums text-slate-400">{row.id}</Td>
                <Td>
                  <span className="font-medium text-slate-900">{row.subjectName}</span>
                  <span className="block text-xs text-slate-400">{row.subjectCode}</span>
                </Td>
                <Td className="tabular-nums">{row.semester}</Td>
                <Td>{row.section}</Td>
                <Td>{row.academicYear}</Td>
                <Td>
                  <Badge tone={row.active ? 'green' : 'slate'}>
                    {row.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    onClick={() => remove(row.id, `${row.subjectCode} · ${row.section}`)}
                  >
                    Remove
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <AssignModal
        open={open}
        staff={staffList}
        defaultFacultyId={facultyId}
        onClose={() => setOpen(false)}
        onSaved={(message, assignedTo) => {
          setNotice(message);
          if (assignedTo === facultyId) assignments.reload();
          else setFacultyId(assignedTo);
        }}
      />
    </>
  );
}

function AssignModal({ open, staff, defaultFacultyId, onClose, onSaved }: {
  open: boolean;
  staff: Array<{ id: number; employeeId: string; firstName: string; lastName?: string }>;
  defaultFacultyId: number;
  onClose: () => void;
  onSaved: (message: string, facultyId: number) => void;
}) {
  const { courses } = useLookups();

  const [facultyId, setFacultyId] = useState(defaultFacultyId);
  const [courseId, setCourseId] = useState(0);
  const [semester, setSemester] = useState(1);
  const [subjectId, setSubjectId] = useState(0);
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const availableSubjects = useAsync(
    () => subjectsApi.list(courseId, semester),
    [courseId, semester],
    open && courseId > 0,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await facultySubjects.assign({ facultyId, subjectId, academicYear, section });
      onSaved('Subject allocated.', facultyId);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Allocate a subject" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <Field label="Faculty member" required>
          <Select
            value={facultyId}
            onChange={(e) => setFacultyId(Number(e.target.value))}
            required
          >
            <option value={0} disabled>Select faculty</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.employeeId} — {fullName(member.firstName, member.lastName)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Course" required>
            <Select
              value={courseId}
              onChange={(e) => { setCourseId(Number(e.target.value)); setSubjectId(0); }}
              required
            >
              <option value={0} disabled>Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </Select>
          </Field>

          <Field label="Semester" required>
            <Select
              value={semester}
              onChange={(e) => { setSemester(Number(e.target.value)); setSubjectId(0); }}
            >
              {SEMESTERS.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
        </div>

        <Field
          label="Subject"
          required
          hint={courseId === 0 ? 'Pick a course first.' : undefined}
        >
          <Select
            value={subjectId}
            onChange={(e) => setSubjectId(Number(e.target.value))}
            disabled={courseId === 0 || availableSubjects.loading}
            required
          >
            <option value={0} disabled>
              {availableSubjects.loading ? 'Loading…' : 'Select subject'}
            </option>
            {(availableSubjects.data ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectCode} — {subject.subjectName}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section" required>
            <Input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="A"
              required
            />
          </Field>

          <Field label="Academic year" required>
            <Input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              required
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || subjectId === 0 || facultyId === 0}>
            {busy ? 'Saving…' : 'Allocate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
