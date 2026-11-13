import type { Opportunity } from '../../types';
import { isValidUrl } from '../../lib/utils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresAdminReview: boolean;
  confidenceScore: number; // 0 - 100
}

export class Validator {
  public static validate(opp: Opportunity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidenceScore = 100;

    // 1. Mandatory Text Fields
    if (!opp.title || opp.title.trim().length < 3) {
      errors.push('Title is missing or too short.');
    }
    if (!opp.organizer || opp.organizer.trim().length < 2) {
      warnings.push('Organizer name is ambiguous.');
      confidenceScore -= 10;
    }
    if (!opp.description || opp.description.trim().length < 20) {
      warnings.push('Description is very short or incomplete.');
      confidenceScore -= 15;
    }

    // 2. URL Validations
    if (!opp.officialRegistrationUrl || !isValidUrl(opp.officialRegistrationUrl)) {
      errors.push('Official registration URL is invalid or malformed.');
    }
    if (opp.originalSourceUrl && !isValidUrl(opp.originalSourceUrl)) {
      warnings.push('Original source URL is malformed.');
      confidenceScore -= 5;
    }

    // 3. Date Chronology Validations
    const regStart = new Date(opp.registrationStartDate).getTime();
    const regEnd = new Date(opp.registrationDeadline).getTime();
    const evtStart = new Date(opp.eventStartDate).getTime();
    const evtEnd = new Date(opp.eventEndDate).getTime();

    if (isNaN(regStart) || isNaN(regEnd)) {
      errors.push('Registration dates are unparseable.');
    } else if (regEnd < regStart) {
      errors.push('Registration deadline cannot be before registration start date.');
    }

    if (isNaN(evtStart) || isNaN(evtEnd)) {
      warnings.push('Event start or end date is missing or unparseable.');
      confidenceScore -= 15;
    } else if (evtEnd < evtStart) {
      errors.push('Event end date cannot be before event start date.');
    }

    // 4. Age Eligibility Validations
    if (opp.eligibility.minAge !== undefined && opp.eligibility.maxAge !== undefined) {
      if (opp.eligibility.minAge > opp.eligibility.maxAge) {
        errors.push(`Minimum age (${opp.eligibility.minAge}) cannot exceed maximum age (${opp.eligibility.maxAge}).`);
      }
    }

    // 5. Team Size Validations
    if (opp.eligibility.minTeamSize !== undefined && opp.eligibility.maxTeamSize !== undefined) {
      if (opp.eligibility.minTeamSize > opp.eligibility.maxTeamSize) {
        errors.push(`Minimum team size (${opp.eligibility.minTeamSize}) cannot exceed maximum team size (${opp.eligibility.maxTeamSize}).`);
      }
    }

    // 6. Registration Fee
    if (opp.registrationFee < 0) {
      errors.push('Registration fee cannot be negative.');
    }

    const isValid = errors.length === 0;
    const requiresAdminReview = !isValid || confidenceScore < 75 || warnings.length > 2;

    return {
      isValid,
      errors,
      warnings,
      requiresAdminReview,
      confidenceScore: Math.max(0, confidenceScore),
    };
  }
}

