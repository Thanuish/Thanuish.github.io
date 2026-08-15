/**
 * Fills and opens the scrollable detail page.
 *
 * Both the project boards and the lab instruments need the same thing: a
 * readable, scrollable write-up that the 3D world has no room for. They share
 * this one modal rather than each growing their own.
 *
 * @param {object} game
 * @param {{ role?: string, title: string, sections?: Array, url?: string, urlLabel?: string, emptyLabel?: string }} content
 */
export function openInfoPage(game, content)
{
    const modal = document.querySelector('.js-modal[data-name="project"]')

    if(!modal)
        return

    modal.querySelector('.js-project-role').textContent = content.role ?? ''
    modal.querySelector('.js-project-title').textContent = content.title ?? ''

    const body = modal.querySelector('.js-project-body')
    body.replaceChildren()

    for(const section of content.sections ?? [])
    {
        const element = document.createElement('div')
        element.className = 'section'

        if(section.kicker)
        {
            const kicker = document.createElement('div')
            kicker.className = 'kicker'
            kicker.style.color = section.accent ?? ''
            kicker.textContent = section.kicker
            element.append(kicker)
        }

        if(section.title)
        {
            const heading = document.createElement('h2')
            heading.className = 'heading'
            heading.textContent = section.title
            element.append(heading)
        }

        if(section.lines?.length)
        {
            const list = document.createElement('ul')

            for(const line of section.lines)
            {
                const item = document.createElement('li')
                item.textContent = line
                list.append(item)
            }

            element.append(list)
        }

        if(section.chips?.length)
        {
            const chips = document.createElement('div')
            chips.className = 'chips'
            chips.style.color = section.accent ?? ''

            for(const chip of section.chips)
            {
                const chipElement = document.createElement('span')
                chipElement.className = 'chip'
                chipElement.textContent = chip
                chips.append(chipElement)
            }

            element.append(chips)
        }

        body.append(element)
    }

    const links = modal.querySelector('.js-project-links')
    links.replaceChildren()

    if(content.url)
    {
        const anchor = document.createElement('a')
        anchor.className = 'button'
        anchor.href = content.url
        anchor.target = '_blank'
        anchor.rel = 'noreferrer'
        anchor.textContent = content.urlLabel ?? 'Open link'
        links.append(anchor)
    }
    else if(content.emptyLabel)
    {
        const note = document.createElement('span')
        note.className = 'no-link'
        note.textContent = content.emptyLabel
        links.append(note)
    }

    // Always start a newly opened page at the top.
    modal.querySelector('.js-scroller').scrollTop = 0

    game.modals.open('project')
}
