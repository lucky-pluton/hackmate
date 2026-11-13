import React from 'react';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { 
  Sparkles, 
  Clock, 
  Bookmark, 
  Send, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

interface DashboardMetricsProps {
  onNavigate: (view: string) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ onNavigate }) => {
  const { opportunities, matches, savedIds, applications } = useOpportunities();

  // Metrics calculation
  const eligibleMatches = opportunities.filter(o => {
    const m = matches.get(o.id);
    return m?.category === 'ELIGIBLE' || m?.category === 'POTENTIALLY ELIGIBLE';
  }).length;

  const now = Date.now();
  const closingSoonCount = opportunities.filter(o => {
    const d = new Date(o.registrationDeadline).getTime();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  }).length;

  const activeAppsCount = applications.filter(a => 
    !['Rejected', 'Completed'].includes(a.stage)
  ).length;

  const metrics = [
    {
      label: 'Eligible Matches',
      value: eligibleMatches,
      description: 'Based on your qualifications',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      onClick: () => onNavigate('discover'),
    },
    {
      label: 'Closing Soon',
      value: closingSoonCount,
      description: 'Deadlines within 7 days',
      icon: <Clock className="w-5 h-5 text-rose-500" />,
      onClick: () => onNavigate('discover'),
    },
    {
      label: 'Applications In Progress',
      value: activeAppsCount,
      description: 'Tracked submission stages',
      icon: <Send className="w-5 h-5 text-indigo-500" />,
      onClick: () => onNavigate('tracker'),
    },
    {
      label: 'Saved Opportunities',
      value: savedIds.length,
      description: 'Bookmarked for later',
      icon: <Bookmark className="w-5 h-5 text-amber-500" />,
      onClick: () => onNavigate('saved'),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          onClick={metric.onClick}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
              {metric.icon}
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
          </div>

          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metric.value}
          </div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
            {metric.label}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metric.description}
          </div>
        </div>
      ))}
    </div>
  );
};
