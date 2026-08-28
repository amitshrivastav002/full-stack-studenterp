import { Badge, Card, EmptyState, Spinner, Alert } from './ui';
import { date } from '../lib/format';
import type { NoticeResponse } from '../api/types';

/** Read-only notice list, shared by all three portals. */
export function NoticeBoard({ notices, loading, error, title = 'Notice board', className }: {
  notices: NoticeResponse[] | null;
  loading?: boolean;
  error?: string;
  title?: string;
  className?: string;
}) {
  return (
    <Card title={title} description="Announcements from the administration." className={className}>
      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (notices ?? []).length === 0 ? (
        <EmptyState title="No notices right now" />
      ) : (
        <ul className="space-y-3">
          {notices!.map((notice) => (
            <li
              key={notice.id}
              className="rounded-lg border border-slate-200 px-4 py-3 transition hover:border-brand-300 hover:bg-slate-50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">{notice.title}</span>
                {notice.pinned && <Badge tone="amber">Pinned</Badge>}
                <span className="ml-auto text-xs text-slate-400">
                  {date(notice.publishDate)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                {notice.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
