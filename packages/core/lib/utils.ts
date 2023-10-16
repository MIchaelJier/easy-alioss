export const regexp = /YYYY|YY|MM|DD|HH|hh|mm|SS|ss/g;

/**
 * Checks if a given key is a valid key in the provided object.
 *
 * @param {string | number | symbol} key - The key to check.
 * @param {Record<string, any>} object - The object to check against.
 * @return {boolean} Returns true if the key is a valid key in the object, otherwise returns false.
 */
export function isValidKey(
  key: string | number | symbol,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object: Record<string, any>,
): key is keyof typeof object {
  return key in object;
}

/**
 * Returns a Date object based on the provided input.
 *
 * @param {string | number | Date} date - The input date string, number, or Date object.
 * @return {Date} The converted Date object.
 */
export const getDate = function (date: string | number | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string') {
    // eslint-disable-next-line no-useless-escape
    date = (date as string).replace(/\-/g, '/');
    return new Date(date);
  }
  if (typeof date === 'number') {
    return new Date(date);
  }
  return new Date();
};

export const formatDate = function (
  unknownDate: string | number | Date = '',
  format = 'YYYYMMDDHHmm',
): string {
  const date = getDate(unknownDate);
  const padDate = (time: number): string | number =>
    time < 10 ? '0' + time : time;

  return format.replace(regexp, function (key: string): string {
    switch (key) {
      case 'YYYY':
        return date.getFullYear() + '';
      case 'YY':
        return (date.getFullYear() + '').slice(2);
      case 'MM':
        return padDate(date.getMonth() + 1) + '';
      case 'DD':
        return padDate(date.getDate()) + '';
      case 'HH':
      case 'hh':
        return padDate(date.getHours()) + '';
      case 'mm':
        return padDate(date.getMinutes()) + '';
      case 'SS':
      case 'ss':
        return padDate(date.getSeconds()) + '';
      default:
        return ' ';
    }
  });
};
