<template>
  <div class="mask" @click="emit('close')"></div>
  <section v-if="isEmpty(selectedRoomType) !== true" class="sheet">
    <div class="sheet-body">
      <h2>{{ selectedRoomType.typeName }}</h2>
      <p class="hint">{{ formHintText }}</p>
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

const emit = defineEmits(['close', 'select-slot', 'submit']);

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
  max-height: calc(100vh - var(--gv-safe-top, 0px));
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
  font-size: 13px;
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
.amount-line {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px 16px 0;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  font-size: 16px;
}
.amount-line span,
.amount-line strong {
  font-size: 16px;
}
.amount-line strong {
  color: #6d28d9;
  font-variant-numeric: tabular-nums;
}
.form-error {
  margin: 8px 0 0;
  color: #b45309;
  font-size: 13px;
}
.actions {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  padding: 12px 16px calc(12px + var(--gv-safe-bottom, 0px));
  background: #fff;
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
