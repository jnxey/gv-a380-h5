<template>
  <div class="page" :class="{ 'page-with-bar': showBookingBar }">
    <section v-if="bookingStep !== HotelBookingStep.SUCCESS">
      <PullRefresh
        v-if="bookingStep === HotelBookingStep.LIST"
        :tone="PullRefreshTone.HOTEL"
        :refreshing="pageRefreshing"
        @refresh="refreshPage"
      />
      <HotelStoreHeader :current-shop="currentShop" />
      <div class="panel">
        <HotelContentTabs :selected-content-tab="selectedContentTab" @select="selectContentTab" />
        <template v-if="selectedContentTab === HotelContentTab.BOOKING">
          <HotelDateRange
            :check-in-date="selectedCheckInDate"
            :check-out-date="selectedCheckOutDate"
            :night-count="nightCount"
            :calendar-month-list="calendarMonthList"
            :sheet-open="dateSheetOpen"
            @open="openDateSheet"
            @close="closeDateSheet"
            @confirm="applyStayDates"
          />
          <HotelRoomList
            :current-shop="currentShop"
            :room-type-list="roomTypeList"
            :selected-room-type-id="selectedRoomTypeId"
            :format-nightly-price="formatNightlyPrice"
            @select="selectRoomType"
          />
        </template>
        <HotelOrderList
          v-if="selectedContentTab === HotelContentTab.ORDER"
          :order-list="orderList"
          :order-total="orderTotal"
          :order-loading="orderLoading"
          @load-more="loadMoreOrders"
          @refresh-orders="refreshMemberOrders"
        />
        <ShopReviewList
          v-if="selectedContentTab === HotelContentTab.REVIEW"
          :review-list="reviewList"
          :review-total="reviewTotal"
          :review-loading="reviewLoading"
          :time-zone="isEmpty(currentShop) ? '' : currentShop.timeZone"
          @load-more="loadMoreReviews"
        />
        <HotelShopDetail v-if="selectedContentTab === HotelContentTab.SHOP" :current-shop="currentShop" />
      </div>
      <HotelBookingBar
        v-if="showBookingBar"
        :summary-text="bottomSummaryText"
        :amount-text="bottomAmountText"
        :booking-disabled="isEmpty(selectedRoomType)"
        @open="openForm"
      />
    </section>
    <HotelBookingSheet
      v-if="bookingStep === HotelBookingStep.FORM"
      :selected-room-type="selectedRoomType"
      :form-hint-text="formHintText"
      v-model:guest-name="guestName"
      v-model:contact="bookingContact"
      :check-in-date="selectedCheckInDate"
      :night-count="nightCount"
      :check-out-date="selectedCheckOutDate"
      :amount-text="sheetAmountText"
      :form-error="formError"
      :point-plan="pointPlan"
      :use-point-deduct="usePointDeduct"
      @update:use-point-deduct="usePointDeduct = $event"
      @close="closeForm"
      @submit="submitBooking"
    />
    <HotelBookingSuccess
      v-if="bookingStep === HotelBookingStep.SUCCESS"
      :success-summary="successSummary"
      @again="bookAgain"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { HotelApi } from '../../api/hotel.js';
