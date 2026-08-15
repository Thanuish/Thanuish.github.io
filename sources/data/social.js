/**
 * Links around the statue.
 *
 * `target` is the name of the logo sculpture in the world model that each
 * entry belongs to. The original code spaced these evenly around a circle,
 * which put the labels nowhere near the logos they described. Anchoring to
 * the sculpture keeps the two in sync no matter how the model is arranged.
 *
 * Order here is reading order across the plaza: LinkedIn, GitHub, Mail are the
 * live links and sit together. The rest are platforms I am not on yet, so they
 * are inert and say so.
 */
export default [
    { name: 'LinkedIn', target: 'linkedIn', url: 'https://linkedin.com/in/thanuish-kumar-s-a74175212' },
    { name: 'GitHub', target: 'gitHub', url: 'https://github.com/Thanuish' },
    { name: 'Mail', target: 'mail', url: 'mailto:thanuishkumar02@gmail.com' },
    { name: 'Résumé', target: 'discord', modal: 'cv' },
    { name: 'Coming soon', target: 'x', soon: true },
    { name: 'Coming soon', target: 'youtube', soon: true },
    { name: 'Coming soon', target: 'twitch', soon: true },
    { name: 'Coming soon', target: 'bluesky', soon: true },
]
