<template>
  <div class="tabs-bar">
    <div class="tabs">
      <button
        v-for="tabItem in KtvContentTabItemList"
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
import { KtvContentTabItemList } from '../../../utils/constants.js';

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
  top: var(--gv-safe-top, 0px);
  z-index: 2;
  margin: -8px -16px 0;
  padding: 0 16px 16px;
  background: #f5f6f8;
}
.tabs {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 4px;
  border-radius: 999px;
  background: #ede9fe;
}
.tabs button {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #3d2c52;
  font: inherit;
  font-size: 13px;
}
.tabs button.active {
  background: #6d28d9;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(109, 40, 217, 0.28);
}
</style>
