import { getAuthToken } from './gv-sdk.js';
import { HttpStatusCode, ResponseCode } from './constants.js';
import { isEmpty } from './tools.js';

/**
 * 请求业务接口，并自动带上宿主签发的 Authorization。
 */
export function request(options) {
  return getAuthToken().then((accessToken) => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        success(response) {
          if (response.statusCode === HttpStatusCode.UNAUTHORIZED) {
            uni.showToast({ title: '请从聊天App重新进入', icon: 'none' });
            reject(response);
            return;
          }
          const responseBody = response.data || {};
          if (responseBody.code !== ResponseCode.SUCCESS) {
            const failMessage = isEmpty(responseBody.message) ? '请求失败' : responseBody.message;
            uni.showToast({ title: failMessage, icon: 'none' });
            reject(responseBody);
            return;
          }
          resolve(responseBody.data);
        },
        fail(error) {
          uni.showToast({ title: '网络异常', icon: 'none' });
          reject(error);
        },
      });
    });
  });
}
