import * as THREE from 'three/webgpu'
import { color, vec4 } from 'three/tsl'
import { Area } from './Area.js'
import { createTextPlane } from '../../utilities/text3D.js'
import { InteractivePoints } from '../../InteractivePoints.js'

/**
 * Base for areas that are built in code rather than authored in Blender.
 *
 * The world model has no geometry for these, and there is no Blender pipeline
 * here to add any. So the area is handed a model containing nothing but its
 * zone references, which is all the base Area needs to wire up bounding and
 * frustum behaviour. Everything visible is created here and added to the scene
 * directly.
 *
 * Visuals deliberately bypass Objects.addFromModel: that path runs
 * Materials.updateObject over the subtree, which would remap the emissive
 * instrument materials onto the world palette. Meshes are still registered in
 * `objects.hideable` so they cull with the area like everything else.
 */
export class ProceduralArea extends Area
{
    /**
     * Builds the zone-only model the base class expects.
     *
     * @param {{x: number, z: number}} position world position of the area
     * @param {number} boundingRadius radius that counts as "inside" the area
     * @param {number} frustumRadius radius used for visibility culling
     */
    static createModel(name, position, boundingRadius, frustumRadius)
    {
        const model = new THREE.Group()
        model.name = name
        model.position.set(position.x, 0, position.z)

        const bounding = new THREE.Object3D()
        bounding.name = 'refZoneBounding'
        bounding.scale.setScalar(boundingRadius)
        model.add(bounding)

        const frustum = new THREE.Object3D()
        frustum.name = 'refZoneFrustum'
        frustum.scale.setScalar(frustumRadius)
        model.add(frustum)

        return model
    }

    constructor(model, options = {})
    {
        super(model)

        this.origin = new THREE.Vector3(model.position.x, 0, model.position.z)
        this.accent = options.accent ?? '#5fd2ff'

        this.group = new THREE.Group()
        this.group.position.copy(this.origin)
        this.game.scene.add(this.group)
        this.objects.hideable.push(this.group)

        this.signMeshes = []

        this.materials = {
            accent: this.createEmissiveMaterial(this.accent),
            structure: new THREE.MeshLambertNodeMaterial({ color: 0x2a2733 }),
            deck: new THREE.MeshLambertNodeMaterial({ color: 0x3a3646 }),
        }
    }

    createEmissiveMaterial(hex, intensity = 1.9)
    {
        const material = new THREE.MeshBasicNodeMaterial()
        material.outputNode = vec4(color(hex).mul(intensity), 1)
        return material
    }

    /**
     * A raised deck with a matching fixed collider, so the area is drivable
     * regardless of what the terrain does underneath it.
     */
    addDeck(radius, thickness = 0.3, segments = 32)
    {
        const deck = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius + thickness, thickness, segments),
            this.materials.deck
        )
        deck.position.y = thickness / 2
        deck.receiveShadow = true
        this.group.add(deck)

        // A cylinder collider keeps the drivable surface matching the visual.
        this.game.objects.add(null, {
            type: 'fixed',
            friction: 0.9,
            restitution: 0,
            colliders: [ {
                shape: 'cylinder',
                parameters: [ thickness / 2, radius ],
                position: { x: this.origin.x, y: thickness / 2, z: this.origin.z },
                category: 'floor'
            } ]
        })

        // A soft rim so the deck reads as a platform rather than a painted disc.
        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.06, 6, segments),
            this.materials.accent
        )
        rim.rotation.x = Math.PI / 2
        rim.position.y = thickness + 0.02
        this.group.add(rim)

        return deck
    }

    /**
     * Signage above the area, drawn flat rather than extruded so it reads at
     * distance the way the rest of the world's labels do.
     */
    addSign(lines, { elevation = 4.2, spacing = 0.5, size = 0.42, width = 12 } = {})
    {
        this.signMeshes = this.signMeshes ?? []
        let index = 0

        for(const line of lines)
        {
            const fontSize = line.size ?? (index === 0 ? size : size * 0.62)

            const mesh = createTextPlane(line.text ?? line, {
                hex: this.accent,
                worldWidth: width,
                worldHeight: fontSize * 1.6,
                fontSize: fontSize,
                density: 140
            })

            mesh.position.y = elevation - index * spacing
            this.group.add(mesh)
            this.signMeshes.push(mesh)

            index++
        }
    }

    /**
     * An interactive point positioned relative to the area origin.
     */
    addPoint(offset, label, onInteract)
    {
        const position = new THREE.Vector3(
            this.origin.x + offset.x,
            0,
            this.origin.z + offset.z
        )

        return this.game.interactivePoints.create(
            position,
            label,
            offset.x < 0 ? InteractivePoints.ALIGN_LEFT : InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            onInteract,
            () => { this.game.inputs.interactiveButtons.addItems([ 'interact' ]) },
            () => { this.game.inputs.interactiveButtons.removeItems([ 'interact' ]) },
            () => { this.game.inputs.interactiveButtons.removeItems([ 'interact' ]) }
        )
    }
}
