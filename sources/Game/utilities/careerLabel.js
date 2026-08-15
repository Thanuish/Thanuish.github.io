import * as THREE from 'three/webgpu'

/**
 * Draws a career label into the two-channel encoding the career shader expects.
 *
 * The shipped label textures encode the plate in green and the glyphs in red:
 *
 *   alpha = step(0.1, max(r, g))          -> anything not on a plate is cut out
 *   color = mix(maskColor, emissive, r)   -> red pixels glow, green pixels stay dark
 *
 * So the plates are filled pure green, the text is drawn pure red on top, and
 * everything else stays black. Generating these at runtime avoids shipping a
 * PNG per entry and lets the text come from data.
 */

const DENSITY = 2

// Proportions taken from the original 316x60 labels: a name plate on top, a
// slightly shorter role plate below, separated by a transparent gap.
const HEIGHT = 60
const NAME_PLATE = { top: 0, height: 28, fontSize: 19, weight: 800, paddingX: 9 }
const ROLE_PLATE = { top: 33, height: 27, fontSize: 14, weight: 700, paddingX: 9 }
const CORNER_RADIUS = 4

// The authored label plane is roughly 5.3:1. Allowing a little more keeps long
// organisation names readable without the plate overhanging its stone.
const MAX_ASPECT = 6.4

function measure(context, text, weight, fontSize)
{
    context.font = `${weight} ${fontSize * DENSITY}px Nunito, sans-serif`
    return context.measureText(text).width
}

function drawPlate(context, x, y, width, height, radius)
{
    context.fillStyle = '#00ff00'
    context.beginPath()
    context.roundRect(x, y, width, height, radius)
    context.fill()
}

/**
 * @returns {{ texture: THREE.CanvasTexture, width: number, height: number, aspect: number }}
 */
export function createCareerLabelTexture(organisation, role)
{
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    // Measure first, then shrink the type if the plate would grow wider than
    // the authored label plane can carry. Without this, a long role line
    // stretches the plane well past the stone it sits on.
    let scale = 1
    let nameWidth = 0
    let roleWidth = 0

    for(let attempt = 0; attempt < 2; attempt++)
    {
        nameWidth = measure(context, organisation, NAME_PLATE.weight, NAME_PLATE.fontSize * scale) + NAME_PLATE.paddingX * 2 * DENSITY * scale
        roleWidth = measure(context, role, ROLE_PLATE.weight, ROLE_PLATE.fontSize * scale) + ROLE_PLATE.paddingX * 2 * DENSITY * scale

        const aspect = Math.max(nameWidth, roleWidth) / (HEIGHT * DENSITY)

        if(aspect <= MAX_ASPECT)
            break

        scale *= MAX_ASPECT / aspect
    }

    canvas.width = Math.ceil(Math.max(nameWidth, roleWidth))
    canvas.height = HEIGHT * DENSITY

    // Resizing the canvas resets the context, so all drawing state is set after.
    context.fillStyle = '#000000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.textBaseline = 'middle'
    context.textAlign = 'left'

    for(const [ plate, text, width ] of [
        [ NAME_PLATE, organisation, nameWidth ],
        [ ROLE_PLATE, role, roleWidth ]
    ])
    {
        drawPlate(context, 0, plate.top * DENSITY, width, plate.height * DENSITY, CORNER_RADIUS * DENSITY)

        context.font = `${plate.weight} ${plate.fontSize * scale * DENSITY}px Nunito, sans-serif`
        context.fillStyle = '#ff0000'
        context.fillText(
            text,
            plate.paddingX * DENSITY * scale,
            (plate.top + plate.height / 2) * DENSITY
        )
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.flipY = false
    texture.needsUpdate = true

    return {
        texture,
        canvas,
        width: canvas.width,
        height: canvas.height,
        aspect: canvas.width / canvas.height
    }
}
