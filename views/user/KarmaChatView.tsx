import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Info, Loader2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { User, ChatMessage, OrgNode } from '../../types';
import { calculateOrgContext } from '../../services/riasecService';
import { StepProgressBar } from '../../components/StepProgressBar';

interface KarmaChatViewProps {
  user: User;
  onComplete: (transcript: ChatMessage[]) => Promise<void>;
  orgStructure?: OrgNode;
  allUsers?: User[];
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

// Streaming chat function using edge function with centralized bot config
const streamKarmaChat = async (
  messages: { role: 'user' | 'assistant'; content: string }[],
  botType: string,
  profileData: Record<string, any>,
  onDelta: (delta: string) => void,
  onDone: () => void,
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
      if (resp.status === 429) {
        onError('Limite richieste superato. Riprova tra qualche secondo.');
        return;
      }
      if (resp.status === 402) {
        onError('Crediti AI esauriti. Contatta l\'amministratore.');
        return;
      }
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

      // Process line-by-line as data arrives
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
          // Incomplete JSON, put back and wait
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
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
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (error) {
    console.error('Streaming error:', error);
    onError('Errore di connessione con Karma AI');
  }
};

export const KarmaChatView: React.FC<KarmaChatViewProps> = ({ 
  user, 
  onComplete, 
  orgStructure,
  allUsers = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(user.karmaData?.transcript || []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build profile data with organizational context
  const buildProfileData = () => {
    // Calculate org context if structure is available
    const orgContext = orgStructure 
      ? calculateOrgContext(user, orgStructure, allUsers)
      : null;

    return {
      firstName: user.firstName,
      lastName: user.lastName,
      profileCode: user.profileCode,
      jobTitle: user.jobTitle,
      // Organizational context
      orgNodeName: orgContext?.orgNodeName,
      orgNodeType: orgContext?.orgNodeType,
      directReports: orgContext?.directReports,
      teamSize: orgContext?.teamSize,
      orgLevel: orgContext?.orgLevel,
      isManager: orgContext?.isManager,
      managerName: orgContext?.managerName,
      // Climate data context
      companyContext: user.climateData 
        ? `Clima percepito: ${user.climateData.overallAverage.toFixed(1)}/5`
        : undefined,
    };
  };

  // Initialize on mount
  useEffect(() => {
    // If no messages, inject welcome message
    if (messages.length === 0) {
      const profileData = buildProfileData();
      const orgInfo = profileData.isManager && profileData.directReports && profileData.directReports > 0
        ? ` Vedo che operi in ${profileData.orgNodeName || 'azienda'} con ${profileData.directReports} collaboratori.`
        : '';
      
      const welcomeText = `Ciao ${user.firstName || 'candidato'}, sono Karma. Ho analizzato il tuo profilo RIASEC (Codice: ${user.profileCode || 'N/A'}).${orgInfo}
            
Il mio obiettivo è conoscerti meglio oltre i numeri. Vorrei farti qualche domanda sul tuo modo di lavorare e sulle tue esperienze passate.

Per iniziare: qual è stata la sfida professionale più complessa che hai affrontato recentemente e come l'hai gestita?`;

      const welcomeMsg: ChatMessage = {
        id: 'welcome-msg',
        role: 'model',
        text: welcomeText,
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
    }
  }, [user.firstName, user.profileCode]);

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

    // Convert to API format
    const apiMessages = newMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text
    }));

    let assistantText = '';
    const assistantMsgId = (Date.now() + 1).toString();

    // Build profile data with org context
    const profileData = buildProfileData();

    await streamKarmaChat(
      apiMessages,
      'jnana', // Use jnana bot type for B2B
      profileData,
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
      () => {
        setIsTyping(false);
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
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-100px)] flex flex-col">
      {/* Step Progress Bar */}
      <StepProgressBar currentStep="karma" completedSteps={['riasec', 'climate']} />
      
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
                disabled={isClosing}
                className="min-w-[160px]"
            >
                {isClosing ? (
                    <><Loader2 size={16} className="mr-2 animate-spin"/> Generazione Profilo...</>
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
                  <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm">Come funziona questo colloquio?</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-200 mt-1">
                      Karma è un'AI progettata per analizzare le tue Soft Skills. Rispondi in modo naturale e sincero. 
                      Non ci sono risposte giuste o sbagliate. Quando senti di aver espresso abbastanza su te stesso, premi "Concludi Colloquio" in alto a destra.
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
                 {/* Visual distinction for Role */}
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
                <input
                    type="text"
                    className="flex-1 p-4 pr-12 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-jnana-sage focus:border-transparent outline-none shadow-sm transition-all"
                    placeholder="Scrivi qui la tua risposta..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isTyping || isClosing}
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
  );
};