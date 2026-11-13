import React from 'react';
import type { EligibilityCategory, EventFormat } from '../../types';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

interface EligibilityBadgeProps {
  category: EligibilityCategory;
  score?: number;
  className?: string;
  showScore?: boolean;
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({
  category,
  score,
  className,
  showScore = true,
}) => {
  let colorStyles = '';
  let icon = null;
  let label = category;

  switch (category) {
    case 'ELIGIBLE':
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50';
      icon = <CheckCircle2 className="w-3.5 h-3.5" />;
      break;
    case 'POTENTIALLY ELIGIBLE':
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50';
      icon = <HelpCircle className="w-3.5 h-3.5" />;
      break;
    case 'NEEDS ACTION':
      colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50';
      icon = <AlertCircle className="w-3.5 h-3.5" />;
      break;
    case 'NOT ELIGIBLE':
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50';
      icon = <XCircle className="w-3.5 h-3.5" />;
      break;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        colorStyles,
        className
      )}
    >
      {icon}
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="font-semibold ml-0.5 opacity-90">({score}%)</span>
      )}
    </div>
  );
};

export const FormatBadge: React.FC<{ format: EventFormat; className?: string }> = ({ format, className }) => {
  const styles = {
    Online: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50',
    Offline: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
    Hybrid: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50',
  }[format];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border',
        styles,
        className
      )}
    >
      {format}
    </span>
  );
};

export const SourceBadge: React.FC<{ source: string; className?: string }> = ({ source, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        className
      )}
    >
      {source}
    </span>
  );
};

