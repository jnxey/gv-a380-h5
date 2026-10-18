<template>
  <div class="dates">
    <button
      v-for="dateOption in dateOptionList"
      :key="dateOption.bookingDate"
      type="button"
      :class="{ active: dateOption.bookingDate === selectedBookingDate }"
      @click="emit('select', dateOption.bookingDate)"
    >
      <span class="weekday">{{ dateOption.dayLabel }}</span>
      <strong>{{ dateOption.dayNumber }}</strong>
    </button>
  </div>
</template>

<script setup>
defineProps({
  dateOptionList: {
    default() {
      return [];
    },
  },
  selectedBookingDate: {
    default: '',
  },
});

const emit = defineEmits(['select']);
</script>

<style scoped>
.dates {
  display: flex;
  gap: 8px;
}
.dates button {
  flex: 1 1 0;
  min-width: 0;
  padding: 10px 0 8px;
  border: 0;
  border-radius: 14px;
  background: #fff;
  text-align: center;
  color: #111827;
  font: inherit;
}
.weekday {
  display: block;
  color: #6b7280;
  font-size: 12px;
}
.dates strong {
  display: block;
  margin-top: 2px;
  font-size: 18px;
}
.dates button.active {
  background: #6d28d9;
  color: #fff;
}
.dates button.active .weekday {
  color: rgba(255, 255, 255, 0.72);
}
</style>
