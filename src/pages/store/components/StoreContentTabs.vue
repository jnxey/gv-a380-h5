<template>
  <div class="tabs">
    <button
      v-for="tabItem in StoreContentTabItemList"
      :key="tabItem.contentTab"
      type="button"
      :class="{ active: tabItem.contentTab === selectedContentTab }"
      @click="emit('select', tabItem.contentTab)"
    >
      {{ tabItem.label }}
    </button>
  </div>
</template>

<script setup>
import { StoreContentTabItemList } from '../../../utils/constants.js';

defineProps({
  selectedContentTab: {
    default: '',
  },
});

const emit = defineEmits(['select']);
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin: -8px 0 16px;
  padding: 4px;
  border-radius: 999px;
  background: #d8efe8;
}
.tabs button {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #145c4b;
  font: inherit;
  font-size: 13px;
}
.tabs button.active {
  background: #1f8a70;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(31, 138, 112, 0.28);
}
</style>
