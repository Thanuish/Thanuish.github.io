/**
 * Experience and education timeline.
 *
 * Keyed by the texture name baked into the world model, which is the only
 * stable identifier for each of the six career "lanes" authored in Blender.
 * Each lane has a fixed X in the model, so entries are assigned to lanes that
 * keep them from overlapping in Z:
 *
 *   careerFreelancer      -> right lane  (x  3.21), one long entry
 *   careerIRLTeacher      -> left lane   (x -0.79), one long entry
 *   the remaining four    -> centre lane (x  1.22), sequential, no overlap
 *
 * `z` and `size` are world-space positions on the year track. `size` is how far
 * the stone slides before retracting, so it reads as duration. Short entries get
 * a floor so they stay legible.
 *
 * Every fact here is taken from the master profile. Dates on the plates are the
 * authoritative ones; the animated year counter is atmosphere.
 */
export default {
    // Right lane. Bachelor's degree, the long early entry.
    careerFreelancer: {
        organisation: 'Anna University',
        role: 'B.E. Computer Science & Engineering  ·  Aug 2020 - Jun 2024',
        color: 'blue',
        z: 5.0,
        size: 10.2,
        hasEnd: true
    },

    // Centre lane, first item encountered.
    careerHetic: {
        organisation: "Bachelor's Thesis",
        role: 'Multimodal Deepfake Detection  ·  Aug 2023 - Apr 2024',
        color: 'green',
        z: -2.9,
        size: 1.9,
        hasEnd: true
    },

    careerUzik: {
        // The master profile fixes this title exactly. Splitting it across the
        // two plates keeps every word without stretching the label.
        organisation: 'EY-Guided Industry Training Program',
        role: 'Data Analytics Trainee  ·  Feb 2024 - Apr 2024',
        color: 'orange',
        z: -4.9,
        size: 1.9,
        hasEnd: true
    },

    careerImmersiveGarden: {
        organisation: 'Shiash Info-Solutions',
        role: 'Machine Learning Engineer Intern  ·  Apr 2024 - Sep 2024',
        color: 'orange',
        z: -6.9,
        size: 1.9,
        hasEnd: true
    },

    careerOnlineTeacher: {
        organisation: 'Max Planck Institute',
        role: 'Student Research Assistant, Perceiving Systems  ·  Nov 2025 - Apr 2026',
        color: 'purple',
        z: -8.9,
        size: 1.9,
        hasEnd: true
    },

    // Left lane. Ongoing, so it never retracts.
    careerIRLTeacher: {
        organisation: 'University of Stuttgart',
        role: 'M.Sc. Computer Science  ·  Apr 2025 - Apr 2028 expected',
        color: 'blue',
        z: -8.0,
        size: 3.3,
        hasEnd: false
    }
}
