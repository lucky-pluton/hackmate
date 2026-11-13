import React, { useState } from 'react';
import type { Opportunity, ApplicationStage } from '../../types';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatDate, formatDeadlineRelative } from '../../lib/utils';
import { 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Clock, 
  Plus, 
  Users, 
  LayoutGrid, 
  ListFilter, 
  ArrowRight, 
  CheckCircle2 
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

interface KanbanColumnDef {
  id: string;
  title: string;
  stages: ApplicationStage[];
  color: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    id: 'inbox',
    title: 'Interested & Saved',
    stages: ['Interested', 'Saved'],
    color: 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30',
  },
  {
    id: 'started',
    title: 'Application Started',
    stages: ['Application started'],
    color: 'border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20',
  },
  {
    id: 'applied',
    title: 'Applied / In Review',
    stages: ['Applied'],
    color: 'border-amber-300 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20',
  },
  {
    id: 'participating',
    title: 'Accepted & Hacking',
    stages: ['Accepted', 'Participating'],
    color: 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20',
  },
  {
    id: 'closed',
    title: 'Completed / Closed',
    stages: ['Completed', 'Rejected'],
    color: 'border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/10',
  },
];

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  onSelectOpportunity,
  onNavigateDiscover,
}) => {
  const { applications, opportunities, saveApplication, removeApplication } = useOpportunities();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
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

  const getNextStage = (current: ApplicationStage): ApplicationStage => {
    const sequence: Record<ApplicationStage, ApplicationStage> = {
      'Interested': 'Application started',
      'Saved': 'Application started',
      'Application started': 'Applied',
      'Applied': 'Accepted',
      'Accepted': 'Participating',
      'Participating': 'Completed',
      'Completed': 'Completed',
      'Rejected': 'Completed',
    };
    return sequence[current] || 'Applied';
  };

  return (
    <div className="space-y-6">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Application Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your pipeline across submission milestones, team formation, and sprint rounds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="List View"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateDiscover}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Opportunity
          </Button>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications tracked yet"
          description="Track opportunities directly from the discovery feed by clicking 'Track' on any hackathon card."
          actionLabel="Explore Opportunities"
          onAction={onNavigateDiscover}
        />
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => {
            const colApps = applications.filter(a => col.stages.includes(a.stage));
            return (
              <div
                key={col.id}
                className={`rounded-2xl border p-3 flex flex-col justify-start min-h-[500px] ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/60 dark:border-slate-800">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colApps.map(app => {
                    const opp = opportunities.find(o => o.id === app.opportunityId);
                    if (!opp) return null;
                    const deadlineInfo = formatDeadlineRelative(opp.registrationDeadline);
                    const nextStage = getNextStage(app.stage);

                    return (
                      <div
                        key={app.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs hover:shadow-card transition-all text-xs flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] text-slate-400 font-medium truncate">
                              {opp.sourcePlatform}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {app.stage}
                            </span>
                          </div>

                          <h4
                            onClick={() => onSelectOpportunity(opp)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-2 transition-colors mb-1.5 leading-snug"
                          >
                            {opp.title}
                          </h4>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className={deadlineInfo.isUrgent ? 'text-rose-600 font-medium' : ''}>
                              {formatDate(opp.registrationDeadline)} ({deadlineInfo.label})
                            </span>
                          </div>

                          {app.teamName && (
                            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 mb-1.5">
                              <Users className="w-3 h-3 text-indigo-500" />
                              {app.teamName}
                            </div>
                          )}

                          {app.notes && (
                            <p className="text-[11px] text-slate-500 italic line-clamp-2 mb-2 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded">
                              {app.notes}
                            </p>
                          )}
                        </div>

                        {/* Card quick actions */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                          {app.stage !== 'Completed' && (
                            <button
                              onClick={() => saveApplication(opp.id, nextStage, app.notes, app.teamName)}
                              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <span>Next: {nextStage}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => removeApplication(app.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors ml-auto"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed List View */
        <div className="space-y-4">
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
        </div>
      )}
    </div>
  );
};
