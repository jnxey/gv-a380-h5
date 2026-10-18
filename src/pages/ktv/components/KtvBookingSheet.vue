<template>
  <div class="mask" @click="emit('close')"></div>
  <section v-if="isEmpty(selectedRoomType) !== true" class="sheet">
    <div class="handle"></div>
    <h2>{{ selectedRoomType.typeName }}</h2>
    <p class="hint">{{ formHintText }}</p>
    <label>到店时间</label>
    <div class="slots">
      <button
        v-for="slot in arrivalSlotList"
        :key="slot.slotKey"
        type="button"
        :class="{ active: slot.slotKey === selectedSlotKey }"
        @click="emit('select-slot', slot.slotKey)"
      >
        {{ formatStartClock(slot) }}
      </button>
    </div>
    <p v-if="isEmpty(arrivalSlotList)" class="form-error">当前日期没有可预约时间</p>
    <label>离店时间</label>
    <p class="leave-time">{{ leaveTimeText }}</p>
    <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
    <div class="actions">
      <button class="ghost" type="button" @click="emit('close')">返回</button>
      <button class="solid" type="button" @click="emit('submit')">确认预约</button>
    </div>
  </section>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

defineProps({
  selectedRoomType: {
    default: null,
  },
  formHintText: {
    default: '',
  },
  arrivalSlotList: {
    default() {
      return [];
    },
  },
  selectedSlotKey: {
    default: '',
  },
  leaveTimeText: {
    default: '',
  },
  formError: {
    default: '',
  },
});

const emit = defineEmits(['close', 'select-slot', 'submit']);

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
}
.sheet {
  box-sizing: border-box;
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(520px, 100%);
  max-height: 88vh;
  overflow: auto;
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
  border-radius: 22px 22px 0 0;
  background: #fff;
  z-index: 21;
}
.handle {
  width: 36px;
  height: 4px;
  margin: 6px auto 12px;
  border-radius: 999px;
  background: #e5e7eb;
}
.sheet h2 {
  margin: 0 0 4px;
  font-size: 18px;
}
.hint {
  margin: 0 0 14px;
  color: #6b7280;
  font-size: 13px;
}
.sheet label {
  display: block;
  margin: 12px 0 6px;
  font-size: 13px;
  color: #6b7280;
}
.slots {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.slots button,
.actions button {
  border: 0;
  font: inherit;
}
.slots button {
  width: 100%;
  padding: 8px 0;
  border-radius: 999px;
  background: #ede9fe;
  color: #111827;
  font-size: 13px;
}
.slots button.active {
  background: #6d28d9;
  color: #fff;
}
.leave-time {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.form-error {
  margin: 8px 0 0;
  color: #b45309;
  font-size: 13px;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.actions button {
  flex: 1;
  padding: 13px;
  border-radius: 999px;
  font-size: 15px;
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
