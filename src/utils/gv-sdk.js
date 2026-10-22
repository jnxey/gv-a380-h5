import { isEmpty, isFunction } from './tools.js';
import { showToast } from './toast.js';

/** 单次等待宿主注入 GV_SDK 的最长时间。 */
const GV_SDK_READY_TIMEOUT_MILLISECONDS = 5000;

/** 轮询 GV_SDK 是否就绪的间隔。 */
const GV_SDK_READY_POLL_MILLISECONDS = 50;

/**
 * 读取已具备 getA380MiniappSign 的 GV_SDK；未就绪返回 null。
 */
function readReadyGvSdk() {
  const bridge = window.GV_SDK;
  if (isEmpty(bridge) || isFunction(bridge.getA380MiniappSign) !== true) {
    return null;
  }
  return bridge;
}

/**
 * 等到宿主注入了可用的 GV_SDK。已就绪则立即返回。
 * 线上偶发 H5 业务代码早于 bootstrap:install，必须等待而不能立刻失败。
 */
function waitForGvSdk() {
  const readyBridge = readReadyGvSdk();
  if (readyBridge !== null) {
    return Promise.resolve(readyBridge);
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    let pollTimerId = null;
    const timeoutTimerId = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearInterval(pollTimerId);
      window.removeEventListener('gv-sdk-ready', onReady);
      reject(new Error('GV_SDK not ready'));
    }, GV_SDK_READY_TIMEOUT_MILLISECONDS);
    function finishWithBridge(bridge) {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutTimerId);
      window.clearInterval(pollTimerId);
      window.removeEventListener('gv-sdk-ready', onReady);
      resolve(bridge);
    }
    function onReady() {
      const bridge = readReadyGvSdk();
      if (bridge !== null) {
        finishWithBridge(bridge);
      }
    }
    window.addEventListener('gv-sdk-ready', onReady);
    pollTimerId = window.setInterval(() => {
      const bridge = readReadyGvSdk();
      if (bridge !== null) {
        finishWithBridge(bridge);
      }
    }, GV_SDK_READY_POLL_MILLISECONDS);
  });
}

/**
 * 通过宿主聊天 App 的 GV_SDK.getA380MiniappSign 获取小程序身份签名。
 * 小程序不自行签发 JWT。SDK 晚到时先等待再取签。
 */
export function getA380MiniappSign() {
  return waitForGvSdk().then((bridge) => {
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
 * 让宿主校验安全密钥，返回 5 分钟内有效的密文。
 * 没有 GV_SDK 时提示从聊天 App 打开。用户取消不提示。尚未设置则提示先去设置。
 */
export function verifyConsumerDoorLock() {
  return waitForGvSdk().then((bridge) => {
    if (isFunction(bridge.verifyConsumerDoorLock) !== true) {
      showToast('请从聊天App打开');
      return Promise.reject(new Error('请从聊天App打开'));
    }
    return Promise.resolve(bridge.verifyConsumerDoorLock()).then((cipherText) => {
      if (isEmpty(cipherText)) {
        return Promise.reject(new Error('安全密钥无效'));
      }
      return cipherText;
    }, (error) => {
      const message = isEmpty(error) || isEmpty(error.message) ? '' : String(error.message);
      if (message === 'cancelled') {
        return Promise.reject(error);
      }
      if (message === 'security key not set') {
        showToast('请先设置安全密钥');
        return Promise.reject(error);
      }
      return Promise.reject(error);
    });
  }, () => {
    showToast('请从聊天App打开');
    return Promise.reject(new Error('请从聊天App打开'));
  });
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
