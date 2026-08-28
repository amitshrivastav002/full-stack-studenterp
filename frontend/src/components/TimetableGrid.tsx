import type { ReactNode } from 'react';
import type { TimetableResponse } from '../api/types';
import { DAYS } from '../api/types';
import { time, titleCase } from '../lib/format';
import { EmptyState } from './ui';

/**
 * Groups entries by weekday. `renderMeta` supplies the secondary line, which
 * differs per portal (faculty wants the class, students want the teacher).
 */
export function TimetableGrid({ entries, renderMeta, onEntryAction }: {
  entries: TimetableResponse[];
  renderMeta: (entry: TimetableResponse) => ReactNode;
  onEntryAction?: (entry: TimetableResponse) => ReactNode;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No timetable entries"
        hint="Nothing has been scheduled for this academic year yet."
      />
    );
  }

  const activeDays = DAYS.filter((day) => entries.some((e) => e.day === day));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {activeDays.map((day) => {
        const dayEntries = entries
          .filter((entry) => entry.day === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div key={day} className="rounded-xl border border-slate-200 bg-white">
            <header className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">{titleCase(day)}</h3>
              <p className="text-xs text-slate-400">
                {dayEntries.length} period{dayEntries.length === 1 ? '' : 's'}
              </p>
            </header>
            <ul className="divide-y divide-slate-100">
              {dayEntries.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium tabular-nums text-brand-600">
                      {time(entry.startTime)} – {time(entry.endTime)}
                    </p>
                    <p className="truncate font-medium text-slate-900">{entry.subjectName}</p>
                    <p className="truncate text-xs text-slate-500">{renderMeta(entry)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {entry.room}
                    </span>
                    {onEntryAction?.(entry)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
