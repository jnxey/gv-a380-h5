import { ref } from 'vue';
import { isEmpty, isFunction } from './tools.js';

const SheetTextInputTag = {
  INPUT: 'INPUT',
  TEXTAREA: 'TEXTAREA'
};

const SheetInputFocusDelay = {
  RESTORE_MILLISECONDS: 300
};

/**
 * 预订弹窗里，输入框聚焦时收起底部合计和按钮。
 */
export function useSheetInputFocus() {
  const sheetElement = ref(null);
  const sheetInputFocused = ref(false);

  /**
   * 判断节点是不是这个弹窗里的输入框。
   */
  function isSheetTextInputElement(element) {
    if (isEmpty(element) || isEmpty(element.tagName) || isEmpty(sheetElement.value)) {
      return false;
    }
    if (element.tagName !== SheetTextInputTag.INPUT && element.tagName !== SheetTextInputTag.TEXTAREA) {
      return false;
    }
    return sheetElement.value.contains(element);
  }

  /**
   * 输入框拿到焦点时收起底部合计和按钮。
   * iOS 会为了露出输入框去滚动整页，固定弹窗会被推成只剩底色。这里把页面拉回，只滚动弹窗内容区。
   */
  function handleSheetFocusIn(event) {
    if (isEmpty(event) || isSheetTextInputElement(event.target) !== true) {
      return;
    }
    sheetInputFocused.value = true;
    const focusedElement = event.target;
    // 1. 下一帧先拉回。键盘动画结束后 iOS 还会再推一次，所以稍后再拉一次
    window.requestAnimationFrame(() => {
      restoreSheetAfterInputFocus(focusedElement);
    });
    window.setTimeout(() => {
      if (document.activeElement !== focusedElement) {
        return;
      }
      restoreSheetAfterInputFocus(focusedElement);
    }, SheetInputFocusDelay.RESTORE_MILLISECONDS);
  }

  /**
   * 取消 iOS 对整页的推移，再把输入框留在弹窗内容区里。
   */
  function restoreSheetAfterInputFocus(focusedElement) {
    window.scrollTo(0, 0);
    scrollFieldIntoSheetBody(focusedElement);
  }

  /**
   * 只滚动弹窗内容区，让输入框落在可见范围里。不滚动页面和外层固定层。
   */
  function scrollFieldIntoSheetBody(focusedElement) {
    if (isEmpty(focusedElement) || isFunction(focusedElement.closest) !== true) {
      return;
    }
    const sheetBodyElement = focusedElement.closest('.sheet-body');
    if (isEmpty(sheetBodyElement)) {
      return;
    }
    const fieldRect = focusedElement.getBoundingClientRect();
    const sheetBodyRect = sheetBodyElement.getBoundingClientRect();
    if (fieldRect.top < sheetBodyRect.top) {
      sheetBodyElement.scrollTop -= sheetBodyRect.top - fieldRect.top;
      return;
    }
    if (fieldRect.bottom > sheetBodyRect.bottom) {
      sheetBodyElement.scrollTop += fieldRect.bottom - sheetBodyRect.bottom;
    }
  }

  /**
   * 焦点离开输入框后，下一帧仍不在这个弹窗的输入框里，再显示底部合计和按钮。
   */
  function handleSheetFocusOut(event) {
    if (isEmpty(event) || isSheetTextInputElement(event.target) !== true) {
      return;
    }
    window.requestAnimationFrame(() => {
      if (isSheetTextInputElement(document.activeElement)) {
        return;
      }
      sheetInputFocused.value = false;
    });
  }

  return {
    sheetElement,
    sheetInputFocused,
    handleSheetFocusIn,
    handleSheetFocusOut
  };
}
