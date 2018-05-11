import { ScrollContext } from 'types'

import { now } from './time'

const scrollSmoothNativeSupported =
  typeof document !== 'undefined' &&
  'scrollBehavior' in document.documentElement.style

const scroll = (context: ScrollContext, el: Window | Element) => {
  const { startX, startY, x = 0, y = 0 } = context

  let elapsed = (now() - context.startTime) / context.duration
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
  el: Window | Element = window,
) => {
  if (scrollSmoothNativeSupported) {
    return el.scrollTo({
      left: context.x,
      top: context.y,
      behavior: 'smooth',
    })
  }

  context.startX = context.startX || window.pageXOffset
  context.startY = context.startY || window.pageYOffset
  context.startTime = context.startTime || now()
  context.duration = context.duration || 500

  scroll(context, el)
}
