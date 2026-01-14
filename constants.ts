
import { Topic, TopicMetadata } from './types';

export const CURRICULUM_ORDER: Topic[] = [
  Topic.PHYSICS,
  Topic.RESOLUTION,
  Topic.PULSED_WAVE,
  Topic.TRANSDUCERS,
  Topic.INSTRUMENTATION,
  Topic.HEMODYNAMICS,
  Topic.DOPPLER,
  Topic.ARTIFACTS,
  Topic.HARMONICS,
  Topic.SAFETY,
  Topic.QA
];

export const TOPICS: Record<Topic, TopicMetadata> = {
  [Topic.PHYSICS]: {
    id: Topic.PHYSICS,
    icon: 'fa-wave-square',
    color: 'blue',
    voice: 'Zephyr',
    description: 'The foundation of ultrasound: Sound as a mechanical longitudinal wave.',
    keyConcepts: ['Compression/Rarefaction', 'Wavelength', 'Frequency', 'Attenuation'],
    subTopics: [
      { id: '1-1', title: 'Introduction to Waves', simulationId: 'WaveFoundationsVisual', description: 'Master the concept of acoustic variables. Interaction: Adjust Frequency to see wavelength compression.' },
      { id: '1-2', title: 'Essential Wave Parameters', simulationId: 'WaveParametersVisual', description: 'Explore Amplitude, Power, and Intensity relationships.' },
      { id: '1-3', title: 'Interaction with Media', simulationId: 'TissueInteractionVisual', description: 'Visualize Reflection vs. Refraction (Snell\'s Law).' }
    ]
  },
  [Topic.TRANSDUCERS]: {
    id: Topic.TRANSDUCERS,
    icon: 'fa-microscope',
    color: 'indigo',
    voice: 'Kore',
    description: 'Energy conversion: How sound is born and received.',
    keyConcepts: ['Piezoelectric Effect', 'Matching Layer', 'Backing Material', 'Focusing'],
    subTopics: [
      { id: '2-1', title: 'Transducer Components', simulationId: 'TransducerAnatomyVisual', description: 'Break down the PZT crystal, matching layer, and backing material.' },
      { id: '2-2', title: 'Array Types', simulationId: 'ArrayTypesVisual', description: 'Compare Linear, Phased, and Convex formats.' },
      { id: '2-3', title: 'Beam Focusing', simulationId: 'BeamFocusingVisual', description: 'Demonstrating electronic focusing and lateral resolution.' }
    ]
  },
  [Topic.PULSED_WAVE]: {
    id: Topic.PULSED_WAVE,
    icon: 'fa-broadcast-tower',
    color: 'cyan',
    voice: 'Charon',
    description: 'The pulse-echo principle and the math of timing.',
    keyConcepts: ['Range Equation', 'Pulse Duration', 'Duty Factor', 'PRP/PRF'],
    subTopics: [
      { id: '3-1', title: 'The Pulse-Echo Principle', simulationId: 'PulseEchoPrincipleVisual', description: 'Master the 13µs Rule and Range Equation.' }
    ]
  },
  [Topic.DOPPLER]: {
    id: Topic.DOPPLER,
    icon: 'fa-heartbeat',
    color: 'pink',
    voice: 'Puck',
    description: 'Measuring motion: Shift, aliasing, and spectral analysis.',
    keyConcepts: ['Doppler Equation', 'Nyquist Limit', 'Aliasing', 'Angle Correction'],
    subTopics: [
      { id: '4-1', title: 'The Doppler Principle', simulationId: 'DopplerPrincipleVisual', description: 'Master the angle of incidence and cosine math.' },
      { id: '4-2', title: 'Doppler Modalities', simulationId: 'DopplerModesVisual', description: 'Trade-offs of CW, PW, Color, and Power Doppler.' }
    ]
  },
  [Topic.ARTIFACTS]: {
    id: Topic.ARTIFACTS,
    icon: 'fa-ghost',
    color: 'purple',
    voice: 'Fenrir',
    description: 'Identifying imaging errors and physics "tricks".',
    keyConcepts: ['Reverberation', 'Mirror Image', 'Shadowing', 'Enhancement'],
    subTopics: [
      { id: '5-1', title: 'Propagation Group Artifacts', simulationId: 'PropagationArtifactsVisual', description: 'Visualize paths like Reverberation and Mirror Image.' },
      { id: '5-2', title: 'Attenuation Group Artifacts', simulationId: 'AttenuationArtifactsVisual', description: 'Shadows vs. Enhancement physics.' }
    ]
  },
  [Topic.SAFETY]: {
    id: Topic.SAFETY,
    icon: 'fa-shield-alt',
    color: 'orange',
    voice: 'Kore',
    description: 'Bioeffects, indices, and the ALARA principle.',
    keyConcepts: ['Thermal Index', 'Mechanical Index', 'Cavitation', 'ALARA'],
    subTopics: [
      { id: '6-1', title: 'The ALARA Principle', simulationId: 'BioeffectMechanismsVisual', description: 'Thermal heating vs. Mechanical cavitation.' },
      { id: '6-2', title: 'Safety Indices (TI and MI)', simulationId: 'SafetyIndicesVisual', description: 'TI and MI dashboard calibration.' }
    ]
  },
  [Topic.HEMODYNAMICS]: {
    id: Topic.HEMODYNAMICS,
    icon: 'fa-tint',
    color: 'red',
    voice: 'Zephyr',
    description: 'Principles of blood flow and pressure.',
    keyConcepts: ['Laminar Flow', 'Turbulence', 'Poiseuille', 'Bernoulli'],
    subTopics: [
      { id: '7-1', title: 'Flow Patterns & Resistance', simulationId: 'FlowPatternsVisual', description: 'Laminar, Turbulent, and resistance waveforms.' },
      { id: '7-2', title: 'Physical Principles', simulationId: 'PhysicalPrinciplesVisual', description: 'Poiseuille Law and Bernoulli Relationship.' }
    ]
  },
  [Topic.QA]: {
    id: Topic.QA,
    icon: 'fa-check-double',
    color: 'emerald',
    voice: 'Charon',
    description: 'Maintaining accuracy with Phantoms and testing.',
    keyConcepts: ['Dead Zone', 'Horizontal/Vertical Accuracy', 'Phantoms'],
    subTopics: [
      { id: '8-1', title: 'QA Principles & Phantoms', simulationId: 'QaPhantomVisual', description: 'Virtual phantom lab calibration.' },
      { id: '8-2', title: 'Key Performance Parameters', simulationId: 'QaPhantomVisual', description: 'Testing resolution and accuracy limits.' }
    ]
  },
  [Topic.RESOLUTION]: {
    id: Topic.RESOLUTION,
    icon: 'fa-compress-arrows-alt',
    color: 'sky',
    voice: 'Fenrir',
    description: 'Spatial detail: LARRD vs. LATA.',
    keyConcepts: ['Axial Resolution', 'Lateral Resolution', 'SPL', 'Beam Width'],
    subTopics: [
      { id: '9-1', title: 'Axial Resolution (LARRD)', simulationId: 'AxialResolutionVisual', description: 'Spatial Pulse Length vs Depth Detail.' },
      { id: '9-2', title: 'Lateral Resolution (LATA)', simulationId: 'LateralResolutionVisual', description: 'Beam width and focusing impact.' }
    ]
  },
  [Topic.HARMONICS]: {
    id: Topic.HARMONICS,
    icon: 'fa-magic',
    color: 'violet',
    voice: 'Puck',
    description: 'Exploiting non-linear propagation for cleaner images.',
    keyConcepts: ['Non-linear Propagation', 'Harmonic Frequency', 'Artifact Reduction'],
    subTopics: [
      { id: '10-1', title: 'Non-Linear Propagation', simulationId: 'NonLinearPropagationVisual', description: 'Wave distortion and harmonic creation.' },
      { id: '10-2', title: 'Tissue Harmonic Imaging', simulationId: 'HarmonicImagingVisual', description: 'Reducing near-field noise with harmonics.' }
    ]
  },
  [Topic.INSTRUMENTATION]: {
    id: Topic.INSTRUMENTATION,
    icon: 'fa-sliders-h',
    color: 'slate',
    voice: 'Zephyr',
    description: 'Processing echoes: Gain, TGC, and Display modes.',
    keyConcepts: ['Receiver Functions', 'Demodulation', 'A/B/M Mode'],
    subTopics: [
      { id: '11-1', title: 'Receiver Functions', simulationId: 'ReceiverFunctionsVisual', description: 'The signal processing pipeline flowchart.' },
      { id: '11-2', title: 'Display Modes', simulationId: 'DisplayModesVisual', description: 'A-Mode, B-Mode, and M-Mode comparison.' }
    ]
  },
  [Topic.ALL]: {
    id: Topic.ALL,
    icon: 'fa-globe-americas',
    color: 'teal',
    voice: 'Zephyr',
    description: 'Comprehensive Mock Exam covering all SPI domains.',
    keyConcepts: ['Physics', 'Transducers', 'Doppler', 'Artifacts', 'Safety'],
    subTopics: []
  }
};
