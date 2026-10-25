<template>
  <div class="mask" @click="emit('close')"></div>
  <section v-if="isEmpty(selectedRoomType) !== true" class="sheet">
    <div class="sheet-body">
      <h2>{{ selectedRoomType.typeName }}</h2>
      <p class="hint">{{ formHintText }}</p>
      <div class="sheet-card">
        <p class="mark-line">
          <span class="text-mark">唱</span>
          <span>{{ descriptionText('bookingSummary') }}</span>
        </p>
        <p class="mark-line">
          <span class="text-mark">退</span>
          <span>{{ descriptionText('cancelRule') }}</span>
        </p>
      </div>
      <div class="sheet-card">
        <div class="field-row">
          <span class="field-label">预订人</span>
          <input
            class="field-input"
            :value="guestName"
            :maxlength="HotelBookingGuest.NAME_MAX_LENGTH"
            placeholder="预订人"
            @input="updateGuestName"
          />
        </div>
        <div class="field-row">
          <span class="field-label">联系方式</span>
          <input
            class="field-input"
            :value="contact"
            :maxlength="HotelBookingGuest.CONTACT_MAX_LENGTH"
            placeholder="联系方式"
            @input="updateContact"
          />
        </div>
      </div>
      <div class="sheet-card">
        <label>{{ arrivalTimeLabel }}</label>
        <div class="slots">
          <button
            v-for="slot in visibleArrivalSlotList"
            :key="slot.slotKey"
            type="button"
            :class="{ active: slot.slotKey === selectedSlotKey }"
            @click="emit('select-slot', slot.slotKey)"
          >
            {{ formatStartClock(slot) }}
          </button>
        </div>
        <button v-if="showArrivalSlotToggle" class="slot-toggle" type="button" @click="toggleArrivalSlots">
          {{ arrivalSlotExpanded ? '收起' : '展开' }}
          <span class="slot-toggle-icon" :class="{ expanded: arrivalSlotExpanded }"></span>
        </button>
        <p v-if="isEmpty(arrivalSlotList)" class="form-error">当前日期没有可预约时间</p>
        <label>离店时间</label>
        <p class="leave-time">{{ leaveTimeText }}</p>
      </div>
      <div class="sheet-card">
        <label>预订须知</label>
        <p class="desc-value">{{ descriptionText('bookingNotice') }}</p>
      </div>
      <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
    </div>
    <div v-if="isEmpty(amountText) !== true" class="amount-line">
      <span>合计</span>
      <strong>{{ amountText }}</strong>
    </div>
    <div class="actions">
      <button class="ghost" type="button" @click="emit('close')">取消</button>
      <button class="solid" type="button" @click="emit('submit')">确认预约</button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { HotelBookingGuest } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

const ArrivalSlotFold = {
  COLUMN_COUNT: 5,
  COLLAPSED_ROW_COUNT: 3
};

const props = defineProps({
  selectedRoomType: {
    default: null
  },
  formHintText: {
    default: ''
  },
  guestName: {
    default: ''
  },
  contact: {
    default: ''
  },
  arrivalTimeLabel: {
    default: '到店时间'
  },
  arrivalSlotList: {
    default() {
      return [];
    }
  },
  selectedSlotKey: {
    default: ''
  },
  leaveTimeText: {
    default: ''
  },
  amountText: {
    default: ''
  },
  formError: {
    default: ''
  }
});

const emit = defineEmits(['close', 'select-slot', 'submit', 'update:guestName', 'update:contact']);

/**
 * 读描述里的一段文字。没有时显示横线。
 */
function descriptionText(fieldName) {
  if (isEmpty(props.selectedRoomType) || isEmpty(props.selectedRoomType.description) || isEmpty(props.selectedRoomType.description[fieldName])) {
    return '—';
  }
  return props.selectedRoomType.description[fieldName];
}

/**
 * 把输入框里的预订人交回页面。
 */
function updateGuestName(event) {
  if (isEmpty(event) || isEmpty(event.target)) {
    return;
  }
  emit('update:guestName', event.target.value);
}

/**
 * 把输入框里的联系方式交回页面。
 */
function updateContact(event) {
  if (isEmpty(event) || isEmpty(event.target)) {
    return;
  }
  emit('update:contact', event.target.value);
}

const arrivalSlotExpanded = ref(false);

