import { format, formatDistance, parseISO } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'

import { Locale } from '#shared/utils/locale'

export type DateType = Date | number | string

const toDate = (date: DateType) =>
  typeof date === 'string' ? parseISO(date) : new Date(date)

export const dateFormat = (date: DateType, pattern = 'yyyy-MM-dd') =>
  format(toDate(date), pattern)

const locales = {
  [Locale.EN]: enUS,
  [Locale.ZH]: zhCN,
}

export const timeAgo = (date: DateType, locale: Locale = Locale.EN) =>
  formatDistance(toDate(date), Date.now(), { locale: locales[locale] })
