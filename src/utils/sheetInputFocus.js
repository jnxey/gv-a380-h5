import { ref } from 'vue';
import { isEmpty, isFunction } from './tools.js';

const SheetTextInputTag = {
  INPUT: 'INPUT',
  TEXTAREA: 'TEXTAREA'
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
   * 输入框拿到焦点时收起底部合计和按钮，并把当前输入滚进内容区。
   */
  function handleSheetFocusIn(event) {
    if (isEmpty(event) || isSheetTextInputElement(event.target) !== true) {
      return;
    }
    sheetInputFocused.value = true;
    const focusedElement = event.target;
    window.requestAnimationFrame(() => {
      if (isEmpty(focusedElement) || isFunction(focusedElement.scrollIntoView) !== true) {
        return;
      }
      focusedElement.scrollIntoView({ block: 'nearest' });
    });
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
