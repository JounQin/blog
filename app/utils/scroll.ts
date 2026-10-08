export interface ScrollContext {
  x?: number
  y?: number
  startX?: number
  startY?: number
  startTime?: number
  duration?: number
}

const now = () =>
  typeof performance === 'undefined' || !performance.now
    ? Date.now()
    : performance.now()

const scroll = (context: ScrollContext, el: Element | Window) => {
  const {
    startX = 0,
    startY = 0,
    x = 0,
    y = 0,
    startTime = 0,
    duration = 500,
  } = context

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
  if (
    typeof document !== 'undefined' &&
    'scrollBehavior' in document.documentElement.style
  ) {
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
