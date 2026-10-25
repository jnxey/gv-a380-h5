<template>
  <Teleport to="body">
    <div v-if="open === true" class="sheet-root" :class="accentClassName">
      <div class="mask" @click="emit('close')"></div>
      <section class="sheet" @click.stop>
        <div class="sheet-head">
          <div class="sheet-head-main">
            <h2>{{ title }}</h2>
            <p v-if="isEmpty(priceText) !== true" class="sheet-price">{{ priceText }}</p>
          </div>
          <button type="button" class="sheet-close" @click="emit('close')">关闭</button>
        </div>
        <div class="sheet-body">
          <ImageGallery :image-list="imageList" :accent="accent" :active="open" />
          <div class="desc-block">
            <p class="desc-label">详细描述</p>
            <p class="desc-text">{{ descriptionDisplayText }}</p>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import ImageGallery from '../ImageGallery/ImageGallery.vue';
import { ItemDetailAccent } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

const props = defineProps({
  open: {
    default: false,
  },
  title: {
    default: '',
  },
  priceText: {
    default: '',
  },
  description: {
    default: '',
  },
  imageList: {
    default() {
      return [];
    },
  },
  accent: {
    default: ItemDetailAccent.KTV,
  },
});

const emit = defineEmits(['close']);

/**
 * 描述文案。空时给占位提示。
 */
const descriptionDisplayText = computed(() => {
  if (isEmpty(props.description) || isEmpty(props.description.trim())) {
    return '暂无详细描述';
  }
  return props.description;
});

/**
 * 按业务线套主色 class。
 */
const accentClassName = computed(() => {
  if (props.accent === ItemDetailAccent.HOTEL) {
    return 'is-hotel';
  }
  if (props.accent === ItemDetailAccent.STORE) {
    return 'is-store';
  }
  return 'is-ktv';
});
</script>

<style scoped>
.sheet-root {
  position: fixed;
  inset: 0;
  z-index: 40;
}
.mask {
  position: absolute;
  inset: 0;
  background: rgba(18, 12, 24, 0.46);
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
  max-height: min(82vh, 720px);
  border-radius: 24px 24px 0 0;
  background: #fff;
  z-index: 41;
  overflow: hidden;
  overscroll-behavior: none;
  box-shadow: 0 -12px 40px rgba(18, 12, 24, 0.12);
}
.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 8px;
}
.sheet-head-main {
  min-width: 0;
  flex: 1 1 auto;
}
.sheet-head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: #111827;
  word-break: break-word;
}
.sheet-price {
  margin: 6px 0 0;
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.sheet-close {
  flex: 0 0 auto;
  margin-top: 2px;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 13px;
}
.sheet-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 0 16px calc(20px + var(--gv-safe-bottom, 0px));
}
.desc-block {
  margin-top: 16px;
  padding: 14px 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
}
.desc-label {
  margin: 0 0 8px;
  color: #6b7280;
  font-size: 12px;
  letter-spacing: 0.06em;
}
.desc-text {
  margin: 0;
  color: #374151;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.is-ktv .sheet-price {
  color: #6d28d9;
}

.is-hotel .sheet-price,
.is-store .sheet-price {
  color: #1f8a70;
}
.is-hotel .sheet,
.is-store .sheet {
  background: #fffdf9;
}
.is-hotel .desc-block,
.is-store .desc-block {
  background: rgba(31, 138, 112, 0.08);
}
.is-hotel .desc-text,
.is-store .desc-text {
  color: #14241c;
}
</style>
