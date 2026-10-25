<template>
  <div class="mask" @click="emit('close')"></div>
  <section ref="sheetElement" class="sheet" @focusin="handleSheetFocusIn" @focusout="handleSheetFocusOut">
    <div class="sheet-body">
      <div class="sheet-head">
        <h2>购物车</h2>
        <button type="button" class="close" @click="emit('close')">关闭</button>
      </div>
      <div class="sheet-card">
        <div v-for="cartLine in cartLineList" :key="cartLine.productId" class="cart-line">
          <div class="cart-line-main">
            <div class="product-name">{{ cartLine.productName }}</div>
            <div class="product-meta">
              单价 {{ formatMoney(cartLine.salePrice) }} · 小计 {{ multiplyMoney(cartLine.salePrice, cartLine.quantity) }}
            </div>
          </div>
          <div class="qty">
            <button type="button" @click="emit('change', cartLine.productId, -1)">-</button>
            <span>{{ cartLine.quantity }}</span>
            <button type="button" class="add" @click="emit('change', cartLine.productId, 1)">+</button>
          </div>
        </div>
      </div>
      <div class="sheet-card">
        <div class="field-row">
          <span class="field-label">收货人</span>
          <input
            class="field-input"
            :value="receiverName"
            :maxlength="HotelBookingGuest.NAME_MAX_LENGTH"
            placeholder="收货人"
            @input="updateReceiverName"
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
        <div class="delivery-field">
          <div class="delivery-label-row">
            <span class="delivery-label">收货地址</span>
            <button v-if="isEmpty(addressHistory) !== true" class="address-pick" type="button" @click="openAddressPicker">
              <AppIcon :icon-name="AppIconName.MAP" />
              <span>选择</span>
            </button>
          </div>
          <textarea
            class="delivery-input"
            rows="2"
            placeholder="请填写收货地址"
            :value="deliveryAddress"
            @input="emit('update:deliveryAddress', $event.target.value)"
          ></textarea>
        </div>
      </div>
      <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
    </div>
    <div v-show="sheetInputFocused !== true" class="sheet-total">
      <span>合计</span>
      <span class="total-side">
        <strong>{{ cartAmountText }}</strong>
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
      </span>
    </div>
    <button v-show="sheetInputFocused !== true" class="solid" type="button" :disabled="submitting" @click="emit('submit')">确认支付</button>
  </section>
  <div v-if="addressPickerOpen === true" class="address-mask" @click="closeAddressPicker">
    <section class="address-card" @click.stop>
      <h3>选择收货地址</h3>
      <button
        v-for="addressText in addressHistory"
        :key="addressText"
        class="address-option"
        :class="{ active: isSelectedAddress(addressText) }"
        type="button"
        @click="selectAddress(addressText)"
      >
        {{ addressText }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppIcon from '../../../components/AppIcon/AppIcon.vue';
import { AppIconName, HotelBookingGuest } from '../../../utils/constants.js';
import { useSheetInputFocus } from '../../../utils/sheetInputFocus.js';
import { formatMoney, isEmpty, multiplyMoney } from '../../../utils/tools.js';

const props = defineProps({
  cartLineList: {
    default: () => [],
  },
  cartAmountText: {
    default: '0.00',
  },
  receiverName: {
    default: '',
  },
  contact: {
    default: '',
  },
  deliveryAddress: {
    default: '',
  },
  addressHistory: {
    default() {
      return [];
    },
  },
  formError: {
    default: '',
  },
  submitting: {
    default: false,
  },
  pointPlan: {
    default() {
      return { visible: false, enabled: false, hint: '' };
    },
  },
  usePointDeduct: {
    default: false,
  },
});

const emit = defineEmits(['close', 'change', 'submit', 'update:receiverName', 'update:contact', 'update:deliveryAddress', 'update:usePointDeduct']);

/**
 * 切换是否使用本单积分抵扣。积分不足时标签不可点。
 */
function togglePointDeduct() {
  if (props.pointPlan.enabled !== true) {
    return;
  }
  emit('update:usePointDeduct', props.usePointDeduct !== true);
}

const addressPickerOpen = ref(false);
const { sheetElement, sheetInputFocused, handleSheetFocusIn, handleSheetFocusOut } = useSheetInputFocus();

/**
 * 把输入框里的收货人交回页面。
 */
function updateReceiverName(event) {
  if (isEmpty(event) || isEmpty(event.target)) {
    return;
  }
  emit('update:receiverName', event.target.value);
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

/**
 * 打开收货地址选择层。
 */
function openAddressPicker() {
  addressPickerOpen.value = true;
}

/**
 * 关掉收货地址选择层。
 */
function closeAddressPicker() {
  addressPickerOpen.value = false;
}

/**
 * 当前输入和这条记住的地址相同。
 */
function isSelectedAddress(addressText) {
  const currentAddress = isEmpty(props.deliveryAddress) ? '' : props.deliveryAddress.trim();
  return currentAddress === addressText;
}

/**
 * 选中一条记住的地址，写回输入框并关掉选择层。
 */
function selectAddress(addressText) {
  emit('update:deliveryAddress', addressText);
  addressPickerOpen.value = false;
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
  width: min(520px, 100%);
  max-height: min(78vh, 640px);
  display: flex;
  flex-direction: column;
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
  overflow: auto;
  overscroll-behavior: contain;
  padding: 16px 16px 16px;
  border-radius: 22px 22px 0 0;
  background: #eef4f1;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sheet-card {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
}
.sheet-card > .field-row:first-child {
  margin-top: 0;
}
.sheet-head h2 {
  margin: 0;
  font-size: 20px;
}
.close {
  border: 0;
  padding: 0;
  background: transparent;
  color: #6b7280;
  font: inherit;
  font-size: 16px;
}
.cart-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
}
.cart-line-main {
  min-width: 0;
  flex: 1 1 auto;
}
.product-name {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}
.product-meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 14px;
}
.qty {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.qty button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #eef2f7;
  font: inherit;
}
.qty button.add {
  background: #1f8a70;
  color: #fff;
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
  color: #6b7280;
  font-size: 15px;
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
.field-row .field-input {
  flex: 1 1 65%;
  min-width: 0;
  width: auto;
  padding: 4px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #111827;
  font-weight: bold;
  text-align: left;
}
.delivery-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.delivery-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.delivery-label {
  color: #374151;
  font-size: 15px;
  font-weight: 600;
}
.address-pick {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  padding: 0;
  background: transparent;
  color: #1f8a70;
  font: inherit;
  font-size: 15px;
}
.address-pick :deep(.app-icon) {
  width: 14px;
  height: 14px;
}
.delivery-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  resize: none;
  font: inherit;
  font-size: 16px;
  line-height: 1.45;
  color: #111827;
  background: #f9fafb;
}
.delivery-input:focus {
  outline: none;
  border-color: #1f8a70;
  background: #fff;
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
.total-side {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sheet-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 0;
  border-top: 1px solid rgba(20, 36, 28, 0.08);
  background: #fff;
}
.sheet-total > span:first-child {
  color: #6b7280;
  font-size: 15px;
}
.sheet-total strong {
  color: #1f8a70;
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}
.form-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-size: 15px;
}
.solid {
  width: calc(100% - 32px);
  margin: 12px 16px calc(12px + var(--ct-safe-bottom, 0px));
  padding: 13px;
  border: 0;
  border-radius: 999px;
  background: #1f8a70;
  color: #fff;
  font: inherit;
  font-size: 17px;
}
.solid:disabled {
  opacity: 0.45;
}
.address-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(20, 36, 28, 0.46);
}
.address-card {
  box-sizing: border-box;
  width: min(520px, 100%);
  max-height: min(60vh, 420px);
  overflow: auto;
  padding: 16px 16px calc(16px + var(--ct-safe-bottom, 0px));
  border-radius: 22px 22px 0 0;
  background: #fff;
}
.address-card h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #111827;
}
.address-option {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  color: #111827;
  font: inherit;
  font-size: 16px;
  line-height: 1.45;
  text-align: left;
  word-break: break-word;
}
.address-option.active {
  border-color: #1f8a70;
  background: #d8efe8;
  color: #1f8a70;
}
</style>
