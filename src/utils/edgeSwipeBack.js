import { exitApp } from 'gv-sdk';
import { H5PagePath } from './constants.js';
import { isEmpty, isFunction } from './tools.js';

/** 左缘侧滑的距离、阻尼、最大宽度和提示动画时间。页面本身不跟着移动。 */
const EdgeSwipeSetting = {
  EDGE_WIDTH: 24,
  LOCK_DISTANCE: 8,
  COMPLETE_RATIO: 0.35,
  RESISTANCE: 0.4,
  MAX_WIDTH: 88,
  ANIMATION_MILLISECONDS: 180,
};

/** 这些层开着时不侧滑，避免把底下的页面带走。 */
const BlockingOverlaySelector = '.sheet-root, .mask, .confirm-mask, .detail-mask, .verify-mask, .address-mask, .review-mask';

let installedPageRouter = null;
let indicatorElement = null;
let gestureTracking = false;
let gestureLocked = false;
let gestureBusy = false;
let gestureTouchId = 0;
let gestureStartClientX = 0;
let gestureStartClientY = 0;
let gestureLatestClientX = 0;
let gestureLatestClientY = 0;

/**
 * 是否为 iPhone 或 iPad。iPad 桌面模式报的是 Mac，用触点数量认出来。
 */
function isIosDevice() {
  if (isEmpty(navigator)) {
    return false;
  }
  const userAgent = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(userAgent) === true) {
    return true;
  }
  const platform = navigator.platform || '';
  return platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/**
 * 弹窗、半屏或整页 loading 是否挡着。
 */
function hasBlockingOverlay() {
  const overlayElement = document.querySelector(BlockingOverlaySelector);
  if (isEmpty(overlayElement) !== true) {
    return true;
  }
  const pageLoadingElement = document.querySelector('.app-page-loading');
  if (isEmpty(pageLoadingElement)) {
    return false;
  }
  return pageLoadingElement.style.display === 'flex';
}

/**
 * 会员中心和积分明细不侧滑。
 */
function isSwipeDisabledPage() {
  if (isEmpty(installedPageRouter) || isEmpty(installedPageRouter.currentRoute) || isEmpty(installedPageRouter.currentRoute.value)) {
    return false;
  }
  const routePath = installedPageRouter.currentRoute.value.path;
  if (isEmpty(routePath)) {
    return false;
  }
  return routePath === H5PagePath.MEMBER || routePath === H5PagePath.POINT;
}

/**
 * 本次打开里是否还有上一页。没有时当前页就是入口，侧滑改为退出小程序。
 */
function hasPreviousPage(pageRouter) {
  if (isEmpty(pageRouter) || isEmpty(pageRouter.options) || isEmpty(pageRouter.options.history)) {
    return false;
  }
  const historyState = pageRouter.options.history.state;
  if (isEmpty(historyState) || isEmpty(historyState.back)) {
    return false;
  }
  return true;
}

/**
 * 从触摸列表里找出这次侧滑的那根手指。
 */
function readTrackedTouch(touchList) {
  if (isEmpty(touchList) || touchList.length === 0) {
    return null;
  }
  for (let touchIndex = 0; touchIndex < touchList.length; touchIndex += 1) {
    const touchPoint = touchList[touchIndex];
    if (touchPoint.identifier === gestureTouchId) {
      return touchPoint;
    }
  }
  return null;
}

/**
 * 去掉以前插过的底页和位移，避免热更新后页面还被挪走。
 */
function clearPreviousSwipeChrome() {
  const styleElement = document.getElementById('edge-swipe-back-style');
  if (isEmpty(styleElement) !== true) {
    styleElement.remove();
  }
  const shadeElement = document.querySelector('.edge-swipe-back-shade');
  if (isEmpty(shadeElement) !== true) {
    shadeElement.remove();
  }
  const previousIndicator = document.querySelector('.edge-swipe-back-indicator');
  if (isEmpty(previousIndicator) !== true) {
    previousIndicator.remove();
  }
  indicatorElement = null;
  const pageElement = document.querySelector('.app');
  if (isEmpty(pageElement) !== true) {
    pageElement.style.transition = '';
    pageElement.style.transform = '';
    pageElement.style.minHeight = '';
    pageElement.classList.remove('edge-swipe-back-page');
  }
}

/**
 * 插入左缘提示条。只盖在页面上，不移动页面。
 */