/**
 * 收起时能放下的刻度数。一行 5 个，默认 3 行。
 */
const collapsedSlotCount = ArrivalSlotFold.COLUMN_COUNT * ArrivalSlotFold.COLLAPSED_ROW_COUNT;

/**
 * 当前要画出来的到店刻度。收起时只留前 3 行。
 */
const visibleArrivalSlotList = computed(() => {
  if (isEmpty(props.arrivalSlotList)) {
    return [];
  }
  if (arrivalSlotExpanded.value || props.arrivalSlotList.length <= collapsedSlotCount) {
    return props.arrivalSlotList;
  }
  return props.arrivalSlotList.slice(0, collapsedSlotCount);
});

/**
 * 超过 3 行才显示展开。
 */
const showArrivalSlotToggle = computed(() => {
  if (isEmpty(props.arrivalSlotList)) {
    return false;
  }
  return props.arrivalSlotList.length > collapsedSlotCount;
});

/**
 * 展开或收起到店时间。
 */
function toggleArrivalSlots() {
  arrivalSlotExpanded.value = arrivalSlotExpanded.value !== true;
}

/**
 * 进店钟点，只保留时和分。
 */
function formatStartClock(slot) {
  return slot.startTime.slice(0, 5);
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(18, 12, 24, 0.46);
  z-index: 20;
  overscroll-behavior: none;
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
  max-height: calc(100vh - var(--ct-safe-top, 0px));
  overflow: visible;
  overscroll-behavior: none;
  border-radius: 22px 22px 0 0;
  background: #fff;
  z-index: 21;
}
.sheet-body {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  max-height: 60vh;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 8px 16px 16px;
  border-radius: 22px 22px 0 0;
  background: #f5f3ff;
}
.sheet h2 {
  margin: 0 0 4px;
  font-size: 20px;
}
.hint {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
}
.sheet-card {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
}
.sheet-card > label:first-child,
.sheet-card > .field-row:first-child {
  margin-top: 0;
}
.sheet label {
  display: block;
  margin: 12px 0 6px;
  font-size: 15px;
  color: #6b7280;
}
.mark-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 6px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.35;
}
.text-mark {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border: 1px solid #6d28d9;
  border-radius: 4px;
  color: #6d28d9;
  font-size: 13px;
  line-height: 1;
  flex: 0 0 auto;
}
.mark-line > span:last-child {
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.mark-line:last-child {
  margin-bottom: 0;
}
.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}
.field-row + .field-row {
  margin-top: 0;
}
.field-label {
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 15px;
}
.field-row .field-input {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
  padding: 4px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  text-align: right;
}
.desc-value {
  margin: 0;
  color: #111827;
  font-size: 16px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.field-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 17px;
}
.slots {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.slots button,
.actions button,
.slot-toggle {
  border: 0;
  font: inherit;
}
.slot-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  margin-top: 8px;
  padding: 4px 0;
  background: transparent;
  color: #6d28d9;
  font-size: 15px;
}
.slot-toggle-icon {
  width: 6px;
  height: 6px;
  border-right: 1.5px solid #6d28d9;
  border-bottom: 1.5px solid #6d28d9;
  transform: rotate(45deg) translateY(-2px);
}
.slot-toggle-icon.expanded {
  transform: rotate(-135deg) translateY(-1px);
}
.slots button {
  width: 100%;
  padding: 8px 0;
  border-radius: 999px;
  background: #ede9fe;
  color: #111827;
  font-size: 15px;
}
.slots button.active {
  background: #6d28d9;
  color: #fff;
}
.leave-time {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.amount-line {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px 16px 0;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  font-size: 18px;
}
.amount-line span,
.amount-line strong {
  font-size: 18px;
}
.amount-line strong {
  color: #6d28d9;
  font-variant-numeric: tabular-nums;
}
.form-error {
  margin: 8px 0 0;
  color: #b45309;
  font-size: 15px;
}
.actions {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  padding: 12px 16px calc(12px + var(--ct-safe-bottom, 0px));
  background: #fff;
}
.actions button {
  flex: 1;
  padding: 13px;
  border-radius: 999px;
  font-size: 17px;
}
.ghost {
  background: #ede9fe;
  color: #111827;
}
.solid {
  background: #6d28d9;
  color: #fff;
}
</style>
