import React from 'react';
import type { UserProfile } from '../../types';
import { 
  GraduationCap, 
  Code, 
  Award, 
  Settings2, 
  Sparkles, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';

interface ProfileSummaryCardProps {
  profile: Partial<UserProfile>;
  onEditSection?: (sectionKey: string) => void;
}

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({
  profile,
  onEditSection,
}) => {
  const p = profile.personal;
  const s = profile.skills;
  const pref = profile.preferences;
  const interests = profile.interests || [];

  const allSkills = [
    ...(s?.programmingLanguages || []),
    ...(s?.frameworks || []),
    ...(s?.aiMlSkills || []),
    ...(s?.webDevelopment || []),
    ...(s?.cloudDevOps || []),
    ...(s?.otherSkills || []),
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {p?.fullName || 'Anonymous Hacker'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {p?.country || 'Global'}{p?.state ? `, ${p.state}` : ''} • {p?.status || 'Student'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Profile Ready
        </span>
      </div>

      {/* 1. Academic & Status */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            Academic & Background
          </h4>
          {onEditSection && (
            <button 
              onClick={() => onEditSection('personal')} 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div><span className="font-medium text-slate-900 dark:text-slate-100">Qualification:</span> {p?.qualification || 'Undergraduate'}</div>
          {p?.collegeOrUniversity && <div><span className="font-medium text-slate-900 dark:text-slate-100">Institution:</span> {p.collegeOrUniversity}</div>}
          {p?.degreeAndBranch && <div><span className="font-medium text-slate-900 dark:text-slate-100">Degree/Branch:</span> {p.degreeAndBranch}</div>}
          {p?.currentYearOfStudy && <div><span className="font-medium text-slate-900 dark:text-slate-100">Year:</span> {p.currentYearOfStudy}th Year (Graduating {p.graduationYear || '2027'})</div>}
          {p?.age && <div><span className="font-medium text-slate-900 dark:text-slate-100">Age:</span> {p.age} years</div>}
        </div>
      </div>

      {/* 2. Technical Stack */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-indigo-500" />
            Technical Stack
          </h4>
          {onEditSection && (
            <button 
              onClick={() => onEditSection('skills')} 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          {allSkills.length > 0 ? (
            allSkills.map((skill, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No skills listed yet</span>
          )}
        </div>
      </div>

      {/* 3. Interests & Themes */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Preferred Themes & Interests
          </h4>
          {onEditSection && (
            <button 
              onClick={() => onEditSection('interests')} 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          {interests.length > 0 ? (
            interests.map((interest, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                {interest}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No interests specified</span>
          )}
        </div>
      </div>

      {/* 4. Participation Preferences */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            Participation Preferences
          </h4>
          {onEditSection && (
            <button 
              onClick={() => onEditSection('preferences')} 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div><span className="font-medium text-slate-900 dark:text-slate-100">Format:</span> {pref?.preferredFormats?.join(', ') || 'Online, Hybrid'}</div>
          <div><span className="font-medium text-slate-900 dark:text-slate-100">Team Type:</span> {pref?.participationType || 'Both'} ({pref?.willingnessToFindTeammates ? 'Open to teammates' : 'Solo only'})</div>
          <div><span className="font-medium text-slate-900 dark:text-slate-100">Travel Willingness:</span> {pref?.willingnessToTravel ? 'Yes (Can travel for hackathons)' : 'No (Local/Online only)'}</div>
          <div><span className="font-medium text-slate-900 dark:text-slate-100">Budget:</span> {pref?.maxRegistrationFee === 0 ? 'Free hackathons only' : `Up to $${pref?.maxRegistrationFee ?? 0}`}</div>
        </div>
      </div>
    </div>
  );
};
