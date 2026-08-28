import { useState } from 'react';
import type { FormEvent } from 'react';
import { courses as coursesApi, departments as departmentsApi } from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import {
  Alert, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Spinner,
  Table, Td,
} from '../../components/ui';
import { money } from '../../lib/format';

export default function AdminAcademics() {
  const departments = useAsync(() => departmentsApi.list(), []);
  const courses = useAsync(() => coursesApi.list(), []);

  const [openDept, setOpenDept] = useState(false);
  const [openCourse, setOpenCourse] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <>
      <PageHeader
        title="Departments & Courses"
        subtitle="The academic structure every other module is built on."
      />

      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Departments"
          description={departments.data ? `${departments.data.length} department(s)` : undefined}
          actions={<Button onClick={() => setOpenDept(true)}>Add department</Button>}
        >
          {departments.loading ? <Spinner /> : departments.error ? (
            <Alert>{departments.error}</Alert>
          ) : (departments.data ?? []).length === 0 ? (
            <EmptyState title="No departments yet" hint="Add one to get started." />
          ) : (
            <Table head={['ID', 'Name', 'Code']}>
              {departments.data!.map((dept) => (
                <tr key={dept.id}>
                  <Td className="tabular-nums text-slate-400">{dept.id}</Td>
                  <Td className="font-medium text-slate-900">{dept.departmentName}</Td>
                  <Td>{dept.departmentCode || '—'}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Courses"
          description={courses.data ? `${courses.data.length} course(s)` : undefined}
          actions={<Button onClick={() => setOpenCourse(true)}>Add course</Button>}
        >
          {courses.loading ? <Spinner /> : courses.error ? (
            <Alert>{courses.error}</Alert>
          ) : (courses.data ?? []).length === 0 ? (
            <EmptyState title="No courses yet" hint="Add one to get started." />
          ) : (
            <Table head={['ID', 'Name', 'Duration', 'Fees']}>
              {courses.data!.map((course) => (
                <tr key={course.id}>
                  <Td className="tabular-nums text-slate-400">{course.id}</Td>
                  <Td className="font-medium text-slate-900">{course.courseName}</Td>
                  <Td>{course.duration ? `${course.duration} yr` : '—'}</Td>
                  <Td className="tabular-nums">{course.fees != null ? money(course.fees) : '—'}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <DepartmentModal
        open={openDept}
        onClose={() => setOpenDept(false)}
        onSaved={() => {
          setNotice('Department created.');
          departments.reload();
        }}
      />

      <CourseModal
        open={openCourse}
        onClose={() => setOpenCourse(false)}
        onSaved={() => {
          setNotice('Course created.');
          courses.reload();
        }}
      />
    </>
  );
}

function DepartmentModal({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [departmentName, setName] = useState('');
  const [departmentCode, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await departmentsApi.create({ departmentName, departmentCode });
      setName('');
      setCode('');
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Add department" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <Field label="Department name" required>
          <Input
            value={departmentName}
            onChange={(e) => setName(e.target.value)}
            placeholder="Computer Science"
            required
          />
        </Field>

        <Field label="Department code">
          <Input
            value={departmentCode}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CSE"
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CourseModal({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [courseName, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [fees, setFees] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await coursesApi.create({
        courseName,
        duration: duration ? Number(duration) : undefined,
        fees: fees ? Number(fees) : undefined,
      });
      setName('');
      setDuration('');
      setFees('');
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Add course" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <Field label="Course name" required>
          <Input
            value={courseName}
            onChange={(e) => setName(e.target.value)}
            placeholder="B.Tech Computer Science"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duration (years)">
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="4"
            />
          </Field>

          <Field label="Indicative fees">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="120000"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
