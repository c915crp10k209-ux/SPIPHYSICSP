
import { Topic } from '../types';

export interface StaticModule {
    summary: string;
    keyPoints: string[];
    harveyHint: string;
    fullLecture?: string;
}

export const PREGENERATED_CURRICULUM: Record<string, StaticModule> = {
    '1-1': {
        summary: "Sound is a {{Concept: Mechanical Wave}} that requires a medium.",
        keyPoints: ["Mechanical Wave", "Longitudinal Wave", "Acoustic Variables"],
        harveyHint: "Remember: Sound CANNOT travel in a vacuum. No medium, no wiggle!",
        fullLecture: `
Part 1: The First Principle
Sound is NOT like light. Light is a diva; it travels through the empty void. Sound is a social butterfly—it NEEDS molecules to bump into. 
{{Concept: Mechanical Wave | Def: A wave that requires a physical medium like tissue or water to propagate.}}
{{Concept: Longitudinal Wave | Def: Wave where particle vibration is parallel to the direction of energy travel.}}

Part 2: The Particle Dance
As sound moves through your patient, it packs molecules together and then pulls them apart.
{{Concept: Compression | Def: The high-pressure, high-density portion of a wave. | Tip: Think 'packed tight'.}}
{{Concept: Rarefaction | Def: The low-pressure, low-density portion of a wave. | Tip: Think 'relaxed space'.}}

Part 3: The Parameters
[[Diagram: wavelength | Caption: The cycle from one compression peak to the next.]]
To change detail, we change the {{Concept: Frequency | Def: Cycles per second (MHz). | Tip: High f = Sharp detail but shallow penetration.}}
`
    },
    '1-2': {
        summary: "Essential wave parameters like frequency and intensity define the beam's strength.",
        keyPoints: ["Period", "Frequency", "Amplitude", "Power"],
        harveyHint: "Intensity equals Power divided by Area. Narrow the beam, spike the intensity!",
        fullLecture: `
Part 1: The Rhythms
Every wave has a beat. {{Concept: Period | Def: The time it takes for one cycle to occur.}}
{{Concept: Frequency | Def: The number of cycles that occur in one second. | Formula: f = 1/Period.}}

Part 2: The Strength Variables
[[Diagram: wave | Caption: Visualizing the peaks of Amplitude.]]
{{Concept: Amplitude | Def: The 'bigness' of the wave. The difference between max value and average.}}
{{Concept: Power | Def: The rate of energy transfer. | Relation: Power ∝ Amplitude².}}

Part 3: Concentrated Energy
{{Concept: Intensity | Def: Concentration of energy in a beam. | Formula: I = Power / Area.}}
`
    },
    '1-3': {
        summary: "Sound interacts with tissue through reflection, refraction, and attenuation.",
        keyPoints: ["Reflection", "Refraction", "Attenuation", "Impedance"],
        harveyHint: "Reflection ONLY happens if there is an impedance mismatch and normal incidence!",
        fullLecture: `
Part 1: The Bounce Back
When sound hits a boundary, some stays and some goes.
{{Concept: Reflection | Def: Sound redirected back to the probe.}}
{{Concept: Impedance | Def: The acoustic resistance of a medium. | Formula: Z = Density × Speed.}}

Part 2: The Bend
[[Diagram: refraction | Caption: Snell's Law in action at a medium boundary.]]
{{Concept: Refraction | Def: A change in direction of wave propagation when transmitting from one medium to another.}}
Requirement: Oblique incidence and different propagation speeds.

Part 3: The Fade
{{Concept: Attenuation | Def: The weakening of sound as it travels. | Tip: Higher frequencies attenuate FASTER.}}
`
    },
    '2-1': {
        summary: "Transducers convert energy using the {{Concept: Piezoelectric Effect}}.",
        keyPoints: ["PZT Crystal", "Matching Layer", "Backing Material"],
        harveyHint: "Thinner crystals produce higher frequencies. It is an inverse relationship!",
        fullLecture: `
Part 1: The Heart of the probe
The transducer is an energy translator.
{{Concept: Piezoelectric Effect | Def: Materials creating a voltage when mechanically deformed.}}
[[Diagram: pzt | Caption: Backing, PZT, and Matching Layer.]]

Part 2: The Layers of Logic
{{Concept: Matching Layer | Def: Layer that reduces impedance mismatch between PZT and skin. | Tip: It is 1/4 wavelength thick.}}
{{Concept: Backing Material | Def: Material bonded to the crystal to dampen ringing. | Tip: This improves Axial Resolution.}}
`
    },
    '2-2': {
        summary: "Modern arrays use electronic phasing for steering and focusing.",
        keyPoints: ["Linear Array", "Phased Array", "Convex Array"],
        harveyHint: "Phased arrays use tiny time delays to steer the beam. No moving parts!",
        fullLecture: `
Part 1: The Array Matrix
Old school probes used one crystal. Modern ones use hundreds.
{{Concept: Linear Sequenced Array | Def: Elements fired in small groups to create a rectangular image.}}
{{Concept: Phased Array | Def: All elements fired nearly simultaneously with miniscule time delays.}}

Part 2: Beam Steering
[[Diagram: wave | Caption: Electronic steering via 'slope' delays.]]
By changing the 'slope' of the electrical spikes, we steer the beam left or right.

Part 3: Beam Focusing
By changing the 'curvature' of the spikes, we focus the beam shallow or deep.
`
    },
    '2-3': {
        summary: "Electronic focusing uses curvature in firing patterns to narrow the beam.",
        keyPoints: ["Beam Former", "Phased Focusing", "Focus Zone"],
        harveyHint: "To focus deep, use a slight curve. To focus shallow, use a steep curve!",
        fullLecture: `
Part 1: The Beam Former
This is the "Brain" of the transducer.
{{Concept: Beam Former | Def: Electronic component that creates the firing patterns for array transducers.}}
[[Diagram: pzt | Caption: Array elements firing with specific delays.]]

Part 2: Electronic Curvature
To create a focus, we don't fire the crystals in a flat line. We fire the outer ones first.
{{Concept: Electronic Focusing | Def: Using time delays to create a curved wavefront that converges at a focal point.}}

Part 3: The Result
Narrower beams mean better {{Concept: Lateral Resolution}}.
`
    },
    '3-1': {
        summary: "The Pulse-Echo principle defines how machines calculate distance.",
        keyPoints: ["13µs Rule", "Range Equation", "Go-Return Time"],
        harveyHint: "At 13 microseconds, the reflector is 1cm deep. At 26, it is 2cm deep!",
        fullLecture: `
Part 1: The Timer
The machine doesn't know "depth"—it only knows "time."
{{Concept: Time-of-Flight | Def: The elapsed time from pulse creation to pulse reception.}}
[[Diagram: wave | Caption: The 13µs Rule visual.]]

Part 2: The Range Equation
Distance = (Speed × Time) / 2. We divide by 2 because the sound goes there and back.
{{Concept: Range Equation | Def: Mathematical formula determining reflector depth based on time.}}

Part 3: The Rule of 13
{{Concept: 13µs Rule | Def: In soft tissue, it takes 13µs of go-return time for every 1cm of reflector depth.}}
`
    },
    '4-1': {
        summary: "The Doppler principle measures frequency shifts from moving reflectors.",
        keyPoints: ["Doppler Equation", "Cosine Theta", "Frequency Shift"],
        harveyHint: "If the angle is 90 degrees, the Doppler shift is ZERO. Always steer your box!",
        fullLecture: `
Part 1: The Shift
Moving red blood cells change the sound's pitch.
{{Concept: Doppler Shift | Def: The difference between transmitted and received frequencies.}}
Toward transducer = Positive shift (Higher pitch). Away = Negative shift.

Part 2: The Math of Motion
[[Diagram: doppler_angle | Caption: The intercept angle determines accuracy.]]
{{Concept: Cosine Theta | Def: The mathematical correction for the angle of the beam vs the flow.}}
Best angle = 0° (Cos 1.0). Worst angle = 90° (Cos 0.0).

Part 3: The Target
We use Doppler to measure VELOCITY, not just speed. Velocity is speed AND direction.
`
    },
    '4-2': {
        summary: "PW vs CW Doppler: Understanding Aliasing and Range Ambiguity.",
        keyPoints: ["Aliasing", "Nyquist Limit", "Spectral Broadening"],
        harveyHint: "CW Doppler has NO aliasing, but also NO depth information!",
        fullLecture: `
Part 1: Pulsed Wave (PW)
{{Concept: Range Resolution | Def: The ability to select exact depths for Doppler measurement.}}
[[Diagram: doppler | Caption: PW Sample volume placement.]]

Part 2: The Limit
PW Doppler has a speed limit called the {{Concept: Nyquist Limit}}.
{{Concept: Aliasing | Def: Wrap-around artifact where high velocities appear as flow in the opposite direction.}}
Rule: Nyquist = PRF / 2.

Part 3: Continuous Wave (CW)
CW uses two crystals: one always talking, one always listening.
{{Concept: Range Ambiguity | Def: Inability to determine where along the beam a signal originated.}}
`
    },
    '5-1': {
        summary: "Propagation artifacts occur when sound takes an unexpected path.",
        keyPoints: ["Reverberation", "Mirror Image", "Comet Tail"],
        harveyHint: "Mirror images always appear DEEPER than the true structure!",
        fullLecture: `
Part 1: The Ping-Pong Effect
Sometimes sound bounces back and forth between two strong reflectors.
{{Concept: Reverberation | Def: Multiple, equally spaced echoes appearing deeper than the true reflector.}}
[[Diagram: wave | Caption: Reverberation 'ladder' echoes.]]

Part 2: The Duplicate
{{Concept: Mirror Image | Def: Sound reflects off a strong specular reflector and is redirected to a structure, creating a duplicate.}}
Key SPI Fact: The artifact is always deeper than the real thing.

Part 3: Comet Tail
{{Concept: Comet Tail | Def: A solid echogenic line directed downward; a form of reverberation from small metallic or calcified objects.}}
`
    },
    '5-2': {
        summary: "Attenuation artifacts result from excessive or insufficient signal loss.",
        keyPoints: ["Shadowing", "Enhancement", "Edge Shadow"],
        harveyHint: "Enhancement happens behind structures with abnormally LOW attenuation!",
        fullLecture: `
Part 1: The Shadow
When a structure absorbs too much sound, the area behind it is dark.
{{Concept: Shadowing | Def: Anechoic or hypoechoic region extending downward from a highly attenuating structure.}}
[[Diagram: wave | Caption: Posterior shadowing from a gallstone.]]

Part 2: The Brightness
{{Concept: Enhancement | Def: Hyperechoic region beneath a structure with low attenuation, like a cyst.}}
Clinical Tip: This is a diagnostic sign of a fluid-filled structure.

Part 3: Refraction Shadows
{{Concept: Edge Shadow | Def: Shadowing extending from the edges of a curved reflector due to beam divergence.}}
`
    },
    '6-1': {
        summary: "Bioeffects are the effects of ultrasound on biological tissue.",
        keyPoints: ["Cavitation", "Thermal", "Stable vs Transient"],
        harveyHint: "Transient cavitation is more dangerous. Think 'Implosion'!",
        fullLecture: `
Part 1: Heat Production
Sound energy is converted to heat as it travels.
{{Concept: Thermal Bioeffects | Def: Tissue heating resulting from the absorption of acoustic energy.}}
Temperature rises above 2°C are considered significant.

Part 2: The Bubbles
{{Concept: Cavitation | Def: Interaction of sound waves with microscopic gas bubbles in tissue.}}
[[Diagram: wave | Caption: Bubble oscillation in a sound field.]]

Part 3: Stable vs Transient
{{Concept: Transient Cavitation | Def: Bubbles burst, creating localized high temperatures and shock waves.}}
`
    },
    '6-2': {
        summary: "Safety Indices help sonographers manage bioeffect risks.",
        keyPoints: ["TI", "MI", "ALARA"],
        harveyHint: "Always maximize GAIN before maximizing POWER to keep TI/MI low!",
        fullLecture: `
Part 1: Thermal Index (TI)
{{Concept: Thermal Index | Def: Ratio of acoustic power to the power required to raise tissue temp by 1°C.}}
TIS (Soft tissue), TIB (Bone), TIC (Cranial).

Part 2: Mechanical Index (MI)
{{Concept: Mechanical Index | Def: Estimate of the likelihood of cavitation bioeffects.}}
[[Diagram: wave | Caption: Higher power and lower frequency = Higher MI.]]

Part 3: The Golden Rule
{{Concept: ALARA | Def: As Low As Reasonably Achievable. Minimize power, maximize gain.}}
`
    },
    '7-1': {
        summary: "Hemodynamics describes the physical principles of blood flow.",
        keyPoints: ["Laminar Flow", "Turbulence", "Pressure Gradients"],
        harveyHint: "Turbulent flow is often found distal to a stenosis. Look for spectral broadening!",
        fullLecture: `
Part 1: The Smooth Path
Blood usually travels in layers that don't mix.
{{Concept: Laminar Flow | Def: Fluid particles move in parallel layers. | Types: Plug and Parabolic.}}
[[Diagram: wave | Caption: Parabolic flow with highest speed in the center.]]

Part 2: The Chaos
{{Concept: Turbulence | Def: Chaotic flow patterns in many directions and speeds.}}
Often associated with cardiovascular disease or high velocities.

Part 3: Energy Loss
{{Concept: Viscosity | Def: The 'thickness' of a fluid. | Tip: High viscosity (polycythemia) loses more energy.}}
`
    },
    '7-2': {
        summary: "Poiseuille and Bernoulli define the relationship between pressure and flow.",
        keyPoints: ["Bernoulli Principle", "Poiseuille Law", "Pressure-Velocity Relationship"],
        harveyHint: "Bernoulli says: Where velocity is HIGHEST (at a stenosis), pressure is LOWEST!",
        fullLecture: `
Part 1: The Energy Balance
{{Concept: Bernoulli Principle | Def: Relationship between pressure and velocity in moving fluid.}}
Total energy must be conserved. If kinetic energy (velocity) goes up, potential energy (pressure) must go down.

Part 2: The Flow Equation
[[Diagram: wave | Caption: Vessel radius is the most powerful factor in flow.]]
{{Concept: Poiseuille Law | Def: Defines the relationship between pressure, volume flow, and resistance.}}
Radius is raised to the 4th power! Small radius change = HUGE flow change.

Part 3: Resistance
{{Concept: Peripheral Resistance | Def: The opposition to flow. | Tip: Arterioles are the primary resistance vessels.}}
`
    },
    '8-1': {
        summary: "QA ensures the machine is performing at factory specifications.",
        keyPoints: ["Phantom Lab", "Dead Zone", "Vertical Accuracy"],
        harveyHint: "The 'Dead Zone' is the region closest to the probe where no data is seen. Use a stand-off pad!",
        fullLecture: `
Part 1: The Truth in Phantoms
Machines lie. {{Concept: Quality Assurance | Def: The routine periodic evaluation of an ultrasound system.}} keeps them honest.
We use a {{Concept: Tissue Mimicking Phantom | Def: A device with ultrasonic features similar to soft tissue.}} to test accuracy.

Part 2: The Parameters of Trust
{{Concept: Dead Zone | Def: Region close to the transducer where images are inaccurate. | Tip: Caused by the time it takes the crystal to switch from talk to listen.}}
[[Diagram: wave | Caption: Measuring distance accuracy on a phantom grid.]]

Part 3: Vertical vs Horizontal
{{Concept: Registration Accuracy | Def: Ability of the system to place echoes in the proper position while scanning from different orientations.}}
`
    },
    '8-2': {
        summary: "Measuring the performance limits of the ultrasound system.",
        keyPoints: ["Sensitivity", "Resolution Testing", "Mock Exam Ready"],
        harveyHint: "Maximum sensitivity is tested by setting gain to max and imaging deep structures!",
        fullLecture: `
Part 1: Sensitivity
{{Concept: Sensitivity | Def: Ability of a system to display low-level echoes.}}
Normal vs Maximum Sensitivity.

Part 2: Detail Resolution
We use pin targets in the phantom to test {{Concept: Axial Resolution}} and {{Concept: Lateral Resolution}}.
[[Diagram: resolution | Caption: Pin targets on a phantom display.]]

Part 3: Slice Thickness
{{Concept: Elevational Resolution | Def: Detail resolution in the plane perpendicular to the imaging plane.}}
Determined by the thickness of the imaging slice.
`
    },
    '9-1': {
        summary: "Axial resolution (LARRD) depends on spatial pulse length.",
        keyPoints: ["SPL", "LARRD", "Dampening"],
        harveyHint: "Damping material shortens the pulse, which IMPROVES axial resolution.",
        fullLecture: `
Part 1: Front-to-Back
{{Concept: Axial Resolution | Def: Resolve structures parallel to the beam. | Formula: AR = SPL / 2.}}
Synonyms: LARRD (Longitudinal, Axial, Range, Radial, Depth).

Part 2: The SPL Factor
[[Diagram: resolution | Caption: Shorter pulses can resolve closer targets.]]
To get a better image, we need a SHORTER pulse. 
{{Concept: Spatial Pulse Length | Def: The length of the pulse in space.}}

Part 3: Frequency Impact
Higher frequency = shorter wavelength = shorter SPL = BETTER Axial Resolution.
`
    },
    '9-2': {
        summary: "Lateral resolution (LATA) depends on the beam's width.",
        keyPoints: ["Beam Width", "Focal Zone", "Focusing"],
        harveyHint: "Lateral resolution changes with depth. It is ALWAYS best at the focus!",
        fullLecture: `
Part 1: Side-to-Side
{{Concept: Lateral Resolution | Def: Resolve structures perpendicular to the beam.}}
Synonyms: LATA (Lateral, Angular, Transverse, Azimuthal).

Part 2: Beam Profile
[[Diagram: resolution | Caption: The beam is hourglass shaped.]]
Lateral resolution equals the beam diameter. 
{{Concept: Focal Zone | Def: The narrowest part of the beam.}}

Part 3: Focusing
We focus the beam to narrow it. Narrower beam = BETTER Lateral Resolution.
`
    },
    '10-1': {
        summary: "Non-linear propagation creates the 'magic' of harmonics.",
        keyPoints: ["Wave Distortion", "Second Harmonic", "Artifact Reduction"],
        harveyHint: "Harmonics are created in the TISSUE, not the transducer!",
        fullLecture: `
Part 1: The Fast and the Slow
Sound doesn't travel at a constant speed within a single cycle. It moves faster in compressions and slower in rarefactions. 
{{Concept: Non-Linear Propagation | Def: The distortion of a sound wave as it travels through tissue.}}

Part 2: The Harmonic Result
This distortion creates the {{Concept: Harmonic Frequency | Def: Twice the fundamental frequency. | Tip: Transmit at 2MHz, listen at 4MHz.}}
[[Diagram: wave | Caption: The wave 'leaning' forward as it distorts.]]

Part 3: Cleaner Images
Harmonics travel deeper and have less near-field artifact.
`
    },
    '10-2': {
        summary: "Pulse Inversion and Power Moduration: Advancing Harmonic technology.",
        keyPoints: ["Pulse Inversion", "Noise Cancellation", "Frame Rate"],
        harveyHint: "Pulse inversion improves detail but reduces TEMPORAL resolution!",
        fullLecture: `
Part 1: Pulse Inversion
Two pulses are sent down each scan line. The second is an exact "inverse" of the first.
{{Concept: Pulse Inversion Harmonics | Def: Technique where positive and negative pulses cancel fundamental echoes and leave only harmonics.}}

Part 2: The Benefit
[[Diagram: wave | Caption: Cancellation of fundamental frequencies.]]
This creates a much cleaner, higher contrast image by removing "noise."

Part 3: The Cost
Sending two pulses takes twice the time. {{Concept: Temporal Resolution}} is halved.
`
    },
    '11-1': {
        summary: "The Receiver pipeline: Gain, TGC, Compression, Demodulation, Reject.",
        keyPoints: ["Alphabetical Order", "TGC Slope", "Demodulation"],
        harveyHint: "Demodulation cannot be adjusted by the sonographer. It is automatic!",
        fullLecture: `
Part 1: The Pipeline
Echoes come back weak. The receiver fixes them in 5 specific steps.
1. {{Concept: Amplification | Def: Also called Gain. All signals are made bigger equally.}}
2. {{Concept: Compensation | Def: Also called TGC. Makes the image uniform from top to bottom.}}

Part 2: The Logics
3. {{Concept: Compression | Def: Reduces the range of signals to something the display can handle without changing the rank.}}
[[Diagram: wave | Caption: The TGC curve compensating for attenuation with depth.]]

Part 3: Final Steps
4. {{Concept: Demodulation | Def: Rectification and Smoothing of the signal.}}
5. {{Concept: Reject | Def: Eliminating low-level noise.}}
`
    },
    '11-2': {
        summary: "Understanding A-Mode, B-Mode, and M-Mode displays.",
        keyPoints: ["A-Mode: Amplitude", "B-Mode: Brightness", "M-Mode: Motion"],
        harveyHint: "M-Mode is the only one that provides a high-sampling record of motion over time!",
        fullLecture: `
Part 1: A-Mode (Amplitude)
Looks like a skyline. Height of the spike = strength of the echo.
{{Concept: A-Mode | Def: Amplitude mode; used primarily in ophthalmology.}}

Part 2: B-Mode (Brightness)
This is our standard 2D image. Strength of echo = brightness of the dot.
{{Concept: B-Mode | Def: Brightness mode; the basis for all real-time gray scale imaging.}}
[[Diagram: wave | Caption: B-mode dots forming a gray scale image.]]

Part 3: M-Mode (Motion)
A group of dots moving over time.
{{Concept: M-Mode | Def: Motion mode; used to evaluate heart valve motion and fetal heart rate.}}
`
    }
};
