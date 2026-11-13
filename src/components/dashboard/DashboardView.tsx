import React from 'react';
import type { Opportunity } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { DashboardMetrics } from './DashboardMetrics';
import { OpportunityCard } from '../opportunities/OpportunityCard';
import { Button } from '../common/Button';
import { 
  Sparkles, 
  Bot, 
  Compass, 
  Calendar, 
  UserCircle, 
  ArrowRight, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

interface DashboardViewProps {
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onNavigate: (view: string) => void;
  onOpenAssistant: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectOpportunity,
  onNavigate,
  onOpenAssistant,
}) => {
  const { user } = useAuth();
  const { opportunities, matches, applications } = useOpportunities();

  // Top recommended: sort by score descending, filter to eligible/potentially eligible
  const recommended = [...opportunities]
    .filter(o => {
      const cat = matches.get(o.id)?.category;
      return cat === 'ELIGIBLE' || cat === 'POTENTIALLY ELIGIBLE' || cat === 'NEEDS ACTION';
    })
    .sort((a, b) => (matches.get(b.id)?.score || 0) - (matches.get(a.id)?.score || 0))
    .slice(0, 3);

  // Closing soon (< 10 days)
  const now = Date.now();
  const closingSoon = [...opportunities]
    .filter(o => {
      const d = new Date(o.registrationDeadline).getTime();
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 12;
    })
    .sort((a, b) => new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime())
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Actions Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI-Personalised Discovery
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.personal.fullName?.split(' ')[0] || 'Hacker'}
          </h1>
          <p className="text-sm text-indigo-200/80 mt-1 leading-relaxed">
            Finding opportunities that fit <span className="text-white font-medium">you</span>, so you never have to manually inspect eligibility criteria or miss deadlines again.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            className="bg-white text-indigo-950 hover:bg-indigo-50 shadow-md font-semibold"
            icon={<Compass className="w-4 h-4 text-indigo-600" />}
            onClick={() => onNavigate('discover')}
          >
            Discover All
          </Button>

          <Button
            variant="outline"
            size="md"
            className="border-indigo-400/30 text-white hover:bg-white/10"
            icon={<Bot className="w-4 h-4 text-indigo-300" />}
            onClick={onOpenAssistant}
          >
            Ask AI Assistant
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="text-indigo-200 hover:text-white hover:bg-white/10"
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => onNavigate('calendar')}
          >
            Calendar
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <DashboardMetrics onNavigate={onNavigate} />

      {/* Recommended For You Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Recommended for You
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prioritized by rule-based eligibility and technical interest alignment
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('discover')}
            icon={<ArrowRight className="w-4 h-4" />}
            className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
          >
            View all
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommended.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSelect={onSelectOpportunity}
            />
          ))}
        </div>
      </div>

      {/* Closing Soon Section */}
      {closingSoon.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                Deadlines Approaching
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Opportunities with registration closing within the next few days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {closingSoon.map(opp => (
              <OpportunityCard
                key={`closing-${opp.id}`}
                opportunity={opp}
                onSelect={onSelectOpportunity}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Applications Pipeline Snapshot */}
      {applications.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              My Applications Pipeline
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('tracker')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400"
            >
              Open Tracker ({applications.length})
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {applications.slice(0, 3).map(app => {
              const opp = opportunities.find(o => o.id === app.opportunityId);
              if (!opp) return null;
              return (
                <div
                  key={app.id}
                  onClick={() => onSelectOpportunity(opp)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-medium text-slate-400 truncate">
                        {opp.sourcePlatform}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {app.stage}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {opp.title}
                    </div>
                    {app.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {app.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Deadline: {new Date(opp.registrationDeadline).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

