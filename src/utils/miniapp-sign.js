import { MiniappSignLifetime } from './constants.js';
import { getA380MiniappSign } from 'gv-sdk';
import { isEmpty } from './tools.js';

let cachedMiniappSignCipherText = '';
let cachedMiniappSignObtainedAt = 0;
let refreshingMiniappSignPromise = null;

/**
 * 获取当前可用的小程序身份签名。
 * 未超过一个半小时使用缓存；超过则向宿主刷新一次。
 */
export function getMiniappSign() {
  // 1. 已有刷新在进行时，等待这一次，不再另起
  if (isEmpty(refreshingMiniappSignPromise) !== true) {
    return refreshingMiniappSignPromise;
  }
  // 2. 缓存未超过一个半小时，直接返回
  if (isCachedMiniappSignFresh() === true) {
    return Promise.resolve(cachedMiniappSignCipherText);
  }
  // 3. 没有缓存或已超过一个半小时，只发起一次刷新
  refreshingMiniappSignPromise = refreshMiniappSign().then((cipherText) => {
    refreshingMiniappSignPromise = null;
    return cipherText;
  }, (error) => {
    refreshingMiniappSignPromise = null;
    return Promise.reject(error);
  });
  return refreshingMiniappSignPromise;
}

/**
 * 判断缓存签名是否还在一个半小时内。
 */
function isCachedMiniappSignFresh() {
  if (isEmpty(cachedMiniappSignCipherText)) {
    return false;
  }
  const miniappSignAgeMilliseconds = Date.now() - cachedMiniappSignObtainedAt;
  return miniappSignAgeMilliseconds <= MiniappSignLifetime.REFRESH_AFTER_MILLISECONDS;
}

/**
 * 向宿主要一份新签名，并记下拿到的时间。
 */
function refreshMiniappSign() {
  return getA380MiniappSign().then((cipherText) => {
    cachedMiniappSignCipherText = cipherText;
    cachedMiniappSignObtainedAt = Date.now();
    return cipherText;
  });
}
