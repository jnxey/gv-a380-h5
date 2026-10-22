import { API_PREFIX } from '../api/prefix.js';
import { getMiniappSign } from './miniapp-sign.js';
import { HttpStatusCode, ResponseCode } from './constants.js';
import { isEmpty } from './tools.js';
import { showToast } from './toast.js';

/**
 * 拼出带统一前缀的完整请求地址。
 */
function resolveRequestUrl(urlPath) {
  if (isEmpty(urlPath)) {
    return API_PREFIX;
  }
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath;
  }
  return `${API_PREFIX}${urlPath}`;
}

/**
 * 请求业务接口，并自动带上宿主签发的小程序身份签名。
 */
export function request(options) {
  return getMiniappSign().then((cipherText) => {
    const method = isEmpty(options.method) ? 'GET' : options.method;
    const requestData = isEmpty(options.data) ? {} : options.data;
    // 1. GET 把参数拼到地址上，其它方法放在请求体里
    let requestUrl = resolveRequestUrl(options.url);
    let requestBody;
    if (method === 'GET') {
      const queryText = new URLSearchParams(requestData).toString();
      if (isEmpty(queryText) !== true) {
        requestUrl = `${requestUrl}?${queryText}`;
      }
    } else {
      requestBody = JSON.stringify(requestData);
    }
    // 2. 按统一响应码处理成功、未登录和失败
    return fetch(requestUrl, {
      method,
      headers: {
        Authorization: `Bearer ${cipherText}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    }).then((response) => {
      if (response.status === HttpStatusCode.UNAUTHORIZED) {
        showToast('请从聊天App重新进入');
        return Promise.reject(response);
      }
      return response.json().then((responseBody) => {
        const body = isEmpty(responseBody) ? {} : responseBody;
        if (body.code !== ResponseCode.SUCCESS) {
          const failMessage = isEmpty(body.message) ? '请求失败' : body.message;
          showToast(failMessage);
          return Promise.reject(body);
        }
        return body.data;
      }).catch((error) => {
        if (isEmpty(error) !== true && error.code !== undefined) {
          return Promise.reject(error);
        }
        showToast('网络异常');
        return Promise.reject(error);
      });
    }, () => {
      showToast('网络异常');
      return Promise.reject(new Error('网络异常'));
    });
  });
}
