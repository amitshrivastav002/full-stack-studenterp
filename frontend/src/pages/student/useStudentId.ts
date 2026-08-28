import { studentPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';

/**
 * The backend has no /api/student/me, and the attendance endpoint needs a
 * numeric student id. The fee dashboard resolves the logged-in user by email
 * and echoes the id back, so it doubles as the identity lookup.
 */
export function useStudentId() {
  const { data, loading, error } = useAsync(() => studentPortal.feeDashboard(), []);
  return {
    studentId: data?.studentId ?? null,
    enrollmentNumber: data?.enrollmentNumber ?? '',
    studentName: data?.studentName ?? '',
    loading,
    error,
  };
}
