export const ResponseCode = {
  SUCCESS: 0
};

export const HttpStatusCode = {
  UNAUTHORIZED: 401
};

export const MiniappSignLifetime = {
  REFRESH_AFTER_MILLISECONDS: 90 * 60 * 1000
};

export const ShopType = {
  KTV: 'KTV',
  HOTEL: 'HOTEL'
};

export const FinanceBizType = {
  RECHARGE: 'RECHARGE'
};

export const FinanceDirection = {
  IN: 'IN',
  OUT: 'OUT'
};

export const KtvBookingHour = {
  MIN: 1,
  MAX: 24
};

export const KtvBookingSlot = {
  DAY_COUNT: 5,
  STEP_MINUTES: 30,
  LEAD_MINUTES: 15
};

export const KtvBookingStep = {
  LIST: 'list',
  FORM: 'form',
  SUCCESS: 'success'
};

/**
 * KTV 订单状态。与服务端一致。
 */
export const KtvOrderStatus = {
  PENDING_VERIFY: 'PENDING_VERIFY'
};

export const KtvContentTab = {
  BOOKING: 'booking',
  ORDER: 'order',
  REVIEW: 'review',
  SHOP: 'shop'
};

export const KtvContentTabItemList = [
  { contentTab: KtvContentTab.BOOKING, label: '预定' },
  { contentTab: KtvContentTab.ORDER, label: '订单' },
  { contentTab: KtvContentTab.REVIEW, label: '评价' },
  { contentTab: KtvContentTab.SHOP, label: '店铺' }
];

export const KtvPullRefreshState = {
  IDLE: 'idle',
  PULLING: 'pulling',
  READY: 'ready',
  REFRESHING: 'refreshing'
};

export const KtvPullRefreshSetting = {
  THRESHOLD: 56,
  MAX_DISTANCE: 120,
  RESISTANCE: 0.4,
  RING_SIZE: 36,
  RING_CENTER: 18,
  RING_RADIUS: 14
};

export const AppIconName = {
  REVIEW: 'REVIEW',
  MAP: 'MAP',
  PHONE: 'PHONE'
};

export const KtvBookingDuration = {
  HOUR_LIST: [2, 3, 4, 6],
  DEFAULT_HOURS: 2
};

export const KtvRoomCoverName = {
  SMALL: '小包',
  MEDIUM: '中包',
  LARGE: '大包',
  VIP: 'VIP'
};

export const KtvDateLabel = {
  TODAY: '今天',
  TOMORROW: '明天',
  WEEKDAY_LIST: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
};

/**
 * 门店时区。偏移是保存值，名称只用于展示。与后台选项一致。
 */
export const TimeZoneOptionList = [
  { offset: '-12:00', name: '国际日期变更线西' },
  { offset: '-11:00', name: '萨摩亚' },
  { offset: '-10:00', name: '夏威夷' },
  { offset: '-09:30', name: '马克萨斯' },
  { offset: '-09:00', name: '阿拉斯加' },
  { offset: '-08:00', name: '太平洋' },
  { offset: '-07:00', name: '山地' },
  { offset: '-06:00', name: '中部' },
  { offset: '-05:00', name: '东部' },
  { offset: '-04:00', name: '大西洋' },
  { offset: '-03:30', name: '纽芬兰' },
  { offset: '-03:00', name: '巴西利亚' },
  { offset: '-02:00', name: '南乔治亚' },
  { offset: '-01:00', name: '亚速尔' },
  { offset: '+00:00', name: '伦敦' },
  { offset: '+01:00', name: '中欧' },
  { offset: '+02:00', name: '东欧' },
  { offset: '+03:00', name: '莫斯科' },
  { offset: '+03:30', name: '德黑兰' },
  { offset: '+04:00', name: '迪拜' },
  { offset: '+04:30', name: '喀布尔' },
  { offset: '+05:00', name: '卡拉奇' },
  { offset: '+05:30', name: '新德里' },
  { offset: '+05:45', name: '加德满都' },
  { offset: '+06:00', name: '达卡' },
  { offset: '+06:30', name: '仰光' },
  { offset: '+07:00', name: '曼谷' },
  { offset: '+08:00', name: '北京' },
  { offset: '+09:00', name: '东京' },
  { offset: '+09:30', name: '阿德莱德' },
  { offset: '+10:00', name: '悉尼' },
  { offset: '+10:30', name: '豪勋爵岛' },
  { offset: '+11:00', name: '努美阿' },
  { offset: '+12:00', name: '奥克兰' },
  { offset: '+12:45', name: '查塔姆' },
  { offset: '+13:00', name: '努库阿洛法' },
  { offset: '+14:00', name: '基里巴斯' }
];

/**
 * 把时区偏移显示成地名加偏移。不认识的偏移原样返回。
 */
export function timeZoneLabel(timeZoneOffset) {
  const matchedOption = TimeZoneOptionList.find((timeZoneOption) => timeZoneOption.offset === timeZoneOffset);
  if (matchedOption === undefined) {
    return timeZoneOffset;
  }
  return `${matchedOption.name} ${matchedOption.offset}`;
}

export const PageSetting = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 5
};

export const H5PagePath = {
  MEMBER: '/pages/member/index',
  KTV_BOOKING: '/pages/ktv/booking',
  HOTEL_BOOKING: '/pages/hotel/booking'
};

export const PageTitle = {
  DEFAULT: 'A380',
  MEMBER: '会员中心',
  KTV_BOOKING: 'KTV订房',
  HOTEL_BOOKING: '酒店订房'
};

export const BookingShopQuery = {
  SHOP_CODE: 'shopCode'
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
  TWIN: '双床'
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
