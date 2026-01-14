
import React, { useEffect, useState } from 'react';
import { Topic } from '../types';
import { HarveyAvatar } from './HarveyAvatar';
import { audioService } from '../services/audioService';

interface CinematicTransitionProps {
  title: string;
  subtitle?: string;
  onComplete: () => void;
  duration?: number;
}

export const CinematicTransition: React.FC<CinematicTransitionProps> = ({ 
  title, 
  subtitle = "Neural Calibration In Progress", 
  onComplete,
  duration = 2500 
}) => {
  const [phase, setPhase] = useState<'ENTERING' | 'ACTIVE' | 'EXITING'>('ENTERING');

  useEffect(() => {
    audioService.playHarveySync();
    
    const timers = [
      setTimeout(() => setPhase('ACTIVE'), 100),
      setTimeout(() => setPhase('EXITING'), duration - 500),
      setTimeout(() => onComplete(), duration)
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [onComplete, duration]);

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center bg-slate-950 transition-all duration-700 ${phase === 'EXITING' ? 'opacity-0 scale-110' : 'opacity-100'}`}>
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Scanning Beam */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-medical-500 to-transparent shadow-[0_0_20px_#0ea5e9] animate-scan-down opacity-30"></div>
        
        {/* Radial Depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1)_0%,transparent_70%)]"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-1 h-1 bg-white rounded-full animate-float-particle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={`transition-all duration-1000 transform ${phase === 'ACTIVE' ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          <HarveyAvatar level={5} size="lg" />
        </div>

        <div className="mt-12 space-y-4">
          <div className="overflow-hidden">
            <h2 className={`text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter transition-all duration-700 transform ${phase === 'ACTIVE' ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              {title}
            </h2>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-medical-500"></div>
            <p className={`text-[10px] md:text-xs font-black text-medical-400 uppercase tracking-[0.5em] transition-all delay-300 duration-700 ${phase === 'ACTIVE' ? 'opacity-100' : 'opacity-0'}`}>
              {subtitle}
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-medical-500"></div>
          </div>
        </div>

        {/* Dynamic Loading Bar */}
        <div className="mt-16 w-64 h-1 bg-slate-900 rounded-full overflow-hidden relative border border-white/5">
           <div className="absolute inset-0 bg-medical-500/20"></div>
           <div className={`h-full bg-medical-500 shadow-[0_0_15px_#0ea5e9] transition-all duration-[2000ms] ease-out ${phase === 'ENTERING' ? 'w-0' : 'w-full'}`}></div>
        </div>
      </div>

      <style>{`
        @keyframes scan-down {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0); opacity: 0; }
          50% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * -100}px); opacity: 0.8; }
        }
        .animate-scan-down {
          animation: scan-down 3s linear infinite;
        }
        .animate-float-particle {
          animation: float-particle ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
