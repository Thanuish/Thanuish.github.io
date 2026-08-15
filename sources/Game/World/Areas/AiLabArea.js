import * as THREE from 'three/webgpu'
import { ProceduralArea } from './ProceduralArea.js'
import { openInfoPage } from '../../utilities/infoPage.js'
import aiLabData from '../../../data/aiLab.js'

/**
 * AI and LLM lab, built around Market Sentinel's agent chain.
 *
 * The whole point of that project is that the execution path is unreachable
 * until the evaluator writes an approval into graph state, so the lab is laid
 * out as a physical pipeline with a barrier that is visibly shut between the
 * approval gate and the executor. The geometry is the argument.
 */
export class AiLabArea extends ProceduralArea
{
    // Terrain here is dead flat across the full deck footprint, sampled from
    // the heightfield collider. The first site dipped 1.3 units on one side,
    // which would have left the deck floating with a wall to drive up.
    static POSITION = { x: 70, z: 15 }
    static ACCENT = '#b65fff'
    static RADIUS = 10.5

    static NODE_SPACING = 5.4
    static NODE_HEIGHT = 4.2

    static createModel()
    {
        return ProceduralArea.createModel('aiLab', AiLabArea.POSITION, 12.5, 15)
    }

    constructor(model)
    {
        super(model, { accent: AiLabArea.ACCENT })

        this.addDeck(AiLabArea.RADIUS)
        this.setPipeline()
        this.setGate()
        this.addSign([ 'AI / LLM LAB', 'MARKET SENTINEL' ], { elevation: 8.2, spacing: 1.15, size: 1.05 })
        this.setPoints()
    }

    /**
     * Four pillars in a line, joined by conduits. The pillar the gate protects
     * is drawn in a colder colour so the break in the chain is legible.
     */
    setPipeline()
    {
        this.nodes = []

        const blockedMaterial = this.createEmissiveMaterial('#4a4560', 1.2)
        const pillarGeometry = new THREE.CylinderGeometry(0.95, 1.12, AiLabArea.NODE_HEIGHT, 8)
        const capGeometry = new THREE.CylinderGeometry(1.22, 0.95, 0.3, 8)

        aiLabData.forEach((entry, index) =>
        {
            const z = (index - (aiLabData.length - 1) / 2) * AiLabArea.NODE_SPACING

            const pillar = new THREE.Mesh(pillarGeometry, this.materials.structure)
            pillar.position.set(0, 0.3 + AiLabArea.NODE_HEIGHT / 2, z)
            pillar.castShadow = true
            pillar.receiveShadow = true
            this.group.add(pillar)

            // The executor sits past the gate, so it reads as unpowered.
            const cap = new THREE.Mesh(capGeometry, entry.blocked ? blockedMaterial : this.materials.accent)
            cap.position.set(0, 0.3 + AiLabArea.NODE_HEIGHT + 0.15, z)
            this.group.add(cap)

            // Conduit to the next node, except where the gate breaks the chain.
            if(index < aiLabData.length - 1 && !entry.gateAfter)
            {
                const conduit = new THREE.Mesh(
                    new THREE.BoxGeometry(0.16, 0.16, AiLabArea.NODE_SPACING - 2.3),
                    this.materials.accent
                )
                conduit.position.set(0, 0.3 + AiLabArea.NODE_HEIGHT * 0.62, z + AiLabArea.NODE_SPACING / 2)
                this.group.add(conduit)
            }

            this.nodes.push({ entry, pillar, cap, z })
        })
    }

    /**
     * The approval gate: a closed barrier across the pipeline between the
     * evaluator and the executor.
     */
    setGate()
    {
        const gateIndex = aiLabData.findIndex(entry => entry.gateAfter)

        if(gateIndex === -1)
            return

        const z = (gateIndex - (aiLabData.length - 1) / 2) * AiLabArea.NODE_SPACING + AiLabArea.NODE_SPACING / 2

        const frame = new THREE.Group()
        frame.position.set(0, 0.3, z)
        this.group.add(frame)

        for(const side of [ -1, 1 ])
        {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 5.2, 0.3),
                this.materials.structure
            )
            post.position.set(side * 2.4, 2.6, 0)
            post.castShadow = true
            frame.add(post)
        }

        const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.32, 0.32), this.materials.structure)
        lintel.position.y = 5.2
        frame.add(lintel)

        // Bars, closed. This is the assertion the project makes.
        const barMaterial = this.createEmissiveMaterial('#ff5f7a', 1.7)
        for(let i = 0; i < 7; i++)
        {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.15, 0.15), barMaterial)
            bar.position.y = 0.7 + i * 0.62
            frame.add(bar)
        }

        this.gate = frame
    }

    setPoints()
    {
        aiLabData.forEach((entry, index) =>
        {
            const z = (index - (aiLabData.length - 1) / 2) * AiLabArea.NODE_SPACING

            this.addPoint({ x: 2.6, z }, entry.label, () =>
            {
                openInfoPage(this.game, {
                    role: entry.role,
                    title: entry.title,
                    sections: entry.sections,
                    url: entry.url,
                    urlLabel: 'Open repository'
                })
            })
        })
    }

    update()
    {
        this.faceCamera(this.signMeshes)
    }
}
