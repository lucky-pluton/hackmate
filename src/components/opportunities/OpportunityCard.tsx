import React from 'react';
import type { Opportunity } from '../../types';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { EligibilityBreakdown } from './EligibilityBreakdown';
import { FormatBadge, SourceBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDate, formatCurrency, formatDeadlineRelative } from '../../lib/utils';
import { 
  Bookmark, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  Briefcase, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect: (opportunity: Opportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onSelect,
}) => {
  const { matches, isSaved, toggleSave, getApplicationForOpportunity, saveApplication } = useOpportunities();
  const match = matches.get(opportunity.id);
  const saved = isSaved(opportunity.id);
  const currentApp = getApplicationForOpportunity(opportunity.id);
  const deadlineInfo = formatDeadlineRelative(opportunity.registrationDeadline);

  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-card transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner / Metadata */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <SourceBadge source={opportunity.sourcePlatform} />
            <FormatBadge format={opportunity.format} />
            {opportunity.internshipOpportunities && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                <Briefcase className="w-3 h-3" />
                Internship / PPI
              </span>
            )}
          </div>

          {/* Save bookmark button */}
          <button
            type="button"
            onClick={() => toggleSave(opportunity.id)}
            aria-label={saved ? 'Unsave opportunity' : 'Save opportunity'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400' : ''}`} />
          </button>
        </div>

        {/* Title and Organizer */}
        <h3 
          onClick={() => onSelect(opportunity)}
          className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2 mb-1"
        >
          {opportunity.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Organized by <span className="font-medium text-slate-700 dark:text-slate-300">{opportunity.organizer}</span>
        </p>

        {/* Essential Info Grid */}
        <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Deadline: <span className={`font-medium ${deadlineInfo.isUrgent ? 'text-rose-600 dark:text-rose-400' : ''}`}>{formatDate(opportunity.registrationDeadline)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate font-medium text-amber-700 dark:text-amber-400">
              {opportunity.prizePool || 'Recognition'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {opportunity.format === 'Online' ? 'Virtual / Global' : `${opportunity.country}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {opportunity.eligibility.participationType === 'Both' 
                ? 'Solo or Team' 
                : `${opportunity.eligibility.participationType} (${opportunity.eligibility.minTeamSize || 1}-${opportunity.eligibility.maxTeamSize || 4})`}
            </span>
          </div>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {opportunity.description}
        </p>

        {/* Themes tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {opportunity.themes.slice(0, 3).map((theme, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
            >
              {theme}
            </span>
          ))}
          {opportunity.requiredSkills.slice(0, 2).map((skill, i) => (
            <span
              key={`skill-${i}`}
              className="px-2 py-0.5 rounded-md bg-indigo-50/70 dark:bg-indigo-950/40 text-[11px] text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Eligibility Breakdown */}
        {match && (
          <EligibilityBreakdown 
            match={match} 
            opportunity={opportunity} 
            initiallyExpanded={false}
          />
        )}
      </div>

      {/* Card Footer / Actions */}
      <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelect(opportunity)}
          >
            Full Details
          </Button>

          {currentApp ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Check className="w-3 h-3" />
              {currentApp.stage}
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveApplication(opportunity.id, 'Interested')}
            >
              Track
            </Button>
          )}
        </div>

        <a
          href={opportunity.officialRegistrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0 shadow-sm"
        >
          <span>Register</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
