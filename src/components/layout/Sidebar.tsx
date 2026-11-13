import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { 
  LayoutDashboard, 
  Compass, 
  Bookmark, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  User, 
  Sparkles, 
  Layers 
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const { savedIds, applications } = useOpportunities();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'discover', label: 'Discover Feed', icon: <Compass className="w-4 h-4" /> },
    { 
      id: 'tracker', 
      label: 'My Applications', 
      icon: <FileText className="w-4 h-4" />, 
      badge: applications.length > 0 ? applications.length : undefined 
    },
    { id: 'calendar', label: 'Deadline Calendar', icon: <Calendar className="w-4 h-4" /> },
    { 
      id: 'saved', 
      label: 'Saved Opportunities', 
      icon: <Bookmark className="w-4 h-4" />, 
      badge: savedIds.length > 0 ? savedIds.length : undefined 
    },
    { id: 'admin', label: 'Admin Console', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile & Matching', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-4 space-y-6">
      {/* Navigation Links */}
      <nav className="space-y-1">
        {navItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Integration Ecosystem Footer Box */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Integrated Sources</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          11 active source adapters streaming real competitions with zero fabricated listings.
        </p>
        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
          Unstop • Devfolio • Devpost • MLH • DoraHacks & more
        </div>
      </div>
    </aside>
  );
};

