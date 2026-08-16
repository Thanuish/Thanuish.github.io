/**
 * Achievements and awards, shown on the lab benches.
 */

const ACCENT = '#a2ffab'

export default [
    {
        title: 'CODERIZZ Coding Club',
        imageMini: 'awards/coderizz.jpg',
        card: {
            accent: ACCENT,
            kicker: 'Leadership',
            title: 'Founder & Technical Head',
            lines: [
                'Founded the CODERIZZ coding club at SRM Valliammai Engineering College and led it as Technical Head.'
            ],
            chips: [ 'Founder', 'Technical Head' ]
        }
    },
    {
        title: 'SRM Project Expo 2022',
        card: {
            accent: ACCENT,
            kicker: 'First place  ·  2022',
            title: 'Emma, an AI virtual assistant',
            lines: [
                'Won first place at the SRM Project Expo for Emma, an AI-based virtual assistant.'
            ],
            chips: [ '1st place', 'AI assistant' ]
        }
    },
    {
        title: 'Saveetha Project Expo 2023',
        card: {
            accent: ACCENT,
            kicker: 'First place  ·  2023',
            title: 'AI-driven storytelling application',
            lines: [
                'Won first place at the Saveetha College of Engineering Project Expo for an AI-driven storytelling application.'
            ],
            chips: [ '1st place', 'Generative AI' ]
        }
    },
    {
        title: 'SRM Hackathon 2023',
        card: {
            accent: ACCENT,
            kicker: 'Runner-up  ·  2023',
            title: 'Farm automation system',
            lines: [
                'Runner-up at the SRM Hackathon 2023 for a farm automation system.'
            ],
            chips: [ 'Runner-up', 'Automation' ]
        }
    },
    {
        title: 'Computer Society of India',
        card: {
            accent: ACCENT,
            kicker: 'Leadership',
            title: 'Secretary, student branch',
            lines: [
                'Served as Secretary of the Computer Society of India student branch.'
            ],
            chips: [ 'Secretary' ]
        }
    }
]
