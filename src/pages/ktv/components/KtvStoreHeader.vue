<template>
  <header v-if="isEmpty(currentShop) !== true" class="store">
    <div v-if="isEmpty(storeCoverImageUrl) !== true" class="store-photo" :style="storeCoverStyle"></div>
    <div v-if="isEmpty(storeCoverImageUrl) !== true" class="store-mask"></div>
    <div class="store-body">
      <h1>{{ currentShop.shopName }}</h1>
      <p v-if="isEmpty(businessHoursText) !== true" class="meta">
        {{ businessHoursText }}
        <span v-if="isEmpty(shopTimeZoneText) !== true" class="time-zone-tag">{{ shopTimeZoneText }}</span>
      </p>
      <p v-if="isEmpty(shopAddressText) !== true" class="meta">{{ shopAddressText }}</p>
      <p v-if="isEmpty(shopPhoneText) !== true" class="meta">{{ shopPhoneText }}</p>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { timeZoneLabel } from '../../../utils/constants.js';
import { isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  currentShop: {
    default: null
  }
});

/**
 * 门店图库第一张。没有图片时 Header 继续用紫色渐变。
 */
const storeCoverImageUrl = computed(() => {
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.imageList)) {
    return '';
  }
  const firstShopImage = props.currentShop.imageList[0];
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
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.businessHours)) {
    return '';
  }
  const startTime = props.currentShop.businessHours.startTime;
  const endTime = props.currentShop.businessHours.endTime;
  if (isEmpty(startTime) && isEmpty(endTime)) {
    return '';
  }
  return `营业时间 ${startTime} - ${endTime}`;
});

/**
 * 门店时区标签。没有时区时不显示。
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
</script>

<style scoped>
.store {
  box-sizing: border-box;
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
  filter: blur(8px);
  transform: scale(1.08);
}
.store-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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
.time-zone-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(245, 243, 255, 0.18);
  color: #f5f3ff;
  font-size: 12px;
  line-height: 20px;
  vertical-align: 1px;
}
</style>
