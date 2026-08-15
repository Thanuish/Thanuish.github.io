import * as THREE from 'three/webgpu'

/**
 * Project boards are text cards drawn at runtime rather than screenshots.
 *
 * The area's carousel expects textures at the authored board ratio, so cards
 * are rendered at exactly that size and handed back through the same resource
 * lookup the KTX loader would have populated.
 */

const WIDTH = 960
const HEIGHT = 540

const BACKGROUND = '#14131a'
const PANEL = '#1d1b26'
const TEXT = '#e8e6f0'
const TEXT_FADED = '#9d99b0'

const PADDING = 56

function roundRect(context, x, y, width, height, radius)
{
    context.beginPath()
    context.roundRect(x, y, width, height, radius)
}

/**
 * Wraps `text` to `maxWidth`, returning the lines. The caller has already set
 * the font on the context.
 */
function wrap(context, text, maxWidth)
{
    const words = text.split(' ')
    const lines = []
    let current = ''

    for(const word of words)
    {
        const candidate = current ? `${current} ${word}` : word

        if(context.measureText(candidate).width > maxWidth && current)
        {
            lines.push(current)
            current = word
        }
        else
        {
            current = candidate
        }
    }

    if(current)
        lines.push(current)

    return lines
}

/**
 * @param {{ kicker?: string, title: string, lines?: string[], chips?: string[], accent?: string }} card
 */
export function createProjectCardTexture(card)
{
    const accent = card.accent ?? '#5fd2ff'

    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT

    const context = canvas.getContext('2d')

    // Ground
    context.fillStyle = BACKGROUND
    context.fillRect(0, 0, WIDTH, HEIGHT)

    // Accent stripe down the left edge
    context.fillStyle = accent
    context.fillRect(0, 0, 8, HEIGHT)

    let y = PADDING
    const contentWidth = WIDTH - PADDING * 2

    // Kicker
    if(card.kicker)
    {
        context.font = '800 20px Nunito, sans-serif'
        context.fillStyle = accent
        context.textBaseline = 'top'
        context.fillText(card.kicker.toUpperCase(), PADDING, y)
        y += 34
    }

    // Title
    context.font = '900 46px Nunito, sans-serif'
    context.fillStyle = TEXT
    for(const line of wrap(context, card.title, contentWidth))
    {
        context.fillText(line, PADDING, y)
        y += 54
    }

    y += 18

    // Body lines, each with a small accent bullet
    if(card.lines)
    {
        context.font = '400 24px Nunito, sans-serif'

        for(const line of card.lines)
        {
            const wrapped = wrap(context, line, contentWidth - 28)
            let first = true

            for(const wrappedLine of wrapped)
            {
                if(first)
                {
                    context.fillStyle = accent
                    context.beginPath()
                    context.arc(PADDING + 5, y + 13, 4, 0, Math.PI * 2)
                    context.fill()
                    first = false
                }

                context.fillStyle = TEXT_FADED
                context.fillText(wrappedLine, PADDING + 28, y)
                y += 32
            }

            y += 8
        }
    }

    // Tech chips along the bottom
    if(card.chips && card.chips.length)
    {
        context.font = '700 20px Nunito, sans-serif'

        let chipX = PADDING
        let chipY = HEIGHT - PADDING - 34

        for(const chip of card.chips)
        {
            const width = context.measureText(chip).width + 28

            // Wrap to a second row rather than running off the card
            if(chipX + width > WIDTH - PADDING)
            {
                chipX = PADDING
                chipY -= 44
            }

            context.fillStyle = PANEL
            roundRect(context, chipX, chipY, width, 34, 17)
            context.fill()

            context.fillStyle = accent
            context.fillText(chip, chipX + 14, chipY + 7)

            chipX += width + 10
        }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.flipY = false
    texture.needsUpdate = true

    return texture
}
