<template>
  <p class="section-label">入住晚数</p>
  <div class="chips">
    <button
      v-for="nightCount in HotelBookingNight.NIGHT_LIST"
      :key="nightCount"
      type="button"
      :class="{ active: nightCount === selectedNightCount }"
      @click="emit('select', nightCount)"
    >
      {{ nightCount }} 晚
    </button>
  </div>
</template>

<script setup>
import { HotelBookingNight } from '../../../utils/constants.js';

defineProps({
  selectedNightCount: {
    default: HotelBookingNight.DEFAULT_NIGHTS,
  },
});

const emit = defineEmits(['select']);
</script>

<style scoped>
.section-label {
  margin: 16px 0 8px;
  color: #5e6b64;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chips button {
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: #fffdf9;
  color: #14241c;
  font: inherit;
  font-size: 13px;
}
.chips button.active {
  background: #1f8a70;
  color: #fffdf9;
}
</style>
