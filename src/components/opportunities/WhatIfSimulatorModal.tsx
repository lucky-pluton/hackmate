import React, { useState, useMemo } from 'react';
import type { UserProfile, Opportunity } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { EligibilityEngine } from '../../services/eligibility/engine';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Plane, 
  Code, 
  GraduationCap, 
  RefreshCcw 
} from 'lucide-react';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSelectOpportunity,
}) => {
  const { user } = useAuth();
  const { opportunities, matches: currentMatches } = useOpportunities();

  // Simulated state adjustments
  const [simTravel, setSimTravel] = useState<boolean>(true);
  const [simFindTeammates, setSimFindTeammates] = useState<boolean>(true);
  const [simExtraSkill, setSimExtraSkill] = useState<string>('Docker');
  const [simAcademicYear, setSimAcademicYear] = useState<number>(user?.personal.currentYearOfStudy || 3);

  // Compute simulated profile
  const simulatedProfile = useMemo<UserProfile | null>(() => {
    if (!user) return null;
    return {
      ...user,
      personal: {
        ...user.personal,
        currentYearOfStudy: simAcademicYear,
      },
      skills: {
        ...user.skills,
        otherSkills: [...user.skills.otherSkills, simExtraSkill].filter(Boolean),
      },
      preferences: {
        ...user.preferences,
        willingnessToTravel: simTravel,
        willingnessToFindTeammates: simFindTeammates,
      },
    };
  }, [user, simTravel, simFindTeammates, simExtraSkill, simAcademicYear]);

  // Compute simulated matches and delta
  const { newlyEligible, simulatedMatches } = useMemo(() => {
    if (!simulatedProfile) return { newlyEligible: [], simulatedMatches: new Map() };

    const simMatches = new Map();
    const unlocked: Opportunity[] = [];

    opportunities.forEach(opp => {
      const simMatch = EligibilityEngine.evaluate(simulatedProfile, opp);
      simMatches.set(opp.id, simMatch);

      const currentMatch = currentMatches.get(opp.id);
      const wasEligible = currentMatch?.category === 'ELIGIBLE';
      const nowEligible = simMatch.category === 'ELIGIBLE';

      if (!wasEligible && nowEligible) {
        unlocked.push(opp);
      }
    });

    return { newlyEligible: unlocked, simulatedMatches: simMatches };
  }, [simulatedProfile, opportunities, currentMatches]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl" title="Eligibility &quot;What-If&quot; Simulator">
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Hypothetical Constraint Analysis
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            See how adjusting your constraints unlocks new opportunities
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate forming a team, enabling travel, or adding skills to test which hackathons you would immediately qualify for.
          </p>
        </div>

        {/* Simulation Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
          {/* Teammates Toggle */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simFindTeammates}
              onChange={(e) => setSimFindTeammates(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Find Teammates
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Simulate willingness to join a team for team-mandatory hackathons
              </span>
            </div>
          </label>

          {/* Travel Toggle */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simTravel}
              onChange={(e) => setSimTravel(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-indigo-500" />
                Enable In-Person Travel
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Simulate willingness to travel for flagship offline hackathons
              </span>
            </div>
          </label>

          {/* Year of study selector */}
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <label className="font-semibold text-slate-900 dark:text-slate-100 block mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              Simulated Year of Study
            </label>
            <select
              value={simAcademicYear}
              onChange={(e) => setSimAcademicYear(parseInt(e.target.value, 10))}
              className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value={1}>1st Year Undergraduate</option>
              <option value={2}>2nd Year Undergraduate</option>
              <option value={3}>3rd Year Undergraduate</option>
              <option value={4}>4th Year Undergraduate</option>
            </select>
          </div>

          {/* Extra Skill input */}
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <label className="font-semibold text-slate-900 dark:text-slate-100 block mb-1 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-indigo-500" />
              Hypothetical Acquired Skill
            </label>
            <input
              type="text"
              value={simExtraSkill}
              onChange={(e) => setSimExtraSkill(e.target.value)}
              placeholder="e.g. Solidity, Rust, Docker..."
              className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Delta Impact Results */}
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Simulation Impact
            </div>
            <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">
              +{newlyEligible.length} Hackathon{newlyEligible.length === 1 ? '' : 's'} Unlocked!
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              {newlyEligible.length > 0 
                ? 'These opportunities transform directly into 100% ELIGIBLE status with your simulated profile adjustments.'
                : 'Your profile already qualifies for the current criteria set.'}
            </p>
          </div>
        </div>

        {/* List of newly unlocked opportunities */}
        {newlyEligible.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Newly Unlocked Opportunities ({newlyEligible.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {newlyEligible.map(opp => {
                const simMatch = simulatedMatches.get(opp.id);
                return (
                  <div
                    key={opp.id}
                    onClick={() => {
                      onClose();
                      onSelectOpportunity(opp);
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {opp.title}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {opp.organizer} • {opp.sourcePlatform} • Format: {opp.format}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {simMatch?.score}% Sim Match
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
