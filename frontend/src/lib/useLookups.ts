import { courses, departments } from '../api/endpoints';
import { useAsync } from './useAsync';

/** Departments and courses feed nearly every admin form's dropdowns. */
export function useLookups() {
  const depts = useAsync(() => departments.list(), []);
  const crs = useAsync(() => courses.list(), []);
  return {
    departments: depts.data ?? [],
    courses: crs.data ?? [],
    loading: depts.loading || crs.loading,
    error: depts.error || crs.error,
  };
}
