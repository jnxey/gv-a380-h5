<template>
  <p class="section-label">包厢</p>
  <p v-if="isEmpty(currentShop) !== true && isEmpty(roomTypeList)" class="empty">暂无可预订包厢</p>
  <ul class="rooms">
    <li
      v-for="roomType in roomTypeList"
      :key="roomType.id"
      class="room"
      :class="{ picked: roomType.id === selectedRoomTypeId }"
      @click="onClick(roomType)"
      @touchstart.passive="onTouchStart(roomType, $event)"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <div class="cover" :style="coverStyle(roomType)"></div>
      <div>
        <h2>{{ roomType.typeName }}</h2>
        <div class="price-line">
          <strong>¥{{ formatRoomAmount(roomType) }}</strong>
        </div>
      </div>
    </li>
  </ul>
  <ItemDetailSheet
    :open="detailOpen"
    :title="detailTitle"
    :price-text="detailPriceText"
    :description="detailDescription"
    :image-list="detailImageList"
    :accent="ItemDetailAccent.KTV"
    @close="closeDetail"
  />
</template>

<script setup>
import { ref } from 'vue';
import ItemDetailSheet from '../../../components/ItemDetailSheet/ItemDetailSheet.vue';
import { useItemPress } from '../../../hooks/item-press.js';
import { ItemDetailAccent } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  currentShop: {
    default: null,
  },
  roomTypeList: {
    default() {
      return [];
    },
  },
  selectedRoomTypeId: {
    default: '',
  },
  formatRoomAmount: {
    default() {
      return '';
    },
  },
});

const emit = defineEmits(['select']);

const detailOpen = ref(false);
const detailTitle = ref('');
const detailPriceText = ref('');
const detailDescription = ref('');
const detailImageList = ref([]);

const { onClick, onTouchStart, onTouchMove, onTouchEnd } = useItemPress({
  onClick(roomType) {
    if (isEmpty(roomType) || isEmpty(roomType.id)) {
      return;
    }
    emit('select', roomType.id);
  },
  onLongPress(roomType) {
    openDetail(roomType);
  },
});

/**
 * 封面背景。用包厢类型的第一张图，没有图片时留给样式里的紫色。
 */
function coverStyle(roomType) {
  if (isEmpty(roomType) || isEmpty(roomType.imageList)) {
    return {};
  }
  const firstRoomTypeImage = roomType.imageList[0];
  if (isEmpty(firstRoomTypeImage) || isEmpty(firstRoomTypeImage.imageUrl)) {
    return {};
  }
  return { backgroundImage: `url("${firstRoomTypeImage.imageUrl}")` };
}

/**
 * 打开包厢详情半屏。
 */
function openDetail(roomType) {
  if (isEmpty(roomType)) {
    return;
  }
  detailTitle.value = isEmpty(roomType.typeName) ? '' : roomType.typeName;
  detailPriceText.value = `¥${props.formatRoomAmount(roomType)}`;
  detailDescription.value = isEmpty(roomType.description) || isEmpty(roomType.description.content) ? '' : roomType.description.content;
  detailImageList.value = isEmpty(roomType.imageList) ? [] : roomType.imageList;
  detailOpen.value = true;
}

/**
 * 关闭详情半屏。
 */
function closeDetail() {
  detailOpen.value = false;
}
</script>

<style scoped>
.section-label {
  margin: 16px 0 8px;
  color: #6b7280;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.empty {
  margin: 24px 0;
  color: #6b7280;
  text-align: center;
}
.rooms {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}
.room {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: #fff;
  -webkit-user-select: none;
  user-select: none;
}
.room.picked {
  box-shadow: 0 0 0 2px #6d28d9;
}
.cover {
  height: 72px;
  border-radius: 12px;
  background-color: #6d28d9;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
.room h2 {
  margin: 0;
  font-size: 16px;
}
.price-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 8px;
}
.price-line strong {
  color: #6d28d9;
  font-variant-numeric: tabular-nums;
  font-size: 18px;
}
</style>
