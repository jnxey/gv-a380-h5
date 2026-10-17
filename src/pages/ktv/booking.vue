<template>
  <div class="page">
    <div class="card">
      <div class="field">门店：{{ currentShopName }}</div>
      <label class="field">
        包厢类型：
        <select :value="String(roomTypeIndex)" @change="onRoomTypeChange">
          <option v-if="roomTypeNameList.length === 0" value="0">请选择</option>
          <option
            v-for="(roomTypeName, roomTypeOptionIndex) in roomTypeNameList"
            :key="roomTypeOptionIndex"
            :value="String(roomTypeOptionIndex)"
          >
            {{ roomTypeName }}
          </option>
        </select>
      </label>
      <label class="field">
        开唱：
        <select :value="String(slotIndex)" @change="onSlotChange">
          <option v-if="slotLabelList.length === 0" value="0">请选择</option>
          <option
            v-for="(slotLabel, slotOptionIndex) in slotLabelList"
            :key="slotOptionIndex"
            :value="String(slotOptionIndex)"
          >
            {{ slotLabel }}
          </option>
        </select>
      </label>
      <input class="field" type="number" v-model="durationHours" placeholder="唱几小时" />
      <div class="price" v-if="currentBookingAmount !== ''">包厢费 {{ currentBookingAmount }} 元，提交后立即扣余额</div>
      <button class="submit-button" type="button" @click="submitBooking">提交预订</button>
    </div>
    <div class="section-title">我的订单</div>
    <div v-for="order in orderList" :key="order.bookingOrderId" class="order-row">
      <span class="order-title">{{ order.roomTypeName }} {{ order.bookingDate }}</span>
      <span v-if="isEmpty(order.roomName) !== true" class="order-sub">包厢 {{ order.roomName }}</span>
      <span class="order-sub">{{ order.startTime }} - {{ formatBookingEnd(order) }} {{ order.durationHours }}小时 {{ statusLabel(order.orderStatus) }}</span>
      <span class="order-sub">核销码 {{ order.verifyCode }} 金额 {{ order.amount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { request } from '../../utils/request.js';
import { BookingShopQuery, KtvBookingHour, KtvBookingSlot, PageSetting, ShopType, statusLabel } from '../../utils/constants.js';
import { showToast } from '../../utils/toast.js';
import { isEmpty } from '../../utils/tools.js';

const currentRoute = useRoute();
const shopCode = ref('');
const currentShop = ref(null);
const roomTypeList = ref([]);
const roomTypeIndex = ref(0);
const slotList = ref([]);
const slotIndex = ref(0);
const durationHours = ref('');
const orderList = ref([]);

/**
 * 包厢类型名称列表。
 */
const roomTypeNameList = computed(() => {
  return roomTypeList.value.map((roomType) => `${roomType.typeName} ${roomType.hourlyPrice}元`);
});

/**
 * 当前锁定门店的名称。
 */
const currentShopName = computed(() => {
  return isEmpty(currentShop.value) ? '' : currentShop.value.shopName;
});

/**
 * 开唱刻度的展示文字。
 */
const slotLabelList = computed(() => {
  return slotList.value.map((slot) => slot.label);
});

/**
 * 当前预订金额。小时数不合法时不显示。
 */
const currentBookingAmount = computed(() => {
  const roomType = roomTypeList.value[roomTypeIndex.value];
  const durationHourCount = Number(durationHours.value);
  if (isEmpty(roomType) || Number.isInteger(durationHourCount) !== true || durationHourCount < KtvBookingHour.MIN || durationHourCount > KtvBookingHour.MAX) {
    return '';
  }
  return (Number(roomType.hourlyPrice) * durationHourCount).toFixed(2);
});

/**
 * 从路由路径读取门店编号。本页只服务这一家门店。
 */
function readShopCode() {
  if (isEmpty(currentRoute.params)) {
    shopCode.value = '';
    return;
  }
  const routeShopCode = currentRoute.params[BookingShopQuery.SHOP_CODE];
  shopCode.value = isEmpty(routeShopCode) ? '' : routeShopCode;
}

/**
 * 结束钟点不晚于开唱钟点时，表示已经跨到第二天。
 */
function formatBookingEnd(order) {
  if (isEmpty(order.endTime) || isEmpty(order.startTime)) {
    return '';
  }
  if (order.endTime <= order.startTime) {
    return `次日 ${order.endTime}`;
  }
  return order.endTime;
}

/**
 * 在启用门店列表里按入口门店编号找到对应门店。
 */
function findShopByCode(shopList) {
  if (isEmpty(shopCode.value) || isEmpty(shopList)) {
    return null;
  }
  for (let shopIndex = 0; shopIndex < shopList.length; shopIndex += 1) {
    const shop = shopList[shopIndex];
    if (isEmpty(shop) !== true && shop.shopCode === shopCode.value) {
      return shop;
    }
  }
  return null;
}

/**
 * 按当前门店加载可预订的包厢类型。
 */
async function loadRoomTypes() {
  const shop = currentShop.value;
  if (isEmpty(shop)) {
    roomTypeList.value = [];
    return;
  }
  roomTypeList.value = await request({
    url: '/app/ktv/room-types',
    method: 'GET',
    data: { shopId: shop.shopId },
  });
  roomTypeIndex.value = 0;
}

/**
 * 加载门店、包厢类型和订单。门店由地址中的门店编号锁定。
 */
async function loadPage() {
  // 1. 按门店类型拉取启用门店，再按入口编号锁定一家
  const shopList = await request({
    url: '/app/shops',
    method: 'GET',
    data: { shopType: ShopType.KTV },
  });
  currentShop.value = findShopByCode(shopList);
  if (isEmpty(currentShop.value)) {
    const toastTitle = isEmpty(shopCode.value) ? '缺少门店编号' : '门店不存在';
    showToast(toastTitle);
    roomTypeList.value = [];
  } else {
    await loadRoomTypes();
  }
  // 2. 我的订单与门店编号无关，仍然加载
  const orderPage = await request({
    url: '/app/ktv/booking-orders',
    method: 'GET',
    data: { page: PageSetting.DEFAULT_PAGE, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
  });
  orderList.value = isEmpty(orderPage) ? [] : orderPage.list;
}

/**
 * 选择包厢类型。
 */
function onRoomTypeChange(event) {
  roomTypeIndex.value = Number(event.target.value);
}

/**
 * 格式化成本地日期。
 */
function formatDate(dateTime) {
  const monthText = String(dateTime.getMonth() + 1).padStart(2, '0');
  const dayText = String(dateTime.getDate()).padStart(2, '0');
  return `${dateTime.getFullYear()}-${monthText}-${dayText}`;
}

/**
 * 格式化成本地钟点，秒固定为 0。
 */
function formatClockTime(dateTime) {
  const hourText = String(dateTime.getHours()).padStart(2, '0');
  const minuteText = String(dateTime.getMinutes()).padStart(2, '0');
  return `${hourText}:${minuteText}:00`;
}

/**
 * 从可预约的第一档开唱时间起，生成全部刻度。
 */
function buildSlotList(now) {
  const stepMilliseconds = KtvBookingSlot.STEP_MINUTES * 60 * 1000;
  const leadMilliseconds = KtvBookingSlot.LEAD_MINUTES * 60 * 1000;
  // 1. 正好落在刻度上时，这个刻度已经不大于当前时间，再往后推一档
  let nextSlotTime = Math.ceil(now.getTime() / stepMilliseconds) * stepMilliseconds;
  if (nextSlotTime <= now.getTime()) {
    nextSlotTime += stepMilliseconds;
  }
  // 2. 离下一档不足 15 分钟时，从再下一档开始
  if (nextSlotTime - now.getTime() < leadMilliseconds) {
    nextSlotTime += stepMilliseconds;
  }
  // 3. 连续取出 8 个刻度，跨过当天的显示明天
  const todayText = formatDate(now);
  const builtSlotList = [];
  for (let slotPosition = 0; slotPosition < KtvBookingSlot.COUNT; slotPosition += 1) {
    const slotTime = new Date(nextSlotTime + slotPosition * stepMilliseconds);
    const bookingDate = formatDate(slotTime);
    const startTime = formatClockTime(slotTime);
    const dayLabel = bookingDate === todayText ? '今天' : '明天';
    builtSlotList.push({
      bookingDate,
      startTime,
      slotKey: `${bookingDate} ${startTime}`,
      label: `${dayLabel} ${startTime.slice(0, 5)}`,
    });
  }
  return builtSlotList;
}

/**
 * 按当前时间重算 8 个开唱刻度。原来的选择还在列表里就保留。
 */
function refreshSlots() {
  const previousSlot = slotList.value[slotIndex.value];
  const previousKey = isEmpty(previousSlot) ? '' : previousSlot.slotKey;
  slotList.value = buildSlotList(new Date());
  const matchedIndex = slotList.value.findIndex((slot) => slot.slotKey === previousKey);
  slotIndex.value = matchedIndex >= 0 ? matchedIndex : 0;
}

/**
 * 选择开唱刻度。
 */
function onSlotChange(event) {
  slotIndex.value = Number(event.target.value);
}

/**
 * 提交预订。服务端按包厢类型占名额并扣余额。
 */
async function submitBooking() {
  const shop = currentShop.value;
  const roomType = roomTypeList.value[roomTypeIndex.value];
  const slot = slotList.value[slotIndex.value];
  const durationHourCount = Number(durationHours.value);
  if (isEmpty(shop) || isEmpty(roomType) || isEmpty(slot)) {
    showToast('请完整填写预订信息');
    return;
  }
  if (Number.isInteger(durationHourCount) !== true || durationHourCount < KtvBookingHour.MIN || durationHourCount > KtvBookingHour.MAX) {
    showToast('演唱小时数必须在1到24之间');
    return;
  }
  await request({
    url: '/app/ktv/booking-orders',
    method: 'POST',
    data: {
      shopId: shop.shopId,
      roomTypeId: roomType.id,
      bookingDate: slot.bookingDate,
      startTime: slot.startTime,
      durationHours: durationHourCount,
    },
  });
  showToast('预订成功');
  await loadPage();
}

/**
 * 打开页面时记下门店编号，并加载 KTV 门店和我的订单。
 */
onMounted(() => {
  readShopCode();
  refreshSlots();
  loadPage();
});
</script>

<style>
.page {
  padding: 12px;
}
.card,
.order-row {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}
.field,
.price,
.order-title,
.order-sub {
  display: block;
  margin-bottom: 8px;
}
.field select,
.field input {
  width: 100%;
  margin-top: 6px;
  box-sizing: border-box;
}
.section-title {
  font-weight: 600;
  margin: 6px 0;
}
.order-sub {
  color: #6b7280;
}
.submit-button {
  width: 100%;
  border: 0;
  border-radius: 4px;
  background: #1f4b99;
  color: #fff;
  padding: 10px 0;
}
</style>
