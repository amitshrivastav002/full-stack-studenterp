import { useEffect, useState } from 'react';
import { useAsync, errorMessage } from '../lib/useAsync';
import {
  Alert, Badge, Button, Card, EmptyState, Input, Spinner, Table, Td, cx,
} from './ui';
import { ATTENDANCE_STATUSES } from '../api/types';
import type {
  AttendanceRequest, AttendanceResponse, AttendanceStatus,
  AttendanceStudentResponse,
} from '../api/types';
import { titleCase } from '../lib/format';

/**
 * The three calls the marker needs.  Faculty and administration hit different
 * endpoints for the same job - one is scoped to the subjects a lecturer is
 * allocated, the other to every class in the college - so the caller supplies
 * them.
 */
export interface AttendanceApi {
  students: (assignmentId: number) => Promise<AttendanceStudentResponse[]>;
  existing: (assignmentId: number, date: string) => Promise<AttendanceResponse[]>;
  mark: (body: AttendanceRequest) => Promise<AttendanceResponse[]>;
}

type Marks = Record<number, { status: AttendanceStatus; remarks: string }>;

/**
 * Roster for one allocation on one date: loads whatever is already recorded,
 * lets every student be set, and saves the lot in a single request.
 */
export function AttendanceMarker({ assignmentId, attendanceDate, api }: {
  assignmentId: number | null;
  attendanceDate: string;
  api: AttendanceApi;
}) {
  const roster = useAsync(
    () => api.students(assignmentId!),
    [assignmentId],
    assignmentId !== null,
  );

  const existing = useAsync(
    () => api.existing(assignmentId!, attendanceDate),
    [assignmentId, attendanceDate],
    assignmentId !== null && attendanceDate !== '',
  );

  const [marks, setMarks] = useState<Marks>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Seed the form from whatever is already recorded for this date.
  useEffect(() => {
    const students = roster.data ?? [];
    if (students.length === 0) {
      setMarks({});
      return;
    }

    const saved = new Map(
      (existing.data ?? []).map((row) => [row.studentId, row]),
    );

    const next: Marks = {};
    for (const student of students) {
      const prior = saved.get(student.studentId);
      next[student.studentId] = {
        status: prior?.status ?? 'PRESENT',
        remarks: prior?.remarks ?? '',
      };
    }
    setMarks(next);
  }, [roster.data, existing.data]);

  const students = roster.data ?? [];
  const alreadyMarked = (existing.data ?? []).length > 0;

  function setStatus(studentId: number, status: AttendanceStatus) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { status, remarks: prev[studentId]?.remarks ?? '' },
    }));
  }

  function setRemarks(studentId: number, remarks: string) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { status: prev[studentId]?.status ?? 'PRESENT', remarks },
    }));
  }

  function setAll(status: AttendanceStatus) {
    setMarks((prev) => {
      const next: Marks = {};
      for (const student of students) {
        next[student.studentId] = {
          status,
          remarks: prev[student.studentId]?.remarks ?? '',
        };
      }
      return next;
    });
  }

  async function save() {
    if (assignmentId === null || students.length === 0) return;

    setError('');
    setNotice('');
    setSaving(true);

    try {
      await api.mark({
        facultySubjectId: assignmentId,
        attendanceDate,
        students: students.map((student) => ({
          studentId: student.studentId,
          status: marks[student.studentId]?.status ?? 'PRESENT',
          remarks: marks[student.studentId]?.remarks || undefined,
        })),
      });
      setNotice(`Attendance saved for ${students.length} student(s).`);
      existing.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const counts = students.reduce(
    (acc, student) => {
      const status = marks[student.studentId]?.status ?? 'PRESENT';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Record<AttendanceStatus, number>,
  );

  return (
    <>
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <Card
        title="Roster"
        description={students.length ? `${students.length} student(s)` : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {alreadyMarked && <Badge tone="blue">Already marked for this date</Badge>}
            <Button
              variant="secondary"
              onClick={() => setAll('PRESENT')}
              disabled={!students.length}
            >
              All present
            </Button>
            <Button
              variant="secondary"
              onClick={() => setAll('ABSENT')}
              disabled={!students.length}
            >
              All absent
            </Button>
            <Button onClick={save} disabled={saving || students.length === 0}>
              {saving ? 'Saving…' : alreadyMarked ? 'Update attendance' : 'Save attendance'}
            </Button>
          </div>
        }
      >
        {students.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {ATTENDANCE_STATUSES.map((status) => (
              <Badge
                key={status}
                tone={
                  status === 'PRESENT' ? 'green'
                    : status === 'ABSENT' ? 'rose'
                      : status === 'LATE' ? 'amber' : 'slate'
                }
              >
                {titleCase(status)}: {counts[status] ?? 0}
              </Badge>
            ))}
          </div>
        )}

        {assignmentId === null ? (
          <EmptyState
            title="No class selected"
            hint="Pick a subject allocation above to load its roster."
          />
        ) : roster.loading ? <Spinner /> : roster.error ? (
          <Alert>{roster.error}</Alert>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students in this class"
            hint="Students matching this course, semester and section will appear here."
          />
        ) : (
          <Table head={['Enrollment', 'Student', 'Status', 'Remarks']}>
            {students.map((student) => {
              const mark = marks[student.studentId];
              return (
                <tr key={student.studentId}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {student.enrollmentNumber}
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-900">{student.studentName}</span>
                    <span className="block text-xs text-slate-400">
                      Sem {student.semester}{student.section ? ` · ${student.section}` : ''}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {ATTENDANCE_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatus(student.studentId, status)}
                          className={cx(
                            'rounded-md px-2.5 py-1 text-xs font-medium transition',
                            mark?.status === status
                              ? status === 'PRESENT' ? 'bg-emerald-600 text-white'
                                : status === 'ABSENT' ? 'bg-rose-600 text-white'
                                  : status === 'LATE' ? 'bg-amber-500 text-white'
                                    : 'bg-slate-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          )}
                        >
                          {titleCase(status)}
                        </button>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <Input
                      value={mark?.remarks ?? ''}
                      onChange={(e) => setRemarks(student.studentId, e.target.value)}
                      placeholder="Optional"
                      className="min-w-[10rem]"
                    />
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
