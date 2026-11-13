import { GoogleGenAI } from '@google/genai';
import type { UserProfile, Opportunity, OpportunityMatch } from '../types';
import { EligibilityEngine } from '../services/eligibility/engine';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const hasApiKey = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here');

let genAiClient: GoogleGenAI | null = null;
if (hasApiKey) {
  try {
    genAiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client with provided key:', err);
  }
}

export class GeminiService {
  public static isConfigured(): boolean {
    return hasApiKey && genAiClient !== null;
  }

  /**
   * Conversational Assistant: Answers user queries strictly grounded in their
   * actual profile and the opportunities currently in the system.
   */
  public static async answerUserQuery(
    query: string,
    profile: UserProfile | null,
    opportunities: Opportunity[],
    matches: Map<string, OpportunityMatch>
  ): Promise<{ text: string; relatedOpportunityIds: string[] }> {
    // 1. If real Gemini API key is configured, call Gemini with strict grounding prompt
    if (this.isConfigured() && genAiClient) {
      try {
        const compactCatalog = opportunities.map(o => {
          const match = matches.get(o.id);
          return {
            id: o.id,
            title: o.title,
            organizer: o.organizer,
            sourcePlatform: o.sourcePlatform,
            deadline: o.registrationDeadline,
            format: o.format,
            country: o.country,
            fee: o.registrationFee,
            themes: o.themes,
            requiredSkills: o.requiredSkills,
            eligibility: o.eligibility,
            matchCategory: match?.category || 'UNKNOWN',
            matchScore: match?.score || 0,
            satisfied: match?.satisfiedRequirements?.map(s => s.criterion) || [],
            blockers: match?.potentialBlockers?.map(b => b.explanation) || [],
            officialUrl: o.officialRegistrationUrl,
          };
        });

        const systemInstruction = `You are HackMate's personal AI assistant. 
CRITICAL RULES:
1. Always base your responses strictly on the provided user profile and the opportunity catalog.
2. NEVER fabricate hackathons, dates, prize pools, or eligibility requirements.
3. If no matching opportunities exist for a query, politely and clearly state that no matching hackathons are currently in the database.
4. When recommending hackathons, include their exact IDs in a comma-separated list at the very end formatted as: "OPP_IDS: id1, id2".
5. Keep explanations direct, concise, and helpful.`;

        const userContext = profile ? JSON.stringify({
          name: profile.personal.fullName,
          qualification: profile.personal.qualification,
          country: profile.personal.country,
          status: profile.personal.status,
          year: profile.personal.currentYearOfStudy,
          skills: profile.skills,
          interests: profile.interests,
          preferences: profile.preferences,
        }) : 'Guest user (not logged in)';

        const prompt = `User Context:
${userContext}

Current Opportunities in Database:
${JSON.stringify(compactCatalog)}

User Query: "${query}"

Provide a natural, helpful response grounded only in the real opportunities above. If you mention any hackathons, specify why they fit (or do not fit) their profile.`;

        const response = await genAiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          }
        });

        const outputText = response.text || '';
        
        // Extract OPP_IDS if present
        const idMatch = outputText.match(/OPP_IDS:\s*([a-zA-Z0-9_\-,\s]+)/);
        let relatedIds: string[] = [];
        let cleanedText = outputText;

        if (idMatch && idMatch[1]) {
          relatedIds = idMatch[1]
            .split(',')
            .map(s => s.trim())
            .filter(id => opportunities.some(o => o.id === id));
          cleanedText = outputText.replace(/OPP_IDS:\s*[a-zA-Z0-9_\-,\s]+/, '').trim();
        }

        // Also detect mentioned IDs in text
        opportunities.forEach(o => {
          if ((cleanedText.includes(o.title) || cleanedText.includes(o.id)) && !relatedIds.includes(o.id)) {
            relatedIds.push(o.id);
          }
        });

