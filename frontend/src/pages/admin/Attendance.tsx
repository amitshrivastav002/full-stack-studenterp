import { useMemo, useState } from 'react';
import { adminAttendance } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import {
  Alert, Card, Field, Input, PageHeader, Select, Spinner,
} from '../../components/ui';
import { AttendanceMarker } from '../../components/AttendanceMarker';
import { today } from '../../lib/format';

const API = {
  students: adminAttendance.students,
  existing: adminAttendance.attendanceFor,
  mark: adminAttendance.mark,
};

export default function AdminAttendance() {
  const assignments = useAsync(() => adminAttendance.assignments(), []);

  const [keyword, setKeyword] = useState('');
  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(today());

  const all = useMemo(() => assignments.data ?? [], [assignments.data]);

  // Every allocation in the college lands in one dropdown, so it needs
  // narrowing before it is usable.
  const matches = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((a) => [
      a.subjectCode, a.subjectName, a.facultyName, a.courseName,
      a.section, a.academicYear,
    ].some((field) => (field ?? '').toLowerCase().includes(needle)));
  }, [all, keyword]);

  const selected = all.find((a) => a.id === assignmentId) ?? null;

  // A filter that excludes the current pick would otherwise leave the roster
  // showing a class the dropdown no longer offers.
  const visible = selected && !matches.some((a) => a.id === selected.id)
    ? [selected, ...matches]
    : matches;

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Mark or correct attendance for any class, for the days a lecturer cannot."
      />

      {assignments.error && <Alert>{assignments.error}</Alert>}

      <Card className="mb-6">
        {assignments.loading ? <Spinner /> : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Find a class" hint="Subject, faculty, course or section.">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="CS304, Operating Systems, B.Tech…"
                />
              </Field>

              <Field label="Subject allocation" required>
                <Select
                  value={assignmentId ?? ''}
                  onChange={(e) => setAssignmentId(
                    e.target.value === '' ? null : Number(e.target.value),
                  )}
                  disabled={all.length === 0}
                >
                  <option value="">
                    {all.length === 0
                      ? 'No subject allocations yet'
                      : `Select one of ${visible.length} allocation(s)`}
                  </option>
                  {visible.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.subjectCode} — {a.subjectName} (Sem {a.semester}
                      {a.section ? `, ${a.section}` : ''}) · {a.facultyName}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Date" required>
                <Input
                  type="date"
                  value={attendanceDate}
                  max={today()}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </Field>
            </div>

            {all.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">
                Attendance is recorded against a faculty-subject allocation.
                Create one under Subject Allocation first.
              </p>
            )}

            {selected && (
              <p className="mt-4 text-sm text-slate-500">
                {selected.courseName} · {selected.subjectName} · Semester{' '}
                {selected.semester}
                {selected.section ? ` · Section ${selected.section}` : ''} ·{' '}
                {selected.academicYear} · Taught by {selected.facultyName}
              </p>
            )}
          </>
        )}
      </Card>

      <AttendanceMarker
        assignmentId={assignmentId}
        attendanceDate={attendanceDate}
        api={API}
      />
    </>
  );
}
