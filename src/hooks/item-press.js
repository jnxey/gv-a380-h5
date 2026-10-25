import { ref } from 'vue';
import { LongPressDelay } from '../utils/constants.js';
import { isEmpty } from '../utils/tools.js';

/**
 * 短按 + 长按。长按触发后会吞掉紧随其后的一次 click。
 * @param {{ onClick?: (payload: unknown) => void, onLongPress?: (payload: unknown) => void }} handlers
 */
export function useItemPress(handlers) {
  const onClickHandler = isEmpty(handlers) ? null : handlers.onClick;
  const onLongPressHandler = isEmpty(handlers) ? null : handlers.onLongPress;
  const longPressTimerId = ref(0);
  const suppressNextClick = ref(false);
  const touchStartX = ref(0);
  const touchStartY = ref(0);

  /**
   * 清掉尚未触发的长按定时器。
   */
  function clearLongPressTimer() {
    if (longPressTimerId.value === 0) {
      return;
    }
    window.clearTimeout(longPressTimerId.value);
    longPressTimerId.value = 0;
  }

  /**
   * 短按。若刚发生过长按则忽略。
   */
  function onClick(payload) {
    if (suppressNextClick.value === true) {
      suppressNextClick.value = false;
      return;
    }
    if (typeof onClickHandler === 'function') {
      onClickHandler(payload);
    }
  }

  /**
   * 按下开始计时长按。
   */
  function onTouchStart(payload, event) {
    clearLongPressTimer();
    if (isEmpty(event) || isEmpty(event.touches) || event.touches.length === 0) {
      return;
    }
    const touchPoint = event.touches[0];
    touchStartX.value = touchPoint.clientX;
    touchStartY.value = touchPoint.clientY;
    longPressTimerId.value = window.setTimeout(() => {
      if (typeof onLongPressHandler === 'function') {
        onLongPressHandler(payload);
      }
      suppressNextClick.value = true;
      longPressTimerId.value = 0;
    }, LongPressDelay.MS);
  }

  /**
   * 手指移动超过阈值则取消长按。
   */
  function onTouchMove(event) {
    if (longPressTimerId.value === 0) {
      return;
    }
    if (isEmpty(event) || isEmpty(event.touches) || event.touches.length === 0) {
      clearLongPressTimer();
      return;
    }
    const touchPoint = event.touches[0];
    const moveX = Math.abs(touchPoint.clientX - touchStartX.value);
    const moveY = Math.abs(touchPoint.clientY - touchStartY.value);
    if (moveX > LongPressDelay.MOVE_PX || moveY > LongPressDelay.MOVE_PX) {
      clearLongPressTimer();
    }
  }

  /**
   * 抬起或取消时清掉长按计时。
   */
  function onTouchEnd() {
    clearLongPressTimer();
  }

  return {
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
