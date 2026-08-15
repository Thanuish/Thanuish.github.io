import { Game } from '../../Game.js'
import { AltarArea } from './AltarArea.js'
import { CookieArea } from './CookieArea.js'
import { LandingArea } from './LandingArea.js'
import { ProjectsArea } from './ProjectsArea.js'
import { LabArea } from './LabArea.js'
import { CareerArea } from './CareerArea.js'
import { SocialArea } from './SocialArea.js'
import { ToiletArea } from './ToiletArea.js'
import { BowlingArea } from './BowlingArea.js'
import { CircuitArea } from './CircuitArea.js'
import { BehindTheSceneArea } from './BehindTheSceneArea.js'
import { AchievementsArea } from './AchievementsArea.js'
import { TimeMachineArea } from './TimeMachineArea.js'
import { EasterArea } from './EasterArea.js'
import { VisionLabArea } from './VisionLabArea.js'
import { AiLabArea } from './AiLabArea.js'

export class Areas
{
    constructor()
    {
        this.game = Game.getInstance()

        // The world model still contains the original owner's playground areas
        // (circuit, bowling, cookie, toilet, altar, time machine). They are left
        // out so the campus is the five areas that carry my content, and the
        // visitor is not sent wandering across an island of unrelated content.
        // Re-adding one is a matter of putting its pair back in this list.
        const list = [
            [ 'behindTheScene', BehindTheSceneArea ],
            [ 'career', CareerArea ],
            [ 'lab', LabArea ],
            [ 'landing', LandingArea ],
            [ 'projects', ProjectsArea ],
            [ 'social', SocialArea ],
        ]

        const model = [...this.game.resources.areasModel.scene.children]
        
        for(const child of model)
        {
            for(const [ name, AreaClass ] of list)
            {
                if(child.name.startsWith(name))
                    this[name] = new AreaClass(child)
            }
        }

        // Areas with no geometry in the world model. They build their own, so
        // they are constructed from a generated zone-only model instead of a
        // Blender node.
        const proceduralList = [
            [ 'visionLab', VisionLabArea ],
            [ 'aiLab', AiLabArea ],
        ]

        for(const [ name, AreaClass ] of proceduralList)
            this[name] = new AreaClass(AreaClass.createModel())

        // // Test how many areas are visible
        // this.game.ticker.events.on('tick', () =>
        // {
        //     let i = 0
        //     if(this.achievements.frustum.isIn)
        //         i++
        //     if(this.altar.frustum.isIn)
        //         i++
        //     if(this.behindTheScene.frustum.isIn)
        //         i++
        //     if(this.bowling.frustum.isIn)
        //         i++
        //     if(this.career.frustum.isIn)
        //         i++
        //     if(this.circuit.frustum.isIn)
        //         i++
        //     if(this.cookie.frustum.isIn)
        //         i++
        //     if(this.lab.frustum.isIn)
        //         i++
        //     if(this.landing.frustum.isIn)
        //         i++
        //     if(this.projects.frustum.isIn)
        //         i++
        //     if(this.social.frustum.isIn)
        //         i++
        //     if(this.toilet.frustum.isIn)
        //         i++

        //     console.log(i)
        // }, 6)
    }
}