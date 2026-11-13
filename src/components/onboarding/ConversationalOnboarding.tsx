import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { GeminiService } from '../../lib/gemini';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { Button } from '../common/Button';
import confetti from 'canvas-confetti';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  ArrowRight, 
  SkipForward, 
  CheckCircle2, 
  Edit3 
} from 'lucide-react';

interface StepDefinition {
  key: 'personal' | 'skills' | 'experience' | 'preferences' | 'interests';
  title: string;
  assistantPrompt: string;
  quickSuggestions: string[];
}

const ONBOARDING_STEPS: StepDefinition[] = [
  {
    key: 'personal',
    title: 'Background & Education',
    assistantPrompt: "Hi there! I'm your HackMate AI guide. To uncover hackathons you are 100% eligible for, let's start with your background.\n\nWhat is your full name, current educational qualification (Undergraduate, Postgraduate, etc.), college or university, year of study, and your country?",
    quickSuggestions: [
      "I'm Alex Chen, 3rd year B.Tech CS undergrad at IIIT, India (age 20)",
      "Priya Sharma, 2nd year B.Tech student in India",
      "I'm a working software engineer based in the US",
      "High school student in Grade 11, interested in coding"
    ],
  },
  {
    key: 'skills',
    title: 'Technical Skills & Languages',
    assistantPrompt: "Awesome! What programming languages, frameworks, or tools do you work with or want to build with? (e.g. Python, React, PyTorch, C++, Flutter, Docker, etc.)",
    quickSuggestions: [
      "Python, TypeScript, React, Next.js, and Tailwind CSS",
      "Python, PyTorch, Machine Learning, and Fast API",
      "C++, Java, SQL, and System Design",
      "JavaScript, HTML/CSS, beginner in Python"
    ],
  },
  {
    key: 'experience',
    title: 'Experience & Projects',
    assistantPrompt: "Tell me a bit about your experience. Have you participated in any hackathons before? Any favorite projects, internships, or GitHub links you'd like to share?",
    quickSuggestions: [
      "Participated in 2 hackathons before, built fullstack web apps",
      "First time hackathon participant, looking for beginner friendly events",
      "Worked on machine learning research projects and web3 dApps",
      "Skip this step for now"
    ],
  },
  {
    key: 'preferences',
    title: 'Participation Preferences',
    assistantPrompt: "How do you prefer to compete? Do you like solo participation or teams? Are you looking for Online, In-Person (Offline), or Hybrid events? Are you open to traveling?",
    quickSuggestions: [
      "Both solo or team (happy to find teammates). Prefer Online & Hybrid.",
      "Strictly Online hackathons, individual participation.",
      "In-person hackathons in India, willing to travel.",
      "Team participation only, free registration events."
    ],
  },
  {
    key: 'interests',
    title: 'Interests & Themes',
    assistantPrompt: "Finally, what themes or domains excite you the most? (e.g. Artificial Intelligence, FinTech, Healthcare, Web3, Social Impact, Robotics, Sustainability, Open Innovation)",
    quickSuggestions: [
      "Artificial Intelligence, GenAI, and Social Impact",
      "FinTech, Cybersecurity, and Cloud Computing",
      "Web3, Blockchain, and Decentralized AI",
      "HealthTech, CleanTech, and Sustainability"
    ],
  },
];

