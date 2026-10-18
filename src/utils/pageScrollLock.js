let lockedScrollTop = 0;
let pageScrollLocked = false;

/**
 * 把底页固定住，避免触摸弹窗时页面跟着动。
 */
export function lockPageScroll() {
  if (typeof document === 'undefined') {
    return;
  }
  if (pageScrollLocked === true) {
    return;
  }
  lockedScrollTop = window.scrollY;
  pageScrollLocked = true;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedScrollTop}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

/**
 * 恢复底页滚动，并回到锁定前的位置。
 */
export function unlockPageScroll() {
  if (typeof document === 'undefined') {
    return;
  }
  if (pageScrollLocked !== true) {
    document.documentElement.style.overflow = '';
    return;
  }
  pageScrollLocked = false;
  document.documentElement.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, lockedScrollTop);
}
