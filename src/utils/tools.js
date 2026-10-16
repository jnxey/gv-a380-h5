/**
 * 判断值是否为空。
 */
export function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
}

/**
 * 判断值是否为函数。
 */
export function isFunction(value) {
  return typeof value === 'function';
}