export const ConversationalOnboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, updateProfile } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [draftProfile, setDraftProfile] = useState<Partial<UserProfile>>(() => user || {});
  const [isConfirmedView, setIsConfirmedView] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initial welcome message
    const firstStep = ONBOARDING_STEPS[0];
    setMessages([
      {
        id: 'msg-0',
        sender: 'assistant',
        content: firstStep.assistantPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: firstStep.quickSuggestions,
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isProcessing) return;

    setInputVal('');

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const currentStep = ONBOARDING_STEPS[currentStepIndex];

    try {
      // Structured AI extraction
      const extracted = await GeminiService.parseOnboardingInput(currentStep.key, text);

      // Merge into draft profile
      const updatedDraft = { ...draftProfile };

      if (currentStep.key === 'personal') {
        updatedDraft.personal = {
          ...updatedDraft.personal,
          fullName: extracted.fullName || updatedDraft.personal?.fullName || 'Alex Chen',
          age: extracted.age || updatedDraft.personal?.age || 20,
          country: extracted.country || updatedDraft.personal?.country || 'India',
          qualification: extracted.qualification || updatedDraft.personal?.qualification || 'Undergraduate',
          currentYearOfStudy: extracted.currentYearOfStudy || updatedDraft.personal?.currentYearOfStudy || 3,
          status: extracted.status || updatedDraft.personal?.status || 'Student',
        };
      } else if (currentStep.key === 'skills') {
        const skillsList = extracted.extractedSkills || text.split(',').map((s: string) => s.trim());
        updatedDraft.skills = {
          ...updatedDraft.skills,
          programmingLanguages: skillsList.filter((s: string) => ['Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'Rust', 'Go'].some(l => s.toLowerCase().includes(l.toLowerCase()))),
          webDevelopment: skillsList.filter((s: string) => ['React', 'Next.js', 'Node.js', 'Tailwind', 'HTML', 'CSS'].some(l => s.toLowerCase().includes(l.toLowerCase()))),
          aiMlSkills: skillsList.filter((s: string) => ['Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'LLMs', 'Gemini'].some(l => s.toLowerCase().includes(l.toLowerCase()))),
          cloudDevOps: skillsList.filter((s: string) => ['Docker', 'AWS', 'Kubernetes', 'Git'].some(l => s.toLowerCase().includes(l.toLowerCase()))),
          frameworks: skillsList,
          dataScience: [],
          appDevelopment: [],
          designAndPrototyping: [],
          otherSkills: skillsList,
        };
      } else if (currentStep.key === 'experience') {
        updatedDraft.experience = {
          ...updatedDraft.experience,
          projectsSummary: text,
          previousHackathonsCount: text.toLowerCase().includes('first') ? 0 : 2,
        };
      } else if (currentStep.key === 'preferences') {
        updatedDraft.preferences = {
          ...updatedDraft.preferences,
          participationType: extracted.participationType || 'Both',
          willingnessToFindTeammates: extracted.willingnessToFindTeammates ?? true,
          preferredFormats: extracted.preferredFormats || ['Online', 'Hybrid'],
          willingnessToTravel: !text.toLowerCase().includes('no travel'),
          maxRegistrationFee: 0,
          receiveDeadlineAlerts: true,
          receiveNewMatchAlerts: true,
          preferredLocations: ['India', 'Global'],
        };
      } else if (currentStep.key === 'interests') {
        const interestItems = text.split(/,|and/i).map(s => s.trim()).filter(Boolean);
        updatedDraft.interests = interestItems.length > 0 ? interestItems : ['Artificial Intelligence', 'FinTech', 'Social Impact'];
      }

      setDraftProfile(updatedDraft);

      // Determine next step or show confirmation
      if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
        const nextIdx = currentStepIndex + 1;
        setCurrentStepIndex(nextIdx);
        const nextStep = ONBOARDING_STEPS[nextIdx];

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              sender: 'assistant',
              content: `Got it! Noted down your ${currentStep.title.toLowerCase()}.\n\n${nextStep.assistantPrompt}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestions: nextStep.quickSuggestions,
            }
          ]);
          setIsProcessing(false);
        }, 600);
      } else {
        // All steps completed -> present confirmation view
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              sender: 'assistant',
              content: `Thank you! I have compiled your complete hacker profile. Please review the summary below and confirm to unlock your personalized discovery feed.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          setIsConfirmedView(true);
          setIsProcessing(false);
        }, 700);
      }
    } catch {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = ONBOARDING_STEPS[nextIdx];

      setMessages(prev => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: `No problem, we can fill that in later! Next up:\n\n${nextStep.assistantPrompt}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: nextStep.quickSuggestions,
        }
      ]);
    } else {
      setIsConfirmedView(true);
    }
  };

  const handleConfirmSave = () => {
    // Save to user profile and mark onboarded
    updateProfile({
      ...draftProfile,
      isOnboarded: true,
    });

    // Celebrate with confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Conversational AI Onboarding
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Let’s personalize your hackathon feed
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          HackMate finds opportunities tailored to your qualifications, skills, and constraints — so you never have to parse dense eligibility rules manually.
        </p>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {ONBOARDING_STEPS.map((step, idx) => (
            <div
              key={step.key}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-8 bg-indigo-600'
                  : idx < currentStepIndex
                  ? 'w-4 bg-emerald-500'
                  : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
              title={step.title}
            />
          ))}
        </div>
      </div>

      {!isConfirmedView ? (
        /* Chat Interface */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card overflow-hidden flex flex-col h-[600px]">
          {/* Chat Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isAssistant
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        isAssistant
                          ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Quick suggestion chips */}
                    {isAssistant && m.suggestions && m.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(suggestion)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 block px-1">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Bot className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>Processing your response & extracting qualifications...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type your answer naturally or click a suggestion above..."
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputVal.trim() || isProcessing}
                icon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleSkip}
                className="text-xs text-slate-500"
              >
                Skip
              </Button>
            </form>
          </div>
        </div>
      ) : (
        /* Confirmation Summary Card */
        <div className="space-y-6">
          <ProfileSummaryCard
            profile={draftProfile}
            onEditSection={(sectionKey) => {
              const idx = ONBOARDING_STEPS.findIndex(s => s.key === sectionKey);
              if (idx !== -1) {
                setCurrentStepIndex(idx);
                setIsConfirmedView(false);
              }
            }}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
            <div className="text-sm text-indigo-950 dark:text-indigo-200">
              <span className="font-semibold">Ready to launch!</span> Everything looks great. We will now match you against verified opportunities across all 10 source adapters.
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmedView(false)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Answers
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmSave}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Confirm & Explore Feed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
