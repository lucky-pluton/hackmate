// Deterministic Rule Checkers for Eligibility Evaluation
import type { 
  UserProfile, 
  Opportunity, 
  RequirementEvaluation 
} from '../../types';

export function evaluateAge(profile: UserProfile, opp: Opportunity): RequirementEvaluation {
  const { minAge, maxAge } = opp.eligibility;
  const userAge = profile.personal.age;

  if (minAge === undefined && maxAge === undefined) {
    return {
      id: 'age',
      criterion: 'Age Restriction',
      satisfied: true,
      isMandatory: true,
      userValue: userAge ? `${userAge} yrs` : 'Not specified',
      requiredValue: 'Open to all ages',
      explanation: 'No age restrictions specified for this opportunity.',
    };
  }

  if (userAge === undefined || userAge === null) {
    return {
      id: 'age',
      criterion: 'Age Restriction',
      satisfied: false,
      isMandatory: true,
      userValue: 'Missing in profile',
      requiredValue: `${minAge ?? 0} - ${maxAge ?? 'No limit'} yrs`,
      explanation: 'Please provide your age in your profile to verify eligibility.',
      blocker: false,
    };
  }

  const minOk = minAge === undefined || userAge >= minAge;
  const maxOk = maxAge === undefined || userAge <= maxAge;
  const satisfied = minOk && maxOk;

  return {
    id: 'age',
    criterion: 'Age Restriction',
    satisfied,
    isMandatory: true,
    userValue: `${userAge} yrs`,
    requiredValue: `${minAge ?? 0} - ${maxAge ?? 'No limit'} yrs`,
    explanation: satisfied 
      ? `Your age (${userAge}) satisfies the requirement (${minAge ?? 0}-${maxAge ?? 'No limit'}).`
      : `Your age (${userAge}) does not meet the allowed range (${minAge ?? 0}-${maxAge ?? 'No limit'}).`,
    blocker: !satisfied,
  };
}

export function evaluateGeography(profile: UserProfile, opp: Opportunity): RequirementEvaluation {
  const allowed = opp.eligibility.eligibleCountries || [];
  const userCountry = (profile.personal.country || '').trim().toLowerCase();

  // If empty or includes 'global' / 'worldwide' / 'all'
  const isGlobal = allowed.length === 0 || 
    allowed.some(c => ['global', 'worldwide', 'all', 'any'].includes(c.toLowerCase()));

  if (isGlobal) {
    return {
      id: 'geography',
      criterion: 'Country / Geographic Eligibility',
      satisfied: true,
      isMandatory: true,
      userValue: profile.personal.country || 'Global',
      requiredValue: 'Worldwide / Open to all countries',
      explanation: 'Participants from any country are welcome to apply.',
    };
  }

  const matches = allowed.some(c => c.toLowerCase() === userCountry);

  return {
    id: 'geography',
    criterion: 'Country / Geographic Eligibility',
    satisfied: matches,
    isMandatory: true,
    userValue: profile.personal.country,
    requiredValue: allowed.join(', '),
    explanation: matches
      ? `Your country (${profile.personal.country}) is eligible.`
      : `This opportunity is restricted to applicants from: ${allowed.join(', ')}.`,
    blocker: !matches,
  };
}

export function evaluateQualification(profile: UserProfile, opp: Opportunity): RequirementEvaluation {
  const allowedQuals = opp.eligibility.eligibleQualifications || [];
  const userQual = profile.personal.qualification;

  if (allowedQuals.length === 0) {
    return {
      id: 'qualification',
      criterion: 'Educational Qualification',
      satisfied: true,
      isMandatory: true,
      userValue: userQual,
      requiredValue: 'Open to all qualifications',
      explanation: 'No specific educational qualification is mandated.',
    };
  }

  const satisfied = allowedQuals.includes(userQual);

  return {
    id: 'qualification',
    criterion: 'Educational Qualification',
    satisfied,
    isMandatory: true,
    userValue: userQual,
    requiredValue: allowedQuals.join(', '),
    explanation: satisfied
      ? `Your qualification (${userQual}) matches the eligible criteria.`
      : `Open only to candidates with: ${allowedQuals.join(', ')}.`,
    blocker: !satisfied,
  };
}

export function evaluateAcademicYear(profile: UserProfile, opp: Opportunity): RequirementEvaluation {
  const allowedYears = opp.eligibility.eligibleAcademicYears || [];
  const userYear = profile.personal.currentYearOfStudy;

  if (allowedYears.length === 0) {
    return {
      id: 'academic_year',
      criterion: 'Academic Year of Study',
      satisfied: true,
      isMandatory: true,
      userValue: userYear ? `Year ${userYear}` : 'N/A',
      requiredValue: 'Any year of study',
      explanation: 'Students from any academic year may register.',
    };
  }

  if (profile.personal.status !== 'Student') {
    // Non-students might not have a year of study
    return {
      id: 'academic_year',
      criterion: 'Academic Year of Study',
      satisfied: false,
      isMandatory: true,
      userValue: profile.personal.status,
      requiredValue: `Students in Year: ${allowedYears.join(', ')}`,
      explanation: 'This competition is strictly for currently enrolled college students.',
      blocker: true,
    };
  }

  if (!userYear) {
    return {
      id: 'academic_year',
      criterion: 'Academic Year of Study',
      satisfied: false,
      isMandatory: true,
      userValue: 'Missing',
      requiredValue: `Year: ${allowedYears.join(', ')}`,
      explanation: 'Please set your current year of study to verify academic eligibility.',
      blocker: false,
    };
  }

  const satisfied = allowedYears.includes(userYear);

  return {
    id: 'academic_year',
    criterion: 'Academic Year of Study',
    satisfied,
    isMandatory: true,
    userValue: `Year ${userYear}`,
    requiredValue: `Years: ${allowedYears.join(', ')}`,
    explanation: satisfied
      ? `Your study year (Year ${userYear}) is eligible.`
      : `Restricted to students in years: ${allowedYears.join(', ')}.`,
    blocker: !satisfied,
  };
}

