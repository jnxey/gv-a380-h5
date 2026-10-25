<template>
  <div class="page" :class="{ 'page-with-bar': showBookingBar }">
    <section v-if="bookingStep !== KtvBookingStep.SUCCESS">
      <KtvPullRefresh v-if="bookingStep === KtvBookingStep.LIST" :refreshing="pageRefreshing" @refresh="refreshPage" />
      <KtvStoreHeader :current-shop="currentShop" />
      <div class="panel">
        <KtvContentTabs :selected-content-tab="selectedContentTab" @select="selectContentTab" />
        <template v-if="selectedContentTab === KtvContentTab.BOOKING">
          <KtvDatePicker
            :date-option-list="dateOptionList"
            :selected-booking-date="selectedBookingDate"
            @select="selectBookingDate"
          />
          <KtvDurationPicker :selected-duration-hours="selectedDurationHours" @select="selectDuration" />
          <KtvRoomList
            :current-shop="currentShop"
            :room-type-list="roomTypeList"
            :selected-room-type-id="selectedRoomTypeId"
            :format-room-amount="formatRoomAmount"
            @select="selectRoomType"
          />
        </template>
        <KtvOrderList
          v-if="selectedContentTab === KtvContentTab.ORDER"
          :order-list="orderList"
          :order-page-number="orderPageNumber"
          :order-total="orderTotal"
          :order-page-size="PageSetting.DEFAULT_PAGE_SIZE"
          @change-page="changeOrderPage"
          @refresh-order="refreshClosedOrder"
          @refresh-orders="refreshClosedOrder"
        />
        <ShopReviewList
          v-if="selectedContentTab === KtvContentTab.REVIEW"
          :review-list="reviewList"
          :review-page-number="reviewPageNumber"
          :review-total="reviewTotal"
          :review-page-size="PageSetting.DEFAULT_PAGE_SIZE"
          @change-page="changeReviewPage"
        />
        <KtvShopDetail v-if="selectedContentTab === KtvContentTab.SHOP" :current-shop="currentShop" />
      </div>
      <KtvBookingBar
        v-if="showBookingBar"
        :summary-text="bottomSummaryText"
        :amount-text="bottomAmountText"
        :booking-disabled="isEmpty(selectedRoomType)"
        @open="openForm"
      />
    </section>
    <KtvBookingSheet
      v-if="bookingStep === KtvBookingStep.FORM"
      :selected-room-type="selectedRoomType"
      :form-hint-text="formHintText"
      v-model:guest-name="guestName"
      v-model:contact="bookingContact"
      :arrival-time-label="arrivalTimeLabel"
      :arrival-slot-list="arrivalSlotList"
      :selected-slot-key="selectedSlotKey"
      :leave-time-text="leaveTimeText"
      :amount-text="bottomAmountText"
      :form-error="formError"
      @select-slot="selectArrivalSlot"
      @close="closeForm"
      @submit="submitBooking"
    />
    <KtvBookingSuccess
      v-if="bookingStep === KtvBookingStep.SUCCESS"
      :success-summary="successSummary"
      @again="bookAgain"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { KtvApi } from '../../api/ktv.js';
import { MemberApi } from '../../api/member.js';
import { ShopApi } from '../../api/shop.js';
import { request } from '../../utils/request.js';
import { verifyConsumerDoorLock } from 'gv-sdk';
import KtvBookingBar from './components/KtvBookingBar.vue';
import KtvBookingSheet from './components/KtvBookingSheet.vue';
import KtvBookingSuccess from './components/KtvBookingSuccess.vue';
import KtvContentTabs from './components/KtvContentTabs.vue';
import KtvDatePicker from './components/KtvDatePicker.vue';
import KtvDurationPicker from './components/KtvDurationPicker.vue';
import ShopReviewList from '../../components/ShopReviewList/ShopReviewList.vue';
import KtvOrderList from './components/KtvOrderList.vue';
import KtvPullRefresh from './components/KtvPullRefresh.vue';
import KtvRoomList from './components/KtvRoomList.vue';
import KtvShopDetail from './components/KtvShopDetail.vue';
import KtvStoreHeader from './components/KtvStoreHeader.vue';
import { ShopReviewApi } from '../../api/shop-review.js';
import {
  BookingShopQuery,
  HotelBookingGuest,
  KtvBookingDuration,
  KtvBookingHour,
  KtvBookingSlot,
  KtvBookingStep,
  KtvContentTab,
  KtvDateLabel,
  PageSetting,
  ShopType,
  timeZoneLabel,
} from '../../utils/constants.js';
import { showToast } from '../../utils/toast.js';
import { lockPageScroll, unlockPageScroll } from '../../utils/pageScrollLock.js';
import { isEmpty, nationalContactText } from '../../utils/tools.js';

