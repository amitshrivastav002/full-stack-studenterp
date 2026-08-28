import { me } from '../api/endpoints';
import { useAsync } from '../lib/useAsync';
import { NoticeBoard } from '../components/NoticeBoard';
import { PageHeader } from '../components/ui';

/** The notice board as its own page, for faculty and students. */
export default function Notices() {
  const notices = useAsync(() => me.notices(), []);

  return (
    <>
      <PageHeader
        title="Notices"
        subtitle="Announcements published for you by the administration."
      />
      <NoticeBoard
        title="All notices"
        notices={notices.data}
        loading={notices.loading}
        error={notices.error}
      />
    </>
  );
}