export function evaluateStudentStatus(profile: UserProfile, opp: Opportunity): RequirementEvaluation {
  const allowed = opp.eligibility.allowedStatuses || [];
  const userStatus = profile.personal.status;

  if (allowed.length === 0) {
    return {
      id: 'student_status',
      criterion: 'Student / Professional Status',
      satisfied: true,
      isMandatory: true,
      userValue: userStatus,
      requiredValue: 'Students & Professionals',
      explanation: 'Open to both students and professionals.',
    };
  }

  const satisfied = allowed.includes(userStatus);

  return {
    id: 'student_status',
    criterion: 'Student / Professional Status',
    satisfied,
    isMandatory: true,
    userValue: userStatus,
    requiredValue: allowed.join(', '),
    explanation: satisfied
      ? `Your status (${userStatus}) is permitted.`
      : `Restricted to applicants with status: ${allowed.join(', ')}.`,
    blocker: !satisfied,
  };
}

export function evaluateTeamParticipation(profile: UserProfile, opp: Opportunity): RequirementEvaluation {
  const oppType = opp.eligibility.participationType; // 'Individual' | 'Team' | 'Both'
  const userPref = profile.preferences.participationType;
  const userWillingToFind = profile.preferences.willingnessToFindTeammates;
  const minTeam = opp.eligibility.minTeamSize ?? 1;

  // If hackathon allows individual
  if (oppType === 'Individual' || oppType === 'Both') {
    return {
      id: 'participation_type',
      criterion: 'Team & Participation Model',
      satisfied: true,
      isMandatory: true,
      userValue: `${userPref} (${userWillingToFind ? 'Willing to team' : 'Solo only'})`,
      requiredValue: `${oppType} (Min ${minTeam} member)`,
      explanation: 'Individual participation is permitted or optional.',
    };
  }

  // oppType is 'Team' only (minTeam >= 2)
  if (userPref === 'Individual' && !userWillingToFind) {
    return {
      id: 'participation_type',
      criterion: 'Team & Participation Model',
      satisfied: false,
      isMandatory: true,
      userValue: 'Solo participation only (Unwilling to find teammates)',
      requiredValue: `Team only (Min ${minTeam} members required)`,
      explanation: `Requires a minimum team of ${minTeam}. Your preference is set to individual-only without team matching.`,
      blocker: true,
    };
  }

  // User prefers team or is willing to find teammates
  return {
    id: 'participation_type',
    criterion: 'Team & Participation Model',
    satisfied: true,
    isMandatory: true,
    userValue: userPref === 'Team' ? 'Team preferred' : 'Willing to form team',
    requiredValue: `Team of ${minTeam}-${opp.eligibility.maxTeamSize ?? 4}`,
    explanation: `Requires a team of ${minTeam}-${opp.eligibility.maxTeamSize ?? 4}. You are willing to form or join a team.`,
    blocker: false,
  };
}

export function evaluateDeadline(opp: Opportunity): RequirementEvaluation {
  const deadlineMs = new Date(opp.registrationDeadline).getTime();
  const isPast = deadlineMs < Date.now();

  return {
    id: 'deadline',
    criterion: 'Registration Deadline',
    satisfied: !isPast,
    isMandatory: true,
    userValue: isPast ? 'Registration expired' : 'Registration active',
    requiredValue: new Date(opp.registrationDeadline).toLocaleDateString(),
    explanation: isPast
      ? `Registration closed on ${new Date(opp.registrationDeadline).toLocaleDateString()}.`
      : `Registration is open until ${new Date(opp.registrationDeadline).toLocaleDateString()}.`,
    blocker: isPast,
  };
}

export function evaluateFormatAndTravel(profile: UserProfile, opp: Opportunity): RequirementEvaluation {
  const format = opp.format;
  const preferredFormats = profile.preferences.preferredFormats || ['Online'];
  const userCountry = (profile.personal.country || '').trim().toLowerCase();
  const oppCountry = (opp.country || '').trim().toLowerCase();

  if (format === 'Online') {
    return {
      id: 'format_attendance',
      criterion: 'Event Format & Attendance',
      satisfied: true,
      isMandatory: true,
      userValue: preferredFormats.join(', '),
      requiredValue: 'Online / Virtual',
      explanation: 'Event takes place fully online.',
    };
  }

  // Offline or Hybrid
  const matchesCountry = oppCountry === 'global' || oppCountry === userCountry;
  const willingToTravel = profile.preferences.willingnessToTravel;

  if (matchesCountry || willingToTravel) {
    return {
      id: 'format_attendance',
      criterion: 'Event Format & Attendance',
      satisfied: true,
      isMandatory: true,
      userValue: `${profile.personal.country} (${willingToTravel ? 'Willing to travel' : 'Local only'})`,
      requiredValue: `${format} in ${opp.venue ? `${opp.venue}, ` : ''}${opp.country}`,
      explanation: matchesCountry 
        ? `In-person event is located in your country (${opp.country}).`
        : `In-person event requires travel to ${opp.country}, which matches your travel preference.`,
    };
  }

  return {
    id: 'format_attendance',
    criterion: 'Event Format & Attendance',
    satisfied: false,
    isMandatory: true,
    userValue: `${profile.personal.country} (Not willing to travel)`,
    requiredValue: `${format} in ${opp.country}`,
    explanation: `Event is held in-person in ${opp.country}, but your profile indicates no international/distant travel.`,
    blocker: true,
  };
}

