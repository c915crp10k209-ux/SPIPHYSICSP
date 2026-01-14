
import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../services/audioService';

interface SimulationStageProps {
  simulationId: string;
  isExpanded?: boolean;
  onChallengeProgress?: (challengeId: string) => void;
}

interface ControlConfig {
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  icon: string;
  step?: number;
}

export const SimulationStage: React.FC<SimulationStageProps> = ({ simulationId, isExpanded = false, onChallengeProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const getControls = (): { primary: ControlConfig; secondary: ControlConfig, extra?: ControlConfig } => {
    switch (simulationId) {
      case 'FlowPatternsVisual':
        return {
          primary: { label: 'Inlet Velocity', min: 10, max: 200, defaultValue: 60, icon: 'fa-tachometer-alt', step: 5 },
          secondary: { label: 'Stenosis %', min: 0, max: 90, defaultValue: 0, icon: 'fa-compress-alt', step: 10 },
          extra: { label: 'Vessel Radius', min: 10, max: 30, defaultValue: 20, icon: 'fa-circle-notch', step: 2 }
        };
      case 'LateralResolutionVisual':
        return {
          primary: { label: 'Focus Depth', min: 20, max: 180, defaultValue: 80, icon: 'fa-eye', step: 5 },
          secondary: { label: 'Pin Spacing', min: 2, max: 20, defaultValue: 10, icon: 'fa-ruler-horizontal', step: 1 },
          extra: { label: 'Frequency', min: 2, max: 15, defaultValue: 5, icon: 'fa-wave-square', step: 1 }
        };
      case 'TissueInteractionVisual':
        return {
          primary: { label: 'Frequency', min: 1, max: 15, defaultValue: 3, icon: 'fa-wave-square', step: 0.5 },
          secondary: { label: 'Med 2 Density', min: 0.5, max: 2, defaultValue: 1.05, icon: 'fa-layer-group', step: 0.05 },
          extra: { label: 'Incident Angle', min: 0, max: 80, defaultValue: 0, icon: 'fa-compass', step: 5 }
        };
      case 'WaveFoundationsVisual':
        return {
          primary: { label: 'Frequency (MHz)', min: 1, max: 15, defaultValue: 5, icon: 'fa-wave-square', step: 0.1 },
          secondary: { label: 'Amplitude', min: 5, max: 50, defaultValue: 25, icon: 'fa-arrows-alt-v', step: 1 },
          extra: { label: 'Pulse Cycles', min: 1, max: 10, defaultValue: 3, icon: 'fa-redo', step: 1 }
        };
      case 'AxialResolutionVisual':
        return {
          primary: { label: 'Cycles', min: 2, max: 6, defaultValue: 3, icon: 'fa-redo', step: 1 },
          secondary: { label: 'Frequency', min: 2, max: 15, defaultValue: 5, icon: 'fa-wave-square', step: 1 },
          extra: { label: 'Spacing', min: 0.1, max: 3, defaultValue: 1, icon: 'fa-ruler-horizontal', step: 0.1 }
        };
      default:
        return {
          primary: { label: 'Primary Control', min: 1, max: 100, defaultValue: 50, icon: 'fa-cog', step: 1 },
          secondary: { label: 'Secondary Control', min: 1, max: 100, defaultValue: 50, icon: 'fa-sliders-h', step: 1 }
        };
    }
  };

  const controls = getControls();
  const [primary, setPrimary] = useState(controls.primary.defaultValue);
  const [secondary, setSecondary] = useState(controls.secondary.defaultValue);
  const [extra, setExtra] = useState(controls.extra?.defaultValue || 50);
  const [isPaused, setIsPaused] = useState(false);
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [logicExplanation, setLogicExplanation] = useState<string>('');
  const particlesRef = useRef<{ x: number, y: number, vx: number, vy: number, ox: number, oy: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resizeCanvas = () => {
      if (containerRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = containerRef.current.clientWidth * dpr;
        canvas.height = containerRef.current.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${containerRef.current.clientWidth}px`;
        canvas.style.height = `${containerRef.current.clientHeight}px`;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 400; i++) {
        particlesRef.current.push({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, ox: Math.random(), oy: Math.random() });
      }
    }

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      if (!isPaused) time += 0.016;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      let currentTelemetry: string[] = [];
      let currentLogic = '';

      // --- 1. HEMODYNAMICS (FlowPatternsVisual) ---
      if (simulationId === 'FlowPatternsVisual') {
        const v_in = primary;
        const s_pct = secondary / 100;
        const radius = extra;
        const v_jet = v_in / Math.max(0.01, 1 - s_pct);
        const reynolds = (v_jet * radius) / 10;
        const isTurbulent = reynolds > 2000;
        
        currentTelemetry = [`Inlet: ${v_in}cm/s`, `Jet: ${Math.round(v_jet)}cm/s`, `Re#: ${Math.round(reynolds)}` ];
        currentLogic = s_pct > 0 
            ? `Bernoulli's Law: As the area decreases (stenosis), velocity increases. Kinetic energy rises as potential energy (pressure) falls.`
            : `Poiseuille Flow: Under normal conditions, flow is parabolic. Resistance is proportional to viscosity and length.`;

        ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, h/2 - radius*3);
        ctx.bezierCurveTo(w/2 - 40, h/2 - radius*3, w/2 - 20, h/2 - radius*3 * (1-s_pct), w/2, h/2 - radius*3 * (1-s_pct));
        ctx.bezierCurveTo(w/2 + 20, h/2 - radius*3 * (1-s_pct), w/2 + 40, h/2 - radius*3, w, h/2 - radius*3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, h/2 + radius*3);
        ctx.bezierCurveTo(w/2 - 40, h/2 + radius*3, w/2 - 20, h/2 + radius*3 * (1-s_pct), w/2, h/2 + radius*3 * (1-s_pct));
        ctx.bezierCurveTo(w/2 + 20, h/2 + radius*3 * (1-s_pct), w/2 + 40, h/2 + radius*3, w, h/2 + radius*3);
        ctx.stroke();

        particlesRef.current.forEach((p) => {
          const areaRatio = p.x > 0.4 && p.x < 0.6 ? (1 - s_pct) : 1;
          p.x += ((v_in / 100) / areaRatio) * (isPaused ? 0 : 1);
          if (p.x > 1) p.x = 0;
          let py = h/2 + (p.oy - 0.5) * radius * 6 * areaRatio;
          if (isTurbulent && p.x > 0.6) py += Math.sin(time * 20 + p.x * 50) * 10 * (p.x - 0.6);
          ctx.fillStyle = p.x > 0.4 && p.x < 0.6 ? '#f87171' : '#ef4444';
          ctx.beginPath(); ctx.arc(p.x * w, py, 1.2, 0, Math.PI * 2); ctx.fill();
        });
      }

      // --- 2. LATERAL RESOLUTION (LateralResolutionVisual) ---
      else if (simulationId === 'LateralResolutionVisual') {
        const focus = primary;
        const spacing = secondary;
        const freq = extra;
        currentTelemetry = [`Focus: ${focus}mm`, `Freq: ${freq}MHz`, `Spacing: ${spacing}mm` ];
        currentLogic = `LATA Resolution: Equal to the beam width at a given depth. It is numerically smallest (best) at the focal zone.`;

        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)'; ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(w/2 - 60, 20); ctx.quadraticCurveTo(w/2 - 5, focus, w/2 - 40, h - 20);
        ctx.moveTo(w/2 + 60, 20); ctx.quadraticCurveTo(w/2 + 5, focus, w/2 + 40, h - 20);
        ctx.stroke(); ctx.setLineDash([]);

        [40, focus, h - 60].forEach((depth, idx) => {
          const distToFocus = Math.abs(depth - focus);
          const beamWidthAtDepth = 10 + (distToFocus * 0.5) / (freq / 5);
          const canResolve = spacing > beamWidthAtDepth;
          ctx.fillStyle = canResolve ? '#14b8a6' : '#ef4444';
          ctx.globalAlpha = idx === 1 ? 1 : 0.4;
          ctx.beginPath(); ctx.arc(w/2 - spacing/2, depth, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(w/2 + spacing/2, depth, 3, 0, Math.PI*2); ctx.fill();
          if (!canResolve) ctx.fillRect(w/2 - spacing/2, depth - 1, spacing, 2);
        });
        ctx.globalAlpha = 1;
      }

      // --- 3. AXIAL RESOLUTION (LARRD) ---
      else if (simulationId === 'AxialResolutionVisual') {
          const cycles = primary;
          const freq = secondary;
          const spacing = extra;
          const wavelength = 1.54 / freq;
          const spl = cycles * wavelength;
          const axialRes = spl / 2;
          const canResolve = spacing > axialRes;

          currentTelemetry = [`SPL: ${spl.toFixed(2)}mm`, `AR (SPL/2): ${axialRes.toFixed(2)}mm` ];
          currentLogic = `LARRD: Axial resolution = Spatial Pulse Length / 2. Shorter pulses (higher frequency) yield better detail along the beam axis.`;

          // Targets
          ctx.fillStyle = canResolve ? '#14b8a6' : '#ef4444';
          ctx.beginPath(); ctx.arc(w/2, h/2 - (spacing * 20), 8, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(w/2, h/2 + (spacing * 20), 8, 0, Math.PI*2); ctx.fill();

          // Pulse
          ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 3;
          ctx.beginPath();
          const pulseX = (time * 150) % w;
          for(let i=0; i<spl*40; i++) {
              const x = pulseX + i;
              const y = h/2 + Math.sin(i * 0.5) * 20 * (1 - i/(spl*40));
              if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
      }

      // --- 4. ATTENUATION MATRIX (TissueInteractionVisual) ---
      else if (simulationId === 'TissueInteractionVisual') {
        const freq = primary;
        const attenCoeff = 0.5 * freq;
        currentTelemetry = [`Atten Coeff: ${attenCoeff.toFixed(2)} dB/cm`, `θ: ${Math.round(extra)}°` ];
        currentLogic = `Attenuation Law: Total loss in dB equals 0.5 × Frequency (MHz) × Path Length (cm). Higher frequencies attenuate faster.`;

        ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const amplitude = (h/5) * Math.exp(-0.005 * attenCoeff * x);
          const y = h/2 + Math.sin(x * 0.1 + time * 5) * amplitude;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // --- FALLBACK: WAVE FOUNDATIONS ---
      else {
        const freq = primary;
        const wavelength = 1.54 / freq;
        currentLogic = `Wave Foundation: λ = Speed (1.54) / Frequency. A wave is a cyclic transfer of energy through a medium via pressure oscillations.`;
        ctx.fillStyle = '#0ea5e9';
        particlesRef.current.forEach((p) => {
          const baseX = p.ox! * w;
          const baseY = p.oy! * h * 0.5 + h * 0.25;
          const x = baseX + Math.sin((baseX / (wavelength * 50)) - (time * 10)) * secondary;
          ctx.beginPath(); ctx.arc(x, baseY, 1.2, 0, Math.PI * 2); ctx.fill();
        });
      }

      setTelemetry(currentTelemetry);
      setLogicExplanation(currentLogic);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resizeCanvas); };
  }, [simulationId, primary, secondary, extra, isPaused]);

  return (
    <div className="w-full h-full bg-slate-950 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden relative shadow-2xl border-2 border-slate-900 flex flex-col group">
      
      {/* Enhanced Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col pointer-events-none gap-2 max-w-[220px] md:max-w-[300px]">
        <div className="bg-black/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto">
            <h5 className="text-[8px] font-black text-medical-500 uppercase tracking-widest border-b border-white/5 pb-1 mb-2 flex items-center gap-2">
                <i className="fas fa-brain animate-pulse"></i> Neural Analytics
            </h5>
            <div className="space-y-1 mb-3">
                {telemetry.map((t, i) => (
                    <div key={i} className="text-white font-mono text-[9px] leading-tight flex justify-between">
                        <span className="text-slate-500">{t.split(':')[0]}:</span>
                        <span className="font-black ml-2">{t.split(':')[1]}</span>
                    </div>
                ))}
            </div>
            <div className="p-2 bg-medical-500/5 rounded-xl border border-medical-500/10">
                <p className="text-medical-400 text-[8px] font-bold leading-relaxed italic">
                    "{logicExplanation}"
                </p>
            </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative min-h-0 bg-[#020617]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Lab Controls Tray - Adaptive Grid with explicit spacing for mobile */}
      <div className="p-4 md:p-6 bg-slate-900/95 border-t border-slate-800 flex flex-col md:grid md:grid-cols-12 gap-6 backdrop-blur-xl">
        <div className="md:col-span-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SimControl config={controls.primary} value={primary} onChange={setPrimary} />
          <SimControl config={controls.secondary} value={secondary} onChange={setSecondary} />
          {controls.extra && <SimControl config={controls.extra} value={extra} onChange={setExtra} />}
        </div>
        <div className="md:col-span-2 flex items-center justify-center md:border-l border-slate-800 md:pl-4 mt-4 md:mt-0">
            <button 
                onClick={() => { audioService.playClick(); setIsPaused(!isPaused); }} 
                className={`w-full md:w-16 h-12 md:h-16 rounded-2xl border transition-all flex items-center justify-center ${isPaused ? 'bg-medical-500 text-white border-medical-400 shadow-lg' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'}`}
                title={isPaused ? "Resume Protocol" : "Pause Protocol"}
            >
                <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'} text-lg`}></i>
            </button>
        </div>
      </div>
    </div>
  );
};

const SimControl: React.FC<{ config: ControlConfig, value: number, onChange: (v: number) => void }> = ({ config, value, onChange }) => {
    const lastTickValue = useRef(value);

    const handleInteraction = (val: number) => {
        // Procedural Audio Tick Logic
        if (Math.abs(val - lastTickValue.current) >= (config.step || 1)) {
            audioService.playTick();
            lastTickValue.current = val;
        }
        onChange(val);
    };

    return (
        <div className="group/ctrl flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1.5 px-1">
                <div className="flex items-center gap-2 overflow-hidden">
                    <i className={`fas ${config.icon} text-[9px] text-slate-500 group-hover/ctrl:text-medical-400 transition-colors shrink-0`}></i>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest truncate">{config.label}</span>
                </div>
                <span className="text-[8px] font-mono font-bold text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                </span>
            </div>
            <input 
                type="range" 
                min={config.min} 
                max={config.max} 
                step={config.step || 1} 
                value={value} 
                onChange={(e) => handleInteraction(parseFloat(e.target.value))} 
                className="w-full accent-medical-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer hover:bg-slate-700 transition-colors" 
            />
        </div>
    );
};
