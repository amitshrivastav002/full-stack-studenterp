import { useState } from 'react';
import { studentPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import { Alert, Field, Input, PageHeader, Spinner } from '../../components/ui';
import { TimetableGrid } from '../../components/TimetableGrid';
import { currentAcademicYear } from '../../lib/format';

export default function StudentTimetable() {
  const [year, setYear] = useState(currentAcademicYear());

  const { data, loading, error } = useAsync(
    () => studentPortal.timetable(year),
    [year],
    year.trim().length > 0,
  );

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle="Weekly class schedule for your course, semester and section."
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
          renderMeta={(entry) => `${entry.subjectCode} · ${entry.facultyName}`}
        />
      )}
    </>
  );
}
