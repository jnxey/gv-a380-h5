import { DateTimeStorage, E164CallingCode } from './constants.js';

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
 * 金额转成「分」。按字符串拆整元和小数，超过两位时四舍五入。不能解析时返回空。
 */
export function readMoneyCents(value) {
  if (isEmpty(value) && value !== 0) {
    return null;
  }
  const amountText = String(value).trim();
  const matched = /^(-?)(\d+)(?:\.(\d+))?$/.exec(amountText);
  if (matched === null) {
    return null;
  }
  const negative = matched[1] === '-';
  const wholeText = matched[2];
  const fractionText = isEmpty(matched[3]) ? '' : matched[3];
  const centPrefix = fractionText.padEnd(2, '0').slice(0, 2);
  let cents = Number(wholeText) * 100 + Number(centPrefix);
  if (fractionText.length > 2 && fractionText.charAt(2) >= '5') {
    cents += 1;
  }
  if (Number.isSafeInteger(cents) !== true) {
    return null;
  }
  if (negative) {
    return -cents;
  }
  return cents;
}

/**
 * 「分」转成展示金额，去掉末尾多余的 0。
 */
export function formatMoneyCents(cents) {
  const negative = cents < 0;
  const absoluteCents = negative ? -cents : cents;
  const wholeAmount = Math.floor(absoluteCents / 100);
  const fractionCents = absoluteCents % 100;
  let amountText = String(wholeAmount);
  if (fractionCents > 0) {
    if (fractionCents % 10 === 0) {
      amountText = `${amountText}.${fractionCents / 10}`;
    } else if (fractionCents < 10) {
      amountText = `${amountText}.0${fractionCents}`;
    } else {
      amountText = `${amountText}.${fractionCents}`;
    }
  }
  if (negative && absoluteCents !== 0) {
    return `-${amountText}`;
  }
  return amountText;
}

/**
 * 展示金额。先按两位小数四舍五入，再去掉末尾多余的 0。
 */
export function formatMoney(value) {
  const cents = readMoneyCents(value);
  if (cents === null) {
    if (isEmpty(value)) {
      return '';
    }
    return String(value);
  }
  return formatMoneyCents(cents);
}

/**
 * 把数量拆成整数和小数位数，供金额相乘时避免二进制浮点。
 */
function readDecimalScale(value) {
  if (isEmpty(value) && value !== 0) {
    return null;
  }
  const countText = String(value).trim();
  const matched = /^(-?)(\d+)(?:\.(\d+))?$/.exec(countText);
  if (matched === null) {
    return null;
  }
  const fractionText = isEmpty(matched[3]) ? '' : matched[3];
  const digits = `${matched[2]}${fractionText}`.replace(/^0+(?=\d)/, '');
  const scale = 10 ** fractionText.length;
  const scaled = Number(matched[1] === '-' ? `-${digits}` : digits);
  if (Number.isSafeInteger(scaled) !== true || Number.isSafeInteger(scale) !== true) {
    return null;
  }
  return { scaled, scale };
}

/**
 * 单价乘数量，结果是「分」。任一端不能解析时返回空。
 */
export function multiplyMoneyCents(unitAmount, count) {
  const unitCents = readMoneyCents(unitAmount);
  const countScale = readDecimalScale(count);
  if (unitCents === null || countScale === null) {
    return null;
  }
  const negative = (unitCents < 0) !== (countScale.scaled < 0);
  const absoluteProduct = Math.abs(unitCents) * Math.abs(countScale.scaled);
  if (Number.isSafeInteger(absoluteProduct) !== true) {
    return null;
  }
  const quotient = Math.floor(absoluteProduct / countScale.scale);
  const remainder = absoluteProduct % countScale.scale;
  let lineCents = quotient;
  if (remainder * 2 >= countScale.scale) {
    lineCents += 1;
  }
  if (negative) {
    return -lineCents;
  }
  return lineCents;
}

/**
 * 单价乘数量后的展示金额。
 */
export function multiplyMoney(unitAmount, count) {
  const lineCents = multiplyMoneyCents(unitAmount, count);
  if (lineCents === null) {
    return '';
  }
  return formatMoneyCents(lineCents);
}

/**
 * 两个金额相减后的展示金额。任一端不能解析时返回空字符串。
 */
