<template>
  <p class="section-label">欢唱时长</p>
  <div class="chips">
    <button
      v-for="hourCount in KtvBookingDuration.HOUR_LIST"
      :key="hourCount"
      type="button"
      :class="{ active: hourCount === selectedDurationHours }"
      @click="emit('select', hourCount)"
    >
      {{ hourCount }} 小时
    </button>
  </div>
</template>

<script setup>
import { KtvBookingDuration } from '../../../utils/constants.js';

defineProps({
  selectedDurationHours: {
    default: KtvBookingDuration.DEFAULT_HOURS,
  },
});

const emit = defineEmits(['select']);
</script>

<style scoped>
.section-label {
  margin: 16px 0 8px;
  color: #6b7280;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chips::-webkit-scrollbar {
  display: none;
}
.chips button {
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 13px;
}
.chips button.active {
  background: #6d28d9;
  color: #fff;
}
</style>
