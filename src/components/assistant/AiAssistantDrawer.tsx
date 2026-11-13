import React, { useState, useRef, useEffect } from 'react';
import type { Opportunity, ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../context/OpportunitiesContext';
import { GeminiService } from '../../lib/gemini';
import { Button } from '../common/Button';
import { FormatBadge } from '../common/Badge';
import { formatDate } from '../../lib/utils';
import { 
  Bot, 
  User, 
  Send, 
  X, 
  Sparkles, 
  ArrowUpRight, 
  HelpCircle, 
  Clock, 
  Trophy 
} from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onSelectOpportunity,
}) => {
  const { user } = useAuth();
  const { opportunities, matches } = useOpportunities();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `Hello ${user?.personal.fullName?.split(' ')[0] || 'there'}! I am your personal HackMate assistant. I know your profile (${user?.personal.qualification || 'Student'} from ${user?.personal.country || 'India'}) and have access to our entire verified hackathon database.\n\nAsk me anything! For example:`,
      timestamp: 'Just now',
      suggestions: [
        'Find online AI hackathons I can participate in',
        'Show hackathons open to undergraduate students in India',
        'Find competitions closing within seven days',
        'Free hackathons with internship opportunities',
        'Find individual participation opportunities',
        'Why am I not eligible for Cal Hacks?',
      ],
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isLoading) return;

    setInputQuery('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await GeminiService.answerUserQuery(
        q,
        user,
        opportunities,
        matches
      );

      const asstMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPayload: response.relatedOpportunityIds,
      };

      setMessages(prev => [...prev, asstMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: 'Sorry, I encountered a brief issue retrieving that data. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Personal AI Assistant
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {GeminiService.isConfigured() ? 'Gemini 3.8 Flash' : 'Grounded Assistant'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Zero-hallucination queries on verified database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat message stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isAsst = m.sender === 'assistant';
            const relatedIds: string[] = m.actionPayload || [];
            const relatedOpps = opportunities.filter(o => relatedIds.includes(o.id));

            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isAsst ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isAsst
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  }`}
                >
                  {isAsst ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      isAsst
                        ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* Related Opportunity Mini-Cards */}
                  {relatedOpps.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Referenced Hackathons ({relatedOpps.length})
                      </p>
                      {relatedOpps.map(opp => {
                        const oppMatch = matches.get(opp.id);
                        return (
                          <div
                            key={opp.id}
                            onClick={() => onSelectOpportunity(opp)}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {opp.title}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{opp.sourcePlatform}</span>
                                <span>•</span>
                                <span>Closes {formatDate(opp.registrationDeadline)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {oppMatch && (
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  oppMatch.category === 'ELIGIBLE' 
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                  {oppMatch.score}%
                                </span>
                              )}
                              <ArrowUpRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggestion pills */}
                  {isAsst && m.suggestions && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendQuery(s)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors"
                        >
                          {s}
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

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Bot className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>Scanning your profile & verified opportunities...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about opportunities, eligibility rules, or deadlines..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputQuery.trim() || isLoading}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

