import { students } from '../api/endpoints';
import { useAsync } from './useAsync';
import { fullName } from './format';

/**
 * Flat student list for the pickers on the library, hostel and transport
 * screens. One page is requested with a high size because these forms need the
 * whole roll, not a page of it.
 */
export function useStudentOptions() {
  const page = useAsync(() => students.list({ page: 0, size: 500, sortBy: 'firstName' }), []);

  const options = (page.data?.content ?? []).map((student) => ({
    id: student.id,
    label: `${student.enrollmentNumber} — ${fullName(student.firstName, student.lastName)}`,
  }));

  return { options, loading: page.loading, error: page.error };
}
