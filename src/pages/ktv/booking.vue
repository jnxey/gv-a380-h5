<template>
  <view class="page">
    <view class="card">
      <picker :range="shopNameList" @change="onShopChange">
        <view class="field">门店：{{ currentShopName }}</view>
      </picker>
      <picker :range="roomNameList" @change="onRoomChange">
        <view class="field">包厢：{{ currentRoomName }}</view>
      </picker>
      <picker mode="date" @change="onDateChange">
        <view class="field">日期：{{ bookingDate || '请选择' }}</view>
      </picker>
      <picker mode="time" @change="onStartTimeChange">
        <view class="field">开始：{{ startTime || '请选择' }}</view>
      </picker>
      <picker mode="time" @change="onEndTimeChange">
        <view class="field">结束：{{ endTime || '请选择' }}</view>
      </picker>
      <view class="price" v-if="currentRoomPrice !== ''">包厢费 {{ currentRoomPrice }} 元，提交后立即扣余额</view>
      <button type="primary" @click="submitBooking">提交预订</button>
    </view>
    <view class="section-title">我的订单</view>
    <view v-for="order in orderList" :key="order.bookingOrderId" class="order-row">
      <text class="order-title">{{ order.roomName }} {{ order.bookingDate }}</text>
      <text class="order-sub">{{ order.startTime }} - {{ order.endTime }} {{ statusLabel(order.orderStatus) }}</text>
      <text class="order-sub">核销码 {{ order.verifyCode }} 金额 {{ order.amount }}</text>
    </view>
  </view>
</template>

<script>
import { request } from '../../utils/request.js';
import { PageSetting, ShopType, statusLabel } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

export default {
  data() {
    return {
      shopList: [],
      roomList: [],
      shopIndex: 0,
      roomIndex: 0,
      bookingDate: '',
      startTime: '',
      endTime: '',
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
     * 包厢名称列表。
     */
    roomNameList() {
      return this.roomList.map((room) => `${room.roomName} ${room.price}元`);
    },
    /**
     * 当前选中的门店名称。
     */
    currentShopName() {
      const shop = this.shopList[this.shopIndex];
      return isEmpty(shop) ? '请选择' : shop.shopName;
    },
    /**
     * 当前选中的包厢名称。
     */
    currentRoomName() {
      const room = this.roomList[this.roomIndex];
      return isEmpty(room) ? '请选择' : room.roomName;
    },
    /**
     * 当前包厢价格。
     */
    currentRoomPrice() {
      const room = this.roomList[this.roomIndex];
      return isEmpty(room) ? '' : room.price;
    },
  },
  /**
   * 打开页面时加载 KTV 门店和我的订单。
   */
  onShow() {
    this.loadPage();
  },
  methods: {
    statusLabel,
    /**
     * 加载门店、包厢和订单。
     */
    async loadPage() {
      this.shopList = await request({
        url: '/app/shops',
        method: 'GET',
        data: { shopType: ShopType.KTV },
      });
      await this.loadRooms();
      const orderPage = await request({
        url: '/app/ktv/booking-orders',
        method: 'GET',
        data: { page: PageSetting.DEFAULT_PAGE, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
      });
      this.orderList = isEmpty(orderPage) ? [] : orderPage.list;
    },
    /**
     * 按当前门店加载可售包厢。
     */
    async loadRooms() {
      const shop = this.shopList[this.shopIndex];
      if (isEmpty(shop)) {
        this.roomList = [];
        return;
      }
      this.roomList = await request({
        url: '/app/ktv/rooms',
        method: 'GET',
        data: { shopId: shop.shopId },
      });
      this.roomIndex = 0;
    },
    /**
     * 切换门店后重载包厢。
     */
    async onShopChange(event) {
      this.shopIndex = Number(event.detail.value);
      await this.loadRooms();
    },
    /**
     * 选择包厢。
     */
    onRoomChange(event) {
      this.roomIndex = Number(event.detail.value);
    },
    /**
     * 选择预订日期。
     */
    onDateChange(event) {
      this.bookingDate = event.detail.value;
    },
    /**
     * 选择开始时间。
     */
    onStartTimeChange(event) {
      this.startTime = this.normalizeTime(event.detail.value);
    },
    /**
     * 选择结束时间。
     */
    onEndTimeChange(event) {
      this.endTime = this.normalizeTime(event.detail.value);
    },
    /**
     * 时间选择器只有时分时补上秒。
     */
    normalizeTime(timeText) {
      if (isEmpty(timeText)) {
        return '';
      }
      if (timeText.length === 5) {
        return `${timeText}:00`;
      }
      return timeText;
    },
    /**
     * 提交预订。服务端会校验包厢归属并扣余额。
     */
    async submitBooking() {
      const shop = this.shopList[this.shopIndex];
      const room = this.roomList[this.roomIndex];
      if (isEmpty(shop) || isEmpty(room) || isEmpty(this.bookingDate) || isEmpty(this.startTime) || isEmpty(this.endTime)) {
        uni.showToast({ title: '请完整填写预订信息', icon: 'none' });
        return;
      }
      await request({
        url: '/app/ktv/booking-orders',
        method: 'POST',
        data: {
          shopId: shop.shopId,
          roomId: room.id,
          bookingDate: this.bookingDate,
          startTime: this.startTime,
          endTime: this.endTime,
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
