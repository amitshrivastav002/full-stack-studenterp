import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  faculty as facultyApi, subjects as subjectsApi, timetable as timetableApi,
} from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useLookups } from '../../lib/useLookups';
import {
  Alert, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select,
  Spinner,
} from '../../components/ui';
import { TimetableGrid } from '../../components/TimetableGrid';
import { DAYS } from '../../api/types';
import type { DayOfWeek, TimetableRequest, TimetableResponse } from '../../api/types';
import { currentAcademicYear, fullName, titleCase } from '../../lib/format';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AdminTimetable() {
  const { courses } = useLookups();

  const [courseId, setCourseId] = useState(0);
  const [semester, setSemester] = useState(1);
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const ready = courseId > 0 && section.trim() !== '' && academicYear.trim() !== '';

  const list = useAsync(
    () => timetableApi.forClass(courseId, semester, section, academicYear),
    [courseId, semester, section, academicYear],
    ready,
  );

  const [editing, setEditing] = useState<TimetableResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function remove(entry: TimetableResponse) {
    if (!window.confirm(
      `Delete ${entry.subjectName} on ${titleCase(entry.day)} at ${entry.startTime.slice(0, 5)}?`,
    )) return;

    setError('');
    try {
      await timetableApi.remove(entry.id);
      setNotice('Timetable entry deleted.');
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle="Weekly schedule per course, semester and section."
        actions={
          <Button onClick={() => setCreating(true)} disabled={courses.length === 0}>
            Add period
          </Button>
        }
      />

      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <Field label="Section" required>
            <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" />
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

      {!ready ? (
        <EmptyState
          title="Select a class"
          hint="Choose a course, semester, section and academic year to view its timetable."
        />
      ) : list.loading ? <Spinner /> : list.error ? (
        <Alert>{list.error}</Alert>
      ) : (
        <TimetableGrid
          entries={list.data ?? []}
          renderMeta={(entry) => `${entry.subjectCode} · ${entry.facultyName}`}
          onEntryAction={(entry) => (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setEditing(entry)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(entry)}
                className="text-xs font-medium text-rose-600 hover:underline"
              >
                Delete
              </button>
            </div>
          )}
        />
      )}

      {(creating || editing !== null) && <TimetableModal
        entry={editing}
        courses={courses}
        defaults={{ courseId, semester, section, academicYear }}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={(message) => { setNotice(message); list.reload(); }}
      />}
    </>
  );
}

function TimetableModal({ entry, courses, defaults, onClose, onSaved }: {
  entry: TimetableResponse | null;
  courses: Array<{ id?: number; courseName: string }>;
  defaults: { courseId: number; semester: number; section: string; academicYear: string };
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const blank = (): TimetableRequest => ({
    courseId: defaults.courseId,
    semester: defaults.semester,
    section: defaults.section,
    day: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 0,
    facultyId: 0,
    room: '',
    academicYear: defaults.academicYear,
  });

  // Mounted fresh each time the modal opens, so plain initial state is enough.
  const [form, setForm] = useState<TimetableRequest>(() => (entry ? {
    courseId: entry.courseId,
    semester: entry.semester,
    section: entry.section,
    day: entry.day,
    startTime: entry.startTime.slice(0, 5),
    endTime: entry.endTime.slice(0, 5),
    subjectId: entry.subjectId,
    facultyId: entry.facultyId,
    room: entry.room,
    academicYear: entry.academicYear,
  } : blank()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const availableSubjects = useAsync(
    () => subjectsApi.list(form.courseId, form.semester),
    [form.courseId, form.semester],
    form.courseId > 0,
  );

  const staff = useAsync(
    () => facultyApi.list({ page: 0, size: 200, sortBy: 'firstName', sortDir: 'asc' }),
    [],
  );

  function set<K extends keyof TimetableRequest>(key: K, value: TimetableRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    // Backend LocalTime parses "HH:mm" fine; normalise for consistency.
    const payload: TimetableRequest = {
      ...form,
      startTime: `${form.startTime}:00`.slice(0, 8),
      endTime: `${form.endTime}:00`.slice(0, 8),
    };

    try {
      if (entry) {
        await timetableApi.update(entry.id, payload);
        onSaved('Timetable entry updated.');
      } else {
        await timetableApi.create(payload);
        onSaved('Timetable entry created.');
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      wide
      title={entry ? 'Edit period' : 'Add period'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Course" required>
            <Select
              value={form.courseId}
              onChange={(e) => { set('courseId', Number(e.target.value)); set('subjectId', 0); }}
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
              value={form.semester}
              onChange={(e) => { set('semester', Number(e.target.value)); set('subjectId', 0); }}
            >
              {SEMESTERS.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>

          <Field label="Section" required>
            <Input value={form.section} onChange={(e) => set('section', e.target.value)} required />
          </Field>

          <Field label="Subject" required>
            <Select
              value={form.subjectId}
              onChange={(e) => set('subjectId', Number(e.target.value))}
              disabled={form.courseId === 0 || availableSubjects.loading}
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

          <Field label="Faculty" required>
            <Select
              value={form.facultyId}
              onChange={(e) => set('facultyId', Number(e.target.value))}
              disabled={staff.loading}
              required
            >
              <option value={0} disabled>Select faculty</option>
              {(staff.data?.content ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.employeeId} — {fullName(member.firstName, member.lastName)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Room" required>
            <Input
              value={form.room}
              onChange={(e) => set('room', e.target.value)}
              placeholder="A-204"
              required
            />
          </Field>

          <Field label="Day" required>
            <Select
              value={form.day}
              onChange={(e) => set('day', e.target.value as DayOfWeek)}
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>{titleCase(day)}</option>
              ))}
            </Select>
          </Field>

          <Field label="Start time" required>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
              required
            />
          </Field>

          <Field label="End time" required>
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => set('endTime', e.target.value)}
              required
            />
          </Field>

          <Field label="Academic year" required>
            <Input
              value={form.academicYear}
              onChange={(e) => set('academicYear', e.target.value)}
              placeholder="2025-2026"
              required
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : entry ? 'Save changes' : 'Add period'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
