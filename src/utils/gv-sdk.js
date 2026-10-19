import { isEmpty, isFunction } from './tools.js';
import { showToast } from './toast.js';

/**
 * 通过宿主聊天 App 的 GV_SDK.getA380MiniappSign 获取小程序身份签名。
 * 小程序不自行签发 JWT。
 */
export function getA380MiniappSign() {
  const bridge = window.GV_SDK;
  if (isEmpty(bridge) || isFunction(bridge.getA380MiniappSign) !== true) {
    showToast('请从聊天App打开');
    return Promise.reject(new Error('请从聊天App打开'));
  }
  return bridge.getA380MiniappSign().then((cipherText) => {
    if (isEmpty(cipherText)) {
      showToast('请从聊天App打开');
      return Promise.reject(new Error('请从聊天App打开'));
    }
    return cipherText;
  }, () => {
    showToast('请从聊天App打开');
    return Promise.reject(new Error('请从聊天App打开'));
  });
}
