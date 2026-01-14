
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Topic, ChatMessage, GamificationState, ChatThread, AppView } from '../types';
import { chatWithTutor, getMnemonics } from '../services/geminiService';
import { saveChatDraft, getChatDraft, vaultItem, getGameState, vaultMnemonicToProgress, getChatThreads, saveChatThread, deleteChatThread } from '../services/persistenceService';
import ReactMarkdown from 'react-markdown';
import { AudioNarrator } from './AudioNarrator';
import { TOPICS } from '../constants';
import { HarveyAvatar } from './HarveyAvatar';
import { audioService } from '../services/audioService';

interface GeminiTutorProps {
  topic: Topic;
  isExpanded?: boolean;
  onTeleport?: (view: AppView, topic?: Topic) => void;
}

export const GeminiTutor: React.FC<GeminiTutorProps> = ({ topic, isExpanded = true, onTeleport }) => {
  const [threads, setThreads] = useState<ChatThread[]>(getChatThreads());
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(getChatDraft(topic));
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [game, setGame] = useState<GamificationState>(getGameState());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentVoice = TOPICS[topic].voice;

  // Initialize with a welcome message if no thread is active
  useEffect(() => {
    const existingThreads = getChatThreads();
    setThreads(existingThreads);
    
    const topicThread = existingThreads.find(t => t.topic === topic);
    if (topicThread) {
      setCurrentThreadId(topicThread.id);
      setMessages(topicThread.messages);
    } else {
      const newId = crypto.randomUUID();
      const initialMsgs: ChatMessage[] = [{ role: 'model', text: `Neural link stabilized. I'm Harvey, your navigator for ${topic}. How can I assist your study loop?`, timestamp: Date.now() }];
      setMessages(initialMsgs);
      setCurrentThreadId(newId);
      const newThread: ChatThread = {
        id: newId,
        topic,
        title: `${topic} Protocol`,
        messages: initialMsgs,
        lastUpdated: Date.now()
      };
      saveChatThread(newThread);
      setThreads(getChatThreads());
    }
    
    setInput(getChatDraft(topic));
    setGame(getGameState());
  }, [topic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    saveChatDraft(topic, val);
  };

  const parseNavCommands = (text: string) => {
    // Look for patterns like [NAV:QUIZ] or [NAV:FLASHCARDS]
    const navMatch = text.match(/\[NAV:(.*?)\]/);
    if (navMatch && onTeleport) {
       const target = navMatch[1] as AppView;
       setTimeout(() => {
          onTeleport(target, topic);
       }, 2000);
       return text.replace(/\[NAV:.*?\]/g, '*(Teleporting student to destination...)*');
    }
    return text;
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    audioService.playClick();
    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    saveChatDraft(topic, '');
    setLoading(true);

    const history = newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    
    try {
      const responseText = await chatWithTutor(topic, textToSend, history);
      const cleanedResponse = parseNavCommands(responseText);
      const assistantMsg: ChatMessage = { role: 'model', text: cleanedResponse, timestamp: Date.now() };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      
      if (currentThreadId) {
        saveChatThread({
          id: currentThreadId,
          topic,
          title: messages[0]?.text.substring(0, 30) || `${topic} Session`,
          messages: finalMessages,
          lastUpdated: Date.now()
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Neural dropout detected. Re-routing signal...", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
      setThreads(getChatThreads());
    }
  };

  const handleVault = (msg: ChatMessage, title: string) => {
    audioService.playSuccess();
    vaultItem({ topic, title, content: msg.text, type: 'insight' });
    setJustSaved(msg.text);
    
    // Mark as saved in local state
    const updatedMessages = messages.map(m => m.timestamp === msg.timestamp ? { ...m, isSaved: true } : m);
    setMessages(updatedMessages);
    if (currentThreadId) {
        const threads = getChatThreads();
        const tIdx = threads.findIndex(t => t.id === currentThreadId);
        if (tIdx !== -1) {
            threads[tIdx].messages = updatedMessages;
            localStorage.setItem('spi_chat_threads_v1', JSON.stringify(threads));
        }
    }

    setTimeout(() => setJustSaved(null), 2000);
  };

  const handleMnemonicRequest = async () => {
     audioService.playClick();
     setLoading(true);
     const mnemonicText = await getMnemonics(topic);
     vaultMnemonicToProgress(topic, mnemonicText);
     const assistantMsg: ChatMessage = { role: 'model', text: mnemonicText, timestamp: Date.now() };
     const finalMessages = [...messages, assistantMsg];
     setMessages(finalMessages);
     
     if (currentThreadId) {
        saveChatThread({
          id: currentThreadId,
          topic,
          title: `Mnemonic: ${topic}`,
          messages: finalMessages,
          lastUpdated: Date.now()
        });
     }
     setLoading(false);
  };

  const selectThread = (thread: ChatThread) => {
    audioService.playClick();
    setCurrentThreadId(thread.id);
    setMessages(thread.messages);
    setShowHistory(false);
  };

  const createNewThread = () => {
    audioService.playClick();
    const newId = crypto.randomUUID();
    const initialMsgs: ChatMessage[] = [{ role: 'model', text: `Initiating fresh synchronization for ${topic}. How can I direct your path?`, timestamp: Date.now() }];
    setMessages(initialMsgs);
    setCurrentThreadId(newId);
    saveChatThread({
        id: newId,
        topic,
        title: `New ${topic} Link`,
        messages: initialMsgs,
        lastUpdated: Date.now()
    });
    setThreads(getChatThreads());
    setShowHistory(false);
  };

  const removeThread = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      audioService.playError();
      deleteChatThread(id);
      setThreads(getChatThreads());
      if (currentThreadId === id) {
          createNewThread();
      }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950 font-mono transition-all duration-500 relative`}>
      
      {/* Navigator Header */}
      <div className="bg-black/90 px-6 py-10 border-b border-slate-900 flex flex-col items-center sticky top-0 z-[100] backdrop-blur-xl">
         <div className="absolute left-6 top-10">
            <button onClick={() => setShowHistory(!showHistory)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all border border-white/5">
                <i className={`fas ${showHistory ? 'fa-times' : 'fa-history'} text-sm`}></i>
            </button>
         </div>
         
         <div className="relative">
            <div className="absolute -inset-4 bg-medical-500/10 blur-xl rounded-full animate-pulse-slow"></div>
            <HarveyAvatar level={game.level} size="sm" activeSkin={game.activeSkin} isThinking={loading} />
         </div>
         
         <div className="text-center mt-4">
            <h4 className="text-lg font-black text-white tracking-[0.2em] uppercase mb-1">Harvey <span className="text-medical-500">Navigator</span></h4>
            <div className="flex items-center space-x-3 justify-center">
                <span className="text-[9px] text-teal-400 font-black tracking-widest uppercase bg-teal-400/10 px-2 py-0.5 rounded-full border border-teal-400/20">Link Established</span>
                <button onClick={handleMnemonicRequest} className="text-[9px] text-fuchsia-400 hover:text-fuchsia-300 transition-colors uppercase font-black tracking-widest">
                    <i className="fas fa-bolt mr-1"></i> Quick Tip
                </button>
            </div>
         </div>
      </div>

      {/* History / Protocol Archives */}
      {showHistory && (
          <div className="absolute inset-0 top-[170px] bg-slate-950 z-[110] animate-in slide-in-from-left duration-300 border-r border-slate-900">
             <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Synapse Archives</h5>
                    <button onClick={createNewThread} className="text-[9px] font-black uppercase text-medical-400 hover:text-white transition-colors bg-medical-500/10 px-4 py-2 rounded-xl border border-medical-500/20">
                        <i className="fas fa-plus mr-2"></i> New Protocol
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-4">
                    {threads.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => selectThread(t)}
                            className={`w-full p-5 rounded-[1.5rem] border-2 text-left transition-all flex items-center justify-between group
                              ${currentThreadId === t.id ? 'bg-medical-500 border-medical-400 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-white/5'}`}
                        >
                            <div className="flex-1 truncate mr-4">
                                <p className="text-[11px] font-black uppercase tracking-tight truncate">{t.title}</p>
                                <div className="flex items-center space-x-2 mt-1.5 opacity-60">
                                   <div className="w-1 h-1 rounded-full bg-current"></div>
                                   <p className="text-[8px] font-bold uppercase tracking-widest">{t.topic}</p>
                                </div>
                            </div>
                            <i onClick={(e) => removeThread(e, t.id)} className="fas fa-trash-alt text-[10px] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-2"></i>
                        </button>
                    ))}
                </div>
             </div>
          </div>
      )}
      
      {/* Communication Stream */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar bg-black/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[95%] rounded-[2rem] p-6 lg:p-8 text-sm leading-relaxed relative group ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-slate-200 border border-slate-800 shadow-xl' 
                  : 'bg-white/5 text-slate-300 border-l-4 border-medical-500 shadow-inner'
              }`}>
                <div className={`prose prose-invert prose-sm max-w-none font-sans ${msg.role === 'model' ? 'italic text-base lg:text-xl leading-relaxed' : 'text-sm font-bold'}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                
                {msg.role === 'model' && (
                  <div className="mt-8 flex flex-wrap items-center gap-3 lg:gap-4">
                      <AudioNarrator text={msg.text} voiceName={currentVoice} />
                      <button 
                          onClick={() => handleVault(msg, `Harvey's Insight: ${topic}`)}
                          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border shadow-xl flex items-center justify-center transition-all 
                          ${msg.isSaved || justSaved === msg.text ? 'bg-teal-500 text-white border-teal-600' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-medical-400'}`}
                      >
                          <i className={`fas ${msg.isSaved || justSaved === msg.text ? 'fa-check' : 'fa-bookmark'} text-xs lg:text-sm`}></i>
                      </button>
                      
                      {/* Navigation Actions (Bottom of model messages) */}
                      {idx === messages.length - 1 && !loading && (
                          <div className="w-full mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                              <QuickAction label="Test Readiness" icon="fa-tasks" onClick={() => handleSend("Initiate diagnostic assessment for this topic.")} />
                              <QuickAction label="Clinical Analogy" icon="fa-stethoscope" onClick={() => handleSend("Provide a real-world clinical analogy for the last point.")} />
                              <QuickAction label="Simulate" icon="fa-vial" onClick={() => onTeleport?.(AppView.TOPIC, topic)} />
                          </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="flex items-center space-x-4 bg-slate-900/60 px-6 py-4 rounded-[1.5rem] border border-white/5 backdrop-blur-md">
                  <div className="flex space-x-1.5">
                     <div className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce delay-150"></div>
                     <div className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce delay-300"></div>
                  </div>
                  <span className="text-[10px] font-black text-medical-400 uppercase tracking-[0.4em]">Neural Mapping...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Neural Input Interface */}
        <div className="p-6 lg:p-10 bg-black border-t border-slate-900 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
          <div className="relative max-w-4xl mx-auto">
            <input
              type="text"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl lg:rounded-[2rem] px-6 lg:px-10 py-5 lg:py-7 text-base text-white placeholder-slate-600 focus:border-medical-500 focus:outline-none transition-all pr-16 lg:pr-24 shadow-inner"
              placeholder="Direct Harvey: 'Test me on Aliasing' or 'Explain LARRD'..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()} 
              className={`absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all ${input.trim() ? 'bg-medical-500 text-white shadow-lg' : 'text-slate-700 bg-transparent'}`}
            >
              <i className="fas fa-paper-plane text-base lg:text-xl"></i>
            </button>
          </div>
          <div className="flex justify-between items-center mt-6 px-4">
             <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">Protocol Loop Active</p>
             <div className="flex space-x-4">
                <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Node: {topic}</span>
                <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Bandwidth: 100%</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ label: string; icon: string; onClick: () => void }> = ({ label, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center space-x-2.5 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-medical-500 hover:text-white transition-all group"
    >
        <i className={`fas ${icon} text-[10px] text-medical-400 group-hover:text-white`}></i>
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
);
