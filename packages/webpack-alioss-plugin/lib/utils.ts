export const regexp = /YYYY|YY|MM|DD|HH|hh|mm|SS|ss/g
const week: Array<string> = ['01', '02', '03', '04', '05', '06', '07']

export const getDate = function (date: string | number | Date): Date {
  if (date instanceof Date) {
    return date
  }
  if (typeof date === 'string') {
    // eslint-disable-next-line no-param-reassign
    date = (date as string).replace(/\-/g, '/')
    return new Date(date)
  }
  if (typeof date === 'number') {
    return new Date(date)
  }
  return new Date()
}

export const formatDate = function (
  unknownDate: string | number | Date = '',
  format = 'YYYYMMDDHHmm'
): string {
  // eslint-disable-next-line no-param-reassign
  const date = getDate(unknownDate)
  const padDate = (time: number): string | number =>
    (time < 10 ? '0' + time : time)

  return format.replace(regexp, function (key: string): string {
    switch (key) {
      case 'YYYY':
        return date.getFullYear() + ''
      case 'YY':
        return (date.getFullYear() + '').slice(2)
      case 'MM':
        return padDate(date.getMonth() + 1) + ''
      case 'DD':
        return padDate(date.getDate()) + ''
      case 'HH':
      case 'hh':
        return padDate(date.getHours()) + ''
      case 'mm':
        return padDate(date.getMinutes()) + ''
      case 'SS':
      case 'ss':
        return padDate(date.getSeconds()) + ''
      case 'week':
        return week[date.getDay()]
      default:
        return ' '
    }
  })
}
