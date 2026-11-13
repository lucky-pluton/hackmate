import React, { useState } from 'react';
import type { Opportunity, ApplicationStage } from '../../types';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatDate, formatDeadlineRelative } from '../../lib/utils';
import { 
  FileText, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Users, 
  Search 
} from 'lucide-react';

interface ApplicationTrackerProps {
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onNavigateDiscover: () => void;
}

const STAGES: ApplicationStage[] = [
  'Interested',
  'Saved',
  'Application started',
  'Applied',
  'Accepted',
  'Rejected',
  'Participating',
  'Completed',
];

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  onSelectOpportunity,
  onNavigateDiscover,
}) => {
  const { applications, opportunities, saveApplication, removeApplication } = useOpportunities();
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTeam, setEditTeam] = useState('');

  const filteredApps = applications.filter(app => {
    if (selectedStageFilter !== 'All' && app.stage !== selectedStageFilter) return false;
    return true;
  });

  const handleStartEdit = (appId: string, currentNotes?: string, currentTeam?: string) => {
    setEditingAppId(appId);
    setEditNotes(currentNotes || '');
    setEditTeam(currentTeam || '');
  };

  const handleSaveEdit = (oppId: string, stage: ApplicationStage) => {
    saveApplication(oppId, stage, editNotes, editTeam);
    setEditingAppId(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Stage Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Application Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record submission milestones, team formation, and application progress
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onNavigateDiscover}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Opportunities
        </Button>
      </div>

      {/* Stage Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedStageFilter('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedStageFilter === 'All'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All Stages ({applications.length})
        </button>

        {STAGES.map(stage => {
          const count = applications.filter(a => a.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setSelectedStageFilter(stage)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStageFilter === stage
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>{stage}</span>
              <span className="opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <EmptyState
          title="No applications tracked in this stage"
          description="Track opportunities directly from the discovery feed by clicking 'Track' or moving an existing opportunity."
          actionLabel="Explore Opportunities"
          onAction={onNavigateDiscover}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map(app => {
            const opp = opportunities.find(o => o.id === app.opportunityId);
            if (!opp) return null;

            const isEditing = editingAppId === app.id;
            const deadlineInfo = formatDeadlineRelative(opp.registrationDeadline);

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-medium text-slate-400">
                      {opp.sourcePlatform} • {opp.format}
                    </span>

                    {/* Stage Selector */}
                    <select
                      value={app.stage}
                      onChange={(e) => saveApplication(opp.id, e.target.value as ApplicationStage, app.notes, app.teamName)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 focus:outline-none cursor-pointer"
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <h3 
                    onClick={() => onSelectOpportunity(opp)}
                    className="font-semibold text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-2 transition-colors mb-1"
                  >
                    {opp.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Organized by {opp.organizer}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registration Deadline: <strong className={deadlineInfo.isUrgent ? 'text-rose-600' : ''}>{formatDate(opp.registrationDeadline)}</strong> ({deadlineInfo.label})</span>
                  </div>

                  {/* Notes & Team Info */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-0.5">Team Name</label>
                          <input
                            type="text"
                            value={editTeam}
                            onChange={(e) => setEditTeam(e.target.value)}
                            placeholder="e.g. CodeWarriors"
                            className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-0.5">Notes & Submission Details</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={2}
                            placeholder="Ideas, teammate emails, round details..."
                            className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="primary" onClick={() => handleSaveEdit(opp.id, app.stage)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingAppId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {app.teamName && (
                            <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                              <Users className="w-3.5 h-3.5 text-indigo-500" />
                              Team: {app.teamName}
                            </div>
                          )}
                          <p className="italic text-slate-500 dark:text-slate-400">
                            {app.notes || 'No notes added yet.'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartEdit(app.id, app.notes, app.teamName)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                          title="Edit notes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectOpportunity(opp)}
                      className="text-xs"
                    >
                      View Details
                    </Button>
                    <button
                      onClick={() => removeApplication(app.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove application from tracker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <a
                    href={opp.officialRegistrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                  >
                    <span>Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
