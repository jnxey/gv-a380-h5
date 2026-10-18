<template>
  <svg v-if="isEmpty(iconShapeList) === false" class="app-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-for="(iconShape, iconShapeIndex) in iconShapeList" :key="iconShapeIndex">
      <path v-if="iconShape.shapeKind === AppIconShapeKind.PATH" :d="iconShape.pathData" />
      <circle
        v-else-if="iconShape.shapeKind === AppIconShapeKind.CIRCLE"
        :cx="iconShape.centerX"
        :cy="iconShape.centerY"
        :r="iconShape.radius"
      />
      <rect
        v-else-if="iconShape.shapeKind === AppIconShapeKind.RECT"
        :x="iconShape.offsetX"
        :y="iconShape.offsetY"
        :width="iconShape.width"
        :height="iconShape.height"
        :rx="iconShape.cornerRadius"
      />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue';
import { AppIconShapeKind, appIconShapeListByName } from './appIconShapeList.js';
import { isEmpty } from '../../utils/tools.js';

const props = defineProps({
  iconName: {
    default: '',
  },
});

/**
 * 按图标名取出要画的图形。没有对应图标时不画。
 */
const iconShapeList = computed(() => {
  const shapeList = appIconShapeListByName[props.iconName];
  if (isEmpty(shapeList)) {
    return [];
  }
  return shapeList;
});
</script>

<style scoped>
.app-icon {
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
