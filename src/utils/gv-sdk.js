import { isEmpty, isFunction } from './tools.js';
import { showToast } from './toast.js';

/**
 * 通过宿主聊天 App 的 GV_SDK 获取会员 access_token。
 * 小程序不做登录，refresh_token 只保存在原生 App。
 */
export function getAuthToken() {
  return new Promise((resolve, reject) => {
    const bridge = window.GV_SDK;
    if (isEmpty(bridge) || isFunction(bridge.getAuthToken) !== true) {
      showToast('请从聊天App打开');
      reject(new Error('请从聊天App打开'));
      return;
    }
    bridge.getAuthToken({
      success(result) {
        if (isEmpty(result) || isEmpty(result.token)) {
          showToast('请从聊天App打开');
          reject(new Error('请从聊天App打开'));
          return;
        }
        resolve(result.token);
      },
      fail() {
        showToast('请从聊天App打开');
        reject(new Error('请从聊天App打开'));
      },
    });
  });
}
