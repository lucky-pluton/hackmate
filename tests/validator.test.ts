import { describe, it, expect } from 'vitest';
import { Validator } from '../src/services/pipeline/validator';
import type { Opportunity } from '../src/types';

describe('Validator — Deterministic Ingestion Verification', () => {
  const validOpportunity: Opportunity = {
    id: 'valid-opp-1',
    title: 'Google Gemini AI Developer Challenge',
    organizer: 'Google Cloud',
    sourcePlatform: 'Devpost',
    description: 'Comprehensive developer competition creating multimodal applications with Gemini API.',
    themes: ['AI', 'Multimodal'],
    categories: ['Challenge'],
    registrationStartDate: '2026-10-01T00:00:00Z',
    registrationDeadline: '2026-11-20T23:59:59Z',
    eventStartDate: '2026-11-25T00:00:00Z',
    eventEndDate: '2026-11-30T23:59:59Z',
    country: 'Global',
    format: 'Online',
    eligibility: {
      minAge: 18,
      maxAge: 35,
      participationType: 'Both',
      minTeamSize: 1,
      maxTeamSize: 4,
    },
    registrationFee: 0,
    feeCurrency: 'USD',
    prizePool: '$100,000',
    internshipOpportunities: false,
    placementOpportunities: false,
    requiredSkills: ['Python', 'TypeScript'],
    officialRegistrationUrl: 'https://google-gemini.devpost.com',
    originalSourceUrl: 'https://devpost.com',
    lastVerifiedAt: '2026-11-13T00:00:00Z',
    isVerified: true,
    status: 'active',
  };

  it('validates a complete, correctly formatted opportunity with high confidence', () => {
    const res = Validator.validate(validOpportunity);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.confidenceScore).toBeGreaterThanOrEqual(90);
  });

  it('rejects opportunities with invalid registration URLs', () => {
    const badUrlOpp: Opportunity = {
      ...validOpportunity,
      officialRegistrationUrl: 'ftp://not-a-valid-web-url',
    };
    const res = Validator.validate(badUrlOpp);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('registration URL'))).toBe(true);
  });

  it('rejects opportunities with non-chronological dates (deadline before start date)', () => {
    const invertedDatesOpp: Opportunity = {
      ...validOpportunity,
      registrationStartDate: '2026-11-20T00:00:00Z',
      registrationDeadline: '2026-10-01T00:00:00Z', // Before start
    };
    const res = Validator.validate(invertedDatesOpp);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('deadline cannot be before'))).toBe(true);
  });

  it('flags opportunities with minAge > maxAge', () => {
    const invalidAgeOpp: Opportunity = {
      ...validOpportunity,
      eligibility: {
        ...validOpportunity.eligibility,
        minAge: 30,
        maxAge: 20,
      },
    };
    const res = Validator.validate(invalidAgeOpp);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('Minimum age'))).toBe(true);
  });
});
