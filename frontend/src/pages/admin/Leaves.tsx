import { adminLeaves } from '../../api/endpoints';
import { LeaveReview } from '../../components/LeaveReview';

export default function AdminLeaves() {
  return (
    <LeaveReview
      title="Leave requests"
      subtitle="All student leave applications across the institution."
      fetchLeaves={adminLeaves.list}
      decide={adminLeaves.decide}
    />
  );
}
