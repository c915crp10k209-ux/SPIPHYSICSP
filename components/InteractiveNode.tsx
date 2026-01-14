
import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { vaultItem } from '../services/persistenceService';
import { Topic } from '../types';

interface InteractiveNodeProps {
  name: string;
  definition: string;
  tip?: string;
  not?: string;
  related?: string[];
  topic?: Topic;
}

export const InteractiveNode: React.FC<InteractiveNodeProps> = ({ name, definition, tip, not, related = [], topic = Topic.PHYSICS }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [posStyles, setPosStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && tooltipRef.current && triggerRef.current) {
      const isMobile = window.innerWidth < 768;
      
      let styles: React.CSSProperties = {};
      
      if (isMobile) {
          // Mobile: Centered Screen Overlay (Prevents overlapping buttons/edges)
          styles = {
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90vw',
              maxWidth: '360px',
              margin: '0',
              bottom: 'auto',
              zIndex: 1000
          };
      } else {
          // Desktop: Smart Popover
          const rect = tooltipRef.current.getBoundingClientRect();
          const margin = 16;
          styles = { left: '50%', transform: 'translateX(-50%)' };
          
          if (rect.left < margin) {
            styles = { left: '0', transform: 'translateX(0)' };
          } else if (rect.right > window.innerWidth - margin) {
            styles = { left: 'auto', right: '0', transform: 'translateX(0)' };
          }

          if (rect.top < margin) {
            styles = { ...styles, top: '100%', bottom: 'auto', marginTop: '12px' };
          }
      }

      setPosStyles(styles);
    }
  }, [isOpen]);

  const handleVault = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.playSuccess();
    vaultItem({
      topic,
      title: `Concept: ${name}`,
      content: `${definition}${not ? `\n\nDistinction: ${not}` : ''}${tip ? `\n\nMnemonic: ${tip}` : ''}`,
      type: 'explanation'
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
        audioService.playLogicSuccess(); // Discovery Sound
    } else {
        audioService.playClick();
    }
    setIsOpen(!isOpen);
  };

  return (
    <span 
      ref={triggerRef}
      className="relative inline-block cursor-help group mx-0.5"
      onMouseEnter={() => window.innerWidth > 1024 && setIsOpen(true)}
      onMouseLeave={() => window.innerWidth > 1024 && setIsOpen(false)}
      onClick={handleToggle}
    >
      <span className="text-medical-500 font-black border-b-2 border-dotted border-medical-500/40 hover:border-medical-400 hover:text-medical-400 hover:bg-medical-500/5 px-1 rounded-t-sm transition-all duration-300">
        {name}
      </span>
      
      {/* Dimmed backdrop for mobile overlays */}
      {isOpen && window.innerWidth < 768 && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[990]" onClick={handleToggle}></div>
      )}

      <div 
        ref={tooltipRef}
        style={posStyles}
        className={`absolute bottom-full mb-4 w-[280px] md:w-[400px] p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-[1000] transition-all duration-400 transform ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
        }`}
      >
        <div className="absolute inset-0 bg-medical-500/5 pointer-events-none rounded-[inherit] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-medical-500 to-transparent animate-pulse"></div>
        </div>
        
        <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-medical-500/10 flex items-center justify-center text-medical-500 border border-medical-500/20 shadow-inner">
                    <i className="fas fa-microchip text-[11px]"></i>
                </div>
                <div>
                    <h5 className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">Synapse Link</h5>
                    <p className="text-[7px] font-bold text-teal-400 uppercase">Synchronized</p>
                </div>
            </div>
            <button 
                onClick={handleVault}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${isSaved ? 'bg-teal-500 text-white border-teal-600' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-teal-500'}`}
            >
                <i className={`fas ${isSaved ? 'fa-check' : 'fa-bookmark'} text-xs`}></i>
            </button>
          </div>

          <h4 className="text-white font-display font-black text-xl md:text-2xl mb-4 tracking-tight leading-tight uppercase italic">{name}</h4>
          
          <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
               <p className="text-[8px] font-black text-medical-400 uppercase tracking-widest mb-2 flex items-center">
                 <i className="fas fa-bolt mr-1.5"></i> Physics Definition
               </p>
               <p className="text-slate-200 text-sm md:text-base leading-relaxed font-sans font-medium">{definition}</p>
            </div>

            {not && (
               <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                  <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center">
                    <i className="fas fa-ban mr-1.5"></i> Common Error
                  </p>
                  <p className="text-slate-300 text-[11px] md:text-xs italic font-sans leading-relaxed">"{not}"</p>
               </div>
            )}
            
            {tip && (
              <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20 shadow-inner">
                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center">
                  <i className="fas fa-lightbulb mr-1.5"></i> Harvey's Mnemonic
                </p>
                <p className="text-amber-50/90 text-xs md:text-sm font-serif italic leading-relaxed font-medium">"{tip}"</p>
              </div>
            )}
          </div>

          {/* Close button for mobile Modal experience */}
          {window.innerWidth < 768 && (
              <button 
                onClick={handleToggle}
                className="w-full mt-6 py-3 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest border border-white/5"
              >
                Close Briefing
              </button>
          )}
        </div>
        
        {/* Tooltip Arrow (Only desktop) */}
        {window.innerWidth >= 768 && !posStyles.top && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-900"></div>
        )}
      </div>
    </span>
  );
};
