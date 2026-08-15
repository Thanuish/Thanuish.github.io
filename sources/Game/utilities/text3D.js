import * as THREE from 'three/webgpu'
import { color, texture, uv, vec2, vec4 } from 'three/tsl'
import { TextCanvas } from '../TextCanvas.js'

/**
 * Extruded 3D text helpers.
 *
 * The original world ships its letters as baked Blender meshes. Since the
 * portfolio needs different words (and different signage per lab), letters are
 * generated at runtime instead. The typeface and the two addon modules are
 * imported lazily so they land in their own chunk and never touch the initial
 * payload.
 */

let fontPromise = null

export function getFont()
{
    if(!fontPromise)
    {
        fontPromise = Promise.all([
            import('three/addons/loaders/FontLoader.js'),
            import('three/examples/fonts/helvetiker_bold.typeface.json')
        ]).then(([ { FontLoader }, fontData ]) =>
        {
            return new FontLoader().parse(fontData.default ?? fontData)
        })
    }

    return fontPromise
}

let textGeometryPromise = null

function getTextGeometryClass()
{
    if(!textGeometryPromise)
        textGeometryPromise = import('three/addons/geometries/TextGeometry.js').then(module => module.TextGeometry)

    return textGeometryPromise
}

/**
 * Builds one centered, extruded geometry per character.
 *
 * Spaces produce a `null` geometry so callers can keep the layout while
 * skipping the mesh. Returns the per-character advance too, so a caller can lay
 * the letters out along an arbitrary axis.
 */
export async function createLetters(text, { size = 1, depth = 0.46, curveSegments = 4, letterSpacing = 0.14 } = {})
{
    const [ font, TextGeometry ] = await Promise.all([ getFont(), getTextGeometryClass() ])

    const letters = []
    let cursor = 0

    for(const character of text)
    {
        if(character === ' ')
        {
            letters.push({ character, geometry: null, width: size * 0.4, offset: cursor + size * 0.2 })
            cursor += size * 0.4 + letterSpacing
            continue
        }

        const geometry = new TextGeometry(character, {
            font: font,
            size: size,
            depth: depth,
            curveSegments: curveSegments,
            bevelEnabled: false
        })

        geometry.computeBoundingBox()
        const boundingBox = geometry.boundingBox
        const width = boundingBox.max.x - boundingBox.min.x
        const height = boundingBox.max.y - boundingBox.min.y

        // Center the glyph on its own bounding box so the caller only has to
        // position it, and so a physics collider can be derived symmetrically.
        geometry.translate(
            - (boundingBox.max.x + boundingBox.min.x) / 2,
            - (boundingBox.max.y + boundingBox.min.y) / 2,
            - depth / 2
        )
        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()

        letters.push({
            character,
            geometry,
            width,
            height,
            depth,
            offset: cursor + width / 2
        })

        cursor += width + letterSpacing
    }

    const totalWidth = cursor - letterSpacing

    // Re-center the whole run on its own midpoint.
    for(const letter of letters)
        letter.offset -= totalWidth / 2

    return { letters, totalWidth }
}

/**
 * A single flat text mesh, useful for signage that doesn't need per-letter
 * physics. Geometry is centered on the origin.
 */
export async function createTextGeometry(text, { size = 1, depth = 0.1, curveSegments = 4 } = {})
{
    const [ font, TextGeometry ] = await Promise.all([ getFont(), getTextGeometryClass() ])

    const geometry = new TextGeometry(text, {
        font: font,
        size: size,
        depth: depth,
        curveSegments: curveSegments,
        bevelEnabled: false
    })

    geometry.computeBoundingBox()
    const boundingBox = geometry.boundingBox
    geometry.translate(
        - (boundingBox.max.x + boundingBox.min.x) / 2,
        - (boundingBox.max.y + boundingBox.min.y) / 2,
        - depth / 2
    )
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    return geometry
}

export function getGeometrySize(geometry)
{
    if(!geometry.boundingBox)
        geometry.computeBoundingBox()

    return new THREE.Vector3().subVectors(geometry.boundingBox.max, geometry.boundingBox.min)
}

/**
 * Flat signage text drawn on a canvas, the way the rest of the world does it.
 *
 * Extruded glyphs read poorly at distance: they catch the scene lighting, the
 * side walls muddy the letterforms and thin strokes disappear. The original
 * world renders every label as flat text on a plane in its own display face,
 * so signage matches it instead of fighting it.
 *
 * @returns {THREE.Mesh} centred on its own origin, lying in the XY plane
 */
export function createTextPlane(text, {
    hex = '#5fd2ff',
    worldWidth = 8,
    worldHeight = 1.2,
    fontSize = 0.8,
    density = 100,
    fontFamily = 'Amatic SC',
    fontWeight = '700',
    intensity = 1.9
} = {})
{
    const canvas = new TextCanvas(
        fontFamily,
        fontWeight,
        fontSize,
        worldWidth,
        worldHeight,
        density,
        'center'
    )
    canvas.updateText(text)

    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide })

    // The canvas is white on black, so its red channel doubles as the mask.
    // TextCanvas sets flipY false, so the V axis is inverted here to match a
    // plane's default UVs, otherwise the text renders upside down.
    material.outputNode = vec4(
        color(hex).mul(intensity),
        texture(canvas.texture, vec2(uv().x, uv().y.oneMinus())).r
    )

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldWidth, worldHeight), material)
    mesh.castShadow = false
    mesh.receiveShadow = false
    mesh.userData.textCanvas = canvas

    return mesh
}
