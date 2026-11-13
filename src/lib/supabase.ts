import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  UserProfile, 
  Opportunity, 
  ApplicationTrackerItem, 
  NotificationItem, 
  IngestionLog, 
  AdminReviewItem 
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Initial Demo Seed User Profile
export const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr-student-001',
  email: 'alex.chen@university.edu',
  role: 'user',
  personal: {
    fullName: 'Alex Chen',
    age: 20,
    country: 'India',
    state: 'Karnataka',
    qualification: 'Undergraduate',
    collegeOrUniversity: 'Indian Institute of Information Technology',
    degreeAndBranch: 'B.Tech in Computer Science',
    currentYearOfStudy: 3,
    graduationYear: 2027,
    status: 'Student',
  },
  skills: {
    programmingLanguages: ['Python', 'TypeScript', 'C++', 'JavaScript'],
    frameworks: ['React', 'FastAPI', 'Node.js', 'Next.js'],
    aiMlSkills: ['PyTorch', 'Gemini API', 'Scikit-Learn', 'RAG'],
    dataScience: ['Pandas', 'NumPy', 'Data Visualization'],
    webDevelopment: ['Tailwind CSS', 'REST APIs', 'PostgreSQL'],
    appDevelopment: ['Flutter'],
    cloudDevOps: ['Docker', 'Git', 'GitHub Actions'],
    designAndPrototyping: ['Figma'],
    otherSkills: ['Competitive Programming', 'System Design'],
  },
  experience: {
    previousHackathonsCount: 2,
    projectsSummary: 'Built an automated campus event planner and an AI notes summarizer using Gemini.',
    internshipExperience: 'Summer software engineering intern at a fintech startup.',
    githubUrl: 'https://github.com/alexchen-dev',
    portfolioUrl: 'https://alexchen.dev',
  },
  preferences: {
    participationType: 'Both',
    willingnessToFindTeammates: true,
    preferredFormats: ['Online', 'Hybrid'],
    preferredLocations: ['India', 'Global'],
    willingnessToTravel: true,
    maxRegistrationFee: 0,
    preferredDurationDays: 2,
    receiveDeadlineAlerts: true,
    receiveNewMatchAlerts: true,
  },
  interests: [
    'Artificial Intelligence',
    'Machine Learning',
    'FinTech',
    'Social Impact',
    'Web Development',
    'E-Commerce',
  ],
  isOnboarded: true,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-11-13T00:00:00Z',
};

const STORAGE_KEYS = {
  USER: 'hackmate_user_profile',
  APPLICATIONS: 'hackmate_applications',
  SAVED: 'hackmate_saved_ids',
  NOTIFICATIONS: 'hackmate_notifications',
  CUSTOM_OPPORTUNITIES: 'hackmate_custom_opportunities',
  ADMIN_REVIEWS: 'hackmate_admin_reviews',
  INGESTION_LOGS: 'hackmate_ingestion_logs',
};

/**
 * Reactive Local Persistence Service that acts as a client data layer.
 * Works seamlessly with or without live Supabase cloud credentials.
 */
