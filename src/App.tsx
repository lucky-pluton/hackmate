import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useOpportunities } from './context/OpportunitiesContext';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './components/dashboard/DashboardView';
import { OpportunityCard } from './components/opportunities/OpportunityCard';
import { OpportunityFilters } from './components/opportunities/OpportunityFilters';
import { OpportunityDetailModal } from './components/opportunities/OpportunityDetailModal';
import { WhatIfSimulatorModal } from './components/opportunities/WhatIfSimulatorModal';
import { ConversationalOnboarding } from './components/onboarding/ConversationalOnboarding';
import { AiAssistantDrawer } from './components/assistant/AiAssistantDrawer';
import { ApplicationTracker } from './components/tracker/ApplicationTracker';
import { DeadlineCalendar } from './components/tracker/DeadlineCalendar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { EmptyState } from './components/common/EmptyState';
import { Button } from './components/common/Button';
import type { Opportunity } from './types';
import { Sparkles, Bot, Compass, Bookmark, ShieldCheck, ArrowRight } from 'lucide-react';

export function App() {
  const { user, isOnboarded, resetOnboarding } = useAuth();
  const { filteredOpportunities, opportunities, savedIds, resetFilters } = useOpportunities();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  // If user hasn't completed conversational onboarding
  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <ConversationalOnboarding 
          onComplete={() => {
            setCurrentView('dashboard');
          }} 
        />
      </div>
    );
  }

  // Saved opportunities list
  const savedOpportunities = opportunities.filter(o => savedIds.includes(o.id));

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      onOpenAssistant={() => setIsAssistantOpen(true)}
    >
      {/* 1. Dashboard View */}
      {currentView === 'dashboard' && (
        <DashboardView
          onSelectOpportunity={setSelectedOpportunity}
          onNavigate={setCurrentView}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />
      )}

      {/* 2. Discover Feed View */}
      {currentView === 'discover' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Compass className="w-6 h-6 text-indigo-600" />
                Personalised Discovery Feed
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every opportunity evaluated deterministically against your qualifications and constraints
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSimulatorOpen(true)}
              icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            >
              "What-If" Simulator
            </Button>
          </div>

          <OpportunityFilters />

          {filteredOpportunities.length === 0 ? (
            <EmptyState
              title="No opportunities match current criteria"
              description="Try relaxing your filters or explore other tracks with your AI assistant."
              actionLabel="Reset All Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOpportunities.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onSelect={setSelectedOpportunity}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Application Tracker View */}
      {currentView === 'tracker' && (
        <ApplicationTracker
          onSelectOpportunity={setSelectedOpportunity}
          onNavigateDiscover={() => setCurrentView('discover')}
        />
      )}

      {/* 4. Deadline Calendar View */}
      {currentView === 'calendar' && (
        <DeadlineCalendar
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {/* 5. Saved Opportunities View */}
      {currentView === 'saved' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-indigo-600" />
              Saved Opportunities ({savedOpportunities.length})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Competitions and hackathons you have bookmarked for later review
            </p>
          </div>

          {savedOpportunities.length === 0 ? (
            <EmptyState
              title="No saved hackathons yet"
              description="Click the bookmark icon on any hackathon card to save it here for fast access."
              actionLabel="Discover Opportunities"
              onAction={() => setCurrentView('discover')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedOpportunities.map(opp => (
                <OpportunityCard
                  key={`saved-${opp.id}`}
                  opportunity={opp}
                  onSelect={setSelectedOpportunity}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Admin Console View */}
      {currentView === 'admin' && (
        <AdminDashboard
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {/* 7. Profile & Matching View */}
      {currentView === 'profile' && (
        <ProfileView
          onRerunOnboarding={() => {
            resetOnboarding();
          }}
        />
      )}

      {/* Detail Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />

      {/* What-If Simulator Modal */}
      <WhatIfSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSelectOpportunity={(opp) => {
          setSelectedOpportunity(opp);
          setIsSimulatorOpen(false);
        }}
      />

      {/* AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onSelectOpportunity={(opp) => {
          setSelectedOpportunity(opp);
          setIsAssistantOpen(false);
        }}
      />
    </Layout>
  );
}
