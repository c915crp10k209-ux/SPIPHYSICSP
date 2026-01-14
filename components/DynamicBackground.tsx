
import React, { useEffect, useState, useRef } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  symbol: string;
  vx: number;
  vy: number;
}

export const DynamicBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const harveyPos = useRef({ x: 100, y: 100 });
  const [displayPos, setDisplayPos] = useState({ x: 100, y: 100 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Initialize background nodes
  useEffect(() => {
    const initialNodes: Node[] = [
      { id: 'wavelength', x: 20, y: 30, label: 'Wavelength', symbol: 'λ', vx: 0.02, vy: 0.01 },
      { id: 'frequency', x: 80, y: 20, label: 'Frequency', symbol: 'f', vx: -0.015, vy: 0.02 },
      { id: 'speed', x: 70, y: 80, label: 'Propagation', symbol: 'c', vx: 0.01, vy: -0.015 },
      { id: 'impedance', x: 15, y: 75, label: 'Impedance', symbol: 'Z', vx: -0.01, vy: -0.01 },
      { id: 'density', x: 50, y: 50, label: 'Density', symbol: 'ρ', vx: 0.005, vy: 0.005 },
    ];
    setNodes(initialNodes);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const updateLoop = () => {
      // Harvey smooth follow
      const targetX = mousePos.x;
      const targetY = mousePos.y;
      
      const dx = targetX - harveyPos.current.x;
      const dy = targetY - harveyPos.current.y;
      
      const floatX = Math.sin(Date.now() / 1200) * 20;
      const floatY = Math.cos(Date.now() / 1800) * 25;

      harveyPos.current.x += dx * 0.04;
      harveyPos.current.y += dy * 0.04;

      const currentX = harveyPos.current.x + floatX;
      const currentY = harveyPos.current.y + floatY;

      setDisplayPos({ x: currentX, y: currentY });

      // Update nodes (drifting)
      setNodes(prev => prev.map(n => {
        let nx = n.x + n.vx;
        let ny = n.y + n.vy;
        
        // Bounce off bounds
        if (nx < 5 || nx > 95) n.vx *= -1;
        if (ny < 5 || ny > 95) n.vy *= -1;
        
        return { ...n, x: nx, y: ny };
      }));

      // Find nearest node for interaction
      let nearest: string | null = null;
      let minDist = 300; // Activation distance in pixels
      
      nodes.forEach(n => {
        const nx = (n.x / 100) * window.innerWidth;
        const ny = (n.y / 100) * window.innerHeight;
        const dist = Math.sqrt(Math.pow(currentX - nx, 2) + Math.pow(currentY - ny, 2));
        if (dist < minDist) {
          minDist = dist;
          nearest = n.id;
        }
      });

      setActiveNode(nearest);
      setIsSyncing(!!nearest);

      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos, nodes]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-slate-950">
      
      {/* Neural Network Grid with Perspective */}
      <div className="absolute inset-0 opacity-[0.05]"
           style={{
             backgroundImage: `linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)`,
             backgroundSize: '80px 80px',
             transform: 'perspective(1000px) rotateX(10deg) translateY(-100px) scale(1.5)',
             transformOrigin: 'top'
           }}>
      </div>

      {/* Floating Physics Nodes */}
      {nodes.map(node => {
        const isActive = activeNode === node.id;
        return (
          <div 
            key={node.id}
            className={`absolute transition-all duration-1000 flex flex-col items-center justify-center ${isActive ? 'scale-125 z-10' : 'scale-100 opacity-20'}`}
            style={{ 
              left: `${node.x}%`, 
              top: `${node.y}%`,
            }}
          >
            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center bg-slate-900 shadow-2xl transition-all duration-500
              ${isActive ? 'border-medical-500 text-medical-400 shadow-[0_0_30px_rgba(14,165,233,0.3)]' : 'border-slate-800 text-slate-700'}`}>
              <span className="font-display font-black text-xl">{node.symbol}</span>
            </div>
            {isActive && (
              <span className="mt-2 text-[8px] font-black uppercase text-medical-500 tracking-widest animate-pulse whitespace-nowrap">
                Analyzing {node.label}
              </span>
            )}
            
            {/* Pulsing Aura for active node */}
            {isActive && (
              <div className="absolute inset-0 bg-medical-500/10 rounded-full blur-2xl animate-pulse"></div>
            )}
          </div>
        );
      })}

      {/* Interaction Beam / Sync Line */}
      {activeNode && (
        <svg className="absolute inset-0 w-full h-full overflow-visible opacity-30">
          <defs>
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
              <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>
          {nodes.filter(n => n.id === activeNode).map(n => {
            const nx = (n.x / 100) * window.innerWidth;
            const ny = (n.y / 100) * window.innerHeight;
            return (
              <g key={n.id}>
                {/* Main Beam */}
                <line 
                  x1={displayPos.x} y1={displayPos.y} 
                  x2={nx} y2={ny} 
                  stroke="url(#beamGradient)" 
                  strokeWidth="4" 
                  strokeDasharray="10 5" 
                  className="animate-beam-flow" 
                />
                {/* Connection Glow */}
                <circle cx={nx} cy={ny} r="20" fill="rgba(45, 212, 191, 0.1)" className="animate-ping" />
              </g>
            );
          })}
        </svg>
      )}

      {/* Mini-Harvey Chassis */}
      <div 
        className="absolute transition-transform duration-300 ease-out z-20"
        style={{ 
          transform: `translate(${displayPos.x - 40}px, ${displayPos.y - 40}px)`,
        }}
      >
        <div className="relative group">
          
          {/* Harvey Head */}
          <div className={`w-24 h-20 bg-slate-950 border-2 rounded-[2rem] flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all duration-700
            ${isSyncing ? 'border-teal-400 shadow-[0_0_40px_rgba(20,184,166,0.2)]' : 'border-medical-500/20'}`}>
            
            {/* Internal Glow */}
            <div className={`absolute inset-0 opacity-10 transition-colors duration-700 rounded-[inherit]
              ${isSyncing ? 'bg-teal-400' : 'bg-medical-500'}`}></div>

            {/* Eyes */}
            <div className="flex space-x-6 mb-2 relative z-10">
              {[1, 2].map(i => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-700
                  ${isSyncing ? 'bg-teal-400 shadow-[0_0_15px_#2dd4bf]' : 'bg-medical-500 shadow-[0_0_10px_#0ea5e9]'}`}>
                  <div className="w-full h-full bg-white/20 rounded-full scale-150 animate-ping"></div>
                </div>
              ))}
            </div>

            {/* Scanning Laser Line */}
            {isSyncing && (
              <div className="absolute inset-x-2 top-0 h-0.5 bg-teal-400/80 shadow-[0_0_10px_#2dd4bf] animate-scan-y z-20"></div>
            )}

            {/* Status Panel Mini */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1">
               <div className={`px-3 py-1 rounded-full bg-slate-900/90 border border-white/5 text-[7px] font-black uppercase tracking-widest transition-all duration-500
                 ${isSyncing ? 'text-teal-400 border-teal-500/30' : 'text-slate-600'}`}>
                 {isSyncing ? 'Protocol: SYNC_ESTABLISHED' : 'Status: STANDBY'}
               </div>
               <div className="w-0.5 h-6 bg-gradient-to-b from-slate-800 to-transparent"></div>
            </div>
          </div>

          {/* Orbital Data Bits */}
          {isSyncing && [...Array(4)].map((_, i) => (
            <div key={i} className="absolute inset-0 animate-orbit" style={{ animationDuration: `${3 + i}s`, animationDelay: `${i * 0.5}s` }}>
              <div className="w-1.5 h-1.5 bg-medical-500 rounded-full absolute -top-10 left-1/2 shadow-[0_0_10px_#0ea5e9]"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Ambient Particles (Background Depth) */}
      {[...Array(15)].map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full bg-white/5 animate-ambient-float"
          style={{
            width: `${Math.random() * 10 + 2}px`,
            height: `${Math.random() * 10 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${10 + Math.random() * 20}s`,
            animationDelay: `${Math.random() * 10}s`
          }}
        ></div>
      ))}

      <style>{`
        @keyframes scan-y {
          0% { top: 15%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes beam-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ambient-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
        }
        .animate-scan-y { animation: scan-y 2s ease-in-out infinite; }
        .animate-orbit { animation: orbit linear infinite; }
        .animate-beam-flow { animation: beam-flow 2s linear infinite; }
        .animate-ambient-float { animation: ambient-float ease-in-out infinite; }
      `}</style>
    </div>
  );
};
