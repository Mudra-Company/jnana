import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Info, Loader2 } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { User, ChatMessage } from '../../types';
import { generateKarmaSystemInstruction } from '../../services/riasecService';

interface KarmaChatViewProps {
  user: User;
  onComplete: (transcript: ChatMessage[]) => Promise<void>; // Updated to Promise to handle loading state
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

export const KarmaChatView: React.FC<KarmaChatViewProps> = ({ user, onComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(user.karmaData?.transcript || []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // State to prevent double clicks on close
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref for the Chat instance to persist across renders
  const chatSessionRef = useRef<Chat | null>(null);

  // Initialize Chat Session on mount if not already present
  useEffect(() => {
    if (!chatSessionRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = user.results ? generateKarmaSystemInstruction(user.results) : "Sei un assistente HR.";
        
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
            history: messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }))
        });

        // UX FIX: If history is empty, inject a Welcome Message immediately to guide the user
        if (messages.length === 0) {
            const welcomeText = `Ciao ${user.firstName}, sono Karma. Ho analizzato il tuo profilo RIASEC (Codice: ${user.profileCode || 'N/A'}). 
            
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
    }
  }, [user.results, messages, user.firstName, user.profileCode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text;
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: "Mi dispiace, ho avuto un problema tecnico. Riprova tra poco.",
          timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConclude = async () => {
      if (isClosing) return;
      setIsClosing(true);
      await onComplete(messages);
      // setIsClosing(false); // No need to reset, view will unmount/change
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-100px)] flex flex-col">
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