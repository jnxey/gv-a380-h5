<template>
  <div class="page" :class="{ 'page-with-bar': bookingStep !== KtvBookingStep.SUCCESS }">
    <section v-if="bookingStep !== KtvBookingStep.SUCCESS">
      <header v-if="isEmpty(currentShop) !== true" class="store">
        <div v-if="isEmpty(storeCoverImageUrl) !== true" class="store-photo" :style="storeCoverStyle"></div>
        <div v-if="isEmpty(storeCoverImageUrl) !== true" class="store-mask"></div>
        <div class="store-body">
          <h1>{{ currentShop.shopName }}</h1>
          <p v-if="isEmpty(businessHoursText) !== true" class="meta">{{ businessHoursText }}</p>
          <p v-if="isEmpty(shopAddressText) !== true" class="meta">{{ shopAddressText }}</p>
          <p v-if="isEmpty(shopPhoneText) !== true" class="meta">{{ shopPhoneText }}</p>
        </div>
      </header>

      <div class="panel">
        <div class="dates">
          <button
            v-for="dateOption in dateOptionList"
            :key="dateOption.bookingDate"
            type="button"
            :class="{ active: dateOption.bookingDate === selectedBookingDate }"
            @click="selectBookingDate(dateOption.bookingDate)"
          >
            <span class="weekday">{{ dateOption.dayLabel }}</span>
            <strong>{{ dateOption.dayNumber }}</strong>
          </button>
        </div>

        <p class="section-label">欢唱时长</p>
        <div class="chips">
          <button
            v-for="hourCount in KtvBookingDuration.HOUR_LIST"
            :key="hourCount"
            type="button"
            :class="{ active: hourCount === selectedDurationHours }"
            @click="selectDuration(hourCount)"
          >
            {{ hourCount }} 小时
          </button>
        </div>

        <p class="section-label">包厢</p>
        <p v-if="isEmpty(currentShop) !== true && isEmpty(roomTypeList)" class="empty">暂无可预订包厢</p>
        <ul class="rooms">
          <li
            v-for="roomType in roomTypeList"
            :key="roomType.id"
            class="room"
            :class="{ picked: roomType.id === selectedRoomTypeId }"
            @click="selectRoomType(roomType.id)"
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

        <p class="section-label">我的订单</p>
        <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
        <div v-for="order in orderList" :key="order.id" class="order-row">
          <span class="order-title">{{ order.orderNo }} {{ statusLabel(order.orderStatus) }}</span>
          <span class="order-sub">{{ order.bookingDate }} {{ order.startTime }} - {{ formatBookingEnd(order) }}</span>
          <span class="order-sub">{{ order.durationHours }}小时 ¥{{ order.amount }} 核销码 {{ order.verifyCode }}</span>
        </div>
      </div>

      <div class="bar">
        <div>
          <p>{{ bottomSummaryText }}</p>
          <strong v-if="isEmpty(selectedRoomType) !== true">{{ bottomAmountText }}</strong>
        </div>
        <button class="book" type="button" :disabled="isEmpty(selectedRoomType)" @click="openForm">去预约</button>
      </div>
    </section>

    <div v-if="bookingStep === KtvBookingStep.FORM" class="mask" @click="closeForm"></div>
    <section v-if="bookingStep === KtvBookingStep.FORM && isEmpty(selectedRoomType) !== true" class="sheet">
      <div class="handle"></div>
      <h2>{{ selectedRoomType.typeName }}</h2>
      <p class="hint">{{ formHintText }}</p>
      <label>到店时间</label>
      <div class="slots">
        <button
          v-for="slot in arrivalSlotList"
          :key="slot.slotKey"
          type="button"
          :class="{ active: slot.slotKey === selectedSlotKey }"
          @click="selectArrivalSlot(slot.slotKey)"
        >
          {{ formatStartClock(slot) }}
        </button>
      </div>
      <p v-if="isEmpty(arrivalSlotList)" class="form-error">当前日期没有可预约时间</p>
      <label>离店时间</label>
      <p class="leave-time">{{ leaveTimeText }}</p>
      <p v-if="isEmpty(formError) !== true" class="form-error">{{ formError }}</p>
      <div class="actions">
        <button class="ghost" type="button" @click="closeForm">返回</button>
        <button class="solid" type="button" @click="submitBooking">确认预约</button>
      </div>
    </section>

    <section v-if="bookingStep === KtvBookingStep.SUCCESS && isEmpty(successSummary) !== true" class="success">
      <div class="badge">✓</div>
      <h1>预约已提交</h1>
      <p class="order-no">单号 {{ successSummary.orderNo }}</p>
      <div class="summary">
        <div>核销码 {{ successSummary.verifyCode }}</div>
        <div>{{ successSummary.shopName }} · {{ successSummary.roomTypeName }}</div>
        <div>{{ successSummary.bookingDate }} {{ successSummary.arrivalLabel }}</div>
        <div>¥{{ successSummary.amount }}</div>
      </div>
      <button type="button" @click="bookAgain">再约一间</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import largeCover from '../../assets/ktv/ktv-large.jpg';
