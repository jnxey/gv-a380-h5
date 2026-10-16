import { createSSRApp } from 'vue';
import App from './App.vue';

/**
 * 创建内嵌小程序应用。不注册登录页。
 */
export function createApp() {
  const app = createSSRApp(App);
  return {
    app,
  };
}
