/**
 * `@deeplx/core` warms its DeepL session by reading `Set-Cookie` from
 * `https://www.deepl.com/translator`, through `headers.get('set-cookie')` -- a
 * forbidden response header in the Workers runtime, so it silently collected
 * nothing there. Without the `verifiedBot` cookie the anonymous oneshot endpoint
 * answers with the input text instead of a translation, which is why the site
 * looked untranslated while no error was ever logged.
 *
 * Warm the cookies with the runtime's own accessor and hand them to the library,
 * which accepts them via `cookies` (and `skipWarm`, to bypass its own attempt).
 *
 * un-ts/deeplx#56 ("optimize warmCookies for ephemeral environments") added exactly
 * these two options -- plus `setSharedCookies` -- because the in-memory warm-up dies
 * between executions in runtimes like Workers: injecting cookies from outside is the
 * intended design, the network half stays with the caller. The published 0.2.2 only
 * exports `getSharedCookies`, so the cookies are passed per call here.
 */
let cookies = ''
let warming: Promise<string> | undefined

export const warmDeepLCookies = async (): Promise<string> => {
  if (cookies) {
    return cookies
  }

  warming ??= (async () => {
    try {
      const response = await fetch('https://www.deepl.com/translator')
      const raw = [
        ...(response.headers.getSetCookie?.() ?? []),
        response.headers.get('set-cookie') ?? '',
      ].join('; ')

      const picked = ['userCountry', 'verifiedBot']
        .map(name => new RegExp(`${name}=[^;]+`).exec(raw)?.[0])
        .filter((value): value is string => Boolean(value))

      if (picked.length > 0) {
        cookies = picked.join('; ')
      }
    } catch {
      // a failed warm-up only means the request goes out without cookies
    }

    console.info(`[translate] deepl cookies warmed: ${cookies ? 'yes' : 'no'}`)
    return cookies
  })()

  return warming
}
