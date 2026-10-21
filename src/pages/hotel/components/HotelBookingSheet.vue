<template>
  <div class="mask" @click="emit('close')"></div>
  <section v-if="isEmpty(selectedRoomType) !== true" class="sheet">
    <div class="sheet-body">
      <h2>{{ selectedRoomType.typeName }}</h2>
      <p class="hint">{{ formHintText }}</p>
      <label>入住日期</label>
      <p class="value">{{ checkInDate }}</p>
      <label>入住晚数</label>
      <p class="value">{{ nightCount }} 晚</p>
      <label>离店日期</label>
      <p class="value">{{ checkOutDate }}</p>
      <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
    </div>
    <div v-if="isEmpty(amountText) !== true" class="amount-line">
      <span>合计</span>
      <strong>{{ amountText }}</strong>
    </div>
    <div class="actions">
      <button class="ghost" type="button" @click="emit('close')">取消</button>
      <button class="solid" type="button" @click="emit('submit')">确认预订</button>
    </div>
  </section>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

defineProps({
  selectedRoomType: {
    default: null
  },
  formHintText: {
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
  }
});

const emit = defineEmits(['close', 'submit']);
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
  max-height: calc(100vh - var(--gv-safe-top, 0px));
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
}
.sheet h2 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #14241c;
}
.hint {
  margin: 0 0 14px;
  color: #5e6b64;
  font-size: 13px;
}
.sheet label {
  display: block;
  margin: 12px 0 6px;
  font-size: 13px;
  color: #5e6b64;
}
.value {
  margin: 0;
  color: #14241c;
  font-size: 16px;
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
  border-top: 1px solid rgba(20, 36, 28, 0.08);
  font-size: 16px;
  color: #14241c;
}
.amount-line span,
.amount-line strong {
  font-size: 16px;
}
.amount-line strong {
  color: #1f8a70;
  font-variant-numeric: tabular-nums;
}
.form-error {
  margin: 8px 0 0;
  color: #c2412d;
  font-size: 13px;
}
.actions {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  padding: 12px 16px calc(12px + var(--gv-safe-bottom, 0px));
  background: #fffdf9;
}
.actions button {
  flex: 1;
  padding: 13px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 15px;
}
.ghost {
  background: rgba(31, 138, 112, 0.12);
  color: #14241c;
}
.solid {
  background: #1f8a70;
  color: #fffdf9;
}
</style>
