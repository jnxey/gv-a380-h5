<template>
  <button class="stay-bar" type="button" @click="emit('open')">
    <span class="stay-side">
      <span class="stay-kicker">入住</span>
      <strong>{{ formatStayDate(checkInDate) }}</strong>
      <span class="stay-week">{{ formatStayWeekday(checkInDate) }}</span>
    </span>
    <span class="stay-nights">{{ nightCount }}晚</span>
    <span class="stay-side stay-side-end">
      <span class="stay-kicker">离店</span>
      <strong>{{ formatStayDate(checkOutDate) }}</strong>
      <span class="stay-week">{{ formatStayWeekday(checkOutDate) }}</span>
    </span>
  </button>
  <Teleport to="body">
    <div v-if="sheetOpen" class="sheet-root">
      <div class="mask" @click="emit('close')"></div>
      <section class="sheet">
      <div class="sheet-head">
        <div>
          <span>入住</span>
          <strong>{{ formatStayDate(draftCheckInDate) }}</strong>
        </div>
        <div class="sheet-nights">{{ draftNightCount }}晚</div>
        <div class="sheet-end">
          <span>离店</span>
          <strong>{{ formatStayDate(draftCheckOutDate) }}</strong>
        </div>
      </div>
      <div class="weekdays">
        <span v-for="weekday in HotelDateLabel.WEEKDAY_SHORT_LIST" :key="weekday">{{ weekday }}</span>
      </div>
      <div class="months">
        <section v-for="month in calendarMonthList" :key="month.monthKey" class="month">
          <h3>{{ month.monthLabel }}</h3>
          <div class="days">
            <button
              v-for="(dayCell, dayIndex) in month.dayCellList"
              :key="`${month.monthKey}-${dayIndex}`"
              type="button"
              class="day"
              :class="dayClass(dayCell)"
              :disabled="dayCell.disabled || isEmpty(dayCell.dateText)"
              @click="selectDay(dayCell)"
            >
              {{ dayCell.dayNumber }}
            </button>
          </div>
        </section>
      </div>
      <div class="actions">
        <button class="solid" type="button" :disabled="draftReady !== true" @click="confirmDates">确定</button>
      </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { HotelDateLabel } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  checkInDate: {
    default: ''
  },
  checkOutDate: {
    default: ''
  },
  nightCount: {
    default: 0
  },
  calendarMonthList: {
    default() {
      return [];
    }
  },
  sheetOpen: {
    default: false
  }
});

const emit = defineEmits(['open', 'close', 'confirm']);

const draftCheckInDate = ref('');
const draftCheckOutDate = ref('');

/**
 * 草稿里的晚数。还没选离店时为 0。
 */
const draftNightCount = computed(() => {
  return countDraftNights(draftCheckInDate.value, draftCheckOutDate.value);
});

/**
 * 入住和离店都选好才能确定。
 */
const draftReady = computed(() => {
  if (isEmpty(draftCheckInDate.value) || isEmpty(draftCheckOutDate.value)) {
    return false;
  }
  return draftCheckOutDate.value > draftCheckInDate.value;
});

/**
 * 打开日历时，用页面上已经确定的入住和离店作为草稿。
 */
watch(
  () => props.sheetOpen,
  (sheetOpen) => {
    if (sheetOpen !== true) {
      return;
    }
    draftCheckInDate.value = props.checkInDate;
    draftCheckOutDate.value = props.checkOutDate;
  },
  { flush: 'sync' }
);

/**
 * 把日期显示成月日。空日期显示待选择。
 */
function formatStayDate(dateText) {
  const dateTime = parseUtcDate(dateText);
  if (dateTime === null) {
    return '待选择';
  }
  return `${dateTime.getUTCMonth() + 1}月${dateTime.getUTCDate()}日`;
}

/**
 * 把日期显示成星期。空日期不显示。
 */
function formatStayWeekday(dateText) {
  const dateTime = parseUtcDate(dateText);
  if (dateTime === null) {
    return '';
  }
  return HotelDateLabel.WEEKDAY_LIST[dateTime.getUTCDay()];
}

/**
 * 解析 YYYY-MM-DD。格式不对时返回空。
 */
function parseUtcDate(dateText) {
  if (isEmpty(dateText)) {
    return null;
  }
  const datePartList = dateText.split('-');
  if (datePartList.length !== 3) {
    return null;
  }
  const yearNumber = Number(datePartList[0]);
  const monthNumber = Number(datePartList[1]);
  const dayNumber = Number(datePartList[2]);
  if (Number.isFinite(yearNumber) !== true || Number.isFinite(monthNumber) !== true || Number.isFinite(dayNumber) !== true) {
    return null;
  }
  return new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
}

/**
 * 计算草稿晚数。离店不晚于入住时为 0。
 */
function countDraftNights(checkInDate, checkOutDate) {
  const checkInTime = parseUtcDate(checkInDate);
  const checkOutTime = parseUtcDate(checkOutDate);
  if (checkInTime === null || checkOutTime === null) {
    return 0;
  }
  let nightCount = 0;
  const cursor = new Date(checkInTime.getTime());
  while (formatUtcDate(cursor) < checkOutDate) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    nightCount += 1;
  }
  return nightCount;
}