import { PointApi } from '../../api/point.js';
import { MemberApi } from '../../api/member.js';
import { ShopApi } from '../../api/shop.js';
import { request } from '../../utils/request.js';
import { verifyConsumerDoorLock } from 'gv-sdk';
import HotelBookingBar from './components/HotelBookingBar.vue';
import HotelBookingSheet from './components/HotelBookingSheet.vue';
import HotelBookingSuccess from './components/HotelBookingSuccess.vue';
import HotelContentTabs from './components/HotelContentTabs.vue';
import HotelDateRange from './components/HotelDateRange.vue';
import ShopReviewList from '../../components/ShopReviewList/ShopReviewList.vue';
import HotelOrderList from './components/HotelOrderList.vue';
import PullRefresh from '../../components/PullRefresh/PullRefresh.vue';
import HotelRoomList from './components/HotelRoomList.vue';
import HotelShopDetail from './components/HotelShopDetail.vue';
import HotelStoreHeader from './components/HotelStoreHeader.vue';
import { ShopReviewApi } from '../../api/shop-review.js';
import {
  BookingShopQuery,
  HotelBookingCalendar,
  HotelBookingGuest,
  HotelBookingStep,
  HotelContentTab,
  PageSetting,
  PullRefreshTone,
  RecordStatus,
  ShopType,
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
 * 把当前时刻平移成门店钟面。日期读 UTC 字段，避免本机时区。
 */
function toShopWallClock(now, timeZoneOffset) {
  const offsetMinutes = timeZoneOffsetMinutes(timeZoneOffset, now);
  const offsetMilliseconds = offsetMinutes * 60 * 1000;
  return new Date(now.getTime() + offsetMilliseconds);
}

/**
 * 格式化成门店钟面日期。入参须是平移后的钟面时间。
 */
function formatDate(dateTime) {
  const monthText = String(dateTime.getUTCMonth() + 1).padStart(2, '0');
  const dayText = String(dateTime.getUTCDate()).padStart(2, '0');
  return `${dateTime.getUTCFullYear()}-${monthText}-${dayText}`;
}

const currentRoute = useRoute();
const shopCode = ref('');
const currentShop = ref(null);
const roomTypeList = ref([]);
const selectedRoomTypeId = ref('');
const dateBaseTime = ref(new Date());
const selectedCheckInDate = ref('');
const selectedCheckOutDate = ref('');
const dateSheetOpen = ref(false);
const guestName = ref('');
const bookingContact = ref('');
const pointsBalance = ref(0);
const usePointDeduct = ref(false);
const formError = ref('');
const bookingSubmitting = ref(false);
const bookingStep = ref(HotelBookingStep.LIST);
const selectedContentTab = ref(HotelContentTab.BOOKING);
const successSummary = ref(null);
const orderList = ref([]);
const orderPageNumber = ref(PageSetting.DEFAULT_PAGE);
const orderTotal = ref(0);
const orderLoading = ref(false);
const reviewList = ref([]);
const reviewPageNumber = ref(PageSetting.DEFAULT_PAGE);
const reviewTotal = ref(0);
const reviewLoading = ref(false);
const pageRefreshing = ref(false);

/**
 * 底部预订栏只在预订 Tab，并且还没进入成功页时出现。
 */
const showBookingBar = computed(() => {
  if (bookingStep.value === HotelBookingStep.SUCCESS) {
    return false;
  }
  return selectedContentTab.value === HotelContentTab.BOOKING;
});

/**
 * 当前选中的房型。没点过卡片时为空。
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
 * 门店时区的今天。日历不能选这天之前。
 */
const shopTodayDate = computed(() => {
  const now = dateBaseTime.value;
  const timeZoneOffset = isEmpty(currentShop.value) ? '' : currentShop.value.timeZone;
  const shopNow = toShopWallClock(now, timeZoneOffset);
  const todayStart = new Date(Date.UTC(shopNow.getUTCFullYear(), shopNow.getUTCMonth(), shopNow.getUTCDate()));
  return formatDate(todayStart);
});

/**
 * 从今天起连续 6 个月的日历。今天之前的日期不可选。
 */
const calendarMonthList = computed(() => {
  const todayText = shopTodayDate.value;
  const todayTime = parseUtcDate(todayText);
  if (todayTime === null) {
    return [];
  }
  const monthList = [];
  const firstMonth = new Date(Date.UTC(todayTime.getUTCFullYear(), todayTime.getUTCMonth(), 1));
  for (let monthOffset = 0; monthOffset < HotelBookingCalendar.MONTH_COUNT; monthOffset += 1) {
    const monthTime = new Date(firstMonth.getTime());
    monthTime.setUTCMonth(firstMonth.getUTCMonth() + monthOffset);
    const yearNumber = monthTime.getUTCFullYear();
    const monthNumber = monthTime.getUTCMonth();
    const dayCount = new Date(Date.UTC(yearNumber, monthNumber + 1, 0)).getUTCDate();
    const leadingBlankCount = new Date(Date.UTC(yearNumber, monthNumber, 1)).getUTCDay();
    const dayCellList = [];
    for (let blankIndex = 0; blankIndex < leadingBlankCount; blankIndex += 1) {
      dayCellList.push({ dateText: '', dayNumber: '', disabled: true });
    }
    for (let dayNumber = 1; dayNumber <= dayCount; dayNumber += 1) {
      const dayTime = new Date(Date.UTC(yearNumber, monthNumber, dayNumber));
      const dateText = formatDate(dayTime);
      dayCellList.push({
        dateText,
        dayNumber,
        disabled: dateText < todayText,
      });
    }
    const monthText = String(monthNumber + 1).padStart(2, '0');
    monthList.push({
      monthKey: `${yearNumber}-${monthText}`,
      monthLabel: `${yearNumber}年${monthNumber + 1}月`,
      dayCellList,
    });
  }
  return monthList;
});

/**
 * 入住到离店的晚数。离店不晚于入住时为 0。
 */
const nightCount = computed(() => {
  return countNights(selectedCheckInDate.value, selectedCheckOutDate.value);
});

/**
 * 底部栏左侧的房型、入住日期和晚数。没选房型时提示去选。
 */
const bottomSummaryText = computed(() => {
  if (isEmpty(selectedRoomType.value)) {
    return '请选择房型';
  }
  return `${selectedRoomType.value.typeName} · ${selectedCheckInDate.value} 至 ${selectedCheckOutDate.value} · ${nightCount.value}晚`;
});

/**
 * 底部金额。按每晚价格乘以晚数，这是将要扣的房费。
 */
const bottomAmountText = computed(() => {
  const nightlyPrice = formatNightlyPrice(selectedRoomType.value);
  if (isEmpty(nightlyPrice) || nightCount.value < 1) {
    return '';
  }
  const totalAmount = Number(nightlyPrice) * nightCount.value;
  return `${totalAmount.toFixed(2)}`;
});

/**
 * 当前房型和晚数对应的积分抵扣。余额不够时只展示还差多少，不能勾选。
 */
const pointPlan = computed(() => {
  const roomType = selectedRoomType.value;
  if (isEmpty(roomType) || nightCount.value < 1) {
    return { visible: false, enabled: false, amountText: '0.00', hint: '' };
  }
  const unitAmount = Number(roomType.pointDeductAmount);
  const unitPoints = Number(roomType.pointDeductPoints);
  if (Number.isFinite(unitAmount) !== true || unitAmount <= 0 || Number.isInteger(unitPoints) !== true || unitPoints <= 0) {
    return { visible: false, enabled: false, amountText: '0.00', hint: '' };
  }
  const points = unitPoints * nightCount.value;
  const amountText = (unitAmount * nightCount.value).toFixed(2);
  if (pointsBalance.value < points) {
    return { visible: true, enabled: false, amountText, hint: `积分不足，还差${points - pointsBalance.value}` };
  }
  return { visible: true, enabled: true, amountText, hint: `抵扣${amountText}元，消耗${points}积分` };
});

/**
 * 弹层合计。勾选抵扣后显示实付。
 */
const sheetAmountText = computed(() => {
  if (usePointDeduct.value !== true || pointPlan.value.enabled !== true || isEmpty(bottomAmountText.value)) {
    return bottomAmountText.value;
  }
  const payableAmount = Number(bottomAmountText.value) - Number(pointPlan.value.amountText);
  return payableAmount.toFixed(2);
});

watch(() => pointPlan.value.enabled, (enabled) => {
  if (enabled !== true) {
    usePointDeduct.value = false;
  }
});

/**
 * 弹层副标题：门店、入住日期和晚数。
 */
const formHintText = computed(() => {
  if (isEmpty(currentShop.value) || isEmpty(selectedRoomType.value)) {
    return '';
  }
  return `${currentShop.value.shopName} · ${selectedCheckInDate.value} 至 ${selectedCheckOutDate.value} · ${nightCount.value} 晚`;
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
 * 每晚价格。不是数字时不展示。
 */
function formatNightlyPrice(roomType) {
  if (isEmpty(roomType)) {
    return '';
  }
  const priceNumber = Number(roomType.price);
  if (Number.isFinite(priceNumber) !== true) {
    return '';
  }
  return priceNumber.toFixed(2);
}

/**
 * 解析 YYYY-MM-DD。格式不对时返回空。
 */
function parseUtcDate(dateText) {
  if (isEmpty(dateText)) {
    return null;
  }
  const datePartList = dateText.split('-');
  if (datePartList.length !== 3) {
    return null;
  }
  const yearNumber = Number(datePartList[0]);
  const monthNumber = Number(datePartList[1]);
  const dayNumber = Number(datePartList[2]);
  if (Number.isFinite(yearNumber) !== true || Number.isFinite(monthNumber) !== true || Number.isFinite(dayNumber) !== true) {
    return null;
  }
  return new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
}

/**
 * 计算入住晚数。离店不晚于入住时为 0。
 */
function countNights(checkInDate, checkOutDate) {
  const checkInTime = parseUtcDate(checkInDate);
  if (checkInTime === null || isEmpty(checkOutDate)) {
    return 0;
  }
  let stayNightCount = 0;
  const cursor = new Date(checkInTime.getTime());
  while (formatDate(cursor) < checkOutDate) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    stayNightCount += 1;
  }
  return stayNightCount;
}

/**
 * 入住日加上晚数，得到离店日。入住日不完整时返回空。
 */
function formatCheckOutDate(checkInDate, nightCount) {
  if (isEmpty(checkInDate)) {
    return '';
  }
  const datePartList = checkInDate.split('-');
  if (datePartList.length !== 3) {
    return '';
  }
  const yearNumber = Number(datePartList[0]);
  const monthNumber = Number(datePartList[1]);
  const dayNumber = Number(datePartList[2]);
  if (Number.isFinite(yearNumber) !== true || Number.isFinite(monthNumber) !== true || Number.isFinite(dayNumber) !== true) {
    return '';
  }
  const checkInTime = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  checkInTime.setUTCDate(checkInTime.getUTCDate() + nightCount);
  return formatDate(checkInTime);
}

/**
 * 按当前酒店加载可预订房型。
 */
async function loadRoomTypes() {
  const shop = currentShop.value;
  if (isEmpty(shop)) {
    roomTypeList.value = [];
    selectedRoomTypeId.value = '';
    return;
  }
  roomTypeList.value = await request({
    url: HotelApi.ROOM_TYPES,
    method: 'GET',
    data: { shopId: shop.shopId },
  });
  if (isEmpty(selectedRoomType.value)) {
    selectedRoomTypeId.value = '';
  }
}

/**
 * 加载酒店、房型和订单。酒店由地址中的门店编号锁定。
 */
async function loadPage() {
  // 1. 按门店类型拉取酒店，再按入口编号锁定一家
  const shopList = await request({
    url: ShopApi.LIST,
    method: 'GET',
    data: { shopType: ShopType.HOTEL },
  });
  currentShop.value = findShopByCode(shopList);
  refreshCheckInDates();
  if (isEmpty(currentShop.value)) {
    const toastTitle = isEmpty(shopCode.value) ? '缺少门店编号' : '门店不存在';
    showToast(toastTitle);
    roomTypeList.value = [];
    selectedRoomTypeId.value = '';
  } else if (currentShop.value.status !== RecordStatus.ENABLED) {
    // 休息中的门店不拉房型，那些接口只接受启用门店
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
 * 下拉松开后刷新整页。酒店、房型和订单都重新加载。
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
 * 按页查询当前会员的酒店订单。第一页替换列表，之后追加。空页时不再继续翻。
 */
async function loadMemberOrders(pageNumber) {
  // 1. 按页拉取当前会员的酒店订单
  const orderPage = await request({
    url: HotelApi.BOOKING_ORDERS,
    method: 'GET',
    data: { page: pageNumber, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
  });
  const nextList = isEmpty(orderPage) || isEmpty(orderPage.list) ? [] : orderPage.list;
  const nextTotal = isEmpty(orderPage) || isEmpty(orderPage.total) ? 0 : Number(orderPage.total);
  // 2. 第一页覆盖，后续页接到后面。这一页没有数据就停在已有条数
  if (pageNumber !== PageSetting.DEFAULT_PAGE && nextList.length === 0) {
    orderTotal.value = orderList.value.length;
    return;
  }
  if (pageNumber === PageSetting.DEFAULT_PAGE) {
    orderList.value = nextList;
  } else {
    orderList.value = orderList.value.concat(nextList);
  }
  orderTotal.value = Number.isFinite(nextTotal) ? nextTotal : orderList.value.length;
  orderPageNumber.value = pageNumber;
}

/**
 * 加载下一页订单。正在请求或已经到末页时不重复请求。
 */
async function loadMoreOrders() {
  if (orderLoading.value === true || orderList.value.length >= orderTotal.value) {
    return;
  }
  orderLoading.value = true;
  try {
    await loadMemberOrders(orderPageNumber.value + 1);
  } finally {
    orderLoading.value = false;
  }
}

/**
 * 取消或评价后，从第 1 页重新拉取并替换整表。
 */
async function refreshMemberOrders() {
  await loadMemberOrders(PageSetting.DEFAULT_PAGE);
}

/**
 * 用会员资料预填预订人和联系方式。手机号带 +86 时去掉区号。请求失败时留空，仍可手填。
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
 * 按当前时间和门店时区重算今天。入住早于今天时回到今天住一晚。
 */
function refreshCheckInDates() {
  dateBaseTime.value = new Date();
  ensureSelection();
}

/**
 * 入住不早于今天，离店晚于入住。不满足时回到今天住一晚。
 */
function ensureSelection() {
  const todayText = shopTodayDate.value;
  const tomorrowText = formatCheckOutDate(todayText, 1);
  if (isEmpty(selectedCheckInDate.value) || selectedCheckInDate.value < todayText) {
    selectedCheckInDate.value = todayText;
    selectedCheckOutDate.value = tomorrowText;
    return;
  }
  if (isEmpty(selectedCheckOutDate.value) || selectedCheckOutDate.value <= selectedCheckInDate.value) {
    selectedCheckOutDate.value = formatCheckOutDate(selectedCheckInDate.value, 1);
  }
}

/**
 * 按页查询当前门店评价。第一页替换列表，之后追加。空页时不再继续翻。
 */
async function loadShopReviews(pageNumber) {
  if (isEmpty(currentShop.value) || isEmpty(currentShop.value.shopId)) {
    reviewList.value = [];
    reviewTotal.value = 0;
    reviewPageNumber.value = pageNumber;
    return;
  }
  // 1. 按页拉取当前门店评价
  const reviewPage = await request({
    url: ShopReviewApi.REVIEWS,
    method: 'GET',
    data: {
      shopId: currentShop.value.shopId,
      page: pageNumber,
      pageSize: PageSetting.DEFAULT_PAGE_SIZE,
    },
  });
  const nextList = isEmpty(reviewPage) || isEmpty(reviewPage.list) ? [] : reviewPage.list;
  const nextTotal = isEmpty(reviewPage) || isEmpty(reviewPage.total) ? 0 : Number(reviewPage.total);
  // 2. 第一页覆盖，后续页接到后面。这一页没有数据就停在已有条数
  if (pageNumber !== PageSetting.DEFAULT_PAGE && nextList.length === 0) {
    reviewTotal.value = reviewList.value.length;
    return;
  }
  if (pageNumber === PageSetting.DEFAULT_PAGE) {
    reviewList.value = nextList;
  } else {
    reviewList.value = reviewList.value.concat(nextList);
  }
  reviewTotal.value = Number.isFinite(nextTotal) ? nextTotal : reviewList.value.length;
  reviewPageNumber.value = pageNumber;
}

/**
 * 加载下一页评价。正在请求或已经到末页时不重复请求。
 */
async function loadMoreReviews() {
  if (reviewLoading.value === true || reviewList.value.length >= reviewTotal.value) {
    return;
  }
  reviewLoading.value = true;
  try {
    await loadShopReviews(reviewPageNumber.value + 1);
  } finally {
    reviewLoading.value = false;
  }
}

/**
 * 切换内容 Tab。进入订单或评价时从第 1 页重新拉取。
 */
async function selectContentTab(contentTab) {
  selectedContentTab.value = contentTab;
  dateSheetOpen.value = false;
  if (contentTab === HotelContentTab.ORDER) {
    await loadMemberOrders(PageSetting.DEFAULT_PAGE);
  }
  if (contentTab === HotelContentTab.REVIEW) {
    await loadShopReviews(PageSetting.DEFAULT_PAGE);
  }
}

/**
 * 打开入住离店日历。
 */
function openDateSheet() {
  dateSheetOpen.value = true;
}

/**
 * 关闭入住离店日历。
 */
function closeDateSheet() {
  dateSheetOpen.value = false;
}

/**
 * 确认日历里选好的入住和离店。
 */
function applyStayDates(stayDates) {
  if (isEmpty(stayDates)) {
    return;
  }
  selectedCheckInDate.value = stayDates.checkInDate;
  selectedCheckOutDate.value = stayDates.checkOutDate;
  dateSheetOpen.value = false;
}

/**
 * 选择房型。
 */
function selectRoomType(roomTypeId) {
  selectedRoomTypeId.value = roomTypeId;
}

/**
 * 读取当前会员积分余额，用来决定抵扣开关能不能点。
 */
async function loadPointsBalance() {
  try {
    const summary = await request({ url: PointApi.SUMMARY, method: 'GET' });
    const balanceText = isEmpty(summary) || isEmpty(summary.balance) ? '0' : summary.balance;
    const balanceNumber = Number(balanceText);
    pointsBalance.value = Number.isFinite(balanceNumber) === true ? Math.trunc(balanceNumber) : 0;
  } catch {
    pointsBalance.value = 0;
  }
}

/**
 * 打开确认层。没选房型时不打开。
 */
function openForm() {
  if (isEmpty(selectedRoomType.value)) {
    return;
  }
  usePointDeduct.value = false;
  void loadPointsBalance();
  dateSheetOpen.value = false;
  formError.value = '';
  bookingStep.value = HotelBookingStep.FORM;
}

/**
 * 关闭确认层，回到选房。
 */
function closeForm() {
  formError.value = '';
  bookingStep.value = HotelBookingStep.LIST;
}

/**
 * 提交预订。先核对预订人和联系方式，再校验安全密钥，并按晚数扣会员余额。
 */
async function submitBooking() {
  if (bookingSubmitting.value) {
    return;
  }
  const shop = currentShop.value;
  const roomType = selectedRoomType.value;
  const checkInDate = selectedCheckInDate.value;
  const nextCheckOutDate = selectedCheckOutDate.value;
  const stayNightCount = nightCount.value;
  const guestNameText = isEmpty(guestName.value) ? '' : guestName.value.trim();
  const contactText = isEmpty(bookingContact.value) ? '' : bookingContact.value.trim();
  // 1. 先做本地校验，缺项时停在弹层里
  if (isEmpty(shop) || isEmpty(roomType) || isEmpty(checkInDate) || isEmpty(nextCheckOutDate)) {
    formError.value = '请完整填写预订信息';
    return;
  }
  if (stayNightCount < 1 || nextCheckOutDate <= checkInDate) {
    formError.value = '离店日期必须晚于入住日期';
    return;
  }
  if (isEmpty(guestNameText) || isEmpty(contactText)) {
    formError.value = '请填写预订人和联系方式';
    return;
  }
  if (guestNameText.length > HotelBookingGuest.NAME_MAX_LENGTH || contactText.length > HotelBookingGuest.CONTACT_MAX_LENGTH) {
    formError.value = '预订人或联系方式过长';
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
    // 3. 提交门店、房型、入住日、离店日、预订人、联系方式和安全密钥密文
    const createdOrder = await request({
      url: HotelApi.BOOKING_ORDERS,
      method: 'POST',
      data: {
        shopId: shop.shopId,
        roomTypeId: roomType.id,
        checkInDate,
        checkOutDate: nextCheckOutDate,
        guestName: guestNameText,
        contact: contactText,
        usePointDeduct: usePointDeduct.value === true && pointPlan.value.enabled === true,
        cipherText: securityKeyCipherText,
      },
    });
    // 4. 成功后记下单号、实付房费和入住离店
    const goodsAmount = isEmpty(createdOrder) || isEmpty(createdOrder.amount) ? Number.NaN : Number(createdOrder.amount);
    const deductAmount = isEmpty(createdOrder) || isEmpty(createdOrder.pointDeductAmount) ? 0 : Number(createdOrder.pointDeductAmount);
    const paidAmount = Number.isFinite(goodsAmount) === true
      ? (goodsAmount - (Number.isFinite(deductAmount) === true ? deductAmount : 0)).toFixed(2)
      : '';
    successSummary.value = {
      orderNo: isEmpty(createdOrder) ? '' : createdOrder.orderNo,
      shopName: shop.shopName,
      roomTypeName: roomType.typeName,
      checkInDate,
      checkOutDate: nextCheckOutDate,
      nightCount: stayNightCount,
      amount: paidAmount,
    };
    bookingStep.value = HotelBookingStep.SUCCESS;
  } finally {
    bookingSubmitting.value = false;
  }
}

/**
 * 查看订单时离开成功页，切到订单 Tab，并从第 1 页重新拉取。
 */
async function bookAgain() {
  bookingStep.value = HotelBookingStep.LIST;
  selectedRoomTypeId.value = '';
  formError.value = '';
  successSummary.value = null;
  await selectContentTab(HotelContentTab.ORDER);
}

/**
 * 地址里的门店编号变了就重新锁定酒店。同一页组件会被复用。
 */
function reloadForShopCode() {
  bookingStep.value = HotelBookingStep.LIST;
  dateSheetOpen.value = false;
  successSummary.value = null;
  readShopCode();
  refreshCheckInDates();
  loadPage();
}

/**
 * 确认层或日历打开时锁住底页滚动，离开后恢复。
 */
function syncPageScrollLock() {
  if (bookingStep.value === HotelBookingStep.FORM || dateSheetOpen.value) {
    lockPageScroll();
    return;
  }
  unlockPageScroll();
}

/**
 * 打开页面时记下门店编号，并加载酒店和我的订单。
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

watch(dateSheetOpen, () => {
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
  min-height: 100vh;
  margin: 0 auto;
  padding: 0;
  color: #14241c;
  background: #f3efe8;
}
.page-with-bar {
  padding-bottom: calc(88px + var(--ct-safe-bottom, 0px));
}
.panel {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  margin-top: -18px;
  padding: 24px 16px 8px;
  border-radius: 18px 18px 0 0;
  background: #f3efe8;
}
</style>
