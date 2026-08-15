import * as THREE from 'three/webgpu'
import { ProceduralArea } from './ProceduralArea.js'
import { openInfoPage } from '../../utilities/infoPage.js'
import visionLabData from '../../../data/visionLab.js'

/**
 * Computer vision and 3D perception lab.
 *
 * A capture volume: motion-capture cameras on posts ringing a scanning
 * platform, with a reconstructed body hovering above it as a point cloud.
 * Every instrument maps to a real workstream from the Max Planck role, and
 * each one opens the write-up for that workstream.
 */
export class VisionLabArea extends ProceduralArea
{
    static POSITION = { x: 12.3, z: 35.3 }
    static ACCENT = '#5fd2ff'
    static RADIUS = 10

    static CAMERA_COUNT = 6
    static CAMERA_RING_RADIUS = 8.2
    static CAMERA_HEIGHT = 3.4

    static createModel()
    {
        return ProceduralArea.createModel('visionLab', VisionLabArea.POSITION, 12, 15)
    }

    constructor(model)
    {
        super(model, { accent: VisionLabArea.ACCENT })

        this.localTime = 0

        this.addDeck(VisionLabArea.RADIUS)
        this.setCameraRing()
        this.setScanner()
        this.setBody()
        this.setWorkstation()
        this.addSign([ 'COMPUTER VISION', '3D PERCEPTION LAB' ], { elevation: 5.4, spacing: 0.62, size: 0.5 })
        this.setPoints()
    }

    /**
     * Motion-capture cameras on posts, angled in at the capture volume.
     */
    setCameraRing()
    {
        this.cameras = []

        const postGeometry = new THREE.CylinderGeometry(0.07, 0.09, VisionLabArea.CAMERA_HEIGHT, 6)
        const bodyGeometry = new THREE.BoxGeometry(0.42, 0.32, 0.62)
        const lensGeometry = new THREE.CylinderGeometry(0.13, 0.16, 0.18, 10)

        for(let i = 0; i < VisionLabArea.CAMERA_COUNT; i++)
        {
            const angle = (i / VisionLabArea.CAMERA_COUNT) * Math.PI * 2
            const x = Math.cos(angle) * VisionLabArea.CAMERA_RING_RADIUS
            const z = Math.sin(angle) * VisionLabArea.CAMERA_RING_RADIUS

            const post = new THREE.Mesh(postGeometry, this.materials.structure)
            post.position.set(x, VisionLabArea.CAMERA_HEIGHT / 2, z)
            post.castShadow = true
            this.group.add(post)

            const head = new THREE.Group()
            head.position.set(x, VisionLabArea.CAMERA_HEIGHT, z)
            // Aim at the capture volume, tilted down onto the platform.
            head.lookAt(0, 1.6, 0)
            this.group.add(head)

            const body = new THREE.Mesh(bodyGeometry, this.materials.structure)
            body.castShadow = true
            head.add(body)

            const lens = new THREE.Mesh(lensGeometry, this.materials.accent)
            lens.rotation.x = Math.PI / 2
            lens.position.z = 0.38
            head.add(lens)

            this.cameras.push(head)
        }
    }

    /**
     * The scanning platform: a turntable with rings that sweep up through the
     * capture volume, standing in for a 3D/4D scan in progress.
     */
    setScanner()
    {
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(2.4, 2.6, 0.32, 24),
            this.materials.structure
        )
        base.position.y = 0.46
        base.receiveShadow = true
        base.castShadow = true
        this.group.add(base)

        this.scanRings = []