/**
 * 格式化成 YYYY-MM-DD。入参须是 UTC 日期。
 */
function formatUtcDate(dateTime) {
  const monthText = String(dateTime.getUTCMonth() + 1).padStart(2, '0');
  const dayText = String(dateTime.getUTCDate()).padStart(2, '0');
  return `${dateTime.getUTCFullYear()}-${monthText}-${dayText}`;
}

/**
 * 日期格子的选中样式。入住、离店和中间日期分开标。
 */
function dayClass(dayCell) {
  if (isEmpty(dayCell) || isEmpty(dayCell.dateText)) {
    return { blank: true };
  }
  const dateText = dayCell.dateText;
  const isCheckIn = dateText === draftCheckInDate.value;
  const isCheckOut = dateText === draftCheckOutDate.value;
  const inRange = isEmpty(draftCheckOutDate.value) !== true && dateText > draftCheckInDate.value && dateText < draftCheckOutDate.value;
  return {
    disabled: dayCell.disabled,
    edge: isCheckIn || isCheckOut,
    'range-start': isCheckIn && isEmpty(draftCheckOutDate.value) !== true,
    'range-end': isCheckOut,
    'in-range': inRange
  };
}

/**
 * 点选日期。已选齐后再点，从新的入住日重选。
 */
function selectDay(dayCell) {
  if (isEmpty(dayCell) || isEmpty(dayCell.dateText) || dayCell.disabled) {
    return;
  }
  const dateText = dayCell.dateText;
  // 1. 还没入住日，或入住离店都已选好，这次作为新的入住日
  if (isEmpty(draftCheckInDate.value) || isEmpty(draftCheckOutDate.value) !== true) {
    draftCheckInDate.value = dateText;
    draftCheckOutDate.value = '';
    return;
  }
  // 2. 晚于入住日才作为离店日，否则改成新的入住日
  if (dateText > draftCheckInDate.value) {
    draftCheckOutDate.value = dateText;
    return;
  }
  draftCheckInDate.value = dateText;
  draftCheckOutDate.value = '';
}

/**
 * 把草稿日期交回页面。
 */
function confirmDates() {
  if (draftReady.value !== true) {
    return;
  }
  emit('confirm', {
    checkInDate: draftCheckInDate.value,
    checkOutDate: draftCheckOutDate.value
  });
}
</script>

<style scoped>
.stay-bar {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0 0 8px;
  padding: 12px 14px;
  border: 0;
  border-radius: 16px;
  background: #fffdf9;
  color: #14241c;
  font: inherit;
  text-align: left;
}
.stay-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stay-side-end {
  text-align: right;
  align-items: flex-end;
}
.stay-kicker,
.stay-week {
  color: #5e6b64;
  font-size: 12px;
}
.stay-bar strong,
.sheet-head strong {
  font-size: 16px;
}
.stay-nights,
.sheet-nights {
  flex: 0 0 auto;
  margin: 0 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(31, 138, 112, 0.12);
  color: #1f8a70;
  font-size: 12px;
}
.sheet-root {
  position: fixed;
  inset: 0;
  z-index: 30;
}
.mask {
  position: absolute;
  inset: 0;
  background: rgba(20, 36, 28, 0.46);
}
.sheet {
  box-sizing: border-box;
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  width: min(520px, 100%);
  height: 78vh;
  border-radius: 22px 22px 0 0;
  background: #fffdf9;
  z-index: 21;
}
.sheet-head {
  display: flex;
  align-items: center;
  padding: 16px 16px 8px;
  color: #14241c;
}
.sheet-head span {
  display: block;
  color: #5e6b64;
  font-size: 12px;
}
.sheet-end {
  margin-left: auto;
  text-align: right;
}
.weekdays,
.days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.weekdays {
  padding: 0 8px 8px;
  color: #5e6b64;
  font-size: 12px;
  text-align: center;
}
.months {
  flex: 1 1 auto;
  overflow: auto;
  padding: 0 8px 8px;
}
.month h3 {
  margin: 12px 8px 8px;
  font-size: 15px;
  color: #14241c;
}
.day {
  height: 44px;
  margin: 2px 0;
  border: 0;
  background: transparent;
  color: #14241c;
  font: inherit;
  font-size: 15px;
}
.day.blank {
  visibility: hidden;
}
.day.disabled {
  color: #c4ccc8;
}
.day.in-range {
  background: rgba(31, 138, 112, 0.12);
}
.day.edge {
  border-radius: 10px;
  background: #1f8a70;
  color: #fffdf9;
}
.day.range-start {
  border-radius: 10px 0 0 10px;
}
.day.range-end {
  border-radius: 0 10px 10px 0;
}
.actions {
  padding: 12px 16px calc(12px + var(--gv-safe-bottom, 0px));
}
.solid {
  width: 100%;
  padding: 13px;
  border: 0;
  border-radius: 999px;
  background: #1f8a70;
  color: #fffdf9;
  font: inherit;
  font-size: 15px;
}
.solid:disabled {
  opacity: 0.4;
}
</style>
