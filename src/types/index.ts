// Core TypeScript Domain Types for HackMate

export type EducationalQualification = 
  | 'High School'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'PhD'
  | 'Bootcamp'
  | 'Self-Taught'
  | 'Working Professional'
  | 'Other';

export type StudentStatus = 'Student' | 'Working Professional' | 'Recent Graduate' | 'Other';

export type EventFormat = 'Online' | 'Offline' | 'Hybrid';

export type ParticipationType = 'Individual' | 'Team' | 'Both';

export type EligibilityCategory = 
  | 'ELIGIBLE' 
  | 'POTENTIALLY ELIGIBLE' 
  | 'NEEDS ACTION' 
  | 'NOT ELIGIBLE';

export type ApplicationStage = 
  | 'Interested'
  | 'Saved'
  | 'Application started'
  | 'Applied'
  | 'Accepted'
  | 'Rejected'
  | 'Participating'
  | 'Completed';

export interface UserPersonalAndEdu {
  fullName: string;
  age?: number;
  country: string;
  state?: string;
  qualification: EducationalQualification;
  collegeOrUniversity?: string;
  degreeAndBranch?: string;
  currentYearOfStudy?: number; // 1, 2, 3, 4, 5+
  graduationYear?: number;
  status: StudentStatus;
}

export interface UserTechnicalSkills {
  programmingLanguages: string[];
  frameworks: string[];
  aiMlSkills: string[];
  dataScience: string[];
  webDevelopment: string[];
  appDevelopment: string[];
  cloudDevOps: string[];
  designAndPrototyping: string[];
  otherSkills: string[];
}

export interface UserExperience {
  previousHackathonsCount: number;
  projectsSummary?: string;
  internshipExperience?: string;
  researchExperience?: string;
  openSourceContributions?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  competitionExperience?: string;
}

export interface UserPreferences {
  participationType: ParticipationType;
  willingnessToFindTeammates: boolean;
  preferredFormats: EventFormat[];
  preferredLocations: string[]; // Countries/cities
  willingnessToTravel: boolean;
  maxRegistrationFee: number; // in USD (0 = free only)
  preferredDurationDays?: number; // e.g. 2 for 48h
  receiveDeadlineAlerts: boolean;
  receiveNewMatchAlerts: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  personal: UserPersonalAndEdu;
  skills: UserTechnicalSkills;
  experience: UserExperience;
  preferences: UserPreferences;
  interests: string[];
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityCriteria {
  minAge?: number;
  maxAge?: number;
  eligibleCountries?: string[]; // Empty/['Global'] means worldwide
  eligibleQualifications?: EducationalQualification[];
  eligibleAcademicYears?: number[]; // e.g. [1, 2, 3, 4]
  allowedStatuses?: StudentStatus[];
  participationType: ParticipationType;
  minTeamSize?: number;
  maxTeamSize?: number;
  prerequisites?: string[];
  mandatoryExperience?: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  organizer: string;
  sourcePlatform: 
    | 'Unstop' 
    | 'Devfolio' 
    | 'Devpost' 
    | 'Major League Hacking' 
    | 'Hack2skill' 
    | 'HackerEarth' 
    | 'DoraHacks' 
    | 'Hack Club' 
    | 'Lablab.ai' 
    | 'HackIndia' 
    | 'Hackalendar'
    | 'Direct / Manual';
  description: string;
  themes: string[];
  categories: string[];
  registrationStartDate: string;
  registrationDeadline: string;
  eventStartDate: string;
  eventEndDate: string;
  country: string;
  venue?: string;
  format: EventFormat;
  eligibility: EligibilityCriteria;
  registrationFee: number; // 0 for free
  feeCurrency: string; // 'USD', 'INR', etc.
  prizePool: string; // e.g. "$50,000" or "₹10,00,000"
  internshipOpportunities: boolean;
  placementOpportunities: boolean;
  requiredSkills: string[];
  experienceRequirements?: string;
  applicationRequirements?: string[];
  officialRegistrationUrl: string;
  originalSourceUrl: string;
  lastVerifiedAt: string;
  isVerified: boolean;
  status: 'active' | 'upcoming' | 'expired' | 'withdrawn';
  duplicateOfId?: string;
  confidenceScore?: number; // 0-100 extraction confidence
}

export interface RequirementEvaluation {
  id: string;
  criterion: string;
  satisfied: boolean;
  isMandatory: boolean;
  userValue?: string | number | string[];
  requiredValue?: string | number | string[];
  explanation: string;
  blocker?: boolean;
}

export interface OpportunityMatch {
  opportunityId: string;
  category: EligibilityCategory;
  score: number; // 0 - 100 percentage based on preference match
  reasonsForMatching: string[];
  satisfiedRequirements: RequirementEvaluation[];
  missingRequirements: RequirementEvaluation[];
  potentialBlockers: RequirementEvaluation[];
  actionRequiredNotice?: string;
  evaluatedAt: string;
}

export interface ApplicationTrackerItem {
  id: string;
  userId: string;
  opportunityId: string;
  stage: ApplicationStage;
  notes?: string;
  teamName?: string;
  submissionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  opportunityId?: string;
  type: 'DEADLINE_APPROACHING' | 'NEW_MATCH' | 'EVENT_UPDATE' | 'APPLICATION_STATUS';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface IngestionLog {
  id: string;
  source: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  itemsFetched: number;
  itemsAdded: number;
  itemsUpdated: number;
  itemsDuplicate: number;
  errors?: string[];
  timestamp: string;
}

export interface AdminReviewItem {
  id: string;
  opportunityId: string;
  reason: 'UNCERTAIN_ELIGIBILITY' | 'SUSPICIOUS_DATES' | 'POTENTIAL_DUPLICATE' | 'MANUAL_IMPORT';
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  actionPayload?: any;
  suggestions?: string[];
}

