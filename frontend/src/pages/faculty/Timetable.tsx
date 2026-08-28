import { useState } from 'react';
import { facultyPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import { Alert, Field, Input, PageHeader, Spinner } from '../../components/ui';
import { TimetableGrid } from '../../components/TimetableGrid';
import { currentAcademicYear } from '../../lib/format';

export default function FacultyTimetable() {
  const [year, setYear] = useState(currentAcademicYear());

  const { data, loading, error } = useAsync(
    () => facultyPortal.timetable(year),
    [year],
    year.trim().length > 0,
  );

  return (
    <>
      <PageHeader
        title="My timetable"
        subtitle="Every period assigned to you across classes."
        actions={
          <div className="w-44">
            <Field label="Academic year">
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2025-2026"
              />
            </Field>
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? <Spinner /> : (
        <TimetableGrid
          entries={data ?? []}
          renderMeta={(entry) =>
            `${entry.courseName} · Sem ${entry.semester} · ${entry.section}`}
        />
      )}
    </>
  );
}
