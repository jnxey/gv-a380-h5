import { isEmpty } from './tools.js';

let pageLoadingElement = null;

/**
 * 盖住整页并转圈，挡住提交过程中的重复点击。
 */
export function showPageLoading() {
  if (typeof document === 'undefined') {
    return;
  }
  if (isEmpty(pageLoadingElement)) {
    pageLoadingElement = document.createElement('div');
    pageLoadingElement.className = 'app-page-loading';
    const spinnerElement = document.createElement('span');
    spinnerElement.className = 'app-page-loading-spinner';
    pageLoadingElement.appendChild(spinnerElement);
    document.body.appendChild(pageLoadingElement);
  }
  pageLoadingElement.style.display = 'flex';
}

/**
 * 关掉整页 loading。
 */
export function hidePageLoading() {
  if (isEmpty(pageLoadingElement)) {
    return;
  }
  pageLoadingElement.style.display = 'none';
}
