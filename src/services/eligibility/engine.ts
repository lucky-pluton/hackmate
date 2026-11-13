import type { 
  UserProfile, 
  Opportunity, 
  OpportunityMatch, 
  RequirementEvaluation,
  EligibilityCategory 
} from '../../types';
import {
  evaluateAge,
  evaluateGeography,
  evaluateQualification,
  evaluateAcademicYear,
  evaluateStudentStatus,
  evaluateTeamParticipation,
  evaluateDeadline,
  evaluateFormatAndTravel,
} from './rules';

export class EligibilityEngine {
  /**
   * Deterministically evaluates an opportunity against the user's profile.
   */
  public static evaluate(profile: UserProfile, opp: Opportunity): OpportunityMatch {
    const mandatoryEvaluations: RequirementEvaluation[] = [
      evaluateGeography(profile, opp),
      evaluateQualification(profile, opp),
      evaluateStudentStatus(profile, opp),
      evaluateAcademicYear(profile, opp),
      evaluateAge(profile, opp),
      evaluateTeamParticipation(profile, opp),
      evaluateDeadline(opp),
      evaluateFormatAndTravel(profile, opp),
    ];

    const satisfiedRequirements = mandatoryEvaluations.filter(e => e.satisfied);
    const missingRequirements = mandatoryEvaluations.filter(e => !e.satisfied);
    const potentialBlockers = mandatoryEvaluations.filter(e => e.blocker === true);

    // Determine category
    let category: EligibilityCategory = 'ELIGIBLE';
    let actionRequiredNotice: string | undefined;

    if (potentialBlockers.length > 0) {
      category = 'NOT ELIGIBLE';
    } else if (missingRequirements.length > 0) {
      // Check if it's missing profile info vs needing user action
      const needsProfileInfo = missingRequirements.some(r => 
        r.userValue === 'Missing in profile' || r.userValue === 'Missing'
      );
      
      if (needsProfileInfo) {
        category = 'POTENTIALLY ELIGIBLE';
      } else {
        category = 'NEEDS ACTION';
      }
    } else {
      // Check if team formation is required
      if (opp.eligibility.participationType === 'Team' && (opp.eligibility.minTeamSize ?? 1) > 1) {
        if (profile.preferences.participationType === 'Individual' && profile.preferences.willingnessToFindTeammates) {
          category = 'NEEDS ACTION';
          actionRequiredNotice = `This is a team-based hackathon (${opp.eligibility.minTeamSize}-${opp.eligibility.maxTeamSize || 4} members). You must form or join a team before the deadline.`;
        }
      }
    }

    // Calculate preference and relevance score (0 - 100)
    const { score, reasons } = this.calculatePreferenceScore(profile, opp, category);

    return {
      opportunityId: opp.id,
      category,
      score,
      reasonsForMatching: reasons,
      satisfiedRequirements,
      missingRequirements,
      potentialBlockers,
      actionRequiredNotice,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculates preference score based on skills, themes, format, fee, and incentives.
   */
  private static calculatePreferenceScore(
    profile: UserProfile, 
    opp: Opportunity,
    category: EligibilityCategory
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let rawScore = 0;

    // 1. Technical Skills overlap (Weight: 35%)
    const userAllSkills = new Set([
      ...profile.skills.programmingLanguages,
      ...profile.skills.frameworks,
      ...profile.skills.aiMlSkills,
      ...profile.skills.dataScience,
      ...profile.skills.webDevelopment,
      ...profile.skills.appDevelopment,
      ...profile.skills.cloudDevOps,
      ...profile.skills.designAndPrototyping,
      ...profile.skills.otherSkills,
    ].map(s => s.toLowerCase()));

    const oppSkills = opp.requiredSkills || [];
    let skillMatches: string[] = [];
    if (oppSkills.length > 0) {
      skillMatches = oppSkills.filter(req => 
        userAllSkills.has(req.toLowerCase()) || 
        Array.from(userAllSkills).some(u => req.toLowerCase().includes(u) || u.includes(req.toLowerCase()))
      );

      const skillRatio = oppSkills.length > 0 ? (skillMatches.length / oppSkills.length) : 1;
      rawScore += Math.round(skillRatio * 35);
      if (skillMatches.length > 0) {
        reasons.push(`Direct match with your skills: ${skillMatches.slice(0, 3).join(', ')}`);
      }
    } else {
      // Beginner friendly or no fixed prerequisites
      rawScore += 25;
      reasons.push('Open skill requirements — suitable for your current technical stack');
    }

    // 2. Interests and Themes overlap (Weight: 30%)
    const userInterests = (profile.interests || []).map(i => i.toLowerCase());
    const oppThemes = [...(opp.themes || []), ...(opp.categories || [])].map(t => t.toLowerCase());

    const themeMatches = oppThemes.filter(theme =>
      userInterests.some(interest => 
        theme.includes(interest) || interest.includes(theme)
      )
    );

    if (themeMatches.length > 0) {
      const uniqueMatchedThemes = Array.from(new Set(themeMatches));
      rawScore += Math.min(30, uniqueMatchedThemes.length * 15);
      reasons.push(`Matches your interest in ${uniqueMatchedThemes.slice(0, 2).map(t => t.toUpperCase()).join(' & ')}`);
    } else {
      rawScore += 10;
    }

    // 3. Preferred format alignment (Weight: 15%)
    const preferredFormats = profile.preferences.preferredFormats || ['Online'];
    if (preferredFormats.includes(opp.format)) {
      rawScore += 15;
      reasons.push(`Matches your preferred ${opp.format} event format`);
    } else if (opp.format === 'Online') {
      rawScore += 10;
    }

    // 4. Registration fee & budget alignment (Weight: 10%)
    if (opp.registrationFee === 0) {
      rawScore += 10;
      reasons.push('Free registration with zero entry fee');
    } else if (opp.registrationFee <= profile.preferences.maxRegistrationFee) {
      rawScore += 8;
      reasons.push(`Within your budget limit ($${opp.registrationFee})`);
    }

    // 5. Career & Prize incentives (Weight: 10%)
    if (opp.internshipOpportunities || opp.placementOpportunities) {
      rawScore += 5;
      reasons.push('Offers internship/recruitment opportunities with sponsor companies');
    }
    if (opp.prizePool && opp.prizePool !== 'None' && opp.prizePool !== 'Free Participation') {
      rawScore += 5;
      reasons.push(`Recognized prize pool: ${opp.prizePool}`);
    }

    // Strict Rule: A high match score must NEVER override a failed mandatory eligibility requirement
    // If not eligible, cap the final score at a maximum of 25% to prevent misleading the user
    let finalScore = Math.min(100, Math.max(15, rawScore));
    if (category === 'NOT ELIGIBLE') {
      finalScore = Math.min(25, Math.round(rawScore * 0.3));
    }

    return {
      score: finalScore,
      reasons,
    };
  }
}