export class StorageService {
  public static getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) return DEFAULT_DEMO_USER;
      return JSON.parse(data);
    } catch {
      return DEFAULT_DEMO_USER;
    }
  }

  public static saveUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  public static clearUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  public static getSavedOpportunityIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED);
      return data ? JSON.parse(data) : ['devpost-google-gemini-developer-challenge', 'unstop-flipkart-grid-6'];
    } catch {
      return [];
    }
  }

  public static toggleSaveOpportunity(oppId: string): boolean {
    const list = this.getSavedOpportunityIds();
    const index = list.indexOf(oppId);
    let isSaved = false;
    if (index === -1) {
      list.push(oppId);
      isSaved = true;
    } else {
      list.splice(index, 1);
      isSaved = false;
    }
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(list));
    return isSaved;
  }

  public static getApplications(): ApplicationTrackerItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return data ? JSON.parse(data) : [
        {
          id: 'app-1',
          userId: 'usr-student-001',
          opportunityId: 'unstop-flipkart-grid-6',
          stage: 'Applied',
          notes: 'Submitted team registration with college team. Waiting for round 1 online assessment.',
          teamName: 'NeuralKnights',
          createdAt: '2026-10-15T12:00:00Z',
          updatedAt: '2026-11-01T14:00:00Z',
        },
        {
          id: 'app-2',
          userId: 'usr-student-001',
          opportunityId: 'devpost-google-gemini-developer-challenge',
          stage: 'Application started',
          notes: 'Drafting prototype idea around multimodal document processing for local students.',
          createdAt: '2026-11-05T09:00:00Z',
          updatedAt: '2026-11-10T11:00:00Z',
        }
      ];
    } catch {
      return [];
    }
  }

  public static saveApplication(item: ApplicationTrackerItem): void {
    const list = this.getApplications();
    const index = list.findIndex(a => a.id === item.id || (a.opportunityId === item.opportunityId && a.userId === item.userId));
    if (index === -1) {
      list.unshift(item);
    } else {
      list[index] = { ...list[index], ...item, updatedAt: new Date().toISOString() };
    }
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
  }

  public static removeApplication(appId: string): void {
    const list = this.getApplications().filter(a => a.id !== appId);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
  }

  public static getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [
        {
          id: 'notif-1',
          userId: 'usr-student-001',
          opportunityId: 'devpost-google-gemini-developer-challenge',
          type: 'DEADLINE_APPROACHING',
          title: 'Deadline Approaching: Gemini API Developer Challenge',
          message: 'Registration closes in 5 days on Nov 18, 2026. Review final submission requirements.',
          isRead: false,
          createdAt: '2026-11-13T06:00:00Z',
        },
        {
          id: 'notif-2',
          userId: 'usr-student-001',
          opportunityId: 'unstop-flipkart-grid-6',
          type: 'EVENT_UPDATE',
          title: 'Round 1 Assessment Schedule Announced',
          message: 'Flipkart GRiD 6.0 preliminary coding test will commence on Nov 25, 2026.',
          isRead: false,
          createdAt: '2026-11-12T15:00:00Z',
        },
        {
          id: 'notif-3',
          userId: 'usr-student-001',
          opportunityId: 'devfolio-ethindia-2026',
          type: 'NEW_MATCH',
          title: '95% Match: ETHIndia 2026',
          message: 'Asia’s premier web3 hackathon matches your interests and travel preferences.',
          isRead: true,
          createdAt: '2026-11-10T08:00:00Z',
        }
      ];
    } catch {
      return [];
    }
  }

  public static markNotificationRead(id: string): void {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  public static markAllNotificationsRead(): void {
    const list = this.getNotifications().map(n => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  public static getCustomOpportunities(): Opportunity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_OPPORTUNITIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addCustomOpportunity(opp: Opportunity): void {
    const list = this.getCustomOpportunities();
    list.unshift(opp);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_OPPORTUNITIES, JSON.stringify(list));
  }

  public static updateOpportunity(updated: Opportunity): void {
    const list = this.getCustomOpportunities();
    const idx = list.findIndex(o => o.id === updated.id);
    if (idx !== -1) {
      list[idx] = updated;
      localStorage.setItem(STORAGE_KEYS.CUSTOM_OPPORTUNITIES, JSON.stringify(list));
    }
  }

  public static getAdminReviews(): AdminReviewItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_REVIEWS);
      return data ? JSON.parse(data) : [
        {
          id: 'rev-001',
          opportunityId: 'unstop-smart-india-internal-26',
          reason: 'UNCERTAIN_ELIGIBILITY',
          notes: 'Verify whether non-Indian passport holders studying in Indian colleges are eligible.',
          status: 'PENDING',
          createdAt: '2026-11-12T10:00:00Z',
        }
      ];
    } catch {
      return [];
    }
  }

  public static saveAdminReviews(reviews: AdminReviewItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_REVIEWS, JSON.stringify(reviews));
  }
}

