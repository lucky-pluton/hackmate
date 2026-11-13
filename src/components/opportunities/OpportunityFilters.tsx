import React from 'react';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '../common/Button';

export const OpportunityFilters: React.FC = () => {
  const { filters, setFilters, resetFilters, filteredOpportunities, opportunities } = useOpportunities();

  const activeFilterCount = [
    filters.search !== '',
    filters.format !== 'All',
    filters.eligibility !== 'All',
    filters.theme !== 'All',
    filters.source !== 'All',
    filters.freeOnly,
    filters.sortBy !== 'matchScore',
  ].filter(Boolean).length;

  const popularThemes = ['All', 'Artificial Intelligence', 'Blockchain', 'Social Impact', 'FinTech', 'E-Commerce', 'Open Innovation'];
  const sources = ['All', 'Unstop', 'Devfolio', 'Devpost', 'Major League Hacking', 'Hack2skill', 'HackerEarth', 'DoraHacks', 'Hack Club', 'Lablab.ai', 'HackIndia', 'Hackalendar'];

  return (
    <div className="space-y-4 mb-6">
      {/* Top Search and Quick Sort row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search by title, organizer, tech stack (Python, React...), or theme..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort and Reset actions */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="matchScore" className="bg-white dark:bg-slate-900">Highest Match %</option>
              <option value="deadline" className="bg-white dark:bg-slate-900">Deadline (Urgent First)</option>
              <option value="newest" className="bg-white dark:bg-slate-900">Recently Verified</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Reset ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Pill Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Eligibility Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'ELIGIBLE', 'POTENTIALLY ELIGIBLE', 'NEEDS ACTION', 'NOT ELIGIBLE'] as const).map((cat) => {
            const isSelected = filters.eligibility === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilters(prev => ({ ...prev, eligibility: cat }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'All' ? 'All Eligibility' : cat}
              </button>
            );
          })}
        </div>

        {/* Format Selector */}
        <select
          value={filters.format}
          onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="All">All Formats</option>
          <option value="Online">Online Only</option>
          <option value="Offline">In-Person Only</option>
          <option value="Hybrid">Hybrid</option>
        </select>

        {/* Platform Source Selector */}
        <select
          value={filters.source}
          onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="All">All Sources (10+ Adapters)</option>
          {sources.filter(s => s !== 'All').map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Free Only Toggle */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.freeOnly}
            onChange={(e) => setFilters(prev => ({ ...prev, freeOnly: e.target.checked }))}
            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
          />
          <span>Free Entry Only</span>
        </label>

        {/* Results Counter */}
        <span className="text-xs text-slate-400 ml-auto hidden md:inline-block">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredOpportunities.length}</span> of {opportunities.length} opportunities
        </span>
      </div>
    </div>
  );
};
