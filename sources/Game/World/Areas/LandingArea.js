import * as THREE from 'three/webgpu'
import { color, float, Fn, instancedArray, mix, normalWorld, positionGeometry, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { Inputs } from '../../Inputs/Inputs.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'
import { createLetters, createTextPlane } from '../../utilities/text3D.js'

export class LandingArea extends Area
{
    static NAME = 'THANUISH'
    static LETTER_SIZE = 1.45
    static LETTER_DEPTH = 0.46
    static LETTER_SPACING = 0.16
    static ACCENT_COLOR = '#5fd2ff'

    // How long a letter lies knocked over before standing itself back up.
    static LETTER_RECOVERY_SECONDS = 5

    // Kept to plain ASCII on purpose: the extruded typeface has no glyph for
    // typographic separators like the middle dot.
    // Sized against the 1.45-unit name letters below them. The first pass was
    // roughly double this and swamped the name; the second overshot the other
    // way and became unreadable. This sits between the two.
    static SIGNBOARD_LINES = [
        { text: 'AI  ·  COMPUTER VISION  ·  3D PERCEPTION', size: 0.62, width: 11, elevation: 3.95 },
        { text: 'M.SC. COMPUTER SCIENCE  ·  STUTTGART', size: 0.44, width: 9, elevation: 3.15 },
        { text: 'EXPLORE THE RESEARCH CAMPUS', size: 0.36, width: 8, elevation: 2.55 },
    ]

    static HINT_POSITION = { x: 42.5, z: 35.6 }
    static HINT_ROTATION = 0.436


    constructor(model)
    {
        super(model)

        this.localTime = uniform(0)

        this.setLetters()
        this.setSignboard()
        this.setGroundHint()
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
    setSignboard()
    {
        const references = this.references.items.get('letters')

        if(!references || references.length === 0)
            return

        const first = references[0].position.clone()
        const last = references[references.length - 1].position.clone()
        const center = first.clone().add(last).multiplyScalar(0.5)
        this.signboardMeshes = []

        for(const line of LandingArea.SIGNBOARD_LINES)
        {
            const mesh = createTextPlane(line.text, {
                hex: LandingArea.ACCENT_COLOR,
                worldWidth: line.width,
                worldHeight: line.size * 1.6,
                fontSize: line.size,
                density: 140
            })

            mesh.position.copy(center)
            mesh.position.y = line.elevation
            this.game.scene.add(mesh)
            this.objects.hideable.push(mesh)
            this.signboardMeshes.push(mesh)
        }
    }

    /**
     * The arrow-key hint.
     *
     * This was text painted on the paving, which sat at a glancing angle and
     * was effectively unreadable. It is HTML now: a glowing key cluster that is
     * legible at any camera angle and on any screen, and which fades out the
     * moment the visitor actually drives.
     */
    setGroundHint()
    {
        const element = document.querySelector('.js-controls-hint')

        if(!element)
            return

        const dismiss = () =>
        {
            element.classList.add('is-hidden')
        }

        for(const action of [ 'forward', 'backward', 'left', 'right' ])
            this.game.inputs.events.on(action, (event) => { if(event.active) dismiss() })
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

    /**
     * Stands the name back up once nobody is looking.
     *
     * The letters are knockable on purpose, but a permanently flattened name is
     * a bad first impression for the next visitor. Leaving the area resets them,
     * so the name is always upright on arrival and always still hittable.
     */
    restoreLetters()
    {
        for(const reference of this.references.items.get('letters'))
        {
            const object = reference.userData.object

            if(object?.physical?.body.isEnabled())
                this.game.objects.resetObject(object)
        }
    }

    /**
     * Stands a knocked-over letter back up once it has come to rest.
     *
     * Waiting for the area to be left was not enough: the name stays flattened
     * while the visitor is still standing in front of it, which is exactly when
     * it matters. A letter that is tilted and asleep is reset after a pause,
     * so hitting them is still fun but the name always recovers.
     */
    updateFallenLetters()
    {
        this.fallenTimers = this.fallenTimers ?? new Map()

        const upright = new THREE.Vector3(0, 1, 0)

        for(const reference of this.references.items.get('letters'))
        {
            const object = reference.userData.object
            const body = object?.physical?.body

            if(!body || !body.isEnabled() || object.reseting)
                continue

            upright.set(0, 1, 0).applyQuaternion(body.rotation())
            const isFallen = upright.y < 0.7

            if(!isFallen || !body.isSleeping())
            {
                this.fallenTimers.delete(reference)
                continue
            }

            const elapsed = (this.fallenTimers.get(reference) ?? 0) + this.game.ticker.deltaScaled
            this.fallenTimers.set(reference, elapsed)

            if(elapsed > LandingArea.LETTER_RECOVERY_SECONDS)
            {
                this.game.objects.resetObject(object)
                this.fallenTimers.delete(reference)
            }
        }
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'landing')
        })

        this.events.on('boundingOut', () =>
        {
            this.restoreLetters()
        })
        this.events.on('boundingOut', () =>
        {
            this.game.achievements.setProgress('landingLeave', 1)
        })
    }

    update()
    {
        this.faceCamera(this.signboardMeshes)
        this.updateFallenLetters()

        this.localTime.value += this.game.ticker.deltaScaled * 0.1
    }
}