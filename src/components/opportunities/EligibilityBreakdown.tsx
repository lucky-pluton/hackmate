import React, { useState } from 'react';
import type { OpportunityMatch, Opportunity } from '../../types';
import { EligibilityBadge } from '../common/Badge';
import { formatDate, formatDeadlineRelative } from '../../lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

interface EligibilityBreakdownProps {
  match: OpportunityMatch;
  opportunity: Opportunity;
  initiallyExpanded?: boolean;
}

export const EligibilityBreakdown: React.FC<EligibilityBreakdownProps> = ({
  match,
  opportunity,
  initiallyExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initiallyExpanded);
  const deadlineInfo = formatDeadlineRelative(opportunity.registrationDeadline);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden text-sm">
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <EligibilityBadge category={match.category} score={match.score} />
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {deadlineInfo.label}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified {formatDate(opportunity.lastVerifiedAt)}
            </span>
          </div>
        </div>

        <button 
          type="button"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex items-center gap-1 text-xs font-medium"
        >
          <span>{isExpanded ? 'Hide Analysis' : 'Explain Match'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4">
          {/* Action Required Notice if present */}
          {match.actionRequiredNotice && (
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-0.5">Action Required</p>
                <p className="text-xs leading-relaxed">{match.actionRequiredNotice}</p>
              </div>
            </div>
          )}

          {/* Potential Blockers */}
          {match.potentialBlockers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2">
                <XCircle className="w-3.5 h-3.5" />
                Eligibility Blockers ({match.potentialBlockers.length})
              </h4>
              <ul className="space-y-1.5">
                {match.potentialBlockers.map((b, idx) => (
                  <li 
                    key={idx}
                    className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200"
                  >
                    <div className="font-medium text-rose-700 dark:text-rose-300">{b.criterion}</div>
                    <div className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">{b.explanation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasons for Matching (Preferences) */}
          {match.reasonsForMatching.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Why this matches your profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {match.reasonsForMatching.map((reason, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Satisfied Mandatory Requirements */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Requirements Satisfied ({match.satisfiedRequirements.length})
            </h4>
            <div className="space-y-1.5">
              {match.satisfiedRequirements.map((req, idx) => (
                <div 
                  key={idx}
                  className="flex items-start justify-between p-2 rounded-md bg-white/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">{req.criterion}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-right max-w-[65%] truncate">
                    {req.userValue}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing non-blocking items (e.g. need to update profile age or year) */}
          {match.missingRequirements.filter(r => !r.blocker).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Information Needed ({match.missingRequirements.filter(r => !r.blocker).length})
              </h4>
              <div className="space-y-1.5">
                {match.missingRequirements.filter(r => !r.blocker).map((req, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded-md bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200"
                  >
                    <span className="font-medium">{req.criterion}: </span>
                    <span>{req.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
