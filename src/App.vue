<template>
  <div class="app">
    <header v-if="showPageHead" class="page-head">{{ pageTitle }}</header>
    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { H5PagePath, PageTitle } from './utils/constants.js';
import { isEmpty } from './utils/tools.js';

const currentRoute = useRoute();

/**
 * 当前页标题。三个模块首页都不显示返回。
 */
const pageTitle = computed(() => {
  if (isEmpty(currentRoute.meta) || isEmpty(currentRoute.meta.title)) {
    return PageTitle.DEFAULT;
  }
  return currentRoute.meta.title;
});

/**
 * KTV 预定页、酒店预定页、商铺选购页和会员中心不显示标题栏。浏览器标题仍使用页面标题。
 */
const showPageHead = computed(() => {
  const routePath = currentRoute.path;
  if (isEmpty(routePath)) {
    return true;
  }
  if (routePath.indexOf(H5PagePath.KTV_BOOKING) === 0) {
    return false;
  }
  if (routePath.indexOf(H5PagePath.HOTEL_BOOKING) === 0) {
    return false;
  }
  if (routePath.indexOf(H5PagePath.STORE_SHOP) === 0) {
    return false;
  }
  return routePath !== H5PagePath.MEMBER;
});

watch(pageTitle, (title) => {
  document.title = title;
});

/**
 * 打开时写入浏览器标题。
 */
onMounted(() => {
  document.title = pageTitle.value;
});
</script>
