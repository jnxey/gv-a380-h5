<template>
  <div class="dates">
    <button
      v-for="dateOption in dateOptionList"
      :key="dateOption.bookingDate"
      type="button"
      :class="{ active: dateOption.bookingDate === selectedCheckInDate }"
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
  selectedCheckInDate: {
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
  background: #fffdf9;
  text-align: center;
  color: #14241c;
  font: inherit;
}
.weekday {
  display: block;
  color: #5e6b64;
  font-size: 12px;
}
.dates strong {
  display: block;
  margin-top: 2px;
  font-size: 18px;
}
.dates button.active {
  background: #1f8a70;
  color: #fffdf9;
}
.dates button.active .weekday {
  color: rgba(255, 253, 249, 0.78);
}
</style>