export function subtractMoney(totalAmount, deductAmount) {
  const totalCents = readMoneyCents(totalAmount);
  const deductCents = readMoneyCents(deductAmount);
  if (totalCents === null || deductCents === null) {
    return '';
  }
  return formatMoneyCents(totalCents - deductCents);
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

/**
 * 把时区偏移换成分钟。格式不是 ±HH:mm 时返回空。
 */
function timeZoneOffsetMinutes(timeZoneOffset) {
  if (isEmpty(timeZoneOffset) || String(timeZoneOffset).length < 6) {
    return null;
  }
  const offsetText = String(timeZoneOffset);
  const signText = offsetText.slice(0, 1);
  const hourCount = Number(offsetText.slice(1, 3));
  const minuteCount = Number(offsetText.slice(4, 6));
  if (offsetText.charAt(3) !== ':') {
    return null;
  }
  if (Number.isFinite(hourCount) !== true || Number.isFinite(minuteCount) !== true) {
    return null;
  }
  const absoluteMinutes = hourCount * 60 + minuteCount;
  if (signText === '-') {
    return -absoluteMinutes;
  }
  if (signText === '+') {
    return absoluteMinutes;
  }
  return null;
}

/**
 * 数字补成两位。
 */
function padDateTimePart(dateTimePart) {
  return String(dateTimePart).padStart(2, '0');
}

/**
 * 把钟面数字排成 YYYY-MM-DD HH:mm:ss。
 */
function formatWallClockText(year, month, day, hour, minute, second) {
  const yearText = String(year);
  const monthText = padDateTimePart(month);
  const dayText = padDateTimePart(day);
  const hourText = padDateTimePart(hour);
  const minuteText = padDateTimePart(minute);
  const secondText = padDateTimePart(second);
  return `${yearText}-${monthText}-${dayText} ${hourText}:${minuteText}:${secondText}`;
}

/**
 * 把数据库里的日期时间换成门店时区。纯日期和纯钟点原样返回。门店时区为空时不平移。
 * 带 T、Z 或偏移的完整时间会先还原成时刻，再输出 YYYY-MM-DD HH:mm:ss。
 */
export function formatShopDateTime(dateTimeText, timeZoneOffset) {
  if (isEmpty(dateTimeText)) {
    return '';
  }
  const trimmedDateTime = String(dateTimeText).trim();
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const clockOnlyPattern = /^\d{2}:\d{2}(:\d{2})?$/;
  // 1. 纯日期、纯钟点原样返回
  if (dateOnlyPattern.test(trimmedDateTime) === true || clockOnlyPattern.test(trimmedDateTime) === true) {
    return trimmedDateTime;
  }
  // 2. 拆出日期时间和自带偏移。Z 表示 UTC，没有偏移的按库时区理解
  const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
  const matchedDateTime = trimmedDateTime.match(dateTimePattern);
  if (matchedDateTime === null) {
    return trimmedDateTime;
  }
  const year = Number(matchedDateTime[1]);
  const month = Number(matchedDateTime[2]);
  const day = Number(matchedDateTime[3]);
  const hour = Number(matchedDateTime[4]);
  const minute = Number(matchedDateTime[5]);
  const second = Number(matchedDateTime[6]);
  const zoneText = matchedDateTime[7];
  if (Number.isFinite(year) !== true || Number.isFinite(month) !== true || Number.isFinite(day) !== true || Number.isFinite(hour) !== true || Number.isFinite(minute) !== true || Number.isFinite(second) !== true) {
    return trimmedDateTime;
  }
  const storageOffsetMinutes = timeZoneOffsetMinutes(DateTimeStorage.TIME_ZONE_OFFSET);
  const shopOffsetMinutes = timeZoneOffsetMinutes(timeZoneOffset);
  let sourceOffsetMinutes = storageOffsetMinutes;
  if (isEmpty(zoneText) !== true) {
    sourceOffsetMinutes = zoneText === 'Z' ? 0 : timeZoneOffsetMinutes(zoneText);
  }
  // 3. 门店时区为空时不平移。字符串自带 Z 或偏移时，先回到库时区再显示，去掉 T、Z
  if (shopOffsetMinutes === null) {
    if (isEmpty(zoneText) === true || sourceOffsetMinutes === null || storageOffsetMinutes === null) {
      return formatWallClockText(year, month, day, hour, minute, second);
    }
    const storageUtcMilliseconds = Date.UTC(year, month - 1, day, hour, minute, second) - sourceOffsetMinutes * 60 * 1000;
    const storageWallClock = new Date(storageUtcMilliseconds + storageOffsetMinutes * 60 * 1000);
    return formatWallClockText(storageWallClock.getUTCFullYear(), storageWallClock.getUTCMonth() + 1, storageWallClock.getUTCDate(), storageWallClock.getUTCHours(), storageWallClock.getUTCMinutes(), storageWallClock.getUTCSeconds());
  }
  if (sourceOffsetMinutes === null) {
    return formatWallClockText(year, month, day, hour, minute, second);
  }
  // 4. 按来源时区还原时刻，再平移成门店钟面。读 UTC 字段，避免本机时区
  const sourceUtcMilliseconds = Date.UTC(year, month - 1, day, hour, minute, second) - sourceOffsetMinutes * 60 * 1000;
  const shopWallClock = new Date(sourceUtcMilliseconds + shopOffsetMinutes * 60 * 1000);
  return formatWallClockText(shopWallClock.getUTCFullYear(), shopWallClock.getUTCMonth() + 1, shopWallClock.getUTCDate(), shopWallClock.getUTCHours(), shopWallClock.getUTCMinutes(), shopWallClock.getUTCSeconds());
}
