import * as THREE from 'three/webgpu'

/**
 * A 911-style body, built to replace the shipped vehicle shell.
 *
 * The car is generated rather than imported because there is no licensed model
 * to ship. It is deliberately a silhouette study, not a badged replica: the
 * shape a 911 is recognised by is almost entirely its side profile, so that
 * profile is drawn as a 2D outline and extruded across the car's width.
 *
 * Coordinates match the original body's local space so the parts that hang off
 * the chassis (lights, boost cells, antenna) still land in sensible places:
 *   +X is the front, -X the rear, Y is height, Z is width.
 */

const HALF_WIDTH = 0.86
const FLOOR = -0.5

/**
 * The side profile, front to back along the top, then back along the floor.
 *
 * The 911 reading comes from three things: a low rounded nose, a windscreen
 * that flows into the roof without a break, and a single unbroken fall from
 * roof to ducktail.
 */
const PROFILE = [
    [ 1.94, -0.10 ],   // nose, low
    [ 1.90, 0.10 ],    // nose crest
    [ 1.66, 0.22 ],    // over the front wing
    [ 1.30, 0.19 ],    // bonnet dip
    [ 0.86, 0.24 ],    // windscreen base
    [ 0.30, 0.62 ],    // windscreen rake
    [ 0.02, 0.73 ],    // roof leading edge
    [ -0.50, 0.72 ],   // roof
    [ -0.95, 0.56 ],   // fastback fall
    [ -1.30, 0.36 ],   // engine cover
    [ -1.48, 0.34 ],   // ducktail lip
    [ -1.56, 0.24 ],
    [ -1.72, 0.06 ],   // tail
    [ -1.74, FLOOR ],  // down to the floor
    [ 1.90, FLOOR ],   // floor, back to the front
]

function buildShellGeometry()
{
    const shape = new THREE.Shape()
    shape.moveTo(PROFILE[0][0], PROFILE[0][1])

    for(let i = 1; i < PROFILE.length; i++)
        shape.lineTo(PROFILE[i][0], PROFILE[i][1])

    shape.closePath()

    // Extruding the XY profile along Z gives width directly, and the bevel
    // rounds the hard edges enough to read as bodywork rather than a slab.
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: HALF_WIDTH * 2,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.07,
        bevelSegments: 2,
        curveSegments: 2
    })

    geometry.translate(0, 0, -HALF_WIDTH)
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    return geometry
}

/**
 * Everything that is not painted bodywork: glass, lamps, haunches.
 *
 * Returned as one group so the caller can drop it onto the chassis and,
 * if the body is ever reverted, remove it in one step.
 */
function buildDetails()
{
    const group = new THREE.Group()
    group.name = 'generatedBodyDetails'

    const glass = new THREE.MeshLambertNodeMaterial({ color: 0x1b1630 })
    const lamp = new THREE.MeshBasicNodeMaterial({ color: 0xfff2cc })
    const dark = new THREE.MeshLambertNodeMaterial({ color: 0x14111f })
    const tail = new THREE.MeshBasicNodeMaterial({ color: 0xff2f4d })

    // Side glass: a flat pane just proud of each flank, cut to the greenhouse.
    const windowShape = new THREE.Shape()
    windowShape.moveTo(0.62, 0.30)
    windowShape.lineTo(0.30, 0.58)
    windowShape.lineTo(-0.62, 0.60)
    windowShape.lineTo(-0.86, 0.34)
    windowShape.closePath()

    const windowGeometry = new THREE.ShapeGeometry(windowShape)

    for(const side of [ 1, -1 ])
    {
        const pane = new THREE.Mesh(windowGeometry, glass)
        pane.position.z = side * (HALF_WIDTH + 0.015)
        group.add(pane)
    }

    // Windscreen, raked to match the profile between its two points.
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.70, HALF_WIDTH * 1.72), glass)
    screen.rotation.set(0, Math.PI / 2, 0)
    screen.rotateY(-0.60)
    screen.position.set(0.58, 0.46, 0)
    group.add(screen)

    // Round lamps set into the front wings. Four of them, the signature.
    const lampGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.10, 12)

    for(const side of [ 1, -1 ])
    {
        const outer = new THREE.Mesh(lampGeometry, lamp)
        outer.rotation.z = Math.PI / 2
        outer.position.set(1.72, 0.16, side * 0.60)
        group.add(outer)

        const inner = new THREE.Mesh(lampGeometry, lamp)
        inner.rotation.z = Math.PI / 2
        inner.scale.setScalar(0.72)
        inner.position.set(1.76, 0.12, side * 0.30)
        group.add(inner)
    }

    // Rear light bar across the tail.
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, HALF_WIDTH * 1.62), tail)
    bar.position.set(-1.70, 0.14, 0)
    group.add(bar)

    // Wide rear haunches over the back wheels.
    for(const side of [ 1, -1 ])
    {
        const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), dark)
        haunch.scale.set(1.25, 0.62, 0.42)
        haunch.position.set(-0.95, -0.10, side * 0.80)
        group.add(haunch)
    }

    // Front and rear valances, so the car does not read as hollow underneath.
    for(const [ x, length ] of [ [ 1.78, 0.30 ], [ -1.62, 0.26 ] ])
    {
        const valance = new THREE.Mesh(new THREE.BoxGeometry(length, 0.18, HALF_WIDTH * 1.86), dark)
        valance.position.set(x, -0.40, 0)
        group.add(valance)
    }

    group.traverse((child) =>
    {
        if(child.isMesh)
        {
            child.castShadow = true
            child.receiveShadow = true
        }
    })

    return group
}

export function buildGeneratedVehicleBody()
{
    return {
        shellGeometry: buildShellGeometry(),
        details: buildDetails()
    }
}
