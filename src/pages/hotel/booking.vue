<template>
  <div class="page">
    <div class="card">
      <div class="field">酒店：{{ currentShopName }}</div>
      <label class="field">
        房型：
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
        入住：
        <input type="date" :value="checkInDate" @change="onCheckInChange" />
      </label>
      <label class="field">
        离店：
        <input type="date" :value="checkOutDate" @change="onCheckOutChange" />
      </label>
      <div class="price" v-if="currentRoomTypePrice !== ''">每晚 {{ currentRoomTypePrice }} 元，预订不扣款，退房时结算</div>
      <button class="submit-button" type="button" @click="submitBooking">提交预订</button>
    </div>
    <div class="section-title">我的订单</div>
    <div v-for="order in orderList" :key="order.bookingOrderId" class="order-row">
      <span class="order-title">{{ order.typeName }} {{ statusLabel(order.orderStatus) }}</span>
      <span class="order-sub">{{ order.checkInDate }} 至 {{ order.checkOutDate }}</span>
      <span class="order-sub">房费 {{ order.amount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { request } from '../../utils/request.js';
import { BookingShopQuery, PageSetting, ShopType, statusLabel } from '../../utils/constants.js';
import { showToast } from '../../utils/toast.js';
import { isEmpty } from '../../utils/tools.js';

const currentRoute = useRoute();
const shopCode = ref('');
const currentShop = ref(null);
const roomTypeList = ref([]);
const roomTypeIndex = ref(0);
const checkInDate = ref('');
const checkOutDate = ref('');
const orderList = ref([]);

/**
 * 房型名称列表。
 */
const roomTypeNameList = computed(() => {
  return roomTypeList.value.map((roomType) => `${roomType.typeName} ${roomType.price}元`);
});

/**
 * 当前锁定酒店的名称。
 */
const currentShopName = computed(() => {
  return isEmpty(currentShop.value) ? '' : currentShop.value.shopName;
});

/**
 * 当前房型每晚价格。
 */
const currentRoomTypePrice = computed(() => {
  const roomType = roomTypeList.value[roomTypeIndex.value];
  return isEmpty(roomType) ? '' : roomType.price;
});

/**
 * 从路由路径读取门店编号。本页只服务这一家酒店。
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
 * 在启用门店列表里按入口门店编号找到对应酒店。
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
 * 加载当前酒店可售房型。
 */
async function loadRoomTypes() {
  const shop = currentShop.value;
  if (isEmpty(shop)) {
    roomTypeList.value = [];
    return;
  }
  roomTypeList.value = await request({
    url: '/app/hotel/room-types',
    method: 'GET',
    data: { shopId: shop.shopId },
  });
  roomTypeIndex.value = 0;
}

/**
 * 加载酒店、房型和订单。酒店由地址中的门店编号锁定。
 */
async function loadPage() {
  // 1. 按门店类型拉取启用酒店，再按入口编号锁定一家
  const shopList = await request({
    url: '/app/shops',
    method: 'GET',
    data: { shopType: ShopType.HOTEL },
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
    url: '/app/hotel/booking-orders',
    method: 'GET',
    data: { page: PageSetting.DEFAULT_PAGE, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
  });
  orderList.value = isEmpty(orderPage) ? [] : orderPage.list;
}

/**
 * 选择房型。
 */
function onRoomTypeChange(event) {
  roomTypeIndex.value = Number(event.target.value);
}

/**
 * 选择入住日期。
 */
function onCheckInChange(event) {
  checkInDate.value = event.target.value;
}

/**
 * 选择离店日期。
 */
function onCheckOutChange(event) {
  checkOutDate.value = event.target.value;
}

/**
 * 提交预订。此时不扣会员余额。
 */
async function submitBooking() {
  const shop = currentShop.value;
  const roomType = roomTypeList.value[roomTypeIndex.value];
  if (isEmpty(shop) || isEmpty(roomType) || isEmpty(checkInDate.value) || isEmpty(checkOutDate.value)) {
    showToast('请完整填写预订信息');
    return;
  }
  await request({
    url: '/app/hotel/booking-orders',
    method: 'POST',
    data: {
      shopId: shop.shopId,
      roomTypeId: roomType.id,
      checkInDate: checkInDate.value,
      checkOutDate: checkOutDate.value,
    },
  });
  showToast('预订成功');
  await loadPage();
}

/**
 * 打开页面时记下门店编号，并加载酒店和我的订单。
 */
onMounted(() => {
  readShopCode();
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