function ensureSwipeIndicator() {
  if (isEmpty(document.getElementById('edge-swipe-back-style'))) {
    const styleElement = document.createElement('style');
    styleElement.id = 'edge-swipe-back-style';
    styleElement.textContent = [
      '.edge-swipe-back-indicator {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0;',
      '  bottom: 0;',
      '  left: 0;',
      '  z-index: 20;',
      '  width: 0;',
      '  overflow: hidden;',
      '  pointer-events: none;',
      '  background: rgba(17, 24, 39, 0.16);',
      '  border-radius: 0 50% 50% 0;',
      '  box-shadow: 8px 0 18px rgba(17, 24, 39, 0.12);',
      '}',
      '.edge-swipe-back-mark {',
      '  position: absolute;',
      '  top: 50%;',
      '  right: 16px;',
      '  width: 28px;',
      '  height: 28px;',
      '  margin-top: -14px;',
      '  border-radius: 50%;',
      '  background: rgba(255, 255, 255, 0.28);',
      '}',
      '.edge-swipe-back-mark::after {',
      '  content: "";',
      '  position: absolute;',
      '  top: 9px;',
      '  left: 11px;',
      '  width: 8px;',
      '  height: 8px;',
      '  border-left: 2px solid rgba(255, 255, 255, 0.55);',
      '  border-bottom: 2px solid rgba(255, 255, 255, 0.55);',
      '  transform: rotate(45deg);',
      '}',
      '.edge-swipe-back-indicator.is-ready {',
      '  background: rgba(31, 138, 112, 0.78);',
      '}',
      '.edge-swipe-back-indicator.is-ready .edge-swipe-back-mark {',
      '  background: #fff;',
      '}',
      '.edge-swipe-back-indicator.is-ready .edge-swipe-back-mark::after {',
      '  border-left-color: #111827;',
      '  border-bottom-color: #111827;',
      '}',
    ].join('\n');
    document.head.appendChild(styleElement);
  }
  if (isEmpty(indicatorElement)) {
    indicatorElement = document.createElement('div');
    indicatorElement.className = 'edge-swipe-back-indicator';
    const markElement = document.createElement('span');
    markElement.className = 'edge-swipe-back-mark';
    indicatorElement.appendChild(markElement);
    document.body.appendChild(indicatorElement);
  }
}

/**
 * 手指位移乘上阻尼，并且不超过最大宽度。
 */
function readIndicatorWidth(fingerOffset) {
  if (fingerOffset <= 0) {
    return 0;
  }
  const dampedOffset = fingerOffset * EdgeSwipeSetting.RESISTANCE;
  if (dampedOffset > EdgeSwipeSetting.MAX_WIDTH) {
    return EdgeSwipeSetting.MAX_WIDTH;
  }
  return dampedOffset;
}

/**
 * 按滑动距离拉出左缘提示。跟手时不加过渡。
 */
function placeIndicator(offsetX, withTransition) {
  if (isEmpty(indicatorElement)) {
    return;
  }
  const pageWidth = window.innerWidth;
  const fingerOffset = Math.max(offsetX, 0);
  const indicatorWidth = readIndicatorWidth(fingerOffset);
  const progress = pageWidth <= 0 ? 0 : fingerOffset / pageWidth;
  if (progress >= EdgeSwipeSetting.COMPLETE_RATIO) {
    indicatorElement.classList.add('is-ready');
  } else {
    indicatorElement.classList.remove('is-ready');
  }
  indicatorElement.style.display = 'block';
  if (withTransition === true) {
    indicatorElement.style.transition = `width ${EdgeSwipeSetting.ANIMATION_MILLISECONDS}ms ease-out, opacity ${EdgeSwipeSetting.ANIMATION_MILLISECONDS}ms ease-out`;
  } else {
    indicatorElement.style.transition = 'none';
  }
  indicatorElement.style.opacity = '1';
  indicatorElement.style.width = `${indicatorWidth}px`;
}

/**
 * 提示条淡出。页面仍留在原地。
 */
function fadeIndicator() {
  if (isEmpty(indicatorElement)) {
    return;
  }
  indicatorElement.style.transition = `opacity ${EdgeSwipeSetting.ANIMATION_MILLISECONDS}ms ease-out`;
  indicatorElement.style.opacity = '0';
}

/**
 * 等提示条的宽度或透明度动画结束。没收到结束事件时按时长兜底。
 */
function waitIndicator() {
  if (isEmpty(indicatorElement)) {
    return Promise.resolve();
  }
  const indicator = indicatorElement;
  return new Promise((resolve) => {
    let settled = false;
    /**
     * 提示动画只结算一次。
     */
    function settle() {
      if (settled === true) {
        return;
      }
      settled = true;
      indicator.removeEventListener('transitionend', onTransitionEnd);
      resolve();
    }
    /**
     * 只认提示条自己的宽度或透明度结束。
     */
    function onTransitionEnd(event) {
      if (event.target !== indicator) {
        return;
      }
      if (event.propertyName !== 'width' && event.propertyName !== 'opacity') {
        return;
      }
      settle();
    }
    indicator.addEventListener('transitionend', onTransitionEnd);
    window.setTimeout(settle, EdgeSwipeSetting.ANIMATION_MILLISECONDS + 60);
  });
}

/**
 * 收起左缘提示，允许下一次侧滑。
 */
function hideIndicator() {
  if (isEmpty(indicatorElement)) {
    return;
  }
  indicatorElement.style.transition = 'none';
  indicatorElement.style.width = '0px';
  indicatorElement.style.opacity = '0';
  indicatorElement.style.display = 'none';
  indicatorElement.classList.remove('is-ready');
}

