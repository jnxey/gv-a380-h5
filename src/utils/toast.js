import { isEmpty } from './tools.js';

const toastHideDelay = 2000;
let toastElement = null;
let toastTimer = 0;

/**
 * 在页面底部短暂显示一条提示。
 */
export function showToast(title) {
  if (typeof document === 'undefined') {
    return;
  }
  if (isEmpty(toastElement)) {
    toastElement = document.createElement('div');
    toastElement.className = 'app-toast';
    document.body.appendChild(toastElement);
  }
  toastElement.textContent = title;
  toastElement.style.display = 'block';
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastElement.style.display = 'none';
  }, toastHideDelay);
}
