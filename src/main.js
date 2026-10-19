import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import HotelBookingPage from './pages/hotel/booking.vue';
import KtvBookingPage from './pages/ktv/booking.vue';
import MemberPage from './pages/member/index.vue';
import { BookingShopQuery, H5PagePath, PageTitle } from './utils/constants.js';
import { enterMiniProgramApp } from './utils/gv-sdk.js';

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

const app = createApp(App);
app.use(createPageRouter());
app.mount('#app');
enterMiniProgramApp();
