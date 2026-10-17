import { createSSRApp } from 'vue';
import App from './App.vue';
import { isEmpty, isFunction } from './utils/tools.js';

/**
 * 本地调试时补上聊天 App 的令牌桥。已有宿主桥时不覆盖，正式环境不安装。
 */
function installDevAuthBridge() {
  if (import.meta.env.DEV !== true || typeof window === 'undefined') {
    return;
  }
  if (isEmpty(window.GV_SDK) !== true) {
    return;
  }
  const accessToken = import.meta.env.VITE_DEV_MEMBER_TOKEN;
  window.GV_SDK = {
    getAuthToken(options) {
      if (isEmpty(accessToken)) {
        if (isFunction(options.fail)) {
          options.fail();
        }
        return;
      }
      options.success({ token: accessToken });
    },
  };
}

installDevAuthBridge();

/**
 * 创建内嵌小程序应用。不注册登录页。
 */
export function createApp() {
  const app = createSSRApp(App);
  return {
    app,
  };
}