/**
 * 把门店时区偏移换成分钟。没有偏移时用本机偏移，钟面与当前一致。
 */
function timeZoneOffsetMinutes(timeZoneOffset, now) {
  if (isEmpty(timeZoneOffset)) {
    return -now.getTimezoneOffset();
  }
  const signText = timeZoneOffset.slice(0, 1);
  const hourText = timeZoneOffset.slice(1, 3);
  const minuteText = timeZoneOffset.slice(4, 6);
  const hourCount = Number(hourText);
  const minuteCount = Number(minuteText);
  if (Number.isFinite(hourCount) !== true || Number.isFinite(minuteCount) !== true) {
    return -now.getTimezoneOffset();
  }
  const absoluteMinutes = hourCount * 60 + minuteCount;
  if (signText === '-') {
    return -absoluteMinutes;
  }
  return absoluteMinutes;
}

/**
 * 把当前时刻平移成门店钟面。日期和钟点读 UTC 字段，避免本机时区。
 */
function toShopWallClock(now, timeZoneOffset) {
  const offsetMinutes = timeZoneOffsetMinutes(timeZoneOffset, now);
  const offsetMilliseconds = offsetMinutes * 60 * 1000;
  return new Date(now.getTime() + offsetMilliseconds);
}

/**
 * 到店钟点是否落在营业时间内。开始包含，结束不包含。结束早于开始时按跨天算。没有营业时间时整天可约。
 */
function isInsideBusinessHours(startTime, businessHours) {
  if (isEmpty(businessHours) || isEmpty(businessHours.startTime) || isEmpty(businessHours.endTime)) {
    return true;
  }
  const clockText = startTime.slice(0, 5);
  // 1. 当天营业：落在 [开始, 结束)
  if (businessHours.endTime > businessHours.startTime) {
    if (clockText < businessHours.startTime) {
      return false;
    }
    if (clockText >= businessHours.endTime) {
      return false;
    }
    return true;
  }
  // 2. 跨天营业：落在 [开始, 24:00) 或 [00:00, 结束)
  if (clockText >= businessHours.startTime) {
    return true;
  }
  if (clockText < businessHours.endTime) {
    return true;
  }
  return false;
}

/**
 * 格式化成门店钟面日期。入参须是平移后的钟面时间。
 */
function formatDate(dateTime) {
  const monthText = String(dateTime.getUTCMonth() + 1).padStart(2, '0');
  const dayText = String(dateTime.getUTCDate()).padStart(2, '0');
  return `${dateTime.getUTCFullYear()}-${monthText}-${dayText}`;
}

/**
 * 格式化成门店钟点，秒固定为 0。入参须是平移后的钟面时间。
 */
function formatClockTime(dateTime) {
  const hourText = String(dateTime.getUTCHours()).padStart(2, '0');
  const minuteText = String(dateTime.getUTCMinutes()).padStart(2, '0');
  return `${hourText}:${minuteText}:00`;
}

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
const guestName = ref('');
const bookingContact = ref('');
const formError = ref('');
const bookingSubmitting = ref(false);
const bookingStep = ref(KtvBookingStep.LIST);
const selectedContentTab = ref(KtvContentTab.BOOKING);
const successSummary = ref(null);
const orderList = ref([]);
const orderPageNumber = ref(PageSetting.DEFAULT_PAGE);
const orderTotal = ref(0);
const reviewList = ref([]);
const reviewPageNumber = ref(PageSetting.DEFAULT_PAGE);
const reviewTotal = ref(0);
const pageRefreshing = ref(false);

