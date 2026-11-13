import React, { useState } from 'react';
import type { EducationalQualification, StudentStatus, UserPreferences, ParticipationType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { 
  User, 
  GraduationCap, 
  Code, 
  Settings2, 
  Sparkles, 
  Download, 
  RotateCcw, 
  ShieldCheck, 
  Bell, 
  Save, 
  CheckCircle2 
} from 'lucide-react';

export const ProfileView: React.FC<{ onRerunOnboarding: () => void }> = ({ onRerunOnboarding }) => {
  const { user, updateProfile, switchDemoRole } = useAuth();

  const [personal, setPersonal] = useState(user?.personal || {
    fullName: '',
    age: 20,
    country: 'India',
    qualification: 'Undergraduate' as EducationalQualification,
    status: 'Student' as StudentStatus,
  });

  const [skillsStr, setSkillsStr] = useState(
    [
      ...(user?.skills.programmingLanguages || []),
      ...(user?.skills.frameworks || []),
      ...(user?.skills.aiMlSkills || []),
      ...(user?.skills.webDevelopment || []),
    ].join(', ')
  );

  const [interestsStr, setInterestsStr] = useState((user?.interests || []).join(', '));

  const [preferences, setPreferences] = useState<UserPreferences>(user?.preferences || {
    participationType: 'Both' as ParticipationType,
    willingnessToFindTeammates: true,
    preferredFormats: ['Online', 'Hybrid'],
    preferredLocations: ['India', 'Global'],
    willingnessToTravel: true,
    maxRegistrationFee: 0,
    preferredDurationDays: 2,
    receiveDeadlineAlerts: true,
    receiveNewMatchAlerts: true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsList = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    const interestsList = interestsStr.split(',').map(s => s.trim()).filter(Boolean);

    updateProfile({
      personal,
      skills: {
        ...(user?.skills || {
          dataScience: [],
          appDevelopment: [],
          cloudDevOps: [],
          designAndPrototyping: [],
          otherSkills: [],
        }),
        programmingLanguages: skillsList,
        frameworks: skillsList,
        aiMlSkills: skillsList.filter(s => /ai|ml|learning|torch|gemini/i.test(s)),
        webDevelopment: skillsList.filter(s => /react|next|node|tailwind|html|css/i.test(s)),
        dataScience: [],
        appDevelopment: [],
        cloudDevOps: [],
        designAndPrototyping: [],
        otherSkills: skillsList,
      },
      interests: interestsList,
      preferences,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hackmate-profile-${user?.id || 'export'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title & Quick Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            Profile & Matching Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Keep your academic qualifications and skills updated for precision rule matching
          </p>
        </div>

        {/* Preset Role Switcher for instant demoing */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-[11px] font-medium text-slate-400 px-2">Presets:</span>
          <button
            onClick={() => switchDemoRole('student')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.personal.status === 'Student' && user?.role !== 'admin'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            College Student
          </button>
          <button
            onClick={() => switchDemoRole('professional')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.personal.status === 'Working Professional'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Working Pro
          </button>
          <button
            onClick={() => switchDemoRole('admin')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.role === 'admin'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Admin Role
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Academic and Personal Details */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            Personal & Academic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={personal.fullName}
                onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Age
              </label>
              <input
                type="number"
                value={personal.age || ''}
                onChange={(e) => setPersonal({ ...personal, age: parseInt(e.target.value, 10) || undefined })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Country
              </label>
              <input
                type="text"
                value={personal.country}
                onChange={(e) => setPersonal({ ...personal, country: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Educational Qualification
              </label>
              <select
                value={personal.qualification}
                onChange={(e) => setPersonal({ ...personal, qualification: e.target.value as any })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Undergraduate">Undergraduate (B.Tech / B.E / B.Sc)</option>
                <option value="Postgraduate">Postgraduate (M.Tech / M.S / MCA)</option>
                <option value="High School">High School (K-12)</option>
                <option value="PhD">PhD / Doctorate</option>
                <option value="Working Professional">Working Professional</option>
                <option value="Bootcamp">Bootcamp / Self-Taught</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                College / University
              </label>
              <input
                type="text"
                value={personal.collegeOrUniversity || ''}
                onChange={(e) => setPersonal({ ...personal, collegeOrUniversity: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Current Year of Study (1 - 5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={personal.currentYearOfStudy || ''}
                onChange={(e) => setPersonal({ ...personal, currentYearOfStudy: parseInt(e.target.value, 10) || undefined })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Technical Skills and Themes */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-500" />
            Skills, Languages & Interests
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Technical Stack (Comma-separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Python, TypeScript, React, PyTorch, Docker, C++"
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Used for matching prerequisites and hackathon technology tracks.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Interest Themes (Comma-separated)
              </label>
              <input
                type="text"
                value={interestsStr}
                onChange={(e) => setInterestsStr(e.target.value)}
                placeholder="Artificial Intelligence, FinTech, Web3, Social Impact, Robotics"
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Participation Preferences */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            Participation & Travel Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Participation Mode
              </label>
              <select
                value={preferences.participationType}
                onChange={(e) => setPreferences({ ...preferences, participationType: e.target.value as any })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Both">Both Individual or Team</option>
                <option value="Individual">Individual Only</option>
                <option value="Team">Team Only</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Maximum Registration Fee ($ USD)
              </label>
              <input
                type="number"
                min={0}
                value={preferences.maxRegistrationFee}
                onChange={(e) => setPreferences({ ...preferences, maxRegistrationFee: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <span className="text-[11px] text-slate-400">Set to 0 for free events only.</span>
            </div>

            <div className="sm:col-span-2 space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preferences.willingnessToFindTeammates}
                  onChange={(e) => setPreferences({ ...preferences, willingnessToFindTeammates: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Willing to find teammates or join teams for team-mandatory hackathons
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preferences.willingnessToTravel}
                  onChange={(e) => setPreferences({ ...preferences, willingnessToTravel: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Willing to travel domestically or internationally for offline/in-person hackathons
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preferences.receiveDeadlineAlerts}
                  onChange={(e) => setPreferences({ ...preferences, receiveDeadlineAlerts: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Receive deadline alerts for matching opportunities within 7 days
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>

            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Updated! Eligibility recalculated.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportData}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export JSON
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRerunOnboarding}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Rerun Onboarding
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
