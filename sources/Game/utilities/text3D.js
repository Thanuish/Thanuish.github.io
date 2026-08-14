import * as THREE from 'three/webgpu'

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
