<template>
  <div class="review-empty">
    <span class="review-icon">
      <AppIcon :icon-name="AppIconName.REVIEW" />
    </span>
    <p>暂无评价</p>
  </div>
</template>

<script setup>
import AppIcon from '../../../components/AppIcon/AppIcon.vue';
import { AppIconName } from '../../../utils/constants.js';
</script>

<style scoped>
.review-empty {
  padding: 48px 0 32px;
  text-align: center;
}
.review-icon {
  display: inline-grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: #ede9fe;
  color: #6d28d9;
}
.review-icon :deep(.app-icon) {
  width: 56px;
  height: 56px;
}
.review-empty p {
  margin: 12px 0 0;
  color: #6b7280;
  font-size: 14px;
}
</style>