        for(let i = 0; i < 3; i++)
        {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(2.1, 0.03, 6, 40),
                this.materials.accent
            )
            ring.rotation.x = Math.PI / 2
            ring.position.y = 0.7 + i * 0.9
            this.group.add(ring)
            this.scanRings.push(ring)
        }
    }

    /**
     * A body reconstruction hovering over the platform, drawn as a point cloud.
     *
     * Points are sampled along a stick figure of capsule segments. It is a
     * suggestion of a reconstructed body, not a real SMPL-X mesh, which the
     * portfolio has no licence to ship.
     */
    setBody()
    {
        const segments = [
            // [ start, end, radius, density ]
            [ [ 0, 2.55, 0 ], [ 0, 2.20, 0 ], 0.20, 90 ],   // head
            [ [ 0, 2.15, 0 ], [ 0, 1.30, 0 ], 0.26, 220 ],  // torso
            [ [ -0.24, 2.05, 0 ], [ -0.62, 1.45, 0 ], 0.09, 70 ],  // left upper arm
            [ [ -0.62, 1.45, 0 ], [ -0.72, 0.90, 0 ], 0.07, 60 ],  // left forearm
            [ [ 0.24, 2.05, 0 ], [ 0.62, 1.45, 0 ], 0.09, 70 ],    // right upper arm
            [ [ 0.62, 1.45, 0 ], [ 0.72, 0.90, 0 ], 0.07, 60 ],    // right forearm
            [ [ -0.16, 1.30, 0 ], [ -0.22, 0.70, 0 ], 0.11, 80 ],  // left thigh
            [ [ -0.22, 0.70, 0 ], [ -0.24, 0.10, 0 ], 0.08, 70 ],  // left shin
            [ [ 0.16, 1.30, 0 ], [ 0.22, 0.70, 0 ], 0.11, 80 ],    // right thigh
            [ [ 0.22, 0.70, 0 ], [ 0.24, 0.10, 0 ], 0.08, 70 ],    // right shin
        ]

        const positions = []

        for(const [ start, end, radius, count ] of segments)
        {
            for(let i = 0; i < count; i++)
            {
                const t = Math.random()

                // Random point in the disc perpendicular enough for this scale.
                const angle = Math.random() * Math.PI * 2
                const spread = Math.sqrt(Math.random()) * radius

                positions.push(
                    start[0] + (end[0] - start[0]) * t + Math.cos(angle) * spread,
                    start[1] + (end[1] - start[1]) * t,
                    start[2] + (end[2] - start[2]) * t + Math.sin(angle) * spread
                )
            }
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

        const material = new THREE.PointsNodeMaterial({ size: 0.05, sizeAttenuation: true })
        material.outputNode = this.materials.accent.outputNode

        this.body = new THREE.Points(geometry, material)
        this.body.position.y = 0.62
        this.group.add(this.body)

        this.bodyPointCount = positions.length / 3
    }

    /**
     * Research workstation: a desk with an angled screen showing the pipeline.
     */
    setWorkstation()
    {
        const station = new THREE.Group()
        station.position.set(-6.0, 0.3, 4.2)
        station.rotation.y = Math.PI * 0.25
        this.group.add(station)

        const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.1), this.materials.structure)
        desk.position.y = 0.95
        desk.castShadow = true
        desk.receiveShadow = true
        station.add(desk)

        for(const side of [ -1, 1 ])
        {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), this.materials.structure)
            leg.position.set(side * 1.15, 0.47, 0)
            station.add(leg)
        }

        const screen = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 0.06), this.materials.accent)
        screen.position.set(0, 1.65, -0.25)
        screen.rotation.x = -0.18
        station.add(screen)
    }

    setPoints()
    {
        for(const entry of visionLabData)
        {
            this.addPoint(entry.offset, entry.label, () =>
            {
                openInfoPage(this.game, {
                    role: entry.role,
                    title: entry.title,
                    sections: entry.sections
                })
            })
        }
    }

    update()
    {
        const delta = this.game.ticker.deltaScaled

        this.localTime += delta

        // Slow turntable, so the reconstruction reads as being scanned.
        if(this.body)
            this.body.rotation.y += delta * 0.25

        // Rings sweep upward through the capture volume and wrap around.
        if(this.scanRings)
        {
            for(let i = 0; i < this.scanRings.length; i++)
            {
                const ring = this.scanRings[i]
                ring.position.y += delta * 0.6

                if(ring.position.y > 3.4)
                    ring.position.y = 0.7
            }
        }
    }
}
