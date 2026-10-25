<template>
  <div class="tabs-bar">
    <div class="tabs">
      <button
        v-for="tabItem in HotelContentTabItemList"
        :key="tabItem.contentTab"
        type="button"
        :class="{ active: tabItem.contentTab === selectedContentTab }"
        @click="emit('select', tabItem.contentTab)"
      >
        {{ tabItem.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { HotelContentTabItemList } from '../../../utils/constants.js';

defineProps({
  selectedContentTab: {
    default: '',
  },
});

const emit = defineEmits(['select']);
</script>

<style scoped>
.tabs-bar {
  position: sticky;
  top: var(--ct-safe-top, 0px);
  z-index: 2;
  margin: -8px -16px 0;
  padding: 0 16px 16px;
  background: #f3efe8;
}
.tabs {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 4px;
  border-radius: 999px;
  background: rgba(31, 138, 112, 0.12);
}
.tabs button {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #14241c;
  font: inherit;
  font-size: 13px;
}
.tabs button.active {
  background: #1f8a70;
  color: #fffdf9;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(31, 138, 112, 0.28);
}
</style>
