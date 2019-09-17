// eslint-disable-next-line import/no-duplicates
import { format, formatDistance, parseISO } from 'date-fns'
// eslint-disable-next-line import/no-duplicates
import { enUS, zhCN } from 'date-fns/locale'

import { Locale } from 'types'

export type DateType = Date | string | number

export const dateFormat = (date: DateType, f = 'yyyy-MM-dd') =>
  format(typeof date === 'string' ? parseISO(date) : date, f)

const locales = {
  [Locale.EN]: enUS,
  [Locale.ZH]: zhCN,
}

export const timeAgo = (date: DateType, locale: Locale = Locale.EN) =>
  formatDistance(typeof date === 'string' ? parseISO(date) : date, Date.now(), {
    locale: locales[locale],
  })

export const now =
  // eslint-disable-next-line @typescript-eslint/unbound-method
  typeof performance === 'undefined' || !performance.now
    ? // eslint-disable-next-line @typescript-eslint/unbound-method
      Date.now
    : performance.now.bind(performance)
