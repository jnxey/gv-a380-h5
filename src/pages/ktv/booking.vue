<template>
  <view class="page">
    <view class="card">
      <picker :range="shopNameList" @change="onShopChange">
        <view class="field">门店：{{ currentShopName }}</view>
      </picker>
      <picker :range="roomTypeNameList" @change="onRoomTypeChange">
        <view class="field">包厢类型：{{ currentRoomTypeName }}</view>
      </picker>
      <picker :range="slotLabelList" @change="onSlotChange">
        <view class="field">开唱：{{ currentSlotLabel }}</view>
      </picker>
      <input class="field" type="number" v-model="durationHours" placeholder="唱几小时" />
      <view class="price" v-if="currentBookingAmount !== ''">包厢费 {{ currentBookingAmount }} 元，提交后立即扣余额</view>
      <button type="primary" @click="submitBooking">提交预订</button>
    </view>
    <view class="section-title">我的订单</view>
    <view v-for="order in orderList" :key="order.bookingOrderId" class="order-row">
      <text class="order-title">{{ order.roomTypeName }} {{ order.bookingDate }}</text>
      <text v-if="isEmpty(order.roomName) !== true" class="order-sub">包厢 {{ order.roomName }}</text>
      <text class="order-sub">{{ order.startTime }} - {{ formatBookingEnd(order) }} {{ order.durationHours }}小时 {{ statusLabel(order.orderStatus) }}</text>
      <text class="order-sub">核销码 {{ order.verifyCode }} 金额 {{ order.amount }}</text>
    </view>
  </view>
</template>

<script>
import { request } from '../../utils/request.js';
import { KtvBookingHour, KtvBookingSlot, PageSetting, ShopType, statusLabel } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

