<template>
  <div class="image-gallery" :class="accentClassName">
    <div v-if="safeImageList.length > 0" class="gallery">
      <div ref="trackRef" class="gallery-track" @scroll="onGalleryScroll">
        <div v-for="imageRow in safeImageList" :key="imageRow.imageId" class="gallery-slide">
          <img :src="imageRow.imageUrl" alt="" />
        </div>
      </div>
      <div v-if="safeImageList.length > 1" class="gallery-dots">
        <span
          v-for="(imageRow, imageIndex) in safeImageList"
          :key="`dot-${imageRow.imageId}`"
          class="gallery-dot"
          :class="{ active: imageIndex === activeImageIndex }"
        ></span>
      </div>
    </div>
    <div v-else class="gallery-empty">{{ emptyText }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { ItemDetailAccent } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

const props = defineProps({
  imageList: {
    default() {
      return [];
    },
  },
  accent: {
    default: ItemDetailAccent.KTV,
  },
  emptyText: {
    default: '暂无图片',
  },
  /**
   * 为 true 时回到第一张（详情半屏打开时传入）。
   */
  active: {
    default: false,
  },
});

const trackRef = ref(null);
const activeImageIndex = ref(0);

/**
 * 有地址的图片列表。
 */
const safeImageList = computed(() => {
  if (isEmpty(props.imageList)) {
    return [];
  }
  const imageList = [];
  for (let imageIndex = 0; imageIndex < props.imageList.length; imageIndex += 1) {
    const imageRow = props.imageList[imageIndex];
    if (isEmpty(imageRow) !== true && isEmpty(imageRow.imageUrl) !== true) {
      imageList.push({
        imageId: isEmpty(imageRow.imageId) ? String(imageIndex) : imageRow.imageId,
        imageUrl: imageRow.imageUrl,
      });
    }
  }
  return imageList;
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

/**
 * 回到第一张，并滚回轨道起点。
 */
async function resetGallery() {
  activeImageIndex.value = 0;
  await nextTick();
  if (isEmpty(trackRef.value) !== true) {
    trackRef.value.scrollLeft = 0;
  }
}

/**
 * 激活时或图片列表变化时重置图库。
 */
watch(
  () => [props.active, props.imageList],
  ([isActive]) => {
    if (isActive === true) {
      void resetGallery();
    }
  },
);

/**
 * 横向滑动时更新圆点。
 */
function onGalleryScroll(event) {
  const trackElement = event.target;
  if (isEmpty(trackElement) || trackElement.clientWidth <= 0) {
    return;
  }
  const nextIndex = Math.round(trackElement.scrollLeft / trackElement.clientWidth);
  if (nextIndex < 0) {
    activeImageIndex.value = 0;
    return;
  }
  if (nextIndex >= safeImageList.value.length) {
    activeImageIndex.value = Math.max(safeImageList.value.length - 1, 0);
    return;
  }
  activeImageIndex.value = nextIndex;
}
</script>

<style scoped>
.gallery {
  margin-top: 4px;
}
.gallery-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  border-radius: 18px;
  overscroll-behavior-x: contain;
}
.gallery-track::-webkit-scrollbar {
  display: none;
}
.gallery-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  height: 220px;
  background: #f3f4f6;
}
.gallery-slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
}
.gallery-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #d1d5db;
}
.gallery-dot.active {
  width: 16px;
}
.gallery-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  margin-top: 4px;
  border-radius: 18px;
  color: #fff;
  font-size: 14px;
}

.is-ktv .gallery-dot.active {
  background: #6d28d9;
}
.is-ktv .gallery-empty {
  background: linear-gradient(145deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%);
}

.is-hotel .gallery-dot.active,
.is-store .gallery-dot.active {
  background: #1f8a70;
}
.is-hotel .gallery-empty,
.is-store .gallery-empty {
  background: linear-gradient(145deg, #2aa084 0%, #1f8a70 55%, #145c4b 100%);
}
</style>
