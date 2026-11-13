import type { Opportunity } from '../../types';

export class Deduplicator {
  /**
   * Normalizes a string by stripping punctuation, extra spaces, and common stop/filler words.
   */
  public static normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\b(the|a|an|hackathon|annual|national|international|global|edition|online|virtual|2025|2026|2027)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Computes Jaccard similarity coefficient between two sets of token words.
   */
  public static tokenJaccardSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(this.normalizeTitle(str1).split(' ').filter(Boolean));
    const tokens2 = new Set(this.normalizeTitle(str2).split(' ').filter(Boolean));

    if (tokens1.size === 0 && tokens2.size === 0) return 1;
    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    let intersectionCount = 0;
    tokens1.forEach(token => {
      if (tokens2.has(token)) intersectionCount++;
    });

    const unionCount = new Set([...tokens1, ...tokens2]).size;
    return intersectionCount / unionCount;
  }

  /**
   * Computes Levenshtein distance between two strings.
   */
  public static levenshteinDistance(a: string, b: string): number {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;

    const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
    for (let i = 0; i <= an; ++i) matrix[0][i] = i;
    for (let i = 0; i <= bn; ++i) matrix[i][0] = i;

    for (let i = 1; i <= bn; ++i) {
      for (let j = 1; j <= an; ++j) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[bn][an];
  }

  /**
   * Computes normalized string similarity (0 to 1) combining Jaccard, Overlap containment, and Levenshtein.
   */
  public static stringSimilarity(a: string, b: string): number {
    const normA = this.normalizeTitle(a);
    const normB = this.normalizeTitle(b);
    if (normA === normB) return 1.0;
    if (!normA || !normB) return 0.0;

    const tokens1 = new Set(normA.split(' ').filter(Boolean));
    const tokens2 = new Set(normB.split(' ').filter(Boolean));

    let intersectionCount = 0;
    tokens1.forEach(t => {
      if (tokens2.has(t)) intersectionCount++;
    });

    const unionCount = new Set([...tokens1, ...tokens2]).size;
    const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;
    const minSize = Math.min(tokens1.size, tokens2.size);
    const overlap = minSize > 0 ? intersectionCount / minSize : 0;

    // If one title is largely a subset or subtitle expansion of the other
    if (overlap >= 0.8 && minSize >= 2) {
      return Math.max(jaccard, overlap * 0.9);
    }

    const maxLen = Math.max(normA.length, normB.length);
    const dist = this.levenshteinDistance(normA, normB);
    const levSim = 1 - dist / maxLen;

    return Math.max(jaccard, levSim);
  }

  /**
   * Checks if two dates fall within a given threshold of days.
   */
  public static datesAreClose(date1Str: string, date2Str: string, maxDaysDiff: number = 3): boolean {
    try {
      const d1 = new Date(date1Str).getTime();
      const d2 = new Date(date2Str).getTime();
      const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
      return diffDays <= maxDaysDiff;
    } catch {
      return false;
    }
  }

  /**
   * Detects if a new opportunity is a cross-platform duplicate of an existing one.
   * Returns matching existing opportunity if duplicate found, or null.
   */
  public static findDuplicate(
    candidate: Opportunity, 
    existingList: Opportunity[]
  ): Opportunity | null {
    for (const existing of existingList) {
      if (existing.id === candidate.id) continue;

      // Check registration URLs or source URLs match
      if (
        candidate.officialRegistrationUrl && 
        candidate.officialRegistrationUrl === existing.officialRegistrationUrl
      ) {
        return existing;
      }

      // Check title similarity
      const titleSim = this.stringSimilarity(candidate.title, existing.title);

      if (titleSim >= 0.75) {
        // If titles are very similar, check dates or organizer
        const datesMatch = this.datesAreClose(
          candidate.eventStartDate, 
          existing.eventStartDate, 
          4
        ) || this.datesAreClose(
          candidate.registrationDeadline, 
          existing.registrationDeadline, 
          4
        );

        const organizerSim = this.stringSimilarity(candidate.organizer, existing.organizer);

        if (titleSim >= 0.90 || datesMatch || organizerSim >= 0.7) {
          return existing;
        }
      }
    }

    return null;
  }
}