export default {
  data() {
    return {
      shopList: [],
      roomTypeList: [],
      shopIndex: 0,
      roomTypeIndex: 0,
      slotList: [],
      slotIndex: 0,
      durationHours: '',
      orderList: [],
    };
  },
  computed: {
    /**
     * 门店名称列表，供选择器使用。
     */
    shopNameList() {
      return this.shopList.map((shop) => shop.shopName);
    },
    /**
     * 包厢类型名称列表。
     */
    roomTypeNameList() {
      return this.roomTypeList.map((roomType) => `${roomType.typeName} ${roomType.hourlyPrice}元`);
    },
    /**
     * 当前选中的门店名称。
     */
    currentShopName() {
      const shop = this.shopList[this.shopIndex];
      return isEmpty(shop) ? '请选择' : shop.shopName;
    },
    /**
     * 当前选中的包厢类型名称。
     */
    currentRoomTypeName() {
      const roomType = this.roomTypeList[this.roomTypeIndex];
      return isEmpty(roomType) ? '请选择' : roomType.typeName;
    },
    /**
     * 开唱刻度的展示文字。
     */
    slotLabelList() {
      return this.slotList.map((slot) => slot.label);
    },
    /**
     * 当前选中的开唱刻度。
     */
    currentSlotLabel() {
      const slot = this.slotList[this.slotIndex];
      return isEmpty(slot) ? '请选择' : slot.label;
    },
    /**
     * 当前预订金额。小时数不合法时不显示。
     */
    currentBookingAmount() {
      const roomType = this.roomTypeList[this.roomTypeIndex];
      const durationHours = Number(this.durationHours);
      if (isEmpty(roomType) || Number.isInteger(durationHours) !== true || durationHours < KtvBookingHour.MIN || durationHours > KtvBookingHour.MAX) {
        return '';
      }
      return (Number(roomType.hourlyPrice) * durationHours).toFixed(2);
    },
  },
  /**
   * 打开页面时加载 KTV 门店和我的订单。
   */
  onShow() {
    this.refreshSlots();
    this.loadPage();
  },
  methods: {
    statusLabel,
    isEmpty,
    /**
     * 结束钟点不晚于开唱钟点时，表示已经跨到第二天。
     */
    formatBookingEnd(order) {
      if (isEmpty(order.endTime) || isEmpty(order.startTime)) {
        return '';
      }
      if (order.endTime <= order.startTime) {
        return `次日 ${order.endTime}`;
      }
      return order.endTime;
    },
    /**
     * 加载门店、包厢类型和订单。
     */
    async loadPage() {
      this.shopList = await request({
        url: '/app/shops',
        method: 'GET',
        data: { shopType: ShopType.KTV },
      });
      await this.loadRoomTypes();
      const orderPage = await request({
        url: '/app/ktv/booking-orders',
        method: 'GET',
        data: { page: PageSetting.DEFAULT_PAGE, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
      });
      this.orderList = isEmpty(orderPage) ? [] : orderPage.list;
    },
    /**
     * 按当前门店加载可预订的包厢类型。
     */
    async loadRoomTypes() {
      const shop = this.shopList[this.shopIndex];
      if (isEmpty(shop)) {
        this.roomTypeList = [];
        return;
      }
      this.roomTypeList = await request({
        url: '/app/ktv/room-types',
        method: 'GET',
        data: { shopId: shop.shopId },
      });
      this.roomTypeIndex = 0;
    },
    /**
     * 切换门店后重载包厢类型。
     */
    async onShopChange(event) {
      this.shopIndex = Number(event.detail.value);
      await this.loadRoomTypes();
    },
    /**
     * 选择包厢类型。
     */
    onRoomTypeChange(event) {
      this.roomTypeIndex = Number(event.detail.value);
    },
    /**
     * 按当前时间重算 8 个开唱刻度。原来的选择还在列表里就保留。
     */
    refreshSlots() {
      const previousSlot = this.slotList[this.slotIndex];
      const previousKey = isEmpty(previousSlot) ? '' : previousSlot.slotKey;
      this.slotList = this.buildSlotList(new Date());
      const matchedIndex = this.slotList.findIndex((slot) => slot.slotKey === previousKey);
      this.slotIndex = matchedIndex >= 0 ? matchedIndex : 0;
    },
    /**
     * 从可预约的第一档开唱时间起，生成全部刻度。
     */
    buildSlotList(now) {
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
      const todayText = this.formatDate(now);
      const slotList = [];
      for (let slotIndex = 0; slotIndex < KtvBookingSlot.COUNT; slotIndex += 1) {
        const slotTime = new Date(nextSlotTime + slotIndex * stepMilliseconds);
        const bookingDate = this.formatDate(slotTime);
        const startTime = this.formatClockTime(slotTime);
        const dayLabel = bookingDate === todayText ? '今天' : '明天';
        slotList.push({
          bookingDate,
          startTime,
          slotKey: `${bookingDate} ${startTime}`,
          label: `${dayLabel} ${startTime.slice(0, 5)}`,
        });
      }
      return slotList;
    },
    /**
     * 格式化成本地日期。
     */
    formatDate(dateTime) {
      const monthText = String(dateTime.getMonth() + 1).padStart(2, '0');
      const dayText = String(dateTime.getDate()).padStart(2, '0');
      return `${dateTime.getFullYear()}-${monthText}-${dayText}`;
    },
    /**
     * 格式化成本地钟点，秒固定为 0。
     */
    formatClockTime(dateTime) {
      const hourText = String(dateTime.getHours()).padStart(2, '0');
      const minuteText = String(dateTime.getMinutes()).padStart(2, '0');
      return `${hourText}:${minuteText}:00`;
    },
    /**
     * 选择开唱刻度。
     */
    onSlotChange(event) {
      this.slotIndex = Number(event.detail.value);
    },
    /**
     * 提交预订。服务端按包厢类型占名额并扣余额。
     */
    async submitBooking() {
      const shop = this.shopList[this.shopIndex];
      const roomType = this.roomTypeList[this.roomTypeIndex];
      const slot = this.slotList[this.slotIndex];
      const durationHours = Number(this.durationHours);
      if (isEmpty(shop) || isEmpty(roomType) || isEmpty(slot)) {
        uni.showToast({ title: '请完整填写预订信息', icon: 'none' });
        return;
      }
      if (Number.isInteger(durationHours) !== true || durationHours < KtvBookingHour.MIN || durationHours > KtvBookingHour.MAX) {
        uni.showToast({ title: '演唱小时数必须在1到24之间', icon: 'none' });
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
          durationHours,
        },
      });
      uni.showToast({ title: '预订成功', icon: 'success' });
      await this.loadPage();
    },
  },
};
</script>

<style>
.page {
  padding: 24rpx;
}
.card,
.order-row {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.field,
.price,
.order-title,
.order-sub {
  display: block;
  margin-bottom: 16rpx;
}
.section-title {
  font-weight: 600;
  margin: 12rpx 0;
}
.order-sub {
  color: #6b7280;
}
</style>
