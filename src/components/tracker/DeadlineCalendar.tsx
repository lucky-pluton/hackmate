import React, { useState } from 'react';
import type { Opportunity } from '../../types';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { Button } from '../common/Button';
import { 
  formatDate, 
  formatDeadlineRelative, 
  createGoogleCalendarUrl, 
  generateIcsContent, 
  downloadIcsFile 
} from '../../lib/utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Download, 
  CalendarPlus, 
  ExternalLink, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface DeadlineCalendarProps {
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

export const DeadlineCalendar: React.FC<DeadlineCalendarProps> = ({ onSelectOpportunity }) => {
  const { opportunities, matches, savedIds } = useOpportunities();
  const [filterType, setFilterType] = useState<'all' | 'saved' | 'urgent'>('all');

  const now = Date.now();

  // Sort upcoming chronologically by registration deadline
  const events = opportunities
    .map(opp => {
      const match = matches.get(opp.id);
      const deadlineMs = new Date(opp.registrationDeadline).getTime();
      const daysLeft = Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24));
      const isSaved = savedIds.includes(opp.id);
      const isUrgent = daysLeft >= 0 && daysLeft <= 7;
      return {
        opp,
        match,
        deadlineMs,
        daysLeft,
        isSaved,
        isUrgent,
      };
    })
    .filter(e => {
      if (filterType === 'saved') return e.isSaved;
      if (filterType === 'urgent') return e.isUrgent;
      return true;
    })
    .sort((a, b) => a.deadlineMs - b.deadlineMs);

  const handleExportAllIcs = () => {
    let combinedIcs = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HackMate//Calendar Agenda//EN',
      'CALSCALE:GREGORIAN',
    ];

    events.forEach(e => {
      const start = new Date(e.opp.registrationDeadline).toISOString().replace(/-|:|\.\d\d\d/g, '');
      combinedIcs.push(
        'BEGIN:VEVENT',
        `UID:${e.opp.id}@hackmate.app`,
        `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}`,
        `DTSTART:${start}`,
        `DTEND:${start}`,
        `SUMMARY:[Deadline] ${e.opp.title}`,
        `DESCRIPTION:Official registration closes for ${e.opp.title}. Organizer: ${e.opp.organizer}. Link: ${e.opp.officialRegistrationUrl}`,
        `URL:${e.opp.officialRegistrationUrl}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    combinedIcs.push('END:VCALENDAR');
    downloadIcsFile('hackmate-deadlines.ics', combinedIcs.join('\r\n'));
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Deadlines & Event Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized calendar of registration cutoffs and hackathon sprint dates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAllIcs}
            icon={<Download className="w-4 h-4" />}
          >
            Export iCal (.ics)
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['all', 'urgent', 'saved'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filterType === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'urgent' ? 'Closing in ≤7 Days' : tab === 'saved' ? 'Saved Hackathons' : 'All Deadlines'}
          </button>
        ))}
      </div>

      {/* Chronological Agenda Timeline */}
      <div className="space-y-3">
        {events.map(({ opp, match, daysLeft, isUrgent }) => {
          const deadlineRel = formatDeadlineRelative(opp.registrationDeadline);
          const gCalUrl = createGoogleCalendarUrl(
            `[Deadline] ${opp.title}`,
            `Official registration cutoff for ${opp.title}. Register at: ${opp.officialRegistrationUrl}`,
            opp.registrationDeadline,
            opp.registrationDeadline,
            opp.country
          );

          return (
            <div
              key={opp.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isUrgent
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Date Column */}
              <div className="flex items-center gap-4 shrink-0">
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center font-bold border ${
                  isUrgent
                    ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                }`}>
                  <span className="text-[10px] uppercase font-semibold">
                    {new Date(opp.registrationDeadline).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg leading-tight">
                    {new Date(opp.registrationDeadline).getDate()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {opp.sourcePlatform} • {opp.format}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isUrgent
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {deadlineRel.label}
                    </span>
                  </div>
                  <h3
                    onClick={() => onSelectOpportunity(opp)}
                    className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-1 transition-colors mt-0.5"
                  >
                    {opp.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Sprint dates: {formatDate(opp.eventStartDate)} – {formatDate(opp.eventEndDate)}
                  </div>
                </div>
              </div>

              {/* Match Score & Actions */}
              <div className="flex items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                {match && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {match.score}% Match
                  </span>
                )}

                <a
                  href={gCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Add deadline to Google Calendar"
                >
                  <CalendarPlus className="w-4 h-4" />
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectOpportunity(opp)}
                >
                  Details
                </Button>

                <a
                  href={opp.officialRegistrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <span>Register</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
