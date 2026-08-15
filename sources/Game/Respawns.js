import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

export class Respawns
{
    // Kept in step with the POSITION constants on the procedural areas.
    static PROCEDURAL = [
        [ 'visionLab', { x: 12.3, z: 47.5 }, Math.PI ],
        [ 'aiLab', { x: 70.0, z: 27.5 }, Math.PI ],
    ]

    constructor(defaultName = 'landing')
    {
        this.game = Game.getInstance()
        this.defaultName = defaultName

        this.setItems()
    }

    setItems()
    {
        this.items = new Map()

        for(const child of this.game.resources.respawnsReferencesModel.scene.children)
        {
            child.rotation.reorder('YXZ')

            let name = child.name.replace(/^respawn(.+)$/i, '$1')

            name = name.charAt(0).toLowerCase() + name.slice(1)

            const item = {
                name: name,
                position: new THREE.Vector3(
                    child.position.x,
                    4,
                    child.position.z
                ),
                rotation: child.rotation.y
            }

            this.items.set(name, item)
        }

        // Areas built in code have no respawn marker in the model, so they get
        // one here. Without it the closest-respawn search would strand a stuck
        // visitor by sending them back across the campus.
        for(const [ name, position, rotation ] of Respawns.PROCEDURAL)
        {
            this.items.set(name, {
                name,
                position: new THREE.Vector3(position.x, 4, position.z),
                rotation
            })
        }
    }

    getByName(name)
    {
        return this.items.get(name)
    }

    getDefault()
    {
        return this.items.get(this.defaultName)
    }

    getClosest(position)
    {
        let closestItem = null
        let closestDistance = Infinity

        this.items.forEach((item) =>
        {
            const distance = Math.hypot(item.position.x - position.x, item.position.z - position.z)

            if(distance < closestDistance)
            {
                closestDistance = distance
                closestItem = item
            }
        })

        return closestItem
    }
}