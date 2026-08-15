import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

/**
 * Drives the car to an area on its own.
 *
 * Rather than scripting a path or teleporting, this steers the real vehicle:
 * every tick it writes into the same `player.steering` / `player.accelerating`
 * fields the keyboard writes, between the player's input pass (priority 1) and
 * the vehicle's physics pass (priority 2). So the car accelerates, leans and
 * loses grip exactly as it would under a human, and anything in the way is hit
 * rather than passed through.
 *
 * Any manual input cancels it immediately.
 */
export class Autopilot
{
    // Full steering lock is reached when the target is this far off the nose.
    static FULL_LOCK_ANGLE = Math.PI * 0.25

    // Past this the car is facing away, so it crawls round instead of charging.
    static WIDE_ANGLE = 1.0

    static ARRIVE_DISTANCE = 6
    static SLOW_DISTANCE = 16

    // If it fails to cover ground for this long, assume it is wedged.
    static STUCK_SECONDS = 4
    static STUCK_SPEED = 1.5

    constructor()
    {
        this.game = Game.getInstance()

        this.target = null
        this.targetName = null
        this.stuckFor = 0
        this.events = { arrive: [], cancel: [] }

        this.forward2D = new THREE.Vector2()
        this.toTarget2D = new THREE.Vector2()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 1.5)

