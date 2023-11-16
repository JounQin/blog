import { now } from './time'

import { ScrollContext } from 'types'

const scrollSmoothNativeSupported =
  typeof document !== 'undefined' &&
  'scrollBehavior' in document.documentElement.style

const scroll = (context: ScrollContext, el: Element | Window) => {
  const { startX, startY, x = 0, y = 0, startTime, duration } = context

  let elapsed = (now() - startTime) / duration
  elapsed = elapsed > 1 ? 1 : elapsed
  const left = startX + (x - startX) * elapsed
  const top = startY + (y - startY) * elapsed

  el.scrollTo({ top, left })

  if (x !== left || y !== top) {
    requestAnimationFrame(() => scroll(context, el))
  }
}

export const scrollTo = (
  context: ScrollContext,
  el: Element | Window = window,
) => {
  if (scrollSmoothNativeSupported) {
    return el.scrollTo({
      left: context.x,
      top: context.y,
      behavior: 'smooth',
    })
  }

  context.startX = context.startX || window.scrollX
  context.startY = context.startY || window.scrollY
  context.startTime = context.startTime || now()

  context.duration = context.duration || 500

  scroll(context, el)
}