import mediumCover from '../../assets/ktv/ktv-medium.jpg';
import smallCover from '../../assets/ktv/ktv-small.jpg';
import vipCover from '../../assets/ktv/ktv-vip.jpg';
import { request } from '../../utils/request.js';
import {
  BookingShopQuery,
  KtvBookingDuration,
  KtvBookingHour,
  KtvBookingSlot,
  KtvBookingStep,
  KtvDateLabel,
  KtvRoomCoverName,
  PageSetting,
  ShopType,
  statusLabel,
} from '../../utils/constants.js';
import { showToast } from '../../utils/toast.js';
import { isEmpty } from '../../utils/tools.js';

const currentRoute = useRoute();
const shopCode = ref('');
const currentShop = ref(null);
const roomTypeList = ref([]);
const selectedRoomTypeId = ref('');
const slotList = ref([]);
const slotBaseTime = ref(new Date());
const selectedBookingDate = ref('');
const selectedDurationHours = ref(KtvBookingDuration.DEFAULT_HOURS);
const selectedSlotKey = ref('');
const formError = ref('');
const bookingStep = ref(KtvBookingStep.LIST);
const successSummary = ref(null);
const orderList = ref([]);

/**
 * 当前选中的包厢类型。没点过卡片时为空。
 */
const selectedRoomType = computed(() => {
  if (isEmpty(selectedRoomTypeId.value)) {
    return null;
  }
  for (let roomTypeIndex = 0; roomTypeIndex < roomTypeList.value.length; roomTypeIndex += 1) {
    const roomType = roomTypeList.value[roomTypeIndex];
    if (isEmpty(roomType) !== true && roomType.id === selectedRoomTypeId.value) {
      return roomType;
    }
  }
  return null;
});

/**
 * 门店图库第一张。没有图片时 Header 继续用紫色渐变。
 */
const storeCoverImageUrl = computed(() => {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.imageList)) {
    return '';
  }
  const firstShopImage = currentShop.value.imageList[0];
  if (isEmpty(firstShopImage) || isEmpty(firstShopImage.imageUrl)) {
    return '';
  }
  return firstShopImage.imageUrl;
});

/**
 * 磨砂背景使用的封面图。
 */
const storeCoverStyle = computed(() => {
  if (isEmpty(storeCoverImageUrl.value)) {
    return {};
  }
  return { backgroundImage: `url("${storeCoverImageUrl.value}")` };
});

/**
 * 营业时间。开始和结束都空时不显示。
 */
const businessHoursText = computed(() => {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.businessHours)) {
    return '';
  }
  const startTime = currentShop.value.businessHours.startTime;
  const endTime = currentShop.value.businessHours.endTime;
  if (isEmpty(startTime) && isEmpty(endTime)) {
    return '';
  }
  return `营业时间 ${startTime} - ${endTime}`;
});

