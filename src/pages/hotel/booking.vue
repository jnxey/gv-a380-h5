<template>
  <view class="page">
    <view class="card">
      <picker :range="shopNameList" @change="onShopChange">
        <view class="field">酒店：{{ currentShopName }}</view>
      </picker>
      <picker :range="roomTypeNameList" @change="onRoomTypeChange">
        <view class="field">房型：{{ currentRoomTypeName }}</view>
      </picker>
      <picker mode="date" @change="onCheckInChange">
        <view class="field">入住：{{ checkInDate || '请选择' }}</view>
      </picker>
      <picker mode="date" @change="onCheckOutChange">
        <view class="field">离店：{{ checkOutDate || '请选择' }}</view>
      </picker>
      <view class="price" v-if="currentRoomTypePrice !== ''">每晚 {{ currentRoomTypePrice }} 元，预订不扣款，退房时结算</view>
      <button type="primary" @click="submitBooking">提交预订</button>
    </view>
    <view class="section-title">我的订单</view>
    <view v-for="order in orderList" :key="order.bookingOrderId" class="order-row">
      <text class="order-title">{{ order.typeName }} {{ statusLabel(order.orderStatus) }}</text>
      <text class="order-sub">{{ order.checkInDate }} 至 {{ order.checkOutDate }}</text>
      <text class="order-sub">房费 {{ order.amount }}</text>
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
      roomTypeList: [],
      shopIndex: 0,
      roomTypeIndex: 0,
      checkInDate: '',
      checkOutDate: '',
      orderList: [],
    };
  },
  computed: {
    /**
     * 酒店名称列表。
     */
    shopNameList() {
      return this.shopList.map((shop) => shop.shopName);
    },
    /**
     * 房型名称列表。
     */
    roomTypeNameList() {
      return this.roomTypeList.map((roomType) => `${roomType.typeName} ${roomType.price}元`);
    },
    /**
     * 当前酒店名称。
     */
    currentShopName() {
      const shop = this.shopList[this.shopIndex];
      return isEmpty(shop) ? '请选择' : shop.shopName;
    },
    /**
     * 当前房型名称。
     */
    currentRoomTypeName() {
      const roomType = this.roomTypeList[this.roomTypeIndex];
      return isEmpty(roomType) ? '请选择' : roomType.typeName;
    },
    /**
     * 当前房型每晚价格。
     */
    currentRoomTypePrice() {
      const roomType = this.roomTypeList[this.roomTypeIndex];
      return isEmpty(roomType) ? '' : roomType.price;
    },
  },
  /**
   * 打开页面时加载酒店和我的订单。
   */
  onShow() {
    this.loadPage();
  },
  methods: {
    statusLabel,
    /**
     * 加载酒店、房型和订单。
     */
    async loadPage() {
      this.shopList = await request({
        url: '/app/shops',
        method: 'GET',
        data: { shopType: ShopType.HOTEL },
      });
      await this.loadRoomTypes();
      const orderPage = await request({
        url: '/app/hotel/booking-orders',
        method: 'GET',
        data: { page: PageSetting.DEFAULT_PAGE, pageSize: PageSetting.DEFAULT_PAGE_SIZE },
      });
      this.orderList = isEmpty(orderPage) ? [] : orderPage.list;
    },
    /**
     * 加载当前酒店可售房型。
     */
    async loadRoomTypes() {
      const shop = this.shopList[this.shopIndex];
      if (isEmpty(shop)) {
        this.roomTypeList = [];
        return;
      }
      this.roomTypeList = await request({
        url: '/app/hotel/room-types',
        method: 'GET',
        data: { shopId: shop.shopId },
      });
      this.roomTypeIndex = 0;
    },
    /**
     * 切换酒店。
     */
    async onShopChange(event) {
      this.shopIndex = Number(event.detail.value);
      await this.loadRoomTypes();
    },
    /**
     * 选择房型。
     */
    onRoomTypeChange(event) {
      this.roomTypeIndex = Number(event.detail.value);
    },
    /**
     * 选择入住日期。
     */
    onCheckInChange(event) {
      this.checkInDate = event.detail.value;
    },
    /**
     * 选择离店日期。
     */
    onCheckOutChange(event) {
      this.checkOutDate = event.detail.value;
    },
    /**
     * 提交预订。此时不扣会员余额。
     */
    async submitBooking() {
      const shop = this.shopList[this.shopIndex];
      const roomType = this.roomTypeList[this.roomTypeIndex];
      if (isEmpty(shop) || isEmpty(roomType) || isEmpty(this.checkInDate) || isEmpty(this.checkOutDate)) {
        uni.showToast({ title: '请完整填写预订信息', icon: 'none' });
        return;
      }
      await request({
        url: '/app/hotel/booking-orders',
        method: 'POST',
        data: {
          shopId: shop.shopId,
          roomTypeId: roomType.id,
          checkInDate: this.checkInDate,
          checkOutDate: this.checkOutDate,
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
