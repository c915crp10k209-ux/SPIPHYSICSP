
import React from 'react';

interface HarveyAvatarProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  activeSkin?: string;
  isSmiling?: boolean;
  isThinking?: boolean;
}

export const HarveyAvatar: React.FC<HarveyAvatarProps> = ({ 
    level, 
    size = 'md', 
    activeSkin = 'Default', 
    isSmiling = false,
    isThinking = false 
}) => {
  const scale = size === 'sm' ? 'scale-50' : size === 'lg' ? 'scale-125' : 'scale-100';
  
  // Visual Identity Logic: Skins override Tiers
  const getSkinTheme = () => {
    switch (activeSkin) {
      case 'Golden': return { main: 'border-amber-400', glow: 'shadow-amber-400/50', fill: 'bg-amber-400', text: 'text-amber-400', filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.8))' };
      case 'Neon': return { main: 'border-fuchsia-500', glow: 'shadow-fuchsia-500/50', fill: 'bg-fuchsia-500', text: 'text-fuchsia-400', filter: 'drop-shadow(0 0 15px rgba(217,70,239,0.9))' };
      case 'Stealth': return { main: 'border-slate-400', glow: 'shadow-slate-500/30', fill: 'bg-slate-500', text: 'text-slate-400', filter: 'grayscale(1) brightness(0.8)' };
      case 'Medical': return { main: 'border-medical-500', glow: 'shadow-medical-500/50', fill: 'bg-medical-500', text: 'text-medical-400', filter: 'none' };
      default:
        // Default behavior based on level
        if (level >= 25) return { main: 'border-fuchsia-500', glow: 'shadow-fuchsia-500/50', fill: 'bg-fuchsia-500', text: 'text-fuchsia-400', filter: 'none' };
        if (level >= 15) return { main: 'border-amber-400', glow: 'shadow-amber-400/50', fill: 'bg-amber-400', text: 'text-amber-400', filter: 'none' };
        if (level >= 5) return { main: 'border-teal-400', glow: 'shadow-teal-400/50', fill: 'bg-teal-400', text: 'text-teal-400', filter: 'none' };
        return { main: 'border-medical-500', glow: 'shadow-medical-500/50', fill: 'bg-medical-500', text: 'text-medical-400', filter: 'none' };
    }
  };

  const current = getSkinTheme();

  return (
    <div className={`relative flex items-center justify-center transition-all duration-1000 ${scale} h-40 w-40`} style={{ filter: current.filter }}>
      
      {/* Background Pulse Aura */}
      <div className={`absolute inset-0 rounded-full blur-[45px] opacity-20 animate-pulse-slow ${current.fill} ${isThinking ? 'scale-110 !opacity-40' : ''}`}></div>

      <div className="relative flex flex-col items-center">
        
        {/* Top Hat Sensor */}
        <div className={`w-10 h-6 border-2 border-b-0 rounded-t-xl transition-all duration-500 ${current.main} ${current.fill} opacity-90 mb-[-2px] relative z-20 flex items-center justify-center shadow-lg`}>
            {isThinking && <div className="w-1 h-4 bg-white/40 rounded-full animate-bounce"></div>}
        </div>

        {/* Main Head Shape */}
        <div className={`relative w-36 h-28 border-2 rounded-[2.5rem] bg-slate-950/90 backdrop-blur-md transition-all duration-500 flex flex-col items-center justify-center overflow-hidden
          ${current.main} shadow-[0_0_30px_rgba(0,0,0,0.6)] ${isThinking ? 'ring-4 ring-white/10' : ''}`}>
          
          {/* Internal Glow Layer */}
          <div className={`absolute inset-0 opacity-10 ${current.fill} blur-2xl`}></div>

          {/* Eyes Section */}
          <div className="flex space-x-12 mb-2 relative z-10">
            {[1, 2].map((eye) => (
              <div key={eye} className="relative">
                {/* Eye Pupil */}
                <div className={`w-5 h-5 rounded-full transition-all duration-500 animate-harvey-blink
                  ${current.fill} shadow-[0_0_15px_rgba(255,255,255,0.9)]`}>
                </div>
                {/* Thinking Glow Overlay */}
                {isThinking && <div className="absolute inset-0 rounded-full bg-white opacity-40 animate-ping"></div>}
              </div>
            ))}
          </div>

          {/* Mouth Section */}
          {(isSmiling || isThinking) && (
             <div className={`mt-4 w-12 h-4 border-b-2 rounded-full transition-all duration-500 opacity-60 ${current.main} ${isThinking ? 'animate-pulse' : ''}`}></div>
          )}

          {/* Scanning Line */}
          <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
             <div className="w-full h-1/2 bg-gradient-to-b from-white to-transparent animate-scan-line"></div>
          </div>
        </div>

        {/* Side Gears / Ears */}
        <div className={`absolute left-[-18px] top-[60px] w-6 h-6 border-2 rounded-full transition-all duration-500 opacity-90 z-0 bg-slate-950/90 ${current.main} ${isThinking ? 'animate-spin' : ''}`}></div>
        <div className={`absolute right-[-18px] top-[60px] w-6 h-6 border-2 rounded-full transition-all duration-500 opacity-90 z-0 bg-slate-950/90 ${current.main} ${isThinking ? 'animate-spin' : ''}`}></div>

        {/* Particle Effects for Special Skins */}
        {(activeSkin === 'Golden' || activeSkin === 'Neon') && (
            <div className="absolute -inset-10 pointer-events-none">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full animate-float-up ${current.fill}`}></div>
                <div className={`absolute bottom-0 left-1/4 w-1 h-1 rounded-full animate-float-up delay-700 ${current.fill}`}></div>
                <div className={`absolute top-1/2 right-0 w-1 h-1 rounded-full animate-float-up delay-300 ${current.fill}`}></div>
            </div>
        )}
      </div>

      <style>{`
        @keyframes harvey-blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.15); }
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.15); }
        }
        @keyframes scan-line {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(200%); }
        }
        @keyframes float-up {
            0% { transform: translateY(0); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(-100px); opacity: 0; }
        }
        .animate-harvey-blink { animation: harvey-blink 6s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse-slow 5s infinite ease-in-out; }
        .animate-scan-line { animation: scan-line 8s linear infinite; }
        .animate-float-up { animation: float-up 4s linear infinite; }
      `}</style>
    </div>
  );
};