/**
 * 滑过阈值才返回上一页，没有上一页就交给宿主退出。小距离不执行。页面不位移。
 */
async function finishSwipe() {
  // 1. 这次手势结束，先收提示条，页面保持原位
  gestureBusy = true;
  gestureLocked = false;
  const pageWidth = window.innerWidth;
  const offsetX = Math.min(Math.max(gestureLatestClientX - gestureStartClientX, 0), pageWidth);
  const progress = pageWidth <= 0 ? 0 : offsetX / pageWidth;
  const shouldComplete = progress >= EdgeSwipeSetting.COMPLETE_RATIO;
  if (shouldComplete !== true) {
    placeIndicator(0, true);
    await waitIndicator();
    hideIndicator();
    gestureBusy = false;
    return;
  }
  fadeIndicator();
  await waitIndicator();
  hideIndicator();
  // 2. 有上一页就返回。没有就退出小程序，退出动画由宿主处理
  if (hasPreviousPage(installedPageRouter) === true && isFunction(installedPageRouter.back) === true) {
    const backResult = installedPageRouter.back();
    if (isEmpty(backResult) !== true && isFunction(backResult.then) === true) {
      backResult.then(() => {
        gestureBusy = false;
      }, () => {
        gestureBusy = false;
      });
      return;
    }
    gestureBusy = false;
    return;
  }
  exitApp();
  gestureBusy = false;
}

/**
 * 只从屏幕左缘开始记这一次触摸。
 */
function onTouchStart(event) {
  if (gestureTracking === true || gestureBusy === true) {
    return;
  }
  if (isSwipeDisabledPage() === true) {
    return;
  }
  if (isEmpty(event) || isEmpty(event.touches) || event.touches.length !== 1) {
    return;
  }
  const touchPoint = event.touches[0];
  if (touchPoint.clientX > EdgeSwipeSetting.EDGE_WIDTH) {
    return;
  }
  if (hasBlockingOverlay() === true) {
    return;
  }
  gestureTracking = true;
  gestureLocked = false;
  gestureTouchId = touchPoint.identifier;
  gestureStartClientX = touchPoint.clientX;
  gestureStartClientY = touchPoint.clientY;
  gestureLatestClientX = touchPoint.clientX;
  gestureLatestClientY = touchPoint.clientY;
}

/**
 * 先分清是竖滑还是侧滑。锁成侧滑后只拦住滚动，不移动页面。
 */
function onTouchMove(event) {
  if (gestureTracking !== true || gestureBusy === true) {
    return;
  }
  const touchPoint = readTrackedTouch(event.touches);
  if (isEmpty(touchPoint)) {
    return;
  }
  // 1. 记下这一帧，供松手时算距离
  gestureLatestClientX = touchPoint.clientX;
  gestureLatestClientY = touchPoint.clientY;
  const offsetX = gestureLatestClientX - gestureStartClientX;
  const offsetY = gestureLatestClientY - gestureStartClientY;
  // 2. 还没锁定时，竖滑或向左滑都交给页面自己
  if (gestureLocked !== true) {
    const absOffsetX = Math.abs(offsetX);
    const absOffsetY = Math.abs(offsetY);
    if (absOffsetX < EdgeSwipeSetting.LOCK_DISTANCE && absOffsetY < EdgeSwipeSetting.LOCK_DISTANCE) {
      return;
    }
    if (offsetX <= 0 || absOffsetY > offsetX) {
      gestureTracking = false;
      return;
    }
    gestureLocked = true;
  }
  // 3. 拦住这次横向滚动。只拉出左缘提示，页面留在原地
  if (event.cancelable === true) {
    event.preventDefault();
  }
  event.stopPropagation();
  placeIndicator(offsetX, false);
}

/**
 * 这根手指离开时，按已经滑出的距离决定返回还是取消。
 */
function onTouchEnd(event) {
  if (gestureTracking !== true) {
    return;
  }
  const touchPoint = readTrackedTouch(event.changedTouches);
  if (isEmpty(touchPoint)) {
    return;
  }
  gestureLatestClientX = touchPoint.clientX;
  gestureTracking = false;
  if (gestureLocked !== true) {
    return;
  }
  finishSwipe().catch(() => {
    hideIndicator();
    gestureBusy = false;
  });
}

/**
 * 在 iOS 上挂上左缘侧滑。其它系统不挂。
 */
export function installEdgeSwipeBack(pageRouter) {
  // 1. 只有 iPhone / iPad 需要补这个手势
  if (isIosDevice() !== true || isEmpty(pageRouter)) {
    return;
  }
  installedPageRouter = pageRouter;
  // 2. 清掉旧的页面位移，放上左缘提示，再监听整页触摸
  clearPreviousSwipeChrome();
  ensureSwipeIndicator();
  document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
  document.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
}
