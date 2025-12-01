import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Bot, Loader, Sparkles, ExternalLink } from 'lucide-react';
import { BankEmail, User, Role, EmailStatus, Priority } from '../types';

interface ChatAssistantProps {
  emails: BankEmail[];
  users: User[];
  currentUser: User;
}

interface ChatSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: ChatSource[];
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ emails, users, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hello ${currentUser.name.split(' ')[0]}! I'm Surgex AI. I can help you analyze workflow trends, find specific emails, or check team availability. I can also search the web for real-time banking rates and news.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const generateSystemPrompt = () => {
    const pendingCount = emails.filter(e => e.status !== EmailStatus.COMPLETED).length;
    const urgentCount = emails.filter(e => e.priority === Priority.URGENT && e.status !== EmailStatus.COMPLETED).length;
    const completedCount = emails.filter(e => e.status === EmailStatus.COMPLETED).length;
    
    // Workers status summary
    const workers = users.filter(u => u.role === Role.WORKER);
    const availableWorkers = workers.filter(u => u.status === 'Available').map(u => u.name);
    const busyWorkers = workers.filter(u => u.status === 'Busy').map(u => u.name);

    // Recent emails summary for context
    const recentEmails = emails.slice(0, 8).map(e => 
      `- [${e.priority}] ${e.subject} (Status: ${e.status}, Assigned: ${users.find(u => u.id === e.assignedWorkerId)?.name || 'Unassigned'})`
    ).join('\n');

    return `
      You are the AI assistant for Surgex, a bank email workflow automation system.
      Current User: ${currentUser.name} (Role: ${currentUser.role})

      SYSTEM METRICS:
      - Total Emails: ${emails.length}
      - Pending: ${pendingCount}
      - Urgent & Pending: ${urgentCount}
      - Completed: ${completedCount}

      TEAM STATUS:
      - Available Workers: ${availableWorkers.length > 0 ? availableWorkers.join(', ') : 'None'}
      - Busy Workers: ${busyWorkers.length > 0 ? busyWorkers.join(', ') : 'None'}

      RECENT EMAILS (Context):
      ${recentEmails}

      INSTRUCTIONS:
      - Answer questions concisely about the system state.
      - If the user asks about specific emails, reference the list above.
      - If the user asks about external information (exchange rates, bank news, etc.), use the Google Search tool to provide up-to-date answers.
      - If the user asks to perform an action (like assigning), explain that you are currently in "Advisor Mode" and they should use the dashboard buttons, but guide them on who is available.
      - Be professional but friendly.
    `;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMsg,
        config: {
            systemInstruction: generateSystemPrompt(),
            tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text || "I processed that, but couldn't generate a text response.";
      
      const sources: ChatSource[] = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || 'Source',
              uri: chunk.web.uri
            });
          }
        });
      }

      setMessages(prev => [...prev, { role: 'model', text, sources }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the network. Please check your API key or try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
        }`}
      >
        {isOpen ? <X className="text-white" size={24} /> : <Sparkles className="text-white" size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-200 overflow-hidden font-sans">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex items-center space-x-3 text-white">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Surgex Assistant</h3>
              <div className="flex items-center text-[10px] text-blue-200">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                Online & Connected
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  
                  {/* Source Links */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100/20">
                      <p className="text-[10px] font-bold opacity-70 mb-1.5 flex items-center">
                        <Sparkles size={10} className="mr-1" />
                        Sources found:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`text-[10px] flex items-center px-2 py-1 rounded-full border transition-colors max-w-full truncate ${
                               msg.role === 'user' 
                               ? 'bg-blue-700/50 border-blue-500 text-blue-100 hover:bg-blue-700' 
                               : 'bg-slate-100 border-slate-200 text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <span className="truncate max-w-[150px]">{source.title}</span>
                            <ExternalLink size={8} className="ml-1 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                  <Loader size={14} className="animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about reports, rates..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 p-2 rounded-lg transition-colors ${
                  input.trim() && !isLoading ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;