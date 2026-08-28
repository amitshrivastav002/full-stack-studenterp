import { facultyPortal } from '../../api/endpoints';
import { LeaveReview } from '../../components/LeaveReview';

export default function FacultyLeaves() {
  return (
    <LeaveReview
      title="Leave requests"
      subtitle="Applications from students in the classes you teach."
      fetchLeaves={facultyPortal.leaves}
      decide={facultyPortal.decideLeave}
    />
  );
}
