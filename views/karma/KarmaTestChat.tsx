import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Info, Loader2, Hexagon, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ChatMessage, RiasecScore } from '../../types';
import type { UserExperience, UserEducation, UserHardSkill } from '../../src/types/karma';

interface KarmaTestChatProps {
  riasecScore: RiasecScore;
  profileCode: string;
  firstName: string;
  onComplete: (transcript: ChatMessage[]) => Promise<void>;
  onBack: () => void;
  // Profile context for personalized interview
  experiences?: UserExperience[];
  education?: UserEducation[];
  skills?: UserHardSkill[];
  bio?: string;
  headline?: string;
}

// Helper to parse **bold** text inside chat messages
const renderMessageText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((part, i) => 
        i % 2 === 1 ? <strong key={i} className="font-bold text-inherit">{part}</strong> : part
      )}
    </span>
  );
};

// Streaming chat function using edge function
const streamKarmaChat = async (
  messages: { role: 'user' | 'assistant'; content: string }[],
  botType: string,
  profileData: {
    firstName?: string;
    lastName?: string;
    profileCode?: string;
    headline?: string;
    bio?: string;
    experiences?: Array<{ role: string; company: string; isCurrent?: boolean }>;
    education?: Array<{ degree: string; institution: string }>;
    skills?: string[];
  },
  onDelta: (delta: string) => void,
  onDone: (finalText: string) => void,
  onError: (error: string) => void
) => {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/karma-chat`;
  
  try {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, botType, profileData }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      onError(errorData.error || 'Errore nella comunicazione con Karma AI');
      return;
    }

    if (!resp.body) {
      onError('Nessuna risposta dal server');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush + collect final text
    let finalText = '';
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onDelta(content);
            finalText += content;
          }
        } catch { /* ignore */ }
      }
    }

    onDone(finalText);
  } catch (error) {
    console.error('Streaming error:', error);
    onError('Errore di connessione con Karma AI');
  }
};

// Patterns that indicate the AI wants to close the conversation
const CLOSING_PATTERNS = [
  'è stato un piacere',
  'in bocca al lupo',
  'buona fortuna',
  'ti auguro il meglio',
  'grazie per aver condiviso',
  'concludiamo qui',
  'questo conclude',
  'abbiamo concluso',
  'ti ringrazio per questa conversazione',
  'ti faccio un grande in bocca al lupo',
];

const checkForAutoClose = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return CLOSING_PATTERNS.some(pattern => lowerText.includes(pattern));
};

export const KarmaTestChat: React.FC<KarmaTestChatProps> = ({ 
  riasecScore, 
  profileCode, 
  firstName, 
  onComplete,
  onBack,
  experiences = [],
  education = [],
  skills = [],
  bio,
  headline
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [autoClosing, setAutoClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build profile data for backend
  const buildProfileData = () => ({
    firstName,
    profileCode,
    headline,
    bio,
    experiences: experiences.slice(0, 5).map(exp => ({
      role: exp.role,
      company: exp.company,
      isCurrent: exp.isCurrent
    })),
    education: education.slice(0, 3).map(edu => ({
      degree: edu.degree,
      institution: edu.institution
    })),
    skills: skills.slice(0, 10).map(s => s.skill?.name || s.customSkillName).filter(Boolean) as string[]
  });

  // Initialize on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = `Ciao ${firstName || 'candidato'}, sono Karma! 👋

Ho analizzato il tuo profilo RIASEC e vedo che hai un codice **${profileCode}** - molto interessante!

Ora vorrei conoscerti meglio attraverso una breve conversazione. Non ci sono risposte giuste o sbagliate, voglio solo capire chi sei professionalmente.

**Raccontami:** qual è stata la sfida professionale più significativa che hai affrontato di recente? Come l'hai gestita?`;

      const welcomeMsg: ChatMessage = {
        id: 'welcome-msg',
        role: 'model',
        text: welcomeText,
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
    }
  }, [profileCode, firstName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const apiMessages = newMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text
    }));

    let assistantText = '';
    const assistantMsgId = (Date.now() + 1).toString();

    await streamKarmaChat(
      apiMessages,
      'karma_talents', // Bot type
      buildProfileData(),
      (delta) => {
        assistantText += delta;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantMsgId) {
            return prev.map(m => m.id === assistantMsgId ? { ...m, text: assistantText } : m);
          }
          return [...prev, {
            id: assistantMsgId,
            role: 'model' as const,
            text: assistantText,
            timestamp: Date.now()
          }];
        });
      },
      (finalText) => {
        setIsTyping(false);
        // Check if AI wants to conclude the conversation
        if (checkForAutoClose(assistantText || finalText)) {
          setAutoClosing(true);
          setTimeout(() => {
            handleConclude();
          }, 2500);
        }
      },
      (error) => {
        console.error('Karma AI error:', error);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: error || "Mi dispiace, ho avuto un problema tecnico. Riprova tra poco.",
          timestamp: Date.now()
        }]);
        setIsTyping(false);
      }
    );
  };

  const handleConclude = async () => {
    if (isClosing) return;
    setIsClosing(true);
    await onComplete(messages);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <Hexagon size={28} className="text-jnana-sage" strokeWidth={1.5} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight lowercase">
                karma
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Colloquio AI</p>
            </div>
          </div>
        </div>
        
        <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl border-0 bg-white dark:bg-gray-800 backdrop-blur">
          
          {/* HEADER */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-jnana-sage flex items-center justify-center text-white shadow-lg animate-pulse-slow">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Karma AI</h3>
                <p className="text-xs text-gray-500">Colloquio Attitudinale</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleConclude}
              disabled={isClosing || messages.length < 3}
              className="min-w-[160px]"
            >
              {isClosing ? (
                <><Loader2 size={16} className="mr-2 animate-spin"/> Analisi in corso...</>
              ) : (
                "Concludi Colloquio"
              )}
            </Button>
          </div>
          
          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
            
            {/* INSTRUCTIONAL BANNER */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3 mb-6 animate-fade-in">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={20}/>
              <div>
                <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm">Come funziona?</h4>
                <p className="text-sm text-blue-600 dark:text-blue-200 mt-1">
                  Rispondi in modo naturale e sincero. Non ci sono risposte giuste o sbagliate. 
                  Dopo qualche scambio, premi "Concludi Colloquio" per ricevere la tua analisi completa.
                </p>
              </div>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm md:text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-jnana-sage text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600'
                }`}>
                  <span className={`block text-[10px] uppercase font-bold mb-1 opacity-70 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                    {msg.role === 'user' ? 'Tu' : 'Karma AI'}
                  </span>
                  <div className="whitespace-pre-wrap">
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2 relative">
              {autoClosing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-700/90 rounded-full">
                  <span className="text-sm text-jnana-sage font-medium animate-pulse">
                    Karma AI ha concluso il colloquio. Analisi in corso...
                  </span>
                </div>
              )}
              <input
                type="text"
                className="flex-1 p-4 pr-12 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-jnana-sage focus:border-transparent outline-none shadow-sm transition-all"
                placeholder="Scrivi qui la tua risposta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isTyping || isClosing || autoClosing}
                autoFocus
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isClosing}
                className="absolute right-2 top-2 p-2 bg-jnana-sage text-white rounded-full hover:bg-jnana-sageDark disabled:opacity-50 disabled:hover:bg-jnana-sage transition-all hover:scale-110 shadow-md"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
