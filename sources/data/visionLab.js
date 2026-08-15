/**
 * Instruments in the computer vision lab.
 *
 * Each entry is one interactive point and the page it opens. Everything here
 * comes from the Max Planck workstreams in the master profile. No research
 * results are described, because none of the outputs are mine to publish.
 */

const ACCENT = '#5fd2ff'

export default [
    {
        label: 'Camera System',
        offset: { x: 0, z: -8.2 },
        role: 'Max Planck Institute for Intelligent Systems',
        title: 'Multi-camera motion capture',
        sections: [
            {
                accent: ACCENT,
                kicker: 'Workstream  ·  capture hardware',
                title: 'Calibrating and running the volume',
                lines: [
                    'Calibrated and operated a multi-camera motion capture system, Vicon Nexus, including the Vicon software.',
                    'Worked under both marker-based and minimal-clothing capture protocols.',
                    'Ran and recorded capture sessions under study protocol.',
                    'Processed and cleaned raw capture data to reduce noise artifacts and improve tracking consistency.'
                ],
                chips: [ 'Vicon Nexus', 'Camera calibration', 'Multi-camera systems', 'Keypoint tracking' ]
            }
        ]
    },
    {
        label: '3D Body',
        offset: { x: 3.2, z: 2.6 },
        role: 'Max Planck Institute for Intelligent Systems',
        title: 'SMPL-X and 3D body reconstruction',
        sections: [
            {
                accent: ACCENT,
                kicker: 'Workstream  ·  computer vision research',
                title: 'Reconstruction from many viewpoints',
                lines: [
                    'Supported multiple computer vision research projects alongside PhD researchers.',
                    'Worked with SMPL-X parametric body modelling.',
                    'Contributed to MAMA, Markerless Accurate Multi-person Motion Acquisition.',
                    'Built computer vision pipelines and a real-time viewer for 3D body reconstruction from multi-camera setups, including keypoint tracking and multi-perspective 3D representation.',
                    'Supported PhD research on audio-driven 3D face reconstruction, collecting and preparing multimodal audio and 3D capture data for training and evaluation.'
                ],
                chips: [ 'SMPL-X', 'MAMA', '3D reconstruction', 'Real-time viewer' ]
            },
            {
                accent: ACCENT,
                kicker: 'Note',
                title: 'About this hologram',
                lines: [
                    'The figure above the platform is a suggestion, not a real body model. It is a point cloud generated in the browser, since the actual parametric models are not mine to publish.'
                ]
            }
        ]
    },
    {
        label: 'Scanner',
        offset: { x: -3.4, z: 2.6 },
        role: 'Max Planck Institute for Intelligent Systems',
        title: '3D and 4D full-body scanning',
        sections: [
            {
                accent: ACCENT,
                kicker: 'Workstream  ·  capture hardware',
                title: 'Static and dynamic capture',
                lines: [
                    'Operated a 3D scanner and a 4D full-body scanner, including complex dynamic capture sessions.',
                    'Contributed to a biomechanics research study on the effect of high heels on the female body, working with medical-related data of female participants under study protocol.',
                    'Prepared the resulting data for analysis and modelling.'
                ],
                chips: [ '3D scanning', '4D scanning', 'Biomechanics study', 'Capture protocol' ]
            }
        ]
    },
    {
        label: 'Workstation',
        offset: { x: -6.0, z: 4.2 },
        role: 'Max Planck Institute for Intelligent Systems',
        title: 'Research tooling and evaluation',
        sections: [
            {
                accent: ACCENT,
                kicker: 'Workstream  ·  internal software',
                title: 'Pipelines, services and model integration',
                lines: [
                    'Collected, organised and cleaned capture data into a structured data pipeline for downstream research use.',
                    'Developed backend services and internal web tooling with Flask, exposing research pipelines through a usable interface.',
                    'Ran containerized Docker backend services on Linux, staged incrementally across 2D, 3D and visualization components to isolate faults and ease debugging.',
                    'Integrated ML models into a live internal service so newly uploaded capture data is processed and reflected automatically, covering the full path from upload to model output.',
                    'Supported database development and visualization of motion data.'
                ],
                chips: [ 'Flask', 'Docker', 'Linux', 'Model serving', 'ETL' ]
            },
            {
                accent: ACCENT,
                kicker: 'Workstream  ·  evaluation',
                title: 'Reviewing what worked and why',
                lines: [
                    'Reviewed reconstruction results for quality and separated successful from failed cases.',
                    'Analysed root causes: why a given result succeeded or failed.',
                    'Reported findings back to researchers with concrete, actionable improvement proposals that fed the next research iteration.',
                    'Worked in Agile/Scrum with Git version control, code review and shared documentation.'
                ],
                chips: [ 'Model evaluation', 'Root cause analysis', 'Git', 'Agile/Scrum' ]
            }
        ]
    }
]