/**
 * 底部预约栏只在预定 Tab，并且还没进入成功页时出现。
 */
const showBookingBar = computed(() => {
  if (bookingStep.value === KtvBookingStep.SUCCESS) {
    return false;
  }
  return selectedContentTab.value === KtvContentTab.BOOKING;
});

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
 * 日期按钮固定近 5 天。今天、明天单独标，后面三天标星期。日期按门店时区。
 */
const dateOptionList = computed(() => {
  const now = slotBaseTime.value;
  const timeZoneOffset = isEmpty(currentShop.value) ? '' : currentShop.value.timeZone;
  const shopNow = toShopWallClock(now, timeZoneOffset);
  const todayStart = new Date(Date.UTC(shopNow.getUTCFullYear(), shopNow.getUTCMonth(), shopNow.getUTCDate()));
  const dateList = [];
  for (let dayOffset = 0; dayOffset < KtvBookingSlot.DAY_COUNT; dayOffset += 1) {
    const dateTime = new Date(todayStart.getTime());
    dateTime.setUTCDate(todayStart.getUTCDate() + dayOffset);
    const bookingDate = formatDate(dateTime);
    let dayLabel = KtvDateLabel.WEEKDAY_LIST[dateTime.getUTCDay()];
    if (dayOffset === 0) {
      dayLabel = KtvDateLabel.TODAY;
    } else if (dayOffset === 1) {
      dayLabel = KtvDateLabel.TOMORROW;
    }
    dateList.push({
      bookingDate,
      dayLabel,
      dayNumber: dateTime.getUTCDate(),
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
 * 到店时间标签。有门店时区时附在后面。
 */
const arrivalTimeLabel = computed(() => {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.timeZone)) {
    return '到店时间';
  }
  return `到店时间 · ${timeZoneLabel(currentShop.value.timeZone)}`;
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
    url: KtvApi.ROOM_TYPES,
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
    url: ShopApi.LIST,
    method: 'GET',
    data: { shopType: ShopType.KTV },
  });
  currentShop.value = findShopByCode(shopList);
  refreshSlots();
  if (isEmpty(currentShop.value)) {
    const toastTitle = isEmpty(shopCode.value) ? '缺少门店编号' : '门店不存在';
    showToast(toastTitle);
    roomTypeList.value = [];
    selectedRoomTypeId.value = '';
  } else {
    await loadRoomTypes();
  }
  // 2. 我的订单与门店编号无关，仍然从第 1 页加载
  await loadMemberOrders(PageSetting.DEFAULT_PAGE);
  // 3. 用已绑定会员的昵称和联系方式预填，已手改过的不覆盖
  await loadMemberProfile();
}

/**
 * 用会员资料预填预定人和联系方式。手机号带 +86 时去掉区号。请求失败时留空，仍可手填。
 */
async function loadMemberProfile() {
  let memberSummary = null;
  try {
    memberSummary = await request({ url: MemberApi.SUMMARY, method: 'GET' });
  } catch {
    return;
  }
  if (isEmpty(memberSummary)) {
    return;
  }
  if (isEmpty(guestName.value) && isEmpty(memberSummary.nickname) !== true) {
    guestName.value = memberSummary.nickname;
  }
  if (isEmpty(bookingContact.value) && isEmpty(memberSummary.contact) !== true) {
    bookingContact.value = nationalContactText(memberSummary.contact);
  }
}

/**
 * 下拉松开后刷新整页。门店、时段、包厢和订单都重新加载。
 */
async function refreshPage() {
  if (pageRefreshing.value === true) {
    return;
  }
  pageRefreshing.value = true;
  try {
    await loadPage();
  } finally {
    pageRefreshing.value = false;
  }
}

/**
 * 按页查询当前会员的预订订单。
 */
async function loadMemberOrders(pageNumber) {
  const orderPage = await request({
    url: KtvApi.BOOKING_ORDERS,
    method: 'GET',
    data: { page: pageNumber, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
  });
  orderPageNumber.value = pageNumber;
  if (isEmpty(orderPage)) {
    orderList.value = [];
    orderTotal.value = 0;
    return;
  }
  orderList.value = isEmpty(orderPage.list) ? [] : orderPage.list;
  orderTotal.value = orderPage.total;
}

/**
 * 切换订单页。
 */
async function changeOrderPage(pageNumber) {
  await loadMemberOrders(pageNumber);
}

/**
 * 关掉核销码弹窗后，按当前页重新拉取订单。
 */
async function refreshClosedOrder() {
  await loadMemberOrders(orderPageNumber.value);
}

/**
 * 生成近 5 天可预约的半小时刻度。今天只留剩余刻度，后四天是全天，再按营业时间过滤。
 */
function buildSlotList(now, timeZoneOffset, businessHours) {
  const shopNow = toShopWallClock(now, timeZoneOffset);
  const stepMilliseconds = KtvBookingSlot.STEP_MINUTES * 60 * 1000;
  const leadMilliseconds = KtvBookingSlot.LEAD_MINUTES * 60 * 1000;
  const minutesPerDay = 24 * 60;
  const slotsPerDay = minutesPerDay / KtvBookingSlot.STEP_MINUTES;
  // 1. 正好落在刻度上时，这个刻度已经不大于当前时间，再往后推一档
  let nextSlotTime = Math.ceil(shopNow.getTime() / stepMilliseconds) * stepMilliseconds;
  if (nextSlotTime <= shopNow.getTime()) {
    nextSlotTime += stepMilliseconds;
  }
  // 2. 离下一档不足 15 分钟时，从再下一档开始
  if (nextSlotTime - shopNow.getTime() < leadMilliseconds) {
    nextSlotTime += stepMilliseconds;
  }
  const todayText = formatDate(shopNow);
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
  const todayStart = new Date(Date.UTC(shopNow.getUTCFullYear(), shopNow.getUTCMonth(), shopNow.getUTCDate()));
  for (let dayOffset = 1; dayOffset < KtvBookingSlot.DAY_COUNT; dayOffset += 1) {
    const dayStart = new Date(todayStart.getTime());
    dayStart.setUTCDate(todayStart.getUTCDate() + dayOffset);
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
  // 5. 只留营业时间内的到店刻度。没有营业时间时整天都保留
  const openSlotList = [];
  for (let builtIndex = 0; builtIndex < builtSlotList.length; builtIndex += 1) {
    const builtSlot = builtSlotList[builtIndex];
    if (isInsideBusinessHours(builtSlot.startTime, businessHours)) {
      openSlotList.push(builtSlot);
    }
  }
  return openSlotList;
}

/**
 * 按当前时间和门店时区重算近 5 天的开唱刻度。
 */
function refreshSlots() {
  slotBaseTime.value = new Date();
  const timeZoneOffset = isEmpty(currentShop.value) ? '' : currentShop.value.timeZone;
  const businessHours = isEmpty(currentShop.value) ? null : currentShop.value.businessHours;
  slotList.value = buildSlotList(slotBaseTime.value, timeZoneOffset, businessHours);
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
 * 按页查询当前门店评价。
 */
async function loadShopReviews(pageNumber) {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.shopId)) {
    reviewList.value = [];
    reviewTotal.value = 0;
    reviewPageNumber.value = pageNumber;
    return;
  }
  const reviewPage = await request({
    url: ShopReviewApi.REVIEWS,
    method: 'GET',
    data: {
      shopId: currentShop.value.shopId,
      page: pageNumber,
      pageSize: PageSetting.DEFAULT_PAGE_SIZE,
    },
  });
  reviewPageNumber.value = pageNumber;
  if (isEmpty(reviewPage)) {
    reviewList.value = [];
    reviewTotal.value = 0;
    return;
  }
  reviewList.value = isEmpty(reviewPage.list) ? [] : reviewPage.list;
  reviewTotal.value = reviewPage.total;
}

/**
 * 切换评价页。
 */
async function changeReviewPage(pageNumber) {
  await loadShopReviews(pageNumber);
}

/**
 * 切换内容区 Tab。进入订单或评价时重新拉取当前页。
 */
async function selectContentTab(contentTab) {
  selectedContentTab.value = contentTab;
  if (contentTab === KtvContentTab.ORDER) {
    await loadMemberOrders(orderPageNumber.value);
  }
  if (contentTab === KtvContentTab.REVIEW) {
    await loadShopReviews(PageSetting.DEFAULT_PAGE);
  }
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
 * 选择包厢类型。再次点击已选中的类型时取消选中。
 */
function selectRoomType(roomTypeId) {
  if (selectedRoomTypeId.value === roomTypeId) {
    selectedRoomTypeId.value = '';
    return;
  }
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
 * 提交预订。先核对预定人和联系方式，再校验安全密钥，并提交门店、包厢类型、开唱时间和时长。
 */
async function submitBooking() {
  if (bookingSubmitting.value) {
    return;
  }
  const shop = currentShop.value;
  const roomType = selectedRoomType.value;
  const slot = selectedArrivalSlot.value;
  const durationHourCount = selectedDurationHours.value;
  const guestNameText = isEmpty(guestName.value) ? '' : guestName.value.trim();
  const contactText = isEmpty(bookingContact.value) ? '' : bookingContact.value.trim();
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
  if (isEmpty(guestNameText) || isEmpty(contactText)) {
    formError.value = '请填写预定人和联系方式';
    return;
  }
  if (guestNameText.length > HotelBookingGuest.NAME_MAX_LENGTH || contactText.length > HotelBookingGuest.CONTACT_MAX_LENGTH) {
    formError.value = '预定人或联系方式过长';
    return;
  }
  bookingSubmitting.value = true;
  try {
    // 2. 弹出安全密钥。取消或没拿到密文时不下单
    let securityKeyCipherText = '';
    try {
      securityKeyCipherText = await verifyConsumerDoorLock();
    } catch {
      return;
    }
    if (isEmpty(securityKeyCipherText)) {
      return;
    }
    // 3. 提交体带上门店、包厢类型、开唱时间、时长、预定人、联系方式和安全密钥密文
    const createdOrder = await request({
      url: KtvApi.BOOKING_ORDERS,
      method: 'POST',
      data: {
        shopId: shop.shopId,
        roomTypeId: roomType.id,
        bookingDate: slot.bookingDate,
        startTime: slot.startTime,
        durationHours: durationHourCount,
        guestName: guestNameText,
        contact: contactText,
        cipherText: securityKeyCipherText,
      },
    });
    // 4. 成功后记下接口返回的单号、核销码和金额
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
  } finally {
    bookingSubmitting.value = false;
  }
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
 * 确认预约打开时锁住底页滚动，离开后恢复。
 */
function syncPageScrollLock() {
  if (bookingStep.value === KtvBookingStep.FORM) {
    lockPageScroll();
    return;
  }
  unlockPageScroll();
}

/**
 * 打开页面时记下门店编号，并加载 KTV 门店和我的订单。
 */
onMounted(() => {
  reloadForShopCode();
});

onUnmounted(() => {
  unlockPageScroll();
});

watch(bookingStep, () => {
  syncPageScrollLock();
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
  padding-bottom: calc(88px + var(--gv-safe-bottom, 0px));
}
.panel {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  margin-top: -18px;
  padding: 24px 16px 8px;
  border-radius: 18px 18px 0 0;
  background: #f5f6f8;
}
</style>
