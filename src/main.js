import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import HotelBookingPage from './pages/hotel/booking.vue';
import KtvBookingPage from './pages/ktv/booking.vue';
import MemberPage from './pages/member/index.vue';
import { BookingShopQuery, H5PagePath, PageTitle } from './utils/constants.js';
import { isEmpty, isFunction } from './utils/tools.js';

/**
 * 本地调试时补上聊天 App 的令牌桥。已有宿主桥时不覆盖，正式环境不安装。
 */
function installDevAuthBridge() {
  if (import.meta.env.DEV !== true || typeof window === 'undefined') {
    return;
  }
  if (isEmpty(window.GV_SDK) !== true) {
    return;
  }
  const accessToken = import.meta.env.VITE_DEV_MEMBER_TOKEN;
  window.GV_SDK = {
    getAuthToken(options) {
      if (isEmpty(accessToken)) {
        if (isFunction(options.fail)) {
          options.fail();
        }
        return;
      }
      options.success({ token: accessToken });
    },
  };
}

/**
 * 创建页面路由。订房入口把门店编号放在路径最后一段。
 */
function createPageRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/',
        redirect: H5PagePath.MEMBER,
      },
      {
        path: H5PagePath.MEMBER,
        component: MemberPage,
        meta: { title: PageTitle.MEMBER },
      },
      {
        path: H5PagePath.KTV_BOOKING,
        component: KtvBookingPage,
        meta: { title: PageTitle.KTV_BOOKING },
      },
      {
        path: `${H5PagePath.KTV_BOOKING}/:${BookingShopQuery.SHOP_CODE}`,
        component: KtvBookingPage,
        meta: { title: PageTitle.KTV_BOOKING },
      },
      {
        path: H5PagePath.HOTEL_BOOKING,
        component: HotelBookingPage,
        meta: { title: PageTitle.HOTEL_BOOKING },
      },
      {
        path: `${H5PagePath.HOTEL_BOOKING}/:${BookingShopQuery.SHOP_CODE}`,
        component: HotelBookingPage,
        meta: { title: PageTitle.HOTEL_BOOKING },
      },
    ],
  });
}

installDevAuthBridge();

const app = createApp(App);
app.use(createPageRouter());
app.mount('#app');
