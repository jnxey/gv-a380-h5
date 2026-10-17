export const ResponseCode = {
  SUCCESS: 0,
};

export const HttpStatusCode = {
  UNAUTHORIZED: 401,
};

export const ShopType = {
  KTV: 'KTV',
  HOTEL: 'HOTEL',
};

export const FinanceBizType = {
  RECHARGE: 'RECHARGE',
};

export const FinanceDirection = {
  IN: 'IN',
  OUT: 'OUT',
};

export const KtvBookingHour = {
  MIN: 1,
  MAX: 24,
};

export const KtvBookingSlot = {
  COUNT: 8,
  STEP_MINUTES: 30,
  LEAD_MINUTES: 15,
};

export const PageSetting = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
};

export const H5PagePath = {
  MEMBER: '/pages/member/index',
  KTV_BOOKING: '/pages/ktv/booking',
  HOTEL_BOOKING: '/pages/hotel/booking',
};

export const PageTitle = {
  DEFAULT: 'A380',
  MEMBER: '会员中心',
  KTV_BOOKING: 'KTV订房',
  HOTEL_BOOKING: '酒店订房',
};

export const BookingShopQuery = {
  SHOP_CODE: 'shopCode',
};

export const statusLabelMap = {
  RECHARGE: '充值',
  KTV_BOOKING: 'KTV预订',
  KTV_IN_STORE: 'KTV店内消费',
  HOTEL_ROOM_FEE: '酒店房费',
  REFUND: '退款',
  IN: '收入',
  OUT: '支出',
  PENDING_VERIFY: '待核销',
  VERIFIED: '已核销',
  REFUNDED: '已退款',
  BOOKED: '已预订',
  CHECKED_IN: '已入住',
  CHECKED_OUT: '已退房',
  CANCELLED: '已取消',
  SMALL: '小包',
  MEDIUM: '中包',
  LARGE: '大床/大包',
  TWIN: '双床',
};

/**
 * 把状态编码转成中文。
 */
export function statusLabel(statusCode) {
  const label = statusLabelMap[statusCode];
  if (label === undefined) {
    return statusCode;
  }
  return label;
}
