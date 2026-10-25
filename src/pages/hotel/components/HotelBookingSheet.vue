<template>
  <div class="mask" @click="emit('close')"></div>
  <section
    v-if="isEmpty(selectedRoomType) !== true"
    ref="sheetElement"
    class="sheet"
    @focusin="handleSheetFocusIn"
    @focusout="handleSheetFocusOut"
  >
    <div class="sheet-body">
      <h2>{{ selectedRoomType.typeName }}</h2>
      <p class="hint">{{ formHintText }}</p>
      <div class="sheet-card">
        <div class="spec-row">
          <span class="spec-item">
            <AppIcon :icon-name="AppIconName.BED" />
            <span>{{ descriptionText('bedType') }}</span>
          </span>
          <span class="spec-item">
            <AppIcon :icon-name="AppIconName.ROOM_SIZE" />
            <span>{{ descriptionText('roomSize') }}</span>
          </span>
          <span class="spec-item">
            <AppIcon :icon-name="AppIconName.FLOOR" />
            <span>{{ descriptionText('floorText') }}</span>
          </span>
        </div>
        <div class="spec-row">
          <span class="spec-item">
            <AppIcon :icon-name="AppIconName.GUEST" />
            <span>{{ descriptionText('guestCount') }}</span>
          </span>
          <span class="spec-item">
            <AppIcon :icon-name="AppIconName.BREAKFAST" />
            <span>{{ descriptionText('breakfast') }}</span>
          </span>
          <span class="spec-item">
            <AppIcon :icon-name="AppIconName.PARKING" />
            <span>{{ descriptionText('freeParking') }}</span>
          </span>
        </div>
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
        <div class="date-row">
          <span class="date-item">
            <span>入住日期</span>
            <strong>{{ checkInDate }}</strong>
          </span>
          <span class="date-item">
            <span>离店日期</span>
            <strong>{{ checkOutDate }}</strong>
          </span>
          <span class="date-item">
            <span>入住晚数</span>
            <strong>{{ nightCount }} 晚</strong>
          </span>
        </div>
      </div>
      <div class="sheet-card">
        <label>预订须知</label>
        <p class="desc-value">{{ descriptionText('bookingNotice') }}</p>
      </div>
      <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
    </div>
    <div v-if="isEmpty(amountText) !== true" v-show="sheetInputFocused !== true" class="amount-line">
      <span>合计</span>
      <strong>{{ amountText }}</strong>
      <button
        v-if="pointPlan.visible === true && pointPlan.enabled === true"
        class="point-tag"
        :class="{ on: usePointDeduct === true }"
        type="button"
        @click="togglePointDeduct"
      >
        积分抵扣{{ pointPlan.amountText }}元
      </button>
      <span v-else-if="pointPlan.visible === true" class="point-tag short">积分不足</span>
    </div>
    <div v-show="sheetInputFocused !== true" class="actions">
      <button class="ghost" type="button" @click="emit('close')">取消</button>
      <button class="solid" type="button" :disabled="submitting === true" @click="emit('submit')">确认预订</button>
    </div>
  </section>
</template>

<script setup>
import AppIcon from '../../../components/AppIcon/AppIcon.vue';
import { AppIconName, HotelBookingGuest } from '../../../utils/constants.js';
import { useSheetInputFocus } from '../../../utils/sheetInputFocus.js';
import { isEmpty } from '../../../utils/tools.js';

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
  checkInDate: {
    default: ''
  },
  nightCount: {
    default: 0
  },
  checkOutDate: {
    default: ''
  },
  amountText: {
    default: ''
  },
  formError: {
    default: ''
  },
  pointPlan: {
    default() {
      return { visible: false, enabled: false, hint: '' };
    }
  },
  usePointDeduct: {
    default: false
  },
  submitting: {
    default: false
  }
});

const emit = defineEmits(['close', 'submit', 'update:guestName', 'update:contact', 'update:usePointDeduct']);

/**
 * 切换是否使用本单积分抵扣。积分不足时标签不可点。
 */
function togglePointDeduct() {
  if (props.pointPlan.enabled !== true) {
    return;
  }
  emit('update:usePointDeduct', props.usePointDeduct !== true);
}

const { sheetElement, sheetInputFocused, handleSheetFocusIn, handleSheetFocusOut } = useSheetInputFocus();

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
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(20, 36, 28, 0.46);
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
  background: #fffdf9;
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
  background: #f3efe6;
}
.sheet h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #14241c;
}
.hint {
  margin: 0;
  color: #5e6b64;
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
  color: #5e6b64;
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
  flex: 0 0 35%;
  color: #5e6b64;
  font-size: 15px;
}
.field-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(20, 36, 28, 0.12);
  border-radius: 12px;
  background: #fff;
  color: #14241c;
  font: inherit;
  font-size: 17px;
}
.field-row .field-input {
  flex: 1 1 65%;
  min-width: 0;
  width: auto;
  padding: 4px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #14241c;
  font-weight: bold;
  text-align: left;
}
.date-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.date-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  flex: 1 1 0;
  color: #5e6b64;
  font-size: 15px;
}
.date-item strong {
  overflow: hidden;
  max-width: 100%;
  color: #14241c;
  font-size: 17px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spec-row {
  display: flex;
  align-items: center;
  margin: 0 0 8px;
  color: #14241c;
  font-size: 15px;
  line-height: 1.4;
  white-space: nowrap;
}
.spec-row:last-child {
  margin-bottom: 0;
}
.spec-item {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1 1 0;
}
.spec-item :deep(.app-icon) {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: #1f8a70;
}
.spec-item > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.desc-value {
  margin: 0;
  color: #14241c;
  font-size: 16px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.point-tag {
  padding: 2px 8px;
  border: 1px solid #1f8a70;
  border-radius: 999px;
  background: #fff;
  color: #1f8a70;
  font-size: 12px;
  line-height: 1.4;
}
.point-tag.on {
  background: #1f8a70;
  color: #fff;
}
.point-tag.short {
  border-color: transparent;
  background: #f3f4f6;
  color: #9ca3af;
}
.amount-line {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px 16px 0;
  border-top: 1px solid rgba(20, 36, 28, 0.08);
  font-size: 18px;
  color: #14241c;
}
.amount-line > span:first-child,
.amount-line strong {
  font-size: 18px;
}
.amount-line strong {
  color: #1f8a70;
  font-variant-numeric: tabular-nums;
}
.form-error {
  margin: 8px 0 0;
  color: #c2412d;
  font-size: 15px;
}
.actions {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  padding: 12px 16px calc(12px + var(--ct-safe-bottom, 0px));
  background: #fffdf9;
}
.actions button {
  flex: 1;
  padding: 13px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 17px;
}
.ghost {
  background: rgba(31, 138, 112, 0.12);
  color: #14241c;
}
.solid {
  background: #1f8a70;
  color: #fffdf9;
}
.solid:disabled {
  opacity: 0.45;
}
</style>
