import { describe, it, expect } from 'vitest';
import { Deduplicator } from '../src/services/pipeline/deduplicator';
import type { Opportunity } from '../src/types';

describe('Deduplicator — Cross-Platform Duplicate Detection', () => {
  it('normalizes hackathon titles removing punctuation and filler stop words', () => {
    const raw = 'The Annual Global AI Hackathon 2026: Edition!';
    const norm = Deduplicator.normalizeTitle(raw);
    expect(norm).toBe('ai');
  });

  it('calculates high Jaccard token similarity for equivalent titles', () => {
    const t1 = 'Cal Hacks 12.0 — World’s Largest Collegiate Hackathon';
    const t2 = 'Cal Hacks 12.0 Collegiate Hackathon';
    const sim = Deduplicator.stringSimilarity(t1, t2);
    expect(sim).toBeGreaterThanOrEqual(0.7);
  });

  it('detects duplicate listings across different platforms by registration URL or title + dates', () => {
    const originalOpp: Opportunity = {
      id: 'opp-1',
      title: 'Cal Hacks 12.0',
      organizer: 'UC Berkeley',
      sourcePlatform: 'Devpost',
      description: 'World largest collegiate hackathon.',
      themes: ['AI'],
      categories: ['Hackathon'],
      registrationStartDate: '2026-10-01T00:00:00Z',
      registrationDeadline: '2026-11-20T23:59:59Z',
      eventStartDate: '2026-12-08T18:00:00Z',
      eventEndDate: '2026-12-10T15:00:00Z',
      country: 'United States',
      format: 'Offline',
      eligibility: { participationType: 'Both' },
      registrationFee: 0,
      feeCurrency: 'USD',
      prizePool: '$100,000',
      internshipOpportunities: true,
      placementOpportunities: false,
      requiredSkills: [],
      officialRegistrationUrl: 'https://calhacks.io',
      originalSourceUrl: 'https://devpost.com/calhacks12',
      lastVerifiedAt: '2026-11-13T00:00:00Z',
      isVerified: true,
      status: 'active',
    };

    const duplicateFromHackalendar: Opportunity = {
      ...originalOpp,
      id: 'opp-2',
      title: 'Cal Hacks 12.0 Berkeley Hackathon',
      sourcePlatform: 'Hackalendar',
      originalSourceUrl: 'https://hackalendar.com/e/calhacks12',
    };

    const found = Deduplicator.findDuplicate(duplicateFromHackalendar, [originalOpp]);
    expect(found).not.toBeNull();
    expect(found?.id).toBe('opp-1');
  });
});
