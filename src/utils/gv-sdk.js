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

/** 已经通知过宿主进入应用。 */
let miniProgramEntered = false;

/**
 * 页面挂载后通知宿主关掉小程序加载动画。
 * 浏览器里没有 GV_SDK 时不调用；SDK 晚到则等 gv-sdk-ready。只通知一次，失败不提示。
 */
export function enterMiniProgramApp() {
  tryEnterMiniProgramApp();
  if (miniProgramEntered) {
    return;
  }
  window.addEventListener('gv-sdk-ready', tryEnterMiniProgramApp);
}

/**
 * SDK 已就绪时调用 enterApp。未就绪则留下一次监听。
 */
function tryEnterMiniProgramApp() {
  if (miniProgramEntered) {
    return;
  }
  const bridge = window.GV_SDK;
  if (isEmpty(bridge) || isFunction(bridge.enterApp) !== true) {
    return;
  }
  miniProgramEntered = true;
  window.removeEventListener('gv-sdk-ready', tryEnterMiniProgramApp);
  Promise.resolve(bridge.enterApp()).catch(() => {});
}

/**
 * 打开宿主地图。没有 GV_SDK 时提示从聊天 App 打开。用户关闭地图不提示。
 */
export function openShopLocation(latitude, longitude) {
  const openLocation = readGvSdkMethod('openLocation');
  if (openLocation === null) {
    return;
  }
  Promise.resolve(openLocation({ latitude, longitude })).catch(() => {});
}

/**
 * 让宿主确认后拨号。没有 GV_SDK 时提示从聊天 App 打开。用户取消不提示。
 */
export function makeShopPhoneCall(phone) {
  const makePhoneCall = readGvSdkMethod('makePhoneCall');
  if (makePhoneCall === null) {
    return;
  }
  Promise.resolve(makePhoneCall({ phone })).catch(() => {});
}

/**
 * 取出宿主上的一个方法。没有这个方法时提示，并返回 null。
 */
function readGvSdkMethod(methodName) {
  const bridge = window.GV_SDK;
  if (isEmpty(bridge) || isFunction(bridge[methodName]) !== true) {
    showToast('请从聊天App打开');
    return null;
  }
  return bridge[methodName].bind(bridge);
}
