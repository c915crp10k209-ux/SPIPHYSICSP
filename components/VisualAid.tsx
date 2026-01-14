import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface VisualAidProps {
  id: string;
  caption?: string;
  initialParams?: Record<string, number>;
}

export const VisualAid: React.FC<VisualAidProps> = ({ id, caption, initialParams = {} }) => {
  const cleanId = id.toLowerCase().trim();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [params, setParams] = useState<Record<string, number>>({
    frequency: initialParams['frequency'] || 5,
    cycles: initialParams['cycles'] || 3,
    angle: initialParams['angle'] || 45,
    depth: initialParams['depth'] || 50,
    aperture: initialParams['aperture'] || 10,
    incidence: initialParams['incidence'] || 30,
    speed1: initialParams['speed1'] || 1450,
    speed2: initialParams['speed2'] || 1540,
    ...initialParams
  });
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.playClick();
    if (!document.fullscreenElement) {
        wrapperRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const updateParam = (key: string, val: number) => {
    audioService.playClick();
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const renderInteractiveDiagram = () => {
    if (cleanId.includes('wavelength') || cleanId.includes('wave')) {
      return (
        <div className="flex flex-col space-y-6">
          <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 120" className="w-full h-auto bg-black/40 rounded-3xl p-6 border border-white/5">
            <path 
              d={`M 0 60 ${Array.from({length: 40}).map((_, i) => {
                const x = i * 10;
                const y = 60 + Math.sin((x / 100) * Math.PI * params.frequency) * 25;
                return `L ${x} ${y}`;
              }).join(' ')}`} 
              fill="none" 
              stroke="#0ea5e9" 
              strokeWidth="3" 
              className="transition-all duration-300 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
            />
            <text x="10" y="20" fill="#0ea5e9" className="text-[10px] font-black uppercase font-mono">Propagation: 1540m/s</text>
            <text x="390" y="20" textAnchor="end" fill="#14b8a6" className="text-[10px] font-black uppercase font-mono">λ = {(1.54/params.frequency).toFixed(2)}mm</text>
          </svg>
          <FormulaSlider label="Frequency (MHz)" unit="MHz" value={params.frequency} min={2} max={15} step={0.5} onChange={(v) => updateParam('frequency', v)} color="text-medical-400" />
        </div>
      );
    }

    if (cleanId.includes('pzt') || cleanId.includes('transducer')) {
      const layers = [
        { id: 'backing', label: 'Backing Material', color: '#1e293b', info: 'Dampens the pulse, reducing SPL for better Axial Resolution.' },
        { id: 'pzt', label: 'PZT Crystal', color: '#0ea5e9', info: 'Converts electrical energy to mechanical sound via Piezoelectric effect.' },
        { id: 'matching', label: 'Matching Layer', color: '#14b8a6', info: 'Reduces impedance mismatch between PZT and skin.' }
      ];
      return (
        <div className="relative group">
          <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 180" className="w-full h-auto cursor-pointer">
            <rect x="50" y="30" width="100" height="120" fill={layers[0].color} onMouseEnter={() => setActiveHotspot('backing')} onMouseLeave={() => setActiveHotspot(null)} className="hover:opacity-80 transition-opacity stroke-white/10" />
            <rect x="150" y="30" width="40" height="120" fill={layers[1].color} onMouseEnter={() => setActiveHotspot('pzt')} onMouseLeave={() => setActiveHotspot(null)} className="hover:opacity-80 transition-opacity animate-pulse stroke-white/20" />
            <rect x="190" y="30" width="20" height="120" fill={layers[2].color} onMouseEnter={() => setActiveHotspot('matching')} onMouseLeave={() => setActiveHotspot(null)} className="hover:opacity-80 transition-opacity stroke-white/10" />
            <text x="100" y="165" textAnchor="middle" fill="#64748b" className="text-[9px] font-black uppercase">Dampening</text>
            <text x="170" y="25" textAnchor="middle" fill="#0ea5e9" className="text-[9px] font-black uppercase">Active Element</text>
            <text x="200" y="165" textAnchor="middle" fill="#14b8a6" className="text-[9px] font-black uppercase">Matching</text>
          </svg>
          {activeHotspot && (
            <div className="absolute top-4 right-4 w-56 bg-slate-900 border border-medical-500/40 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 z-10 backdrop-blur-md">
              <p className="text-[9px] font-black text-medical-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">{layers.find(l => l.id === activeHotspot)?.label}</p>
              <p className="text-slate-300 text-xs leading-relaxed font-sans italic">"{layers.find(l => l.id === activeHotspot)?.info}"</p>
            </div>
          )}
        </div>
      );
    }

    if (cleanId.includes('reflection') || cleanId.includes('refraction')) {
        const angleRad = (params.incidence * Math.PI) / 180;
        const refracAngleRad = Math.asin((params.speed2 / params.speed1) * Math.sin(angleRad));
        const refracDeg = (refracAngleRad * 180) / Math.PI;

        return (
            <div className="flex flex-col space-y-6">
                <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 200" className="w-full h-auto bg-black/40 rounded-3xl p-4 border border-white/5">
                    <line x1="0" y1="100" x2="400" y2="100" stroke="#334155" strokeWidth="2" strokeDasharray="5 5" />
                    <text x="390" y="90" textAnchor="end" fill="#64748b" className="text-[8px] font-black uppercase">Medium 1 ({params.speed1}m/s)</text>
                    <text x="390" y="115" textAnchor="end" fill="#64748b" className="text-[8px] font-black uppercase">Medium 2 ({params.speed2}m/s)</text>
                    <line x1="200" y1="20" x2="200" y2="180" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1={200 - Math.tan(angleRad) * 80} y1="20" x2="200" y2="100" stroke="#0ea5e9" strokeWidth="3" />
                    <text x={200 - Math.tan(angleRad) * 80} y="15" textAnchor="middle" fill="#0ea5e9" className="text-[8px] font-black">INCIDENT ({params.incidence}°)</text>
                    <line x1="200" y1="100" x2={200 + Math.tan(angleRad) * 80} y2="20" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.6" />
                    {!isNaN(refracDeg) ? (
                        <>
                            <line x1="200" y1="100" x2={200 + Math.tan(refracAngleRad) * 80} y2="180" stroke="#14b8a6" strokeWidth="3" />
                            <text x={200 + Math.tan(refracAngleRad) * 80} y="195" textAnchor="middle" fill="#14b8a6" className="text-[8px] font-black">REFRACTED ({Math.round(refracDeg)}°)</text>
                        </>
                    ) : (
                        <text x="200" y="150" textAnchor="middle" fill="#ef4444" className="text-[10px] font-black uppercase animate-pulse">Critical Angle Exceeded</text>
                    )}
                </svg>
                <div className="grid grid-cols-2 gap-4">
                    <FormulaSlider label="Incidence Angle" unit="°" value={params.incidence} min={0} max={85} step={1} onChange={(v) => updateParam('incidence', v)} color="text-medical-400" />
                    <FormulaSlider label="Med 2 Speed" unit="m/s" value={params.speed2} min={300} max={4000} step={10} onChange={(v) => updateParam('speed2', v)} color="text-teal-400" />
                </div>
            </div>
        );
    }

    if (cleanId.includes('doppler_angle') || cleanId.includes('doppler')) {
        const cosValue = Math.cos((params.angle * Math.PI) / 180);
        return (
            <div className="flex flex-col space-y-6">
                <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 150" className="w-full h-auto bg-black/40 rounded-3xl p-6 border border-white/5">
                    <rect x="0" y="60" width="400" height="30" fill="rgba(239, 68, 68, 0.1)" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
                    <line x1="50" y1="75" x2="350" y2="75" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <line 
                        x1={200 - Math.cos((params.angle * Math.PI) / 180) * 100} 
                        y1={75 - Math.sin((params.angle * Math.PI) / 180) * 100} 
                        x2="200" y2="75" 
                        stroke="#0ea5e9" strokeWidth="3" strokeDasharray="4 2" 
                    />
                    <text x="210" y="65" fill="#0ea5e9" className="text-[10px] font-black uppercase font-mono">θ = {params.angle}°</text>
                    <text x="210" y="120" fill={params.angle > 60 ? "#ef4444" : "#14b8a6"} className="text-[10px] font-black uppercase font-mono">COSINE θ = {cosValue.toFixed(2)}</text>
                    {params.angle > 60 && <text x="200" y="140" textAnchor="middle" fill="#ef4444" className="text-[8px] font-black uppercase animate-pulse">Warning: Accuracy drops above 60°</text>}
                </svg>
                <FormulaSlider label="Doppler Intercept Angle" unit="°" value={params.angle} min={0} max={90} step={1} onChange={(v) => updateParam('angle', v)} color="text-medical-400" />
            </div>
        );
    }

    if (cleanId.includes('resolution')) {
        const axialRes = 0.77 * params.cycles / params.frequency;
        return (
            <div className="flex flex-col space-y-6">
                <div className="grid grid-cols-2 gap-4 h-48">
                    <div className="bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                        <p className="absolute top-3 left-3 text-[8px] font-black text-slate-500 uppercase">Axial (Depth)</p>
                        <div className="flex flex-col space-y-4">
                            <div className="w-4 h-4 bg-teal-400 rounded-full shadow-[0_0_10px_#14b8a6]"></div>
                            <div className="w-4 h-4 bg-teal-400 rounded-full shadow-[0_0_10px_#14b8a6]" style={{ marginTop: `${Math.max(2, axialRes * 10)}px` }}></div>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-teal-400">Res: {axialRes.toFixed(2)}mm</p>
                    </div>
                    <div className="bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative">
                        <p className="absolute top-3 left-3 text-[8px] font-black text-slate-500 uppercase">Lateral (Width)</p>
                        <div className="flex space-x-4">
                            <div className="w-4 h-4 bg-medical-500 rounded-full shadow-[0_0_10px_#0ea5e9]"></div>
                            <div className="w-4 h-4 bg-medical-500 rounded-full shadow-[0_0_10px_#0ea5e9]" style={{ marginLeft: `${params.aperture}px` }}></div>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-medical-500">Res: {params.aperture.toFixed(1)}mm</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormulaSlider label="Frequency" unit="MHz" value={params.frequency} min={2} max={15} step={1} onChange={(v) => updateParam('frequency', v)} color="text-teal-400" />
                    <FormulaSlider label="Beam Diameter" unit="mm" value={params.aperture} min={2} max={20} step={1} onChange={(v) => updateParam('aperture', v)} color="text-medical-400" />
                </div>
            </div>
        );
    }

    return (
      <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
          <i className="fas fa-atom text-slate-800 text-5xl mb-6 animate-spin-slow"></i>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Awaiting Neural Link for ID: {id}</p>
      </div>
    );
  };

  return (
    <div 
      ref={wrapperRef}
      className={`my-12 p-8 md:p-10 bg-slate-900/60 border border-slate-800 backdrop-blur-xl group transition-all duration-700 ${isFullscreen ? 'fixed inset-0 z-[2000] p-12 md:p-24 overflow-y-auto bg-slate-950 rounded-none' : 'rounded-[3.5rem] shadow-2xl hover:border-medical-500/40'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-4">
           <div className="w-10 h-10 rounded-2xl bg-medical-500/10 flex items-center justify-center text-medical-500 border border-medical-500/20 shadow-lg">
              <i className="fas fa-microchip animate-pulse"></i>
           </div>
           <div>
              <h5 className="text-[10px] font-black uppercase text-medical-500 tracking-[0.3em]">{isFullscreen ? 'Immersive Lab Active' : 'Interactive Simulation'}</h5>
              <p className="text-[8px] font-bold text-slate-500 uppercase">Live Parameter Tuning Active</p>
           </div>
        </div>
        <div className="flex space-x-3 items-center">
            <button 
                onClick={toggleFullscreen}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all"
                title={isFullscreen ? "Exit Standalone Lab" : "Standalone Lab View"}
            >
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-[10px]`}></i>
            </button>
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isHovered ? 'bg-medical-400 scale-125 shadow-[0_0_10px_#0ea5e9]' : 'bg-slate-700'}`}></div>
        </div>
      </div>
      
      <div className={`relative overflow-visible ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
        {renderInteractiveDiagram()}
      </div>
      
      {caption && (
        <div className={`mt-10 p-6 bg-white/5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
            <p className="text-slate-400 text-sm font-serif italic text-center leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
               "{caption}"
            </p>
        </div>
      )}

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
      `}</style>
    </div>
  );
};

const FormulaSlider: React.FC<{ label: string; unit: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; color: string }> = ({ label, unit, value, min, max, step = 1, onChange, color }) => (
  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex-1">
    <div className="flex justify-between items-center mb-3">
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={`font-mono text-[10px] font-black ${color}`}>{value} {unit}</span>
    </div>
    <input 
      type="range" 
      min={min} max={max} step={step}
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))} 
      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
    />
  </div>
);