<template>
  <header class="store">
    <div v-if="isEmpty(storeCoverImageUrl) !== true" class="store-photo" :style="storeCoverStyle"></div>
    <div v-if="isEmpty(storeCoverImageUrl) !== true" class="store-mask"></div>
    <div class="store-body">
      <h1 v-if="isEmpty(currentShop) !== true">{{ currentShop.shopName }}</h1>
      <p v-if="isEmpty(businessHoursText) !== true" class="meta">
        {{ businessHoursText }}
        <span v-if="isEmpty(shopTimeZoneText) !== true" class="time-zone-tag">{{ shopTimeZoneText }}</span>
      </p>
      <p v-if="isEmpty(shopAddressText) !== true" class="meta meta-address">
        <span class="meta-text">{{ shopAddressText }}</span>
        <button v-if="hasShopLocation" type="button" class="meta-action" @click="openShopMap">
          <AppIcon :icon-name="AppIconName.MAP" />
        </button>
      </p>
      <p v-if="isEmpty(shopPhoneText) !== true" class="meta">
        {{ shopPhoneText }}
        <button type="button" class="meta-action" @click="callShopPhone">
          <AppIcon :icon-name="AppIconName.PHONE" />
        </button>
      </p>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import AppIcon from '../../../components/AppIcon/AppIcon.vue';
import { AppIconName, timeZoneLabel } from '../../../utils/constants.js';
import { makeShopPhoneCall, openShopLocation } from 'gv-sdk';
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
 * 营业时间。开始和结束都空时不显示。结束早于开始时标次日。
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
  if (isEmpty(startTime) !== true && isEmpty(endTime) !== true && endTime < startTime) {
    return `营业时间 ${startTime} - 次日 ${endTime}`;
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

/**
 * 门店纬度。没有有效数字时返回 null。
 */
const shopLatitude = computed(() => {
  return readShopCoordinate('latitude');
});

/**
 * 门店经度。没有有效数字时返回 null。
 */
const shopLongitude = computed(() => {
  return readShopCoordinate('longitude');
});

/**
 * 经纬度都有时才显示地图按钮。
 */
const hasShopLocation = computed(() => {
  return shopLatitude.value !== null && shopLongitude.value !== null;
});

/**
 * 从门店位置里读取一个有限数字坐标。
 */
function readShopCoordinate(fieldName) {
  if (isEmpty(props.currentShop) || isEmpty(props.currentShop.shopAddress)) {
    return null;
  }
  const coordinate = props.currentShop.shopAddress[fieldName];
  if (typeof coordinate !== 'number' || Number.isFinite(coordinate) !== true) {
    return null;
  }
  return coordinate;
}

/**
 * 打开宿主里的地图，定位到这家门店。
 */
function openShopMap() {
  openShopLocation(shopLatitude.value, shopLongitude.value);
}

/**
 * 让宿主确认后拨打这家门店的电话。
 */
function callShopPhone() {
  makeShopPhoneCall(shopPhoneText.value);
}
</script>

<style scoped>
.store {
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  height: calc(162px + var(--ct-safe-top, 0px));
  padding: 16px 16px 28px;
  padding-top: calc(16px + var(--ct-safe-top, 0px));
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 0;
  color: rgba(245, 243, 255, 0.78);
  font-size: 13px;
  line-height: 1.6;
}
.time-zone-tag {
  display: inline-block;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(245, 243, 255, 0.18);
  color: #f5f3ff;
  font-size: 12px;
  line-height: 20px;
}
.meta-address {
  flex-wrap: nowrap;
}
.meta-text {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.meta-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(245, 243, 255, 0.18);
  color: #f5f3ff;
}
.meta-action :deep(.app-icon) {
  width: 14px;
  height: 14px;
}
</style>