/**
 * 门店地址。没有地址时不显示。
 */
const shopAddressText = computed(() => {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.address)) {
    return '';
  }
  return currentShop.value.address;
});

/**
 * 门店电话。没有电话时不显示。
 */
const shopPhoneText = computed(() => {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.contactPhone)) {
    return '';
  }
  return currentShop.value.contactPhone;
});

/**
 * 日期按钮固定近 5 天。今天、明天单独标，后面三天标星期。
 */
const dateOptionList = computed(() => {
  const now = slotBaseTime.value;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateList = [];
  for (let dayOffset = 0; dayOffset < KtvBookingSlot.DAY_COUNT; dayOffset += 1) {
    const dateTime = new Date(todayStart.getTime());
    dateTime.setDate(todayStart.getDate() + dayOffset);
    const bookingDate = formatDate(dateTime);
    let dayLabel = KtvDateLabel.WEEKDAY_LIST[dateTime.getDay()];
    if (dayOffset === 0) {
      dayLabel = KtvDateLabel.TODAY;
    } else if (dayOffset === 1) {
      dayLabel = KtvDateLabel.TOMORROW;
    }
    dateList.push({
      bookingDate,
      dayLabel,
      dayNumber: dateTime.getDate(),
    });
  }
  return dateList;
});

/**
 * 所选日期上全部已经可预约的半小时刻度。
 */
const arrivalSlotList = computed(() => {
  if (isEmpty(selectedBookingDate.value)) {
    return [];
  }
  const arrivalList = [];
  for (let slotIndex = 0; slotIndex < slotList.value.length; slotIndex += 1) {
    const slot = slotList.value[slotIndex];
    if (slot.bookingDate === selectedBookingDate.value) {
      arrivalList.push(slot);
    }
  }
  return arrivalList;
});

/**
 * 当前选中进店刻度对应的离店钟点。跨过零点时标成次日。
 */
const leaveTimeText = computed(() => {
  if (isEmpty(selectedArrivalSlot.value)) {
    return '';
  }
  return formatLeaveTime(selectedArrivalSlot.value);
});

/**
 * 当前选中的到店刻度。
 */
const selectedArrivalSlot = computed(() => {
  for (let slotIndex = 0; slotIndex < arrivalSlotList.value.length; slotIndex += 1) {
    const slot = arrivalSlotList.value[slotIndex];
    if (slot.slotKey === selectedSlotKey.value) {
      return slot;
    }
  }
  return null;
});

/**
 * 底部栏左侧的类型和时长。没选类型时提示去选。
 */
const bottomSummaryText = computed(() => {
  if (isEmpty(selectedRoomType.value)) {
    return '请选择包厢';
  }
  return `${selectedRoomType.value.typeName} · ${selectedDurationHours.value}小时`;
});

/**
 * 底部金额。按包厢小时价乘时长。
 */
const bottomAmountText = computed(() => {
  if (isEmpty(selectedRoomType.value)) {
    return '';
  }
  return `¥${formatRoomAmount(selectedRoomType.value)}`;
});

/**
 * 弹层副标题：门店、日期、时长和金额。
 */
