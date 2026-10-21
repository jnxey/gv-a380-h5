<template>
  <div v-if="isEmpty(currentShop) !== true" class="shop-detail">
    <div v-if="isEmpty(currentShop.shopName) !== true" class="detail-row">
      <span>店名</span>
      <strong>{{ currentShop.shopName }}</strong>
    </div>
    <div v-if="isEmpty(businessHoursText) !== true" class="detail-row">
      <span>营业时间</span>
      <strong>{{ businessHoursText }}</strong>
    </div>
    <div v-if="isEmpty(shopTimeZoneText) !== true" class="detail-row">
      <span>时区</span>
      <strong>{{ shopTimeZoneText }}</strong>
    </div>
    <div v-if="isEmpty(shopAddressText) !== true" class="detail-row">
      <span>地址</span>
      <strong>{{ shopAddressText }}</strong>
    </div>
    <div v-if="isEmpty(shopPhoneText) !== true" class="detail-row">
      <span>电话</span>
      <strong>{{ shopPhoneText }}</strong>
    </div>
    <div v-if="isEmpty(shopImageList) !== true" class="gallery">
      <img v-for="shopImage in shopImageList" :key="shopImage.imageId" :src="shopImage.imageUrl" alt="" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { timeZoneLabel } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  currentShop: {
    default: null,
  },
});

/**
 * 营业时间。开始和结束都空时不显示。
 */
const businessHoursText = computed(() => {
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.businessHours)) {
    return '';
  }
  const startTime = props.currentShop.businessHours.startTime;
  const endTime = props.currentShop.businessHours.endTime;
  if (isEmpty(startTime) && isEmpty(endTime)) {
    return '';
  }
  return `${startTime} - ${endTime}`;
});

/**
 * 门店时区。没有时区时不显示。
 */
const shopTimeZoneText = computed(() => {
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.timeZone)) {
    return '';
  }
  return timeZoneLabel(props.currentShop.timeZone);
});

/**
 * 门店地址。没有地址时不显示。
 */
const shopAddressText = computed(() => {
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.address)) {
    return '';
  }
  return props.currentShop.address;
});

/**
 * 门店电话。没有电话时不显示。
 */
const shopPhoneText = computed(() => {
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.contactPhone)) {
    return '';
  }
  return props.currentShop.contactPhone;
});

/**
 * 有地址的门店图片。
 */
const shopImageList = computed(() => {
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.imageList)) {
    return [];
  }
  const imageList = [];
  for (let imageIndex = 0; imageIndex < props.currentShop.imageList.length; imageIndex += 1) {
    const shopImage = props.currentShop.imageList[imageIndex];
    if (isEmpty(shopImage) !== true && isEmpty(shopImage.imageUrl) !== true) {
      imageList.push(shopImage);
    }
  }
  return imageList;
});
</script>

<style scoped>
.shop-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-row {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fffdf9;
  color: #14241c;
}
.detail-row span {
  flex: 0 0 auto;
  color: #5e6b64;
  font-size: 13px;
}
.detail-row strong {
  font-weight: 600;
  text-align: right;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.gallery img {
  width: 100%;
  height: 88px;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(31, 138, 112, 0.12);
}
</style>
