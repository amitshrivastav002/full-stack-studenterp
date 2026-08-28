import { useEffect, useState } from 'react';
import { facultyPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import {
  Alert, Card, Field, Input, PageHeader, Select,
} from '../../components/ui';
import { AttendanceMarker } from '../../components/AttendanceMarker';
import { today } from '../../lib/format';

const API = {
  students: facultyPortal.attendanceStudents,
  existing: facultyPortal.attendanceFor,
  mark: facultyPortal.markAttendance,
};

export default function FacultyAttendance() {
  const subjects = useAsync(() => facultyPortal.mySubjects(), []);

  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(today());

  // Default to the first allocation once they load.
  useEffect(() => {
    if (assignmentId === null && subjects.data?.length) {
      setAssignmentId(subjects.data[0].id);
    }
  }, [subjects.data, assignmentId]);

  const selected = subjects.data?.find((s) => s.id === assignmentId) ?? null;

  return (
    <>
      <PageHeader
        title="Mark attendance"
        subtitle="Select a subject allocation and a date, then record each student."
      />

      {subjects.error && <Alert>{subjects.error}</Alert>}

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject allocation" required>
            <Select
              value={assignmentId ?? ''}
              onChange={(e) => setAssignmentId(Number(e.target.value))}
              disabled={subjects.loading || (subjects.data ?? []).length === 0}
            >
              {(subjects.data ?? []).length === 0 && <option value="">No allocations</option>}
              {(subjects.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectCode} — {s.subjectName} (Sem {s.semester}, {s.section}, {s.academicYear})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Date" required>
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </Field>
        </div>

        {selected && (
          <p className="mt-4 text-sm text-slate-500">
            {selected.subjectName} · Semester {selected.semester} · Section {selected.section} · {selected.academicYear}
          </p>
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
