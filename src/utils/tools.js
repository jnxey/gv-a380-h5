import { E164CallingCode } from './constants.js';

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

/**
 * 预填联系方式。+86 开头且后面全是数字时去掉区号，邮箱和国内号码原样返回。
 */
export function nationalContactText(contactText) {
  if (isEmpty(contactText)) {
    return '';
  }
  const trimmedContact = contactText.trim();
  if (trimmedContact.indexOf(E164CallingCode.CHINA_PREFIX) !== 0) {
    return trimmedContact;
  }
  const nationalNumber = trimmedContact.slice(E164CallingCode.CHINA_PREFIX.length);
  if (isEmpty(nationalNumber)) {
    return trimmedContact;
  }
  const digitPattern = /^\d+$/;
  if (digitPattern.test(nationalNumber) !== true) {
    return trimmedContact;
  }
  return nationalNumber;
}
