import * as THREE from 'three/webgpu'

const text = `
████████╗██╗  ██╗ █████╗ ███╗   ██╗██╗   ██╗██╗███████╗██╗  ██╗
╚══██╔══╝██║  ██║██╔══██╗████╗  ██║██║   ██║██║██╔════╝██║  ██║
   ██║   ███████║███████║██╔██╗ ██║██║   ██║██║███████╗███████║
   ██║   ██╔══██║██╔══██║██║╚██╗██║██║   ██║██║╚════██║██╔══██║
   ██║   ██║  ██║██║  ██║██║ ╚████║╚██████╔╝██║███████║██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═╝

╔═ Who ═════════════════╗
║ Thanuish Kumar Sathiaraj
║ M.Sc. Computer Science, University of Stuttgart (Apr 2025 - Apr 2028 expected)
║ Stuttgart, Germany
║ AI · Computer Vision · 3D Perception · Software Engineering
╚═══════════════════════╝

╔═ Research ════════════╗
║ Student Research Assistant, Max Planck Institute for Intelligent Systems
║ Perceiving Systems Department, Data Team, Tuebingen (Nov 2025 - Apr 2026)
║ SMPL-X body modelling, MAMA, multi-camera 3D reconstruction, keypoint tracking,
║ Vicon Nexus motion capture, 3D and 4D full-body scanning,
║ Flask backend services and ML model integration on Docker/Linux.
╚═══════════════════════╝

╔═ Contact ═════════════╗
║ Mail     ⇒ thanuishkumar02@gmail.com
║ GitHub   ⇒ https://github.com/Thanuish
║ LinkedIn ⇒ https://linkedin.com/in/thanuish-kumar-s-a74175212
║ Site     ⇒ https://thanuish.github.io
╚═══════════════════════╝

╔═ Debug ═══════════════╗
║ You can access the debug mode by adding #debug at the end of the URL and reloading.
║ Press [V] to toggle the free camera.
╚═══════════════════════╝

╔═ Engine credit ═══════╗
║ This world runs on folio-2025 by Bruno Simon, MIT licensed.
║ https://github.com/brunosimon/folio-2025
║ The engine (rendering, physics, vehicle, audio, world systems) is his work, not mine.
║ The campus content, areas and interactions are mine.
╚═══════════════════════╝

╔═ Three.js ════════════╗
║ Three.js renders this 3D world (release: ${THREE.REVISION})
║ https://threejs.org/
║ Created by mr.doob and hundreds of contributors, including Sunag who added TSL,
║ enabling both WebGL and WebGPU.
╚═══════════════════════╝

╔═ Some more links ═════╗
║ Rapier (Physics library)  ⇒ https://rapier.rs/
║ Howler.js (Audio library) ⇒ https://howlerjs.com/
║ Musics by Kounine, CC0    ⇒ https://linktr.ee/Kounine
╚═══════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #5FD2FF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]
