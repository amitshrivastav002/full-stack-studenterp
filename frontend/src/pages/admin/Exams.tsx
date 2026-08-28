import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  exams as examsApi, students as studentsApi, subjects as subjectsApi,
} from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useLookups } from '../../lib/useLookups';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, Table, Td,
} from '../../components/ui';
import type { ExamResponse, ExamSubjectResponse } from '../../api/types';
import { currentAcademicYear, date, fullName } from '../../lib/format';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AdminExams() {
  const { courses } = useLookups();

  const [courseId, setCourseId] = useState(0);
  const [semester, setSemester] = useState(1);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const ready = courseId > 0 && academicYear.trim() !== '';

  const list = useAsync(
    () => examsApi.list(courseId, semester, academicYear),
    [courseId, semester, academicYear],
    ready,
  );

  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ExamResponse | null>(null);
  const [notice, setNotice] = useState('');

  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle="Create exams, attach subjects with mark limits, and record results."
        actions={
          <Button onClick={() => setCreating(true)} disabled={courses.length === 0}>
            Create exam
          </Button>
        }
      />

      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Course" required>
            <Select value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}>
              <option value={0} disabled>Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </Select>
          </Field>

          <Field label="Semester" required>
            <Select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {SEMESTERS.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>

          <Field label="Academic year" required>
            <Input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
            />
          </Field>
        </div>
      </Card>

      <Card title="Exams">
        {!ready ? (
          <EmptyState
            title="Select a course"
            hint="Exams are listed per course, semester and academic year."
          />
        ) : list.loading ? <Spinner /> : list.error ? (
          <Alert>{list.error}</Alert>
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState title="No exams for this selection" hint="Create one to begin." />
        ) : (
          <Table head={['Exam', 'Date', 'Course', 'Semester', 'Actions']}>
            {list.data!.map((exam) => (
              <tr key={exam.id}>
                <Td className="font-medium text-slate-900">{exam.examName}</Td>
                <Td className="whitespace-nowrap">{date(exam.examDate)}</Td>
                <Td>{exam.courseName}</Td>
                <Td className="tabular-nums">{exam.semester}</Td>
                <Td>
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={() => setSelected(exam)}
                  >
                    Manage
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <CreateExamModal
        open={creating}
        courses={courses}
        defaults={{ courseId, semester, academicYear }}
        onClose={() => setCreating(false)}
        onSaved={() => { setNotice('Exam created.'); list.reload(); }}
      />

      <ManageExamModal exam={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function CreateExamModal({ open, courses, defaults, onClose, onSaved }: {
  open: boolean;
  courses: Array<{ id?: number; courseName: string }>;
  defaults: { courseId: number; semester: number; academicYear: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [courseId, setCourseId] = useState(defaults.courseId);
  const [semester, setSemester] = useState(defaults.semester);
  const [academicYear, setAcademicYear] = useState(defaults.academicYear);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await examsApi.create({ examName, examDate, semester, academicYear, courseId });
      setExamName('');
      setExamDate('');
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Create exam" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <Field label="Exam name" required>
          <Input
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="Mid Semester Examination"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Exam date" required>
            <Input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
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

          <Field label="Course" required>
            <Select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              required
            >
              <option value={0} disabled>Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </Select>
          </Field>

          <Field label="Semester" required>
            <Select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {SEMESTERS.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || courseId === 0}>
            {busy ? 'Saving…' : 'Create exam'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ManageExamModal({ exam, onClose }: {
  exam: ExamResponse | null; onClose: () => void;
}) {
  const [tab, setTab] = useState<'subjects' | 'marks' | 'results'>('subjects');
  const [notice, setNotice] = useState('');

  const examSubjects = useAsync(
    () => examsApi.subjects(exam!.id),
    [exam?.id],
    exam !== null,
  );
  const results = useAsync(
    () => examsApi.results(exam!.id),
    [exam?.id],
    exam !== null && tab === 'results',
  );

  return (
    <Modal
      open={exam !== null}
      wide
      title={exam ? exam.examName : 'Exam'}
      onClose={onClose}
    >
      {exam && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {exam.courseName} · Semester {exam.semester} · {exam.academicYear} ·{' '}
            {date(exam.examDate)}
          </p>

          {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

          <div className="flex gap-1 border-b border-slate-200">
            {([
              ['subjects', 'Subjects'],
              ['marks', 'Enter marks'],
              ['results', 'Results'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={
                  tab === key
                    ? 'border-b-2 border-brand-600 px-4 py-2 text-sm font-medium text-brand-700'
                    : 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800'
                }
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'subjects' && (
            <SubjectsTab
              exam={exam}
              examSubjects={examSubjects.data ?? []}
              loading={examSubjects.loading}
              error={examSubjects.error}
              onAdded={() => { setNotice('Subject added to exam.'); examSubjects.reload(); }}
            />
          )}

          {tab === 'marks' && (
            <MarksTab
              exam={exam}
              examSubjects={examSubjects.data ?? []}
              onSaved={(message) => setNotice(message)}
            />
          )}

          {tab === 'results' && (
            <>
              {results.loading ? <Spinner /> : results.error ? (
                <Alert>{results.error}</Alert>
              ) : (results.data ?? []).length === 0 ? (
                <EmptyState
                  title="No results yet"
                  hint="Results appear once marks have been recorded."
                />
              ) : (
                <Table head={[
                  'Enrollment', 'Student', 'Obtained', 'Total', 'Percentage', 'Grade', 'Result',
                ]}>
                  {results.data!.map((row) => (
                    <tr key={row.studentId}>
                      <Td className="whitespace-nowrap font-mono text-xs">
                        {row.enrollmentNumber}
                      </Td>
                      <Td className="font-medium text-slate-900">{row.studentName}</Td>
                      <Td className="tabular-nums">{Number(row.obtainedMarks)}</Td>
                      <Td className="tabular-nums">{Number(row.totalMarks)}</Td>
                      <Td className="tabular-nums">{Number(row.percentage).toFixed(2)}%</Td>
                      <Td>{row.grade}</Td>
                      <Td>
                        <Badge tone={row.result === 'PASS' ? 'green' : 'rose'}>
                          {row.result}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </Table>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

function SubjectsTab({ exam, examSubjects, loading, error, onAdded }: {
  exam: ExamResponse;
  examSubjects: ExamSubjectResponse[];
  loading: boolean;
  error: string;
  onAdded: () => void;
}) {
  const available = useAsync(
    () => subjectsApi.list(exam.courseId, exam.semester),
    [exam.courseId, exam.semester],
  );

  const [subjectId, setSubjectId] = useState(0);
  const [maxMarks, setMaxMarks] = useState('100');
  const [passMarks, setPassMarks] = useState('40');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await examsApi.addSubject(exam.id, {
        subjectId,
        maxMarks: Number(maxMarks),
        passMarks: Number(passMarks),
      });
      setSubjectId(0);
      onAdded();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-lg bg-slate-50 p-4">
        {formError && <Alert onDismiss={() => setFormError('')}>{formError}</Alert>}

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="Subject" required>
              <Select
                value={subjectId}
                onChange={(e) => setSubjectId(Number(e.target.value))}
                disabled={available.loading}
                required
              >
                <option value={0} disabled>
                  {available.loading ? 'Loading…' : 'Select subject'}
                </option>
                {(available.data ?? []).map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subjectCode} — {subject.subjectName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Max marks" required>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              required
            />
          </Field>

          <Field label="Pass marks" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={passMarks}
              onChange={(e) => setPassMarks(e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={busy || subjectId === 0}>
            {busy ? 'Adding…' : 'Add subject'}
          </Button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {loading ? <Spinner /> : examSubjects.length === 0 ? (
        <EmptyState title="No subjects attached to this exam" />
      ) : (
        <Table head={['Code', 'Subject', 'Max marks', 'Pass marks']}>
          {examSubjects.map((row) => (
            <tr key={row.id}>
              <Td className="whitespace-nowrap font-mono text-xs">{row.subjectCode}</Td>
              <Td className="font-medium text-slate-900">{row.subjectName}</Td>
              <Td className="tabular-nums">{Number(row.maxMarks)}</Td>
              <Td className="tabular-nums">{Number(row.passMarks)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function MarksTab({ exam, examSubjects, onSaved }: {
  exam: ExamResponse;
  examSubjects: ExamSubjectResponse[];
  onSaved: (message: string) => void;
}) {
  const [examSubjectId, setExamSubjectId] = useState(0);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [savingFor, setSavingFor] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Students of the exam's course and semester are the candidate list.
  const roster = useAsync(
    () => studentsApi.list({ page: 0, size: 500, sortBy: 'enrollmentNumber', sortDir: 'asc' }),
    [],
  );

  const candidates = (roster.data?.content ?? []).filter(
    (student) => student.courseId === exam.courseId && student.semester === exam.semester,
  );

  const selected = examSubjects.find((s) => s.id === examSubjectId) ?? null;

  async function save(studentId: number) {
    const raw = marks[studentId];
    if (raw === undefined || raw === '') return;

    setSavingFor(studentId);
    setError('');
    try {
      await examsApi.saveMark(examSubjectId, {
        studentId,
        marksObtained: Number(raw),
      });
      onSaved('Mark saved.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingFor(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

      <div className="max-w-md">
        <Field label="Exam subject" required>
          <Select
            value={examSubjectId}
            onChange={(e) => setExamSubjectId(Number(e.target.value))}
          >
            <option value={0} disabled>Select an exam subject</option>
            {examSubjects.map((row) => (
              <option key={row.id} value={row.id}>
                {row.subjectCode} — {row.subjectName} (max {Number(row.maxMarks)})
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {examSubjectId === 0 ? (
        <EmptyState
          title="Choose an exam subject"
          hint="Add subjects on the Subjects tab first."
        />
      ) : roster.loading ? <Spinner /> : candidates.length === 0 ? (
        <EmptyState
          title="No students match this exam"
          hint={`No active students found in ${exam.courseName}, semester ${exam.semester}.`}
        />
      ) : (
        <Table head={['Enrollment', 'Student', `Marks (max ${Number(selected?.maxMarks ?? 0)})`, '']}>
          {candidates.map((student) => (
            <tr key={student.id}>
              <Td className="whitespace-nowrap font-mono text-xs">
                {student.enrollmentNumber}
              </Td>
              <Td className="font-medium text-slate-900">
                {fullName(student.firstName, student.lastName)}
              </Td>
              <Td>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  max={Number(selected?.maxMarks ?? 100)}
                  value={marks[student.id] ?? ''}
                  onChange={(e) => setMarks((prev) => ({
                    ...prev, [student.id]: e.target.value,
                  }))}
                  className="w-28"
                  placeholder="—"
                />
              </Td>
              <Td>
                <Button
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  disabled={savingFor === student.id || !marks[student.id]}
                  onClick={() => save(student.id)}
                >
                  {savingFor === student.id ? 'Saving…' : 'Save'}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
