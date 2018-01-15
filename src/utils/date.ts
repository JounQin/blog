import { format, formatDistance } from 'date-fns'

export type DateType = Date | string | number

export const dateFormat = (date: DateType, f: string = 'YYYY-MM-DD') =>
  format(date, f)

export const timeAgo = (date: DateType) => formatDistance(date, Date.now())
