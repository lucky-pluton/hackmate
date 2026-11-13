import React, { useState } from 'react';
import type { Opportunity, AdminReviewItem } from '../../types';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { SourceAdapterRegistry } from '../../services/sources/registry';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDate, isValidUrl } from '../../lib/utils';
import { 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Database, 
  Clock, 
  ExternalLink 
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectOpportunity }) => {
  const { 
    opportunities, 
    ingestionLogs, 
    adminReviews, 
    approveAdminReview, 
    rejectAdminReview, 
    triggerIngestion, 
    isIngesting,
    addManualOpportunity 
  } = useOpportunities();

  const [activeTab, setActiveTab] = useState<'reviews' | 'sources' | 'logs' | 'manual'>('reviews');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual import form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualOrganizer, setManualOrganizer] = useState('');
  const [manualSource, setManualSource] = useState('Direct / Manual');
  const [manualUrl, setManualUrl] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualFormat, setManualFormat] = useState<'Online' | 'Offline' | 'Hybrid'>('Online');
  const [manualDeadline, setManualDeadline] = useState('2026-12-01T23:59:59Z');
  const [manualFormError, setManualFormError] = useState('');

  const adapters = SourceAdapterRegistry.getAllAdapters();
  const pendingReviews = adminReviews.filter(r => r.status === 'PENDING');

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualOrganizer || !manualUrl || !manualDescription) {
      setManualFormError('Please fill in all mandatory fields.');
      return;
    }
    if (!isValidUrl(manualUrl)) {
      setManualFormError('Please enter a valid HTTP/HTTPS registration URL.');
      return;
    }

    const newOpp: Opportunity = {
      id: `manual-${Date.now()}`,
      title: manualTitle,
      organizer: manualOrganizer,
      sourcePlatform: manualSource as any,
      description: manualDescription,
      themes: ['Open Innovation', 'Software Development'],
      categories: ['Hackathon'],
      registrationStartDate: new Date().toISOString(),
      registrationDeadline: new Date(manualDeadline).toISOString(),
      eventStartDate: new Date(manualDeadline).toISOString(),
      eventEndDate: new Date(new Date(manualDeadline).getTime() + 86400000 * 2).toISOString(),
      country: 'Global',
      format: manualFormat,
      eligibility: {
        participationType: 'Both',
        minTeamSize: 1,
        maxTeamSize: 4,
        eligibleCountries: ['Global'],
      },
      registrationFee: 0,
      feeCurrency: 'USD',
      prizePool: 'Cash & Swag',
      internshipOpportunities: false,
      placementOpportunities: false,
      requiredSkills: ['Problem Solving', 'Coding'],
      officialRegistrationUrl: manualUrl,
      originalSourceUrl: manualUrl,
      lastVerifiedAt: new Date().toISOString(),
      isVerified: true,
      status: 'active',
      confidenceScore: 100,
    };

    addManualOpportunity(newOpp);
    setIsManualModalOpen(false);
    // Reset form
    setManualTitle('');
    setManualOrganizer('');
    setManualUrl('');
    setManualDescription('');
    setManualFormError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Platform Administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin & Ingestion Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervise 11 source adapters, review suspicious listings, and trigger cross-platform duplicate sweeps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-white hover:bg-slate-800"
            onClick={() => setIsManualModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Manual Import
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={triggerIngestion}
            isLoading={isIngesting}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Sync All Adapters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Review Queue</span>
          {pendingReviews.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950 font-bold">
              {pendingReviews.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'sources'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Source Health ({adapters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Ingestion Logs</span>
        </button>
      </div>

      {/* Review Queue Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Listings requiring administrative verification before final recommendation scoring.
          </div>

          {pendingReviews.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Review queue is clear</h3>
              <p className="text-xs text-slate-500 mt-1">All extracted listings have passed deterministic validation criteria.</p>
            </div>
          ) : (
            pendingReviews.map(review => {
              const opp = opportunities.find(o => o.id === review.opportunityId);
              return (
                <div
                  key={review.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {review.reason}
                      </span>
                      <span className="text-xs text-slate-400">
                        Submitted {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {opp?.title || `Opportunity ID: ${review.opportunityId}`}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong>Audit Note:</strong> {review.notes}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {opp && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectOpportunity(opp)}
                      >
                        Inspect
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => approveAdminReview(review.id)}
                      className="text-emerald-600 hover:text-emerald-700 border-emerald-300"
                    >
                      Approve Listing
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => rejectAdminReview(review.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sources Health Tab */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adapters.map(adapter => (
            <div
              key={adapter.metadata.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {adapter.metadata.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    adapter.metadata.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {adapter.metadata.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {adapter.metadata.description}
                </p>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>Base: <a href={adapter.metadata.baseUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">{adapter.metadata.baseUrl}</a></div>
                  <div>Sync interval: every 6 hours</div>
                  <div>Last sync: {adapter.metadata.lastSyncAt ? formatDate(adapter.metadata.lastSyncAt) : 'Ready'}</div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Automated Pipeline</span>
                <span className="text-[11px] font-medium text-emerald-600">Operational</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ingestion Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {ingestionLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No logs recorded yet.</div>
          ) : (
            ingestionLogs.map(log => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {log.status}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{log.source}</span>
                  <span className="text-slate-400 text-[11px]">
                    Fetched: {log.itemsFetched} | Added: {log.itemsAdded} | Duplicates: {log.itemsDuplicate}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Manual Import Modal */}
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Manual Opportunity Import">
        <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
          {manualFormError && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              {manualFormError}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g. Google Agentic AI Challenge 2026"
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Organizer *
              </label>
              <input
                type="text"
                value={manualOrganizer}
                onChange={(e) => setManualOrganizer(e.target.value)}
                placeholder="e.g. Google DeepMind"
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Event Format
              </label>
              <select
                value={manualFormat}
                onChange={(e) => setManualFormat(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Official Registration URL *
            </label>
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://example.com/register"
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Description & Problem Statement *
            </label>
            <textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              rows={3}
              placeholder="Detailed description of hackathon tracks and requirements..."
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Publish & Ingest Listing
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
