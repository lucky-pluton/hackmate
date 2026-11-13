import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { 
  LayoutDashboard, 
  Compass, 
  FileText, 
  Calendar, 
  Bookmark, 
  User 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAssistant: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onNavigate,
  onOpenAssistant,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenAssistant={onOpenAssistant}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex pb-16 md:pb-0">
        <Sidebar
          currentView={currentView}
          onNavigate={onNavigate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1 text-[10px] font-medium">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 ${currentView === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('discover')}
          className={`flex flex-col items-center gap-1 p-1 ${currentView === 'discover' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <Compass className="w-4 h-4" />
          <span>Feed</span>
        </button>

        <button
          onClick={() => onNavigate('tracker')}
          className={`flex flex-col items-center gap-1 p-1 ${currentView === 'tracker' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Tracker</span>
        </button>

        <button
          onClick={() => onNavigate('calendar')}
          className={`flex flex-col items-center gap-1 p-1 ${currentView === 'calendar' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 p-1 ${currentView === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
};

