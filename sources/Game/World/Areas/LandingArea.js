import * as THREE from 'three/webgpu'
import { color, float, Fn, instancedArray, mix, normalWorld, positionGeometry, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { Inputs } from '../../Inputs/Inputs.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'
import { createLetters, createTextGeometry } from '../../utilities/text3D.js'

export class LandingArea extends Area
{
    static NAME = 'THANUISH'
    static LETTER_SIZE = 1.45
    static LETTER_DEPTH = 0.46
    static LETTER_SPACING = 0.16
    static ACCENT_COLOR = '#5fd2ff'

    // Kept to plain ASCII on purpose: the extruded typeface has no glyph for
    // typographic separators like the middle dot.
    // Sized against the 1.45-unit name letters below them. The first pass was
    // roughly double this and swamped the name; the second overshot the other
    // way and became unreadable. This sits between the two.
    static SIGNBOARD_LINES = [
        { text: 'AI / COMPUTER VISION / 3D PERCEPTION', size: 0.34, elevation: 3.65 },
        { text: 'M.SC. COMPUTER SCIENCE, STUTTGART', size: 0.26, elevation: 3.10 },
        { text: 'EXPLORE THE RESEARCH CAMPUS', size: 0.22, elevation: 2.65 },
    ]

    static SIGNPOST_POSITION = { x: 42.5, y: 0, z: 35.6 }
    static SIGNPOST_HEIGHT = 3.2
    static SIGNPOST_ARM_LENGTH = 1.9

    // Area centres taken from the world model, so the arms point at the real
    // thing rather than depending on other areas having been built first.
    static SIGNPOST_TARGETS = [
        { label: 'CV LAB', x: 12.30, z: 35.30 },
        { label: 'AI LAB', x: 70.00, z: 15.00 },
        { label: 'PROJECTS', x: 35.76, z: 13.41 },
        { label: 'CAREER', x: 25.84, z: -0.90 },
        { label: 'CONTACT', x: 28.90, z: -21.80 },
    ]

    constructor(model)
    {
        super(model)

        this.localTime = uniform(0)

        this.setLetters()
        this.setSignboard()
        this.setSignpost()
        this.setKiosk()
        this.setControls()
        this.setBonfire()
        this.setAchievement()
    }

    setLetters()
    {
        const references = this.references.items.get('letters')

        for(const reference of references)
        {
            const physical = reference.userData.object.physical
            physical.colliders[0].setActiveEvents(this.game.RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
            physical.colliders[0].setContactForceEventThreshold(5)
            physical.onCollision = (force, position) =>
            {
                this.game.audio.groups.get('hitBrick').playRandomNext(force, position)
            }
        }

        this.replaceLetters(references, LandingArea.NAME)
    }

    /**
     * The world ships ten baked letter meshes spelling the original owner's
     * name. Rather than adding a parallel object system, the existing dynamic
     * bodies are reused: each one gets a regenerated glyph, a resized collider
     * and a new position along the same row. Surplus slots are disabled.
     */
    async replaceLetters(references, text)
    {
        if(references.length === 0)
            return

        // The row axis is baked into the model: derive it from the first and
        // last letter so the new word sits exactly where the old one did.
        const first = references[0].position.clone()
        const last = references[references.length - 1].position.clone()
        const center = first.clone().add(last).multiplyScalar(0.5)
        const axis = last.clone().sub(first).setY(0).normalize()
        const rotationY = references[0].rotation.y
        const elevation = first.y

        // Hide everything up front so a slow font load never shows the old name.
        for(const reference of references)
            reference.visible = false

        const { letters } = await createLetters(text, {
            size: LandingArea.LETTER_SIZE,
            depth: LandingArea.LETTER_DEPTH,
            letterSpacing: LandingArea.LETTER_SPACING
        })

        if(letters.length > references.length)
            console.warn(`LandingArea: "${text}" needs ${letters.length} letter slots but only ${references.length} exist.`)

        for(let i = 0; i < references.length; i++)
        {
            const reference = references[i]
            const object = reference.userData.object
            const letter = letters[i]

            // Surplus slot: park it out of play instead of destroying the body,
            // so the shared reset/respawn logic keeps working untouched.
            if(!letter || !letter.geometry)
            {
                reference.visible = false
                object.physical.body.setEnabled(false)
                continue
            }

            reference.geometry.dispose()
            reference.geometry = letter.geometry
            reference.visible = true

            // Letters run along the axis in reverse: index 0 sits at the far
            // end of the row, so the word reads correctly from the viewer side.
            const position = center.clone().addScaledVector(axis, - letter.offset)
            position.y = elevation

            const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY)

            object.physical.body.setTranslation(position, true)
            object.physical.body.setRotation(rotation, true)
            object.physical.colliders[0].setHalfExtents({
                x: letter.width / 2,
                y: letter.height / 2,
                z: letter.depth / 2
            })
            object.physical.body.wakeUp()

            // Reset restores each body to the state captured when it was
            // created, which is the original word's layout. Without rebasing
            // it here, resetting the world puts the letters back in their old
            // slots and the name reads backwards.
            object.physical.initialState.position = { x: position.x, y: position.y, z: position.z }
            object.physical.initialState.rotation = { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }

            reference.position.copy(position)
            reference.needsUpdate = true
        }
    }

    /**
     * Discipline and location lines floating above the name. Purely visual, so
     * they skip the physics pipeline, but they join the area's hideable list to
     * be culled with everything else when the area leaves the view.
     */
    async setSignboard()
    {
        const references = this.references.items.get('letters')

        if(!references || references.length === 0)
            return

        const first = references[0].position.clone()
        const last = references[references.length - 1].position.clone()
        const center = first.clone().add(last).multiplyScalar(0.5)
        const rotationY = references[0].rotation.y

        const material = new THREE.MeshBasicNodeMaterial()
        material.outputNode = vec4(color(LandingArea.ACCENT_COLOR).mul(1.9), 1)

        for(const line of LandingArea.SIGNBOARD_LINES)
        {
            const geometry = await createTextGeometry(line.text, { size: line.size, depth: 0.06, curveSegments: 3 })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.copy(center)
            mesh.position.y = line.elevation
            mesh.rotation.y = rotationY
            mesh.castShadow = false
            mesh.receiveShadow = false

            this.game.scene.add(mesh)
            this.objects.hideable.push(mesh)
        }
    }

    /**
     * A signpost by the spawn with one arm per area, each rotated to actually
     * point at it. Without this the world gives a first-time visitor no reason
     * to pick one direction over another.
     */
    async setSignpost()
    {
        const origin = LandingArea.SIGNPOST_POSITION

        const group = new THREE.Group()
        group.position.set(origin.x, origin.y, origin.z)
        this.game.scene.add(group)
        this.objects.hideable.push(group)

        const woodMaterial = new THREE.MeshLambertNodeMaterial({ color: 0x6b5b4a })
        const textMaterial = new THREE.MeshBasicNodeMaterial()
        textMaterial.outputNode = vec4(color(LandingArea.ACCENT_COLOR).mul(1.9), 1)

        // Post
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, LandingArea.SIGNPOST_HEIGHT, 8), woodMaterial)
        post.position.y = LandingArea.SIGNPOST_HEIGHT / 2
        post.castShadow = true
        post.receiveShadow = true
        group.add(post)

        const armGeometry = new THREE.BoxGeometry(LandingArea.SIGNPOST_ARM_LENGTH, 0.4, 0.07)
        const tipGeometry = new THREE.ConeGeometry(0.26, 0.36, 4)

        let index = 0
        for(const target of LandingArea.SIGNPOST_TARGETS)
        {
            const arm = new THREE.Group()
            arm.position.y = LandingArea.SIGNPOST_HEIGHT - 0.45 - index * 0.55

            // Rotation that maps the arm's local +X onto the direction of travel.
            arm.rotation.y = Math.atan2(- (target.z - origin.z), target.x - origin.x)

            const plank = new THREE.Mesh(armGeometry, woodMaterial)
            plank.position.x = LandingArea.SIGNPOST_ARM_LENGTH / 2
            plank.castShadow = true
            plank.receiveShadow = true
            arm.add(plank)

            const tip = new THREE.Mesh(tipGeometry, woodMaterial)
            tip.position.x = LandingArea.SIGNPOST_ARM_LENGTH + 0.14
            tip.rotation.z = - Math.PI / 2
            tip.castShadow = true
            arm.add(tip)

            const geometry = await createTextGeometry(target.label, { size: 0.22, depth: 0.03, curveSegments: 3 })
            const label = new THREE.Mesh(geometry, textMaterial)
            label.position.set(LandingArea.SIGNPOST_ARM_LENGTH / 2, 0, 0.06)
            arm.add(label)

            group.add(arm)
            index++
        }
    }

    setKiosk()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('kioskInteractivePoint')[0].position,
            'Map',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.modals.open('map')
                // interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // this.game.map.items.get('map').events.on('close', () =>
        // {
        //     interactivePoint.show()
        // })
    }

    setControls()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('controlsInteractivePoint')[0].position,
            'Controls',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.menu.open('controls')
                interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // Menu instance
        const menuInstance = this.game.menu.items.get('controls')

        menuInstance.events.on('close', () =>
        {
            interactivePoint.show()
        })

        menuInstance.events.on('open', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
                menuInstance.tabs.goTo('gamepad')
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
                menuInstance.tabs.goTo('mouse-keyboard')
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
                menuInstance.tabs.goTo('touch')
        })
    }

    setBonfire()
    {
        const position = this.references.items.get('bonfireHashes')[0].position

        // Particles
        let particles = null
        {
            const emissiveMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
    
            const count = 30
            const elevation = uniform(5)
            const positions = new Float32Array(count * 3)
            const scales = new Float32Array(count)
    
    
            for(let i = 0; i < count; i++)
            {
                const i3 = i * 3
    
                const angle = Math.PI * 2 * Math.random()
                const radius = Math.pow(Math.random(), 1.5) * 1
                positions[i3 + 0] = Math.cos(angle) * radius
                positions[i3 + 1] = Math.random()
                positions[i3 + 2] = Math.sin(angle) * radius
    
                scales[i] = 0.02 + Math.random() * 0.06
            }
            
            const positionAttribute = instancedArray(positions, 'vec3').toAttribute()
            const scaleAttribute = instancedArray(scales, 'float').toAttribute()
    
            const material = new THREE.SpriteNodeMaterial()
            material.outputNode = emissiveMaterial.outputNode
    
            const progress = float(0).toVar()
    
            material.positionNode = Fn(() =>
            {
                const newPosition = positionAttribute.toVar()
                progress.assign(newPosition.y.add(this.localTime.mul(newPosition.y)).fract())
    
                newPosition.y.assign(progress.mul(elevation))
                newPosition.xz.addAssign(this.game.wind.direction.mul(progress))
    
                const progressHide = step(0.8, progress).mul(100)
                newPosition.y.addAssign(progressHide)
                
                return newPosition
            })()
            material.scaleNode = Fn(() =>
            {
                const progressScale = progress.remapClamp(0.5, 1, 1, 0)
                return scaleAttribute.mul(progressScale)
            })()
    
            const geometry = new THREE.CircleGeometry(0.5, 8)
    
            particles = new THREE.Mesh(geometry, material)
            particles.visible = false
            particles.position.copy(position)
            particles.count = count
            this.game.scene.add(particles)
        }

        // Hashes
        {
            const alphaNode = Fn(() =>
            {
                const baseUv = uv(1)
                const distanceToCenter = baseUv.sub(0.5).length()
    
                const voronoi = texture(
                    this.game.noises.voronoi,
                    baseUv
                ).g
    
                voronoi.subAssign(distanceToCenter.remap(0, 0.5, 0.3, 0))
    
                return voronoi
            })()
    
            const material = new MeshDefaultMaterial({
                colorNode: color(0x6F6A87),
                alphaNode: alphaNode,
                hasWater: false,
                hasLightBounce: false
            })
    
            const mesh = this.references.items.get('bonfireHashes')[0]
            mesh.material = material
        }

        // Burn
        const burn = this.references.items.get('bonfireBurn')[0]
        burn.visible = false

        // Interactive point
        this.game.interactivePoints.create(
            this.references.items.get('bonfireInteractivePoint')[0].position,
            'Res(e)t',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.reset()

                gsap.delayedCall(2, () =>
                {
                    // Bonfire
                    particles.visible = true
                    burn.visible = true
                    this.game.ticker.wait(2, () =>
                    {
                        particles.geometry.boundingSphere.center.y = 2
                        particles.geometry.boundingSphere.radius = 2
                    })

                    // Sound
                    this.game.audio.groups.get('campfire').items[0].positions.push(position)
                })
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'landing')
        })
        this.events.on('boundingOut', () =>
        {
            this.game.achievements.setProgress('landingLeave', 1)
        })
    }

    update()
    {
        this.localTime.value += this.game.ticker.deltaScaled * 0.1
    }
}