        return {
          text: cleanedText,
          relatedOpportunityIds: relatedIds,
        };
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local deterministic intelligence engine:', err);
      }
    }

    // 2. Resilient Deterministic Engine (Zero hallucination fallback)
    return this.deterministicAssistant(query, profile, opportunities, matches);
  }

  /**
   * Deterministic query parser and answerer for zero-latency, reliable execution.
   */
  private static deterministicAssistant(
    query: string,
    profile: UserProfile | null,
    opportunities: Opportunity[],
    matches: Map<string, OpportunityMatch>
  ): { text: string; relatedOpportunityIds: string[] } {
    const q = query.toLowerCase();

    // Query: "Why am I not eligible for..."
    if (q.includes('why am i not eligible') || q.includes('ineligible') || q.includes('why not eligible')) {
      const targetOpp = opportunities.find(o => 
        q.includes(o.title.toLowerCase()) || 
        q.includes(o.id.toLowerCase()) ||
        q.includes(o.organizer.toLowerCase())
      );

      if (targetOpp && profile) {
        const match = matches.get(targetOpp.id) || EligibilityEngine.evaluate(profile, targetOpp);
        if (match.category === 'ELIGIBLE') {
          return {
            text: `Good news! According to your profile, you are actually **ELIGIBLE** for **${targetOpp.title}**. All mandatory criteria (country: ${targetOpp.country}, status: ${targetOpp.eligibility.allowedStatuses?.join(', ') || 'Any'}, qualification: ${targetOpp.eligibility.eligibleQualifications?.join(', ') || 'Any'}) are satisfied!`,
            relatedOpportunityIds: [targetOpp.id],
          };
        }

        const blockers = match.potentialBlockers.map(b => `• **${b.criterion}**: ${b.explanation}`).join('\n');
        const missing = match.missingRequirements.map(m => `• **${m.criterion}**: ${m.explanation}`).join('\n');

        return {
          text: `Here is the exact eligibility breakdown for **${targetOpp.title}**:\n\n**Status:** ${match.category}\n\n**Blockers:**\n${blockers || 'None directly blocking'}\n\n${missing ? `**Requirements needing attention:**\n${missing}` : ''}\n\n${match.actionRequiredNotice ? `**Action Needed:** ${match.actionRequiredNotice}` : ''}`,
          relatedOpportunityIds: [targetOpp.id],
        };
      }

      // If no specific opp mentioned, list all ineligible ones with reasons
      const ineligible = opportunities
        .map(o => ({ opp: o, match: matches.get(o.id) }))
        .filter(item => item.match?.category === 'NOT ELIGIBLE');

      if (ineligible.length === 0) {
        return {
          text: `You are currently eligible or potentially eligible for all ${opportunities.length} opportunities in the catalog!`,
          relatedOpportunityIds: [],
        };
      }

      const summary = ineligible.slice(0, 3).map(i => {
        const primaryBlocker = i.match?.potentialBlockers[0]?.explanation || 'Mandatory criteria not met';
        return `• **${i.opp.title}**: ${primaryBlocker}`;
      }).join('\n');

      return {
        text: `Here are the opportunities where your profile currently doesn't satisfy mandatory criteria:\n\n${summary}`,
        relatedOpportunityIds: ineligible.slice(0, 3).map(i => i.opp.id),
      };
    }

    // Query: "closing within seven days" / "deadline" / "closing soon"
    if (q.includes('seven days') || q.includes('7 days') || q.includes('closing soon') || q.includes('deadline')) {
      const now = Date.now();
      const closingSoon = opportunities.filter(o => {
        const d = new Date(o.registrationDeadline).getTime();
        const diffDays = (d - now) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 7;
      });

      if (closingSoon.length === 0) {
        return {
          text: `There are currently no matching hackathons closing within the next 7 days in the database. All active listings have longer registration windows.`,
          relatedOpportunityIds: [],
        };
      }

      const list = closingSoon.map(o => {
        const daysLeft = Math.ceil((new Date(o.registrationDeadline).getTime() - now) / (1000 * 60 * 60 * 24));
        return `• **${o.title}** (${o.sourcePlatform}) — Closes in **${daysLeft} day${daysLeft > 1 ? 's' : ''}** (${new Date(o.registrationDeadline).toLocaleDateString()})`;
      }).join('\n');

      return {
        text: `Found **${closingSoon.length}** opportunity closing within 7 days:\n\n${list}\n\nMake sure to review requirements and register on the official platform before the deadline!`,
        relatedOpportunityIds: closingSoon.map(o => o.id),
      };
    }

    // Query: "online ai hackathons"
    if (q.includes('online') && (q.includes('ai') || q.includes('machine learning') || q.includes('llm'))) {
      const onlineAi = opportunities.filter(o => 
        o.format === 'Online' && 
        (o.themes.some(t => t.toLowerCase().includes('ai') || t.toLowerCase().includes('machine learning') || t.toLowerCase().includes('genai')) ||
         o.requiredSkills.some(s => s.toLowerCase().includes('python') || s.toLowerCase().includes('gemini') || s.toLowerCase().includes('ai')))
      );

      const items = onlineAi.slice(0, 4);
      const list = items.map(o => 
        `• **${o.title}** by ${o.organizer} (${o.sourcePlatform}) — Format: **Online** | Prize: **${o.prizePool}**`
      ).join('\n');

      return {
        text: `Here are **${items.length}** online AI/ML hackathons you can participate in from anywhere:\n\n${list}`,
        relatedOpportunityIds: items.map(o => o.id),
      };
    }

    // Query: "undergraduate students in india"
    if (q.includes('undergraduate') || q.includes('college') || q.includes('india')) {
      const forUgIndia = opportunities.filter(o => {
        const forIndia = o.country === 'India' || o.eligibility.eligibleCountries?.includes('India') || o.country === 'Global';
        const forUg = o.eligibility.eligibleQualifications?.includes('Undergraduate') || !o.eligibility.eligibleQualifications?.length;
        return forIndia && forUg;
      });

      const items = forUgIndia.slice(0, 4);
      const list = items.map(o => 
        `• **${o.title}** (${o.sourcePlatform}) — ${o.format} (${o.country}) | Eligibility: ${o.eligibility.eligibleQualifications?.join(', ') || 'All students'}`
      ).join('\n');

      return {
        text: `Found **${forUgIndia.length}** opportunities open to undergraduate students in India:\n\n${list}`,
        relatedOpportunityIds: items.map(o => o.id),
      };
    }

    // Query: "free hackathons with internship"
    if (q.includes('internship') || q.includes('placement') || q.includes('career') || q.includes('hiring')) {
      const withInternships = opportunities.filter(o => 
        (o.internshipOpportunities || o.placementOpportunities) && o.registrationFee === 0
      );

      const list = withInternships.slice(0, 4).map(o => 
        `• **${o.title}** by ${o.organizer} (${o.sourcePlatform}) — Free Entry | PPI / Internships: **Yes** | Prize: ${o.prizePool}`
      ).join('\n');

      return {
        text: `Here are free hackathons that offer direct internship/placement interviews or hiring fast-tracks:\n\n${list}`,
        relatedOpportunityIds: withInternships.map(o => o.id),
      };
    }

    // Query: "individual" or "solo"
    if (q.includes('individual') || q.includes('solo') || q.includes('single')) {
      const solo = opportunities.filter(o => 
        o.eligibility.participationType === 'Individual' || o.eligibility.participationType === 'Both'
      );

      const list = solo.slice(0, 4).map(o => 
        `• **${o.title}** (${o.sourcePlatform}) — Participation: **${o.eligibility.participationType}** (Min team size: 1)`
      ).join('\n');

      return {
        text: `Here are hackathons that allow individual (solo) participation without requiring a team:\n\n${list}`,
        relatedOpportunityIds: solo.slice(0, 4).map(o => o.id),
      };
    }

    // Query: "beginner" or "no experience"
    if (q.includes('beginner') || q.includes('no experience') || q.includes('prior experience')) {
      const beginner = opportunities.filter(o => 
        o.themes.some(t => t.toLowerCase().includes('beginner')) ||
        !o.experienceRequirements ||
        o.experienceRequirements.toLowerCase().includes('open') ||
        o.experienceRequirements.toLowerCase().includes('beginner')
      );

      const list = beginner.slice(0, 3).map(o => 
        `• **${o.title}** (${o.sourcePlatform}) — ${o.description.slice(0, 110)}...`
      ).join('\n');

      return {
        text: `Here are opportunities welcoming developers and students without prior hackathon experience:\n\n${list}`,
        relatedOpportunityIds: beginner.map(o => o.id),
      };
    }

    // General query: Return top recommended based on user profile match
    if (profile) {
      const sorted = [...opportunities].sort((a, b) => {
        const scoreA = matches.get(a.id)?.score || 0;
        const scoreB = matches.get(b.id)?.score || 0;
        return scoreB - scoreA;
      });

      const top = sorted.slice(0, 3);
      const list = top.map(o => {
        const m = matches.get(o.id);
        return `• **${o.title}** — **${m?.score || 85}% Match** (${m?.category || 'ELIGIBLE'}) | ${m?.reasonsForMatching?.[0] || 'Matches your profile'}`;
      }).join('\n');

      return {
        text: `Based on your profile (${profile.personal.qualification}, ${profile.personal.country}, interested in ${profile.interests.slice(0, 3).join(', ')}), here are your top matching opportunities:\n\n${list}\n\nAsk me anytime about specific criteria, deadlines, or eligibility questions!`,
        relatedOpportunityIds: top.map(o => o.id),
      };
    }

    return {
      text: `Welcome to HackMate! I can help you discover hackathons, check detailed eligibility criteria, find internships, or filter by dates and technologies. Try asking:\n• "Show online AI hackathons I can join"\n• "Find competitions closing within seven days"\n• "Free hackathons with internship opportunities"`,
      relatedOpportunityIds: opportunities.slice(0, 3).map(o => o.id),
    };
  }

  /**
   * Conversational Onboarding: Extracts structured user information from freeform text.
   */
  public static async parseOnboardingInput(
    stepKey: 'personal' | 'skills' | 'experience' | 'preferences' | 'interests',
    userInput: string
  ): Promise<Record<string, any>> {
    // If Gemini is available, call it for high-fidelity extraction
    if (this.isConfigured() && genAiClient) {
      try {
        const prompt = `Extract structured profile information from this user response for the '${stepKey}' step.
Return a clean JSON object ONLY (no markdown backticks, no markdown codeblock).

User response: "${userInput}"`;

        const res = await genAiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        if (res.text) {
          return JSON.parse(res.text);
        }
      } catch (err) {
        console.warn('Gemini structured extraction failed, using heuristic extraction:', err);
      }
    }

    // Heuristic structured extraction fallback
    return this.heuristicExtraction(stepKey, userInput);
  }

  private static heuristicExtraction(
    stepKey: string,
    input: string
  ): Record<string, any> {
    const text = input.trim();
    const result: Record<string, any> = {};

    if (stepKey === 'personal') {
      // Look for name
      const nameMatch = text.match(/(?:my name is|i am|i'm|name:\s*)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i);
      if (nameMatch) result.fullName = nameMatch[1];

      // Age
      const ageMatch = text.match(/\b(1[6-9]|[2-5][0-9])\b/);
      if (ageMatch) result.age = parseInt(ageMatch[1], 10);

      // Country
      if (/india/i.test(text)) result.country = 'India';
      else if (/united states|usa|us\b/i.test(text)) result.country = 'United States';
      else if (/canada/i.test(text)) result.country = 'Canada';
      else if (/uk|united kingdom/i.test(text)) result.country = 'United Kingdom';
      else if (/germany/i.test(text)) result.country = 'Germany';
      else result.country = 'India'; // sensible default

      // Qualification
      if (/b\.?tech|b\.?e|undergrad|bachelor|bca|bsc/i.test(text)) {
        result.qualification = 'Undergraduate';
        result.status = 'Student';
      } else if (/master|m\.?tech|mca|postgrad|ms/i.test(text)) {
        result.qualification = 'Postgraduate';
        result.status = 'Student';
      } else if (/high school|12th|11th|k12/i.test(text)) {
        result.qualification = 'High School';
        result.status = 'Student';
      } else if (/working|developer|engineer|job|professional/i.test(text)) {
        result.qualification = 'Working Professional';
        result.status = 'Working Professional';
      } else {
        result.qualification = 'Undergraduate';
        result.status = 'Student';
      }

      // Year of study
      const yearMatch = text.match(/\b([1-5])(?:st|nd|rd|th)?\s*(?:year|yr)\b/i);
      if (yearMatch) result.currentYearOfStudy = parseInt(yearMatch[1], 10);
    } else if (stepKey === 'skills') {
      const skillsList: string[] = [];
      const common = [
        'Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'Rust', 'Go', 
        'React', 'Node.js', 'Next.js', 'Tailwind', 'Vue', 'FastAPI', 'Django',
        'Docker', 'AWS', 'Kubernetes', 'PostgreSQL', 'MongoDB',
        'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'LLMs', 'Gemini API',
        'Figma', 'UI/UX'
      ];

      common.forEach(s => {
        if (new RegExp(`\\b${s}\\b`, 'i').test(text)) {
          skillsList.push(s);
        }
      });

      result.extractedSkills = skillsList.length > 0 ? skillsList : text.split(',').map(s => s.trim());
    } else if (stepKey === 'preferences') {
      if (/solo|individual|alone|myself/i.test(text)) {
        result.participationType = 'Individual';
      } else if (/team/i.test(text)) {
        result.participationType = 'Team';
      } else {
        result.participationType = 'Both';
      }

      result.willingnessToFindTeammates = !/no team|don't want team|strictly solo/i.test(text);

      const formats: string[] = [];
      if (/online|virtual|remote/i.test(text)) formats.push('Online');
      if (/offline|in-person|physical/i.test(text)) formats.push('Offline');
      if (/hybrid/i.test(text)) formats.push('Hybrid');
      result.preferredFormats = formats.length > 0 ? formats : ['Online', 'Hybrid'];
    }

    return result;
  }
}
