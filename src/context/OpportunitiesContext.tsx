import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  Opportunity, 
  OpportunityMatch, 
  ApplicationTrackerItem, 
  NotificationItem, 
  IngestionLog, 
  AdminReviewItem,
  ApplicationStage 
} from '../types';
import { useAuth } from './AuthContext';
import { EligibilityEngine } from '../services/eligibility/engine';
import { SourceAdapterRegistry } from '../services/sources/registry';
import { StorageService } from '../lib/supabase';

interface FilterState {
  search: string;
  format: string; // 'All' | 'Online' | 'Offline' | 'Hybrid'
  eligibility: string; // 'All' | 'ELIGIBLE' | 'POTENTIALLY ELIGIBLE' | 'NEEDS ACTION' | 'NOT ELIGIBLE'
  theme: string;
  source: string;
  freeOnly: boolean;
  sortBy: 'matchScore' | 'deadline' | 'newest' | 'prize';
}

interface OpportunitiesContextType {
  opportunities: Opportunity[];
  filteredOpportunities: Opportunity[];
  matches: Map<string, OpportunityMatch>;
  savedIds: string[];
  applications: ApplicationTrackerItem[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  ingestionLogs: IngestionLog[];
  adminReviews: AdminReviewItem[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  toggleSave: (oppId: string) => boolean;
  isSaved: (oppId: string) => boolean;
  saveApplication: (oppId: string, stage: ApplicationStage, notes?: string, teamName?: string) => void;
  removeApplication: (appId: string) => void;
  getApplicationForOpportunity: (oppId: string) => ApplicationTrackerItem | undefined;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  triggerIngestion: () => Promise<void>;
  isIngesting: boolean;
  addManualOpportunity: (opp: Opportunity) => void;
  updateOpportunity: (opp: Opportunity) => void;
  approveAdminReview: (reviewId: string) => void;
  rejectAdminReview: (reviewId: string) => void;
}

const defaultFilters: FilterState = {
  search: '',
  format: 'All',
  eligibility: 'All',
  theme: 'All',
  source: 'All',
  freeOnly: false,
  sortBy: 'matchScore',
};

const OpportunitiesContext = createContext<OpportunitiesContextType | undefined>(undefined);

export const OpportunitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() => StorageService.getSavedOpportunityIds());
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>(() => StorageService.getApplications());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => StorageService.getNotifications());
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLog[]>([]);
  const [adminReviews, setAdminReviews] = useState<AdminReviewItem[]>(() => StorageService.getAdminReviews());
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Initial load: collect from all adapters and local custom
  useEffect(() => {
    const initOpportunities = async () => {
      setIsIngesting(true);
      const custom = StorageService.getCustomOpportunities();
      const result = await SourceAdapterRegistry.runIngestion(custom);
      setOpportunities(result.mergedOpportunities);
      setIngestionLogs(result.logs);
      if (result.adminReviews.length > 0) {
        setAdminReviews(prev => [...result.adminReviews, ...prev]);
      }
      setIsIngesting(false);
    };

    initOpportunities();
  }, []);

  // Compute matches whenever user profile or opportunities change
  const matches = useMemo(() => {
    const map = new Map<string, OpportunityMatch>();
    if (!user) return map;

    opportunities.forEach(opp => {
      const match = EligibilityEngine.evaluate(user, opp);
      map.set(opp.id, match);
    });

    return map;
  }, [user, opportunities]);

  // Filtered & sorted opportunities
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities];

    // Search query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(o => 
        o.title.toLowerCase().includes(q) ||
        o.organizer.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.themes.some(t => t.toLowerCase().includes(q)) ||
        o.requiredSkills.some(s => s.toLowerCase().includes(q))
      );
    }

    // Format
    if (filters.format !== 'All') {
      list = list.filter(o => o.format === filters.format);
    }

    // Eligibility category
    if (filters.eligibility !== 'All' && user) {
      list = list.filter(o => {
        const match = matches.get(o.id);
        return match?.category === filters.eligibility;
      });
    }

    // Theme
    if (filters.theme !== 'All') {
      list = list.filter(o => o.themes.includes(filters.theme) || o.categories.includes(filters.theme));
    }

    // Source platform
    if (filters.source !== 'All') {
      list = list.filter(o => o.sourcePlatform === filters.source);
    }

    // Free only
    if (filters.freeOnly) {
      list = list.filter(o => o.registrationFee === 0);
    }

    // Sorting
    list.sort((a, b) => {
      if (filters.sortBy === 'matchScore') {
        const scoreA = matches.get(a.id)?.score ?? 0;
        const scoreB = matches.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      }
      if (filters.sortBy === 'deadline') {
        return new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime();
      }
      if (filters.sortBy === 'newest') {
        return new Date(b.lastVerifiedAt).getTime() - new Date(a.lastVerifiedAt).getTime();
      }
      return 0;
    });

    return list;
  }, [opportunities, filters, matches, user]);

  const toggleSave = useCallback((oppId: string): boolean => {
    const updatedStatus = StorageService.toggleSaveOpportunity(oppId);
    setSavedIds(StorageService.getSavedOpportunityIds());
    return updatedStatus;
  }, []);

  const isSaved = useCallback((oppId: string): boolean => {
    return savedIds.includes(oppId);
  }, [savedIds]);

  const saveApplication = useCallback((oppId: string, stage: ApplicationStage, notes?: string, teamName?: string) => {
    if (!user) return;
    const existing = applications.find(a => a.opportunityId === oppId && a.userId === user.id);
    const item: ApplicationTrackerItem = {
      id: existing ? existing.id : `app-${Date.now()}`,
      userId: user.id,
      opportunityId: oppId,
      stage,
      notes: notes !== undefined ? notes : existing?.notes,
      teamName: teamName !== undefined ? teamName : existing?.teamName,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveApplication(item);
    setApplications(StorageService.getApplications());
  }, [user, applications]);

  const removeApplication = useCallback((appId: string) => {
    StorageService.removeApplication(appId);
    setApplications(StorageService.getApplications());
  }, []);

  const getApplicationForOpportunity = useCallback((oppId: string) => {
    if (!user) return undefined;
    return applications.find(a => a.opportunityId === oppId && a.userId === user.id);
  }, [user, applications]);

  const markNotificationAsRead = useCallback((id: string) => {
    StorageService.markNotificationRead(id);
    setNotifications(StorageService.getNotifications());
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    StorageService.markAllNotificationsRead();
    setNotifications(StorageService.getNotifications());
  }, []);

  const triggerIngestion = useCallback(async () => {
    setIsIngesting(true);
    const custom = StorageService.getCustomOpportunities();
    const result = await SourceAdapterRegistry.runIngestion([...custom, ...opportunities]);
    setOpportunities(result.mergedOpportunities);
    setIngestionLogs(prev => [...result.logs, ...prev]);
    if (result.adminReviews.length > 0) {
      setAdminReviews(prev => [...result.adminReviews, ...prev]);
    }
    setIsIngesting(false);
  }, [opportunities]);

  const addManualOpportunity = useCallback((opp: Opportunity) => {
    StorageService.addCustomOpportunity(opp);
    setOpportunities(prev => [opp, ...prev]);
  }, []);

  const updateOpportunity = useCallback((updated: Opportunity) => {
    StorageService.updateOpportunity(updated);
    setOpportunities(prev => prev.map(o => o.id === updated.id ? updated : o));
  }, []);

  const approveAdminReview = useCallback((reviewId: string) => {
    const updated = adminReviews.map(r => r.id === reviewId ? { ...r, status: 'APPROVED' as const } : r);
    setAdminReviews(updated);
    StorageService.saveAdminReviews(updated);
  }, [adminReviews]);

  const rejectAdminReview = useCallback((reviewId: string) => {
    const updated = adminReviews.map(r => r.id === reviewId ? { ...r, status: 'REJECTED' as const } : r);
    setAdminReviews(updated);
    StorageService.saveAdminReviews(updated);
  }, [adminReviews]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return (
    <OpportunitiesContext.Provider
      value={{
        opportunities,
        filteredOpportunities,
        matches,
        savedIds,
        applications,
        notifications,
        unreadNotificationCount,
        ingestionLogs,
        adminReviews,
        filters,
        setFilters,
        resetFilters,
        toggleSave,
        isSaved,
        saveApplication,
        removeApplication,
        getApplicationForOpportunity,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        triggerIngestion,
        isIngesting,
        addManualOpportunity,
        updateOpportunity,
        approveAdminReview,
        rejectAdminReview,
      }}
    >
      {children}
    </OpportunitiesContext.Provider>
  );
};

export const useOpportunities = () => {
  const context = useContext(OpportunitiesContext);
  if (!context) throw new Error('useOpportunities must be used within an OpportunitiesProvider');
  return context;
};

