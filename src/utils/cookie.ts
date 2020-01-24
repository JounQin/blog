import { INFINITY_DATE } from './constant'

import { SetCookie } from 'types'

export const getCookie = (name: string) =>
  decodeURIComponent(
    document.cookie.replace(
      new RegExp(
        '(?:(?:^|.*;)\\s*' +
          encodeURIComponent(name).replace(/[*+-.]/g, '\\$&') +
          '\\s*\\=\\s*([^;]*).*$)|^.*$',
      ),
      '$1',
    ),
  ) || null

export const setCookie = (
  name: string,
  value: string,
  end?: number | string | Date,
  path?: string,
  domain?: string,
  secure?: boolean,
) => {
  if (!name || /^(?:expires|max-age|path|domain|secure)$/i.test(name)) {
    return false
  }
  let sExpires = ''
  if (end) {
    switch (end.constructor) {
      case Number:
        sExpires =
          end === Infinity
            ? `; expires=${INFINITY_DATE}`
            : '; max-age=' + (end as string)
        break
      case String:
        sExpires = '; expires=' + (end as string)
        break
      case Date:
        sExpires = '; expires=' + (end as Date).toUTCString()
        break
    }
  }
  document.cookie =
    encodeURIComponent(name) +
    '=' +
    encodeURIComponent(value == null ? '' : value) +
    sExpires +
    (domain ? '; domain=' + domain : '') +
    (path ? '; path=' + path : '') +
    (secure ? '; secure' : '')
  return true
}

export const parseSetCookies = (setCookies: string | string[]) => {
  if (!Array.isArray(setCookies)) {
    setCookies = [setCookies]
  }
  return setCookies.reduce((result, cookies) => {
    if (!cookies) {
      return result
    }
    const [item, ...rests] = cookies.split(/; */)
    const cookie = item.split('=')
    const setCookieItem = {
      name: cookie[0],
      value: cookie[1],
    }
    rests.forEach(rest => {
      const [key, value] = rest.split('=')
      setCookieItem[key as keyof typeof setCookieItem] =
        value == null ? 'true' : value
    })
    result.push(setCookieItem)
    return result
  }, [] as SetCookie[])
}
