import { describe, it, expect } from 'vitest';
import { EligibilityEngine } from '../src/services/eligibility/engine';
import type { UserProfile, Opportunity } from '../src/types';

describe('EligibilityEngine — Rule-based and Deterministic Evaluation', () => {
  const baseStudentProfile: UserProfile = {
    id: 'test-student',
    email: 'test@student.edu',
    role: 'user',
    personal: {
      fullName: 'Rahul Sharma',
      age: 20,
      country: 'India',
      qualification: 'Undergraduate',
      status: 'Student',
      currentYearOfStudy: 3,
    },
    skills: {
      programmingLanguages: ['Python', 'TypeScript', 'C++'],
      frameworks: ['React', 'FastAPI'],
      aiMlSkills: ['PyTorch', 'Gemini API'],
      dataScience: [],
      webDevelopment: ['Tailwind CSS'],
      appDevelopment: [],
      cloudDevOps: ['Docker'],
      designAndPrototyping: [],
      otherSkills: [],
    },
    experience: {
      previousHackathonsCount: 2,
    },
    preferences: {
      participationType: 'Both',
      willingnessToFindTeammates: true,
      preferredFormats: ['Online', 'Hybrid'],
      preferredLocations: ['India', 'Global'],
      willingnessToTravel: true,
      maxRegistrationFee: 0,
      receiveDeadlineAlerts: true,
      receiveNewMatchAlerts: true,
    },
    interests: ['Artificial Intelligence', 'FinTech', 'E-Commerce'],
    isOnboarded: true,
    createdAt: '2026-11-13T00:00:00Z',
    updatedAt: '2026-11-13T00:00:00Z',
  };

  const sampleIndiaStudentHackathon: Opportunity = {
    id: 'opp-india-student',
    title: 'National Campus Challenge 2026',
    organizer: 'TechCorp India',
    sourcePlatform: 'Unstop',
    description: 'A collegiate hackathon for undergraduate engineers in India building AI solutions.',
    themes: ['Artificial Intelligence', 'E-Commerce'],
    categories: ['Hackathon'],
    registrationStartDate: '2026-10-01T00:00:00Z',
    registrationDeadline: '2026-12-01T23:59:59Z',
    eventStartDate: '2026-12-05T09:00:00Z',
    eventEndDate: '2026-12-07T18:00:00Z',
    country: 'India',
    format: 'Hybrid',
    eligibility: {
      minAge: 18,
      maxAge: 25,
      eligibleCountries: ['India'],
      eligibleQualifications: ['Undergraduate'],
      eligibleAcademicYears: [2, 3, 4],
      allowedStatuses: ['Student'],
      participationType: 'Team',
      minTeamSize: 2,
      maxTeamSize: 4,
    },
    registrationFee: 0,
    feeCurrency: 'INR',
    prizePool: '₹10,00,000',
    internshipOpportunities: true,
    placementOpportunities: true,
    requiredSkills: ['Python', 'React'],
    officialRegistrationUrl: 'https://example.com/register',
    originalSourceUrl: 'https://example.com/source',
    lastVerifiedAt: '2026-11-13T00:00:00Z',
    isVerified: true,
    status: 'active',
  };

  it('correctly classifies a fully matching candidate as ELIGIBLE', () => {
    const match = EligibilityEngine.evaluate(baseStudentProfile, sampleIndiaStudentHackathon);
    expect(match.category).toBe('ELIGIBLE');
    expect(match.potentialBlockers.length).toBe(0);
    expect(match.score).toBeGreaterThanOrEqual(70);
  });

  it('strictly blocks candidates if their country is excluded (Geographic Restriction)', () => {
    const usOnlyHackathon: Opportunity = {
      ...sampleIndiaStudentHackathon,
      id: 'opp-us-only',
      country: 'United States',
      eligibility: {
        ...sampleIndiaStudentHackathon.eligibility,
        eligibleCountries: ['United States'],
      },
    };

    const match = EligibilityEngine.evaluate(baseStudentProfile, usOnlyHackathon);
    expect(match.category).toBe('NOT ELIGIBLE');
    expect(match.potentialBlockers.some(b => b.id === 'geography')).toBe(true);
    // Mandatory invariant: score capped for ineligibles
    expect(match.score).toBeLessThanOrEqual(25);
  });

  it('strictly marks NOT ELIGIBLE when working professional applies for student-only event', () => {
    const professionalProfile: UserProfile = {
      ...baseStudentProfile,
      personal: {
        ...baseStudentProfile.personal,
        qualification: 'Working Professional',
        status: 'Working Professional',
      },
    };

    const match = EligibilityEngine.evaluate(professionalProfile, sampleIndiaStudentHackathon);
    expect(match.category).toBe('NOT ELIGIBLE');
    expect(match.potentialBlockers.some(b => b.id === 'student_status' || b.id === 'qualification')).toBe(true);
  });

  it('marks NEEDS ACTION if a solo applicant is willing to find teammates for a team-mandatory event', () => {
    const soloProfile: UserProfile = {
      ...baseStudentProfile,
      preferences: {
        ...baseStudentProfile.preferences,
        participationType: 'Individual',
        willingnessToFindTeammates: true,
      },
    };

    const match = EligibilityEngine.evaluate(soloProfile, sampleIndiaStudentHackathon);
    expect(match.category).toBe('NEEDS ACTION');
    expect(match.actionRequiredNotice).toBeDefined();
  });

  it('marks NOT ELIGIBLE if candidate is solo-only and strictly unwilling to team for team-mandatory event', () => {
    const strictlySoloProfile: UserProfile = {
      ...baseStudentProfile,
      preferences: {
        ...baseStudentProfile.preferences,
        participationType: 'Individual',
        willingnessToFindTeammates: false,
      },
    };

    const match = EligibilityEngine.evaluate(strictlySoloProfile, sampleIndiaStudentHackathon);
    expect(match.category).toBe('NOT ELIGIBLE');
    expect(match.potentialBlockers.some(b => b.id === 'participation_type')).toBe(true);
  });

  it('enforces that high preference score NEVER overrides a failed mandatory eligibility requirement', () => {
    // Hackathon where user matches 100% of skills and interests, but age is 15 (too young)
    const tooYoungProfile: UserProfile = {
      ...baseStudentProfile,
      personal: {
        ...baseStudentProfile.personal,
        age: 15,
      },
    };

    const match = EligibilityEngine.evaluate(tooYoungProfile, sampleIndiaStudentHackathon);
    expect(match.category).toBe('NOT ELIGIBLE');
    expect(match.potentialBlockers.some(b => b.id === 'age')).toBe(true);
    expect(match.score).toBeLessThanOrEqual(25);
  });
});
