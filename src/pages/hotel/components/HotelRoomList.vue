<template>
  <p class="section-label">房型</p>
  <p v-if="isEmpty(currentShop) !== true && isEmpty(roomTypeList)" class="empty">暂无可预订房型</p>
  <ul class="rooms">
    <li
      v-for="roomType in roomTypeList"
      :key="roomType.id"
      class="room"
      :class="{ picked: roomType.id === selectedRoomTypeId }"
      @click="emit('select', roomType.id)"
    >
      <div class="cover" :style="coverStyle(roomType)"></div>
      <div>
        <h2>{{ roomType.typeName }}</h2>
        <div class="price-line">
          <strong>每晚 ¥{{ formatNightlyPrice(roomType) }}</strong>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { isEmpty } from '../../../utils/tools.js';

defineProps({
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
  formatNightlyPrice: {
    default() {
      return '';
    },
  },
});

const emit = defineEmits(['select']);

/**
 * 封面背景。用房型的第一张图，没有图片时留给样式里的绿色。
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
</script>

<style scoped>
.section-label {
  margin: 16px 0 8px;
  color: #5e6b64;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.empty {
  margin: 24px 0;
  color: #5e6b64;
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
  background: #fffdf9;
}
.room.picked {
  box-shadow: 0 0 0 2px #1f8a70;
}
.cover {
  height: 72px;
  border-radius: 12px;
  background-color: #1f8a70;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
.room h2 {
  margin: 0;
  font-size: 16px;
  color: #14241c;
}
.price-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 8px;
}
.price-line strong {
  color: #1f8a70;
  font-variant-numeric: tabular-nums;
  font-size: 18px;
}
</style>