        this.watchForManualInput()
        this.setChooser()
    }

    /**
     * The prompt offering manual driving or a lift. Shown once, after the
     * intro has handed control over, and reachable again from the map key.
     */
    setChooser()
    {
        this.chooser = {}
        this.chooser.element = document.querySelector('.js-travel')

        if(!this.chooser.element)
            return

        const destinations = this.chooser.element.querySelector('.js-travel-destinations')

        // Inline styles rather than a class: something in the existing sheets
        // wins on opacity, and this element only ever has two states, so it is
        // not worth another specificity fight.
        this.chooser.show = () =>
        {
            this.chooser.element.classList.add('is-visible')
            this.chooser.element.style.opacity = '1'
            this.chooser.element.style.pointerEvents = 'auto'
            this.chooser.element.style.transform = 'translateX(-50%) translateY(0)'
        }

        this.chooser.hide = () =>
        {
            this.chooser.element.classList.remove('is-visible')
            this.chooser.element.style.opacity = '0'
            this.chooser.element.style.pointerEvents = 'none'
            this.chooser.element.style.transform = 'translateX(-50%) translateY(1rem)'
            destinations.classList.remove('is-visible')
            destinations.style.display = 'none'
        }

        this.chooser.element.querySelector('.js-travel-manual').addEventListener('click', () =>
        {
            this.hasChosen = true
            this.chooser.hide()
        })

        this.chooser.element.querySelector('.js-travel-dismiss').addEventListener('click', () =>
        {
            this.hasChosen = true
            this.chooser.hide()
        })

        this.chooser.element.querySelector('.js-travel-auto').addEventListener('click', () =>
        {
            // Destinations are read on demand: the areas exist by the time the
            // visitor can click, which is not true when this is constructed.
            destinations.replaceChildren()

            for(const destination of this.getDestinations())
            {
                const button = document.createElement('button')
                button.className = 'button'
                button.textContent = destination.label
                button.addEventListener('click', () =>
                {
                    this.hasChosen = true
                    this.driveTo(destination.name)
                    this.chooser.hide()
                })
                destinations.append(button)
            }

            destinations.classList.add('is-visible')
            destinations.style.display = 'flex'
        })

        // Give the intro time to finish before interrupting with a question.
        // A plain timer rather than ticker.wait: that queue does not drain
        // reliably here, so the prompt never appeared.
        window.setTimeout(() => this.chooser.show(), 3000)

        // Belt and braces: if that timer is throttled, the first frame the
        // page is actually visible still brings the prompt up.
        document.addEventListener('visibilitychange', () =>
        {
            if(!document.hidden && !this.hasChosen)
                this.chooser.show()
        })
    }

    /** Destinations the visitor can be driven to, resolved from the world. */
    getDestinations()
    {
        const areas = this.game.world.areas
        const list = [
            [ 'visionLab', 'Computer Vision Lab', areas.visionLab?.origin ],
            [ 'aiLab', 'AI / LLM Lab', areas.aiLab?.origin ],
            [ 'projects', 'Projects', areas.projects?.model?.position ],
            [ 'career', 'Experience', areas.career?.model?.position ],
            [ 'lab', 'Achievements', areas.lab?.model?.position ],
            [ 'social', 'Contact', areas.social?.center ],
        ]

        return list
            .filter(([ , , position ]) => !!position)
            .map(([ name, label, position ]) => ({ name, label, position: position.clone() }))
    }

    driveTo(name)
    {
        const destination = this.getDestinations().find(item => item.name === name)

        if(!destination)
            return false

        this.target = destination.position
        this.targetName = destination.label
        this.stuckFor = 0

        this.game.notifications?.add?.({ text: `Driving to ${destination.label}` })

        return true
    }

    cancel(reason = 'cancel')
    {
        if(!this.target)
            return

        this.target = null
        this.targetName = null

        for(const callback of this.events[reason] ?? [])
            callback()
    }

    get isDriving()
    {
        return !!this.target
    }

    /**
     * A deliberate steering or throttle press hands control straight back.
     * Camera movement and menus are left alone so looking around is safe.
     */
    watchForManualInput()
    {
        for(const action of [ 'forward', 'backward', 'left', 'right', 'brake' ])
        {
            this.game.inputs.events.on(action, (event) =>
            {
                if(event.active && this.isDriving)
                    this.cancel()
            })
        }
    }

    update()
    {
        if(!this.target)
            return

        const position = this.game.player.position
        const delta = this.game.ticker.deltaScaled

        this.toTarget2D.set(this.target.x - position.x, this.target.z - position.z)
        const distance = this.toTarget2D.length()

        if(distance < Autopilot.ARRIVE_DISTANCE)
        {
            this.game.player.accelerating = 0
            this.game.player.braking = 1
            this.game.player.steering = 0

            this.game.notifications?.add?.({ text: `Arrived at ${this.targetName}` })
            this.cancel('arrive')
            return
        }

        this.toTarget2D.normalize()

        const forward = this.game.physicalVehicle.forward
        this.forward2D.set(forward.x, forward.z).normalize()

        // Signed angle from the nose to the target, about +Y. Positive turns
        // the nose toward -Z, which is the car's left, and positive steering is
        // left, so the sign carries straight through.
        const cross = this.forward2D.y * this.toTarget2D.x - this.forward2D.x * this.toTarget2D.y
        const dot = this.forward2D.dot(this.toTarget2D)
        const angle = Math.atan2(cross, dot)

        this.game.player.steering = THREE.MathUtils.clamp(angle / Autopilot.FULL_LOCK_ANGLE, -1, 1)

        // Ease off when badly misaligned, so it turns on the spot rather than
        // running wide, and again on the approach so it does not overshoot.
        const alignment = Math.abs(angle) > Autopilot.WIDE_ANGLE ? 0.35 : 1
        const approach = THREE.MathUtils.clamp(distance / Autopilot.SLOW_DISTANCE, 0.35, 1)

        this.game.player.accelerating = alignment * approach
        this.game.player.braking = 0
        this.game.player.boosting = 0

        // Wedged against scenery: back out briefly rather than grinding.
        if(Math.abs(this.game.physicalVehicle.speed) < Autopilot.STUCK_SPEED)
        {
            this.stuckFor += delta

            if(this.stuckFor > Autopilot.STUCK_SECONDS)
            {
                this.game.player.accelerating = -0.8
                this.game.player.steering *= -1

                if(this.stuckFor > Autopilot.STUCK_SECONDS + 1.5)
                    this.stuckFor = 0
            }
        }
        else
        {
            this.stuckFor = 0
        }
    }
}
