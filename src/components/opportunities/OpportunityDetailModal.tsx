import React, { useState } from 'react';
import type { Opportunity, ApplicationStage } from '../../types';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FormatBadge, SourceBadge } from '../common/Badge';
import { EligibilityBreakdown } from './EligibilityBreakdown';
import { 
  formatDate, 
  formatCurrency, 
  formatDeadlineRelative, 
  createGoogleCalendarUrl, 
  generateIcsContent, 
  downloadIcsFile 
} from '../../lib/utils';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  CalendarPlus, 
  Download, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  onClose,
}) => {
  const { matches, isSaved, toggleSave, getApplicationForOpportunity, saveApplication } = useOpportunities();
  const [copyNotification, setCopyNotification] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!opportunity) return null;

  const match = matches.get(opportunity.id);
  const saved = isSaved(opportunity.id);
  const currentApp = getApplicationForOpportunity(opportunity.id);
  const deadlineInfo = formatDeadlineRelative(opportunity.registrationDeadline);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: opportunity.title,
        text: `Check out ${opportunity.title} on HackMate!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(opportunity.officialRegistrationUrl);
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 2000);
    }
  };

  const handleDownloadIcs = () => {
    const ics = generateIcsContent(
      `${opportunity.title} (Registration Deadline)`,
      `Registration deadline for ${opportunity.title} organized by ${opportunity.organizer}.`,
      opportunity.registrationDeadline,
      opportunity.registrationDeadline,
      opportunity.officialRegistrationUrl,
      opportunity.venue || opportunity.country
    );
    downloadIcsFile(`${opportunity.id}-deadline.ics`, ics);
  };

  const gCalUrl = createGoogleCalendarUrl(
    `${opportunity.title} (Registration Deadline)`,
    `Registration closes for ${opportunity.title}. Register at: ${opportunity.officialRegistrationUrl}`,
    opportunity.registrationDeadline,
    opportunity.registrationDeadline,
    opportunity.venue || opportunity.country
  );

  const stages: ApplicationStage[] = [
    'Interested',
    'Saved',
    'Application started',
    'Applied',
    'Accepted',
    'Rejected',
    'Participating',
    'Completed'
  ];

  return (
    <Modal isOpen={Boolean(opportunity)} onClose={onClose} maxWidth="3xl">
      <div className="space-y-6">
        {/* Header section */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SourceBadge source={opportunity.sourcePlatform} />
            <FormatBadge format={opportunity.format} />
            {opportunity.internshipOpportunities && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                <Briefcase className="w-3.5 h-3.5" />
                Internship / Placement Included
              </span>
            )}
            <span className="text-xs text-slate-400 ml-auto">
              Verified {formatDate(opportunity.lastVerifiedAt)}
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {opportunity.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organized by <span className="font-semibold text-slate-700 dark:text-slate-200">{opportunity.organizer}</span>
          </p>
        </div>

        {/* Match and Eligibility Breakdown (Always visible & prominent) */}
        {match && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Eligibility & Profile Match
            </h3>
            <EligibilityBreakdown 
              match={match} 
              opportunity={opportunity} 
              initiallyExpanded={true} 
            />
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Registration Ends</div>
            <div className={`text-sm font-semibold mt-0.5 ${deadlineInfo.isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {formatDate(opportunity.registrationDeadline)}
            </div>
            <div className="text-[11px] text-slate-500">{deadlineInfo.label}</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Event Dates</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatDate(opportunity.eventStartDate)}
            </div>
            <div className="text-[11px] text-slate-500">to {formatDate(opportunity.eventEndDate)}</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Prize Pool</div>
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              {opportunity.prizePool || 'Certificate'}
            </div>
            <div className="text-[11px] text-slate-500">
              Fee: {formatCurrency(opportunity.registrationFee, opportunity.feeCurrency)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Participation</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {opportunity.eligibility.participationType}
            </div>
            <div className="text-[11px] text-slate-500">
              Team: {opportunity.eligibility.minTeamSize || 1} to {opportunity.eligibility.maxTeamSize || 4} members
            </div>
          </div>
        </div>

        {/* Detailed Overview */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Overview & Problem Statement
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {opportunity.description}
          </p>
        </div>

        {/* Themes and Required Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Themes & Tracks
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.themes.map((theme, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Relevant Technical Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.requiredSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Application Stage Tracker Control */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Application Tracker Status
            </h3>
            {currentApp && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Current: {currentApp.stage}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {stages.map((stage) => {
              const isActive = currentApp?.stage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => saveApplication(opportunity.id, stage, currentApp?.notes)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {stage}
                </button>
              );
            })}
          </div>

          {currentApp && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Application Notes & Team details:
                </label>
                <button 
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isEditingNotes ? 'Done' : 'Edit notes'}
                </button>
              </div>
              {isEditingNotes ? (
                <textarea
                  value={notesInput || currentApp.notes || ''}
                  onChange={(e) => setNotesInput(e.target.value)}
                  onBlur={() => {
                    saveApplication(opportunity.id, currentApp.stage, notesInput);
                  }}
                  placeholder="Record your teammates, submission pitch, round status, or ideas..."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                  {currentApp.notes || 'No notes added yet. Click "Edit notes" to add team or submission notes.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={saved ? 'secondary' : 'outline'}
              size="sm"
              icon={<Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />}
              onClick={() => toggleSave(opportunity.id)}
            >
              {saved ? 'Saved' : 'Save'}
            </Button>

            <a
              href={gCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-indigo-500" />
              <span>Google Calendar</span>
            </a>

            <button
              onClick={handleDownloadIcs}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Download iCal (.ics) file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Share Opportunity"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {copyNotification && (
              <span className="text-xs text-emerald-600 font-medium">Link copied!</span>
            )}
          </div>

          <a
            href={opportunity.officialRegistrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-500/20 transition-all shrink-0"
          >
            <span>Open Official Registration</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Modal>
  );
};
