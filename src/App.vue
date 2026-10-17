<template>
  <div class="app">
    <header class="page-head">{{ pageTitle }}</header>
    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { PageTitle } from './utils/constants.js';
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

<style>
body {
  margin: 0;
  background: #f5f6f8;
  color: #111827;
  font-size: 14px;
}

.page-head {
  height: 44px;
  line-height: 44px;
  text-align: center;
  background: #1f4b99;
  color: #fff;
  font-size: 16px;
}

.app-toast {
  display: none;
  position: fixed;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  max-width: 80%;
  padding: 8px 14px;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.86);
  color: #fff;
  font-size: 14px;
  z-index: 20;
}
</style>
