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
 * @param {{ kicker?: string, title: string, lines?: string[], chips?: string[], accent?: string, image?: string }} card
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

    // With an image the text takes the left column and the picture the right,
    // so the wrap width has to shrink to match.
    const hasImage = !!card.image
    const imageWidth = hasImage ? Math.round(WIDTH * 0.4) : 0
    const contentWidth = WIDTH - PADDING * 2 - (hasImage ? imageWidth + PADDING * 0.5 : 0)

    // Kicker
    if(card.kicker)
    {
        context.font = '800 25px Nunito, sans-serif'
        context.fillStyle = accent
        context.textBaseline = 'top'
        context.fillText(card.kicker.toUpperCase(), PADDING, y)
        y += 40
    }

    // Title
    context.font = '900 58px Nunito, sans-serif'
    context.fillStyle = TEXT
    for(const line of wrap(context, card.title, contentWidth))
    {
        context.fillText(line, PADDING, y)
        y += 66
    }

    y += 18

    // Body lines, each with a small accent bullet.
    //
    // The board is a summary: the full write-up lives in the project page. So
    // rather than letting text run under the chips or off the bottom, drawing
    // stops at the first line that will not fit and a hint is drawn instead.
    const chipRowHeight = card.chips && card.chips.length ? 52 : 0
    const bodyLimit = HEIGHT - PADDING - chipRowHeight - 38

    let truncated = false

    if(card.lines)
    {
        context.font = '400 29px Nunito, sans-serif'

        for(const line of card.lines)
        {
            const wrapped = wrap(context, line, contentWidth - 28)

            // Keep bullets whole: a half-drawn point reads worse than none.
            if(y + wrapped.length * 38 > bodyLimit)
            {
                truncated = true
                break
            }

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
                y += 38
            }

            y += 8
        }
    }

    if(truncated)
    {
        context.font = '700 24px Nunito, sans-serif'
        context.fillStyle = accent
        context.fillText('Press ENTER to read more', PADDING + 28, y)
    }

    // Tech chips along the bottom
    if(card.chips && card.chips.length)
    {
        context.font = '700 24px Nunito, sans-serif'

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

    if(hasImage)
    {
        const image = new Image()

        image.onload = () =>
        {
            const boxX = WIDTH - PADDING - imageWidth
            const boxY = PADDING
            const boxHeight = HEIGHT - PADDING * 2

            // Contain, so a certificate is never cropped or stretched.
            const scale = Math.min(imageWidth / image.width, boxHeight / image.height)
            const drawWidth = image.width * scale
            const drawHeight = image.height * scale

            context.fillStyle = PANEL
            roundRect(context, boxX, boxY, imageWidth, boxHeight, 12)
            context.fill()

            context.drawImage(
                image,
                boxX + (imageWidth - drawWidth) / 2,
                boxY + (boxHeight - drawHeight) / 2,
                drawWidth,
                drawHeight
            )

            texture.needsUpdate = true
        }

        image.onerror = () => console.warn(`projectCard: could not load "${card.image}"`)
        image.src = card.image
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
