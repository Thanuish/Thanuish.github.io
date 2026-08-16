# Thanuish Kumar Sathiaraj

An interactive portfolio you drive through, built as a research campus.

**Live at [thanuish.github.io](https://thanuish.github.io/)**

M.Sc. Computer Science at the University of Stuttgart. AI, computer vision
and 3D perception, with research experience at the Max Planck Institute for
Intelligent Systems.

## What is in the campus

| Area | Contents |
| --- | --- |
| Landing | Name, disciplines, and where to go next |
| Computer Vision Lab | Motion capture rig, scanning platform and a reconstructed body, one instrument per Max Planck workstream |
| AI / LLM Lab | The Market Sentinel agent chain, with the approval gate drawn shut |
| Projects | Nine projects, each opening a scrollable write-up |
| Experience | Education and roles laid out along a timeline |
| Contact | GitHub, LinkedIn, email and CV |

## Running it

```bash
npm install
npm run dev
```

Then open the address it prints.

```bash
npm run build     # production build into dist/
npm run deploy    # build and publish to the gh-pages branch
```

## Editing the content

Everything visitors read lives in `sources/data/` as plain data files, so
adding a project or an award does not involve touching any 3D code.

| File | Controls |
| --- | --- |
| `projects.js` | Project boards and their detail pages |
| `lab.js` | Achievements and awards |
| `career.js` | Experience and education timeline |
| `visionLab.js` | Computer vision lab instruments |
| `aiLab.js` | AI lab pipeline nodes |
| `social.js` | Contact links |

## Credits

The 3D engine is [folio-2025](https://github.com/brunosimon/folio-2025) by
Bruno Simon, used under the MIT licence. The rendering, physics, vehicle,
audio and world systems are his work. The campus built on top of it, its
areas, interactions and content, is mine.

Music by [Kounine](https://linktr.ee/Kounine), CC0.
Built with [Three.js](https://threejs.org), [Rapier](https://rapier.rs) and
[Vite](https://vite.dev).

## Licence

MIT. See [license.md](license.md), which retains the original copyright
notice as the licence requires.