const formHintText = computed(() => {
  if (isEmpty(currentShop.value) || isEmpty(selectedRoomType.value)) {
    return '';
  }
  return `${currentShop.value.shopName} · ${selectedBookingDate.value} · ${selectedDurationHours.value} 小时 · ${bottomAmountText.value}`;
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
 * 按类型名挑封面。对不上小包、中包、大包、VIP 时不配图。
 */
function resolveRoomCover(typeName) {
  if (isEmpty(typeName)) {
    return '';
  }
  const upperName = typeName.toUpperCase();
  if (upperName.indexOf(KtvRoomCoverName.VIP) >= 0) {
    return vipCover;
  }
  if (typeName.indexOf(KtvRoomCoverName.LARGE) >= 0) {
    return largeCover;
  }
  if (typeName.indexOf(KtvRoomCoverName.MEDIUM) >= 0) {
    return mediumCover;
  }
  if (typeName.indexOf(KtvRoomCoverName.SMALL) >= 0) {
    return smallCover;
  }
  return '';
}

/**
 * 封面背景。没有对应图片时留给样式里的纯色。
 */
function coverStyle(roomType) {
  const coverUrl = resolveRoomCover(roomType.typeName);
  if (isEmpty(coverUrl)) {
    return {};
  }
  return { backgroundImage: `url("${coverUrl}")` };
}

/**
 * 当前时长下的包厢总价。
 */
function formatRoomAmount(roomType) {
  const amount = Number(roomType.hourlyPrice) * selectedDurationHours.value;
  return amount.toFixed(2);
}

/**
 * 按当前门店加载可预订的包厢类型。
 */
async function loadRoomTypes() {
  const shop = currentShop.value;
  if (isEmpty(shop)) {
    roomTypeList.value = [];
    selectedRoomTypeId.value = '';
    return;
  }
  roomTypeList.value = await request({
    url: '/app/ktv/room-types',
    method: 'GET',
    data: { shopId: shop.shopId },
  });
  if (isEmpty(selectedRoomType.value)) {
    selectedRoomTypeId.value = '';
  }
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
    selectedRoomTypeId.value = '';
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
 * 生成近 5 天可预约的半小时刻度。今天只留剩余刻度，后四天是全天。
 */
function buildSlotList(now) {
  const stepMilliseconds = KtvBookingSlot.STEP_MINUTES * 60 * 1000;
  const leadMilliseconds = KtvBookingSlot.LEAD_MINUTES * 60 * 1000;
  const minutesPerDay = 24 * 60;
  const slotsPerDay = minutesPerDay / KtvBookingSlot.STEP_MINUTES;
  // 1. 正好落在刻度上时，这个刻度已经不大于当前时间，再往后推一档
  let nextSlotTime = Math.ceil(now.getTime() / stepMilliseconds) * stepMilliseconds;
  if (nextSlotTime <= now.getTime()) {
    nextSlotTime += stepMilliseconds;
  }
  // 2. 离下一档不足 15 分钟时，从再下一档开始
  if (nextSlotTime - now.getTime() < leadMilliseconds) {
    nextSlotTime += stepMilliseconds;
  }
  const todayText = formatDate(now);
  const builtSlotList = [];
  // 3. 今天从第一档可用刻度收到当天结束
  let todaySlotTime = nextSlotTime;
  while (formatDate(new Date(todaySlotTime)) === todayText) {
    const slotTime = new Date(todaySlotTime);
    const startTime = formatClockTime(slotTime);
    builtSlotList.push({
      bookingDate: todayText,
      startTime,
      slotKey: `${todayText} ${startTime}`,
    });
    todaySlotTime += stepMilliseconds;
  }
  // 4. 后四天每天从 00:00 到 23:30
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let dayOffset = 1; dayOffset < KtvBookingSlot.DAY_COUNT; dayOffset += 1) {
    const dayStart = new Date(todayStart.getTime());
    dayStart.setDate(todayStart.getDate() + dayOffset);
    for (let slotIndex = 0; slotIndex < slotsPerDay; slotIndex += 1) {
      const slotTime = new Date(dayStart.getTime() + slotIndex * stepMilliseconds);
      const bookingDate = formatDate(slotTime);
      const startTime = formatClockTime(slotTime);
      builtSlotList.push({
        bookingDate,
        startTime,
        slotKey: `${bookingDate} ${startTime}`,
      });
    }
  }
  return builtSlotList;
}

/**
 * 按当前时间重算近 5 天的开唱刻度。
 */
function refreshSlots() {
  slotBaseTime.value = new Date();
  slotList.value = buildSlotList(slotBaseTime.value);
  ensureSelection();
}

/**
 * 日期和时长还在可选范围里就保留，否则回到第一项。
 */
function ensureSelection() {
  const dateStillExists = dateOptionList.value.some((dateOption) => dateOption.bookingDate === selectedBookingDate.value);
  if (dateStillExists !== true && dateOptionList.value.length > 0) {
    selectedBookingDate.value = dateOptionList.value[0].bookingDate;
  }
  const durationStillExists = KtvBookingDuration.HOUR_LIST.some((hourCount) => hourCount === selectedDurationHours.value);
  if (durationStillExists !== true) {
    selectedDurationHours.value = KtvBookingDuration.DEFAULT_HOURS;
  }
}

/**
 * 进店钟点，只保留时和分。
 */
function formatStartClock(slot) {
  return slot.startTime.slice(0, 5);
}

/**
 * 按进店钟点和演唱时长算出离店钟点。唱完不晚于开唱时标成次日。
 */
function formatLeaveTime(slot) {
  const startText = slot.startTime.slice(0, 5);
  const hourValue = Number(slot.startTime.slice(0, 2));
  const minuteValue = Number(slot.startTime.slice(3, 5));
  const totalMinutes = hourValue * 60 + minuteValue + selectedDurationHours.value * 60;
  const minutesPerDay = 24 * 60;
  const endMinutes = totalMinutes % minutesPerDay;
  const endHourText = String(Math.floor(endMinutes / 60)).padStart(2, '0');
  const endMinuteText = String(endMinutes % 60).padStart(2, '0');
  const endText = `${endHourText}:${endMinuteText}`;
  if (endText <= startText) {
    return `次日 ${endText}`;
  }
  return endText;
}

/**
 * 到店时段文字。唱完钟点不晚于开唱钟点时标成次日。
 */
function formatArrivalLabel(slot) {
  const startText = slot.startTime.slice(0, 5);
  const hourValue = Number(slot.startTime.slice(0, 2));
  const minuteValue = Number(slot.startTime.slice(3, 5));
  const totalMinutes = hourValue * 60 + minuteValue + selectedDurationHours.value * 60;
  const minutesPerDay = 24 * 60;
  const endMinutes = totalMinutes % minutesPerDay;
  const endHourText = String(Math.floor(endMinutes / 60)).padStart(2, '0');
  const endMinuteText = String(endMinutes % 60).padStart(2, '0');
  const endText = `${endHourText}:${endMinuteText}`;
  if (endText <= startText) {
    return `${startText}-次日${endText}`;
  }
  return `${startText}-${endText}`;
}

/**
 * 选择日期。
 */
function selectBookingDate(bookingDate) {
  selectedBookingDate.value = bookingDate;
  ensureSelection();
}

/**
 * 选择演唱时长。
 */
function selectDuration(hourCount) {
  selectedDurationHours.value = hourCount;
}

/**
 * 选择包厢类型。
 */
function selectRoomType(roomTypeId) {
  selectedRoomTypeId.value = roomTypeId;
}

/**
 * 选择到店时间。
 */
function selectArrivalSlot(slotKey) {
  selectedSlotKey.value = slotKey;
}

/**
 * 打开预约弹层。到店时间默认落在当天第一档可预约刻度。
 */
function openForm() {
  if (isEmpty(selectedRoomType.value)) {
    return;
  }
  const arrivalStillExists = arrivalSlotList.value.some((slot) => slot.slotKey === selectedSlotKey.value);
  if (arrivalStillExists !== true) {
    selectedSlotKey.value = isEmpty(arrivalSlotList.value) ? '' : arrivalSlotList.value[0].slotKey;
  }
  formError.value = '';
  bookingStep.value = KtvBookingStep.FORM;
}

/**
 * 关闭预约弹层，回到选房。
 */
function closeForm() {
  formError.value = '';
  bookingStep.value = KtvBookingStep.LIST;
}

/**
 * 提交预订。只提交门店、包厢类型、开唱时间和时长。
 */
async function submitBooking() {
  const shop = currentShop.value;
  const roomType = selectedRoomType.value;
  const slot = selectedArrivalSlot.value;
  const durationHourCount = selectedDurationHours.value;
  // 1. 先做本地校验，缺项时停在弹层里
  if (isEmpty(shop) || isEmpty(roomType)) {
    formError.value = '请完整填写预订信息';
    return;
  }
  if (isEmpty(slot)) {
    formError.value = '当前日期没有可预约时间';
    return;
  }
  if (Number.isInteger(durationHourCount) !== true || durationHourCount < KtvBookingHour.MIN || durationHourCount > KtvBookingHour.MAX) {
    formError.value = '演唱小时数必须在1到24之间';
    return;
  }
  // 2. 提交体只带门店、包厢类型、开唱时间和时长
  const createdOrder = await request({
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
  // 3. 成功后记下接口返回的单号、核销码和金额
  const fallbackAmount = formatRoomAmount(roomType);
  successSummary.value = {
    orderNo: isEmpty(createdOrder) ? '' : createdOrder.orderNo,
    verifyCode: isEmpty(createdOrder) ? '' : createdOrder.verifyCode,
    amount: isEmpty(createdOrder) ? fallbackAmount : createdOrder.amount,
    shopName: shop.shopName,
    roomTypeName: roomType.typeName,
    bookingDate: slot.bookingDate,
    arrivalLabel: formatArrivalLabel(slot),
  };
  bookingStep.value = KtvBookingStep.SUCCESS;
}

/**
 * 再约一间时回到选房，并刷新我的订单。
 */
async function bookAgain() {
  bookingStep.value = KtvBookingStep.LIST;
  selectedRoomTypeId.value = '';
  selectedSlotKey.value = '';
  formError.value = '';
  successSummary.value = null;
  refreshSlots();
  await loadPage();
}

/**
 * 地址里的门店编号变了就重新锁定门店。同一页组件会被复用。
 */
function reloadForShopCode() {
  bookingStep.value = KtvBookingStep.LIST;
  successSummary.value = null;
  readShopCode();
  refreshSlots();
  loadPage();
}

/**
 * 打开页面时记下门店编号，并加载 KTV 门店和我的订单。
 */
onMounted(() => {
  reloadForShopCode();
});

watch(
  () => {
    if (isEmpty(currentRoute.params)) {
      return '';
    }
    const routeShopCode = currentRoute.params[BookingShopQuery.SHOP_CODE];
    return isEmpty(routeShopCode) ? '' : routeShopCode;
  },
  (nextShopCode, previousShopCode) => {
    if (nextShopCode === previousShopCode) {
      return;
    }
    reloadForShopCode();
  },
);
</script>

<style scoped>
.page {
  box-sizing: border-box;
  width: min(520px, 100%);
  margin: 0 auto;
  padding: 0;
  color: #111827;
}
.page-with-bar {
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}
.store,
.panel,
.bar,
.sheet,
.room,
.order-row,
.success {
  box-sizing: border-box;
}
.store {
  position: relative;
  overflow: hidden;
  padding: 44px 16px 28px;
  color: #f5f3ff;
  background: linear-gradient(160deg, #6d28d9 0%, #4c1d95 100%);
}
.store-photo {
  position: absolute;
  inset: -20px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(18px);
  transform: scale(1.08);
}
.store-mask {
  position: absolute;
  inset: 0;
  background: rgba(76, 29, 149, 0.55);
}
.store-body {
  position: relative;
}
.store h1 {
  margin: 0;
  font-size: 26px;
  line-height: 1.2;
}
.meta {
  margin: 8px 0 0;
  color: rgba(245, 243, 255, 0.78);
  font-size: 13px;
  line-height: 1.6;
}
.panel {
  position: relative;
  z-index: 1;
  margin-top: -18px;
  padding: 24px 16px 8px;
  border-radius: 18px 18px 0 0;
  background: #f5f6f8;
}
.dates,
.chips {
  display: flex;
  gap: 8px;
}
.chips {
  flex-wrap: wrap;
}
.chips::-webkit-scrollbar {
  display: none;
}
.dates button,
.chips button,
.slots button,
.book,
.actions button,
.success button {
  border: 0;
  font: inherit;
}
.dates button {
  flex: 1 1 0;
  min-width: 0;
  padding: 10px 0 8px;
  border-radius: 14px;
  background: #fff;
  text-align: center;
  color: #111827;
}
.weekday {
  display: block;
  color: #6b7280;
  font-size: 12px;
}
.dates strong {
  display: block;
  margin-top: 2px;
  font-size: 18px;
}
.dates button.active {
  background: #6d28d9;
  color: #fff;
}
.dates button.active .weekday {
  color: rgba(255, 255, 255, 0.72);
}
.section-label {
  margin: 16px 0 8px;
  color: #6b7280;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.chips button,
.slots button {
  padding: 8px 12px;
  border-radius: 999px;
  background: #fff;
  color: #111827;
  font-size: 13px;
}
.slots {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.slots button {
  width: 100%;
  padding: 8px 0;
  background: #ede9fe;
}
.leave-time {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.chips button.active,
.slots button.active {
  background: #6d28d9;
  color: #fff;
}
.rooms {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}
.room {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: #fff;
}
.room.picked {
  border-color: #6d28d9;
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
.price-line strong,
.bar strong {
  color: #6d28d9;
  font-variant-numeric: tabular-nums;
}
.price-line strong {
  font-size: 18px;
}
.empty {
  margin: 24px 0;
  color: #6b7280;
  text-align: center;
}
.bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  box-sizing: border-box;
  width: min(520px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  z-index: 10;
}
.bar p {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
}
.bar strong {
  font-size: 20px;
}
.book {
  border-radius: 999px;
  padding: 12px 22px;
  background: #6d28d9;
  color: #fff;
  font-size: 15px;
}
.book:disabled {
  opacity: 0.4;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(18, 12, 24, 0.46);
  z-index: 20;
}
.sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  box-sizing: border-box;
  width: min(520px, 100%);
  max-height: 88vh;
  overflow: auto;
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
  border-radius: 22px 22px 0 0;
  background: #fff;
  z-index: 21;
}
.handle {
  width: 36px;
  height: 4px;
  margin: 6px auto 12px;
  border-radius: 999px;
  background: #e5e7eb;
}
.sheet h2 {
  margin: 0 0 4px;
  font-size: 18px;
}
.hint {
  margin: 0 0 14px;
  color: #6b7280;
  font-size: 13px;
}
.sheet label {
  display: block;
  margin: 12px 0 6px;
  font-size: 13px;
  color: #6b7280;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.actions button {
  flex: 1;
  padding: 13px;
  border-radius: 999px;
  font-size: 15px;
}
.ghost {
  background: #ede9fe;
  color: #111827;
}
.solid {
  background: #6d28d9;
  color: #fff;
}
.form-error {
  margin: 8px 0 0;
  color: #b45309;
  font-size: 13px;
}
.order-row {
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 8px;
}
.order-title,
.order-sub {
  display: block;
}
.order-sub {
  margin-top: 4px;
  color: #6b7280;
}
.success {
  min-height: 70vh;
  padding: 48px 24px;
  text-align: center;
  background: #fff;
}
.badge {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #eef8f1;
  color: #178a45;
  font-size: 30px;
}
.success h1 {
  margin: 0;
  font-size: 24px;
}
.order-no {
  margin: 8px 0 20px;
  color: #6b7280;
}
.summary {
  margin: 0 auto 24px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f5f6f8;
  text-align: left;
  line-height: 1.8;
}
.success button {
  border-radius: 999px;
  padding: 12px 28px;
  background: #6d28d9;
  color: #fff;
  font-size: 15px;
}
</style>
