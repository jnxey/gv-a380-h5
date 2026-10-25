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
  HOTEL: 'HOTEL',
  STORE: 'STORE'
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
  PENDING_PAY: 'PENDING_PAY',
  PENDING_VERIFY: 'PENDING_VERIFY',
  VERIFIED: 'VERIFIED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

/**
 * 酒店订单状态。与服务端一致。
 */
export const HotelOrderStatus = {
  PENDING_PAY: 'PENDING_PAY',
  BOOKED: 'BOOKED',
  CHECKED_IN: 'CHECKED_IN',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

/**
 * 门店评价业务类型与星级。
 */
export const ShopReviewBizType = {
  KTV_BOOKING: 'KTV_BOOKING',
  HOTEL_BOOKING: 'HOTEL_BOOKING',
  STORE_SALE: 'STORE_SALE'
};

export const ShopReviewLimit = {
  STAR_MIN: 1,
  STAR_MAX: 5,
  CONTENT_MAX_LENGTH: 500
};

/**
 * 确认弹层主色。跟业务线品牌色一致。
 */
export const ConfirmDialogAccent = {
  KTV: 'ktv',
  HOTEL: 'hotel',
  STORE: 'store'
};

/**
 * 包厢 / 房型 / 商品详情半屏主色。
 */
export const ItemDetailAccent = {
  KTV: 'ktv',
  HOTEL: 'hotel',
  STORE: 'store'
};

/**
 * 长按触发时长与滑动取消阈值。
 */
export const LongPressDelay = {
  MS: 450,
  MOVE_PX: 10
};

/**
 * 商铺销售单状态。与服务端一致。
 */
export const StoreSaleStatus = {
  PENDING_PAY: 'PENDING_PAY',
  PENDING_DELIVERY: 'PENDING_DELIVERY',
  DELIVERING: 'DELIVERING',
  PENDING_REVIEW: 'PENDING_REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

export const KtvContentTab = {
  BOOKING: 'booking',
  ORDER: 'order',
  REVIEW: 'review',
  SHOP: 'shop'
};

export const KtvContentTabItemList = [
  { contentTab: KtvContentTab.BOOKING, label: '预订' },
  { contentTab: KtvContentTab.ORDER, label: '订单' },
  { contentTab: KtvContentTab.REVIEW, label: '评价' },
  { contentTab: KtvContentTab.SHOP, label: '店铺' }
];

export const PullRefreshTone = {
  KTV: 'ktv',
  HOTEL: 'hotel',
  STORE: 'store'
};

export const PullRefreshState = {
  IDLE: 'idle',
  PULLING: 'pulling',
  READY: 'ready',
  REFRESHING: 'refreshing'
};

export const PullRefreshSetting = {
  THRESHOLD: 56,
  MAX_DISTANCE: 120,
  RESISTANCE: 0.4
};

export const AppIconName = {
  REVIEW: 'REVIEW',
  MAP: 'MAP',
  PHONE: 'PHONE',
  BOOKING_SUMMARY: 'BOOKING_SUMMARY',
  CANCEL_RULE: 'CANCEL_RULE',
  BED: 'BED',
  ROOM_SIZE: 'ROOM_SIZE',
  FLOOR: 'FLOOR',
  GUEST: 'GUEST',
  BREAKFAST: 'BREAKFAST',
  PARKING: 'PARKING'
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

export const HotelBookingStep = {
  LIST: 'list',
  FORM: 'form',
  SUCCESS: 'success'
};

export const HotelContentTab = {
  BOOKING: 'booking',
  ORDER: 'order',
  REVIEW: 'review',
  SHOP: 'shop'
};

export const HotelContentTabItemList = [
  { contentTab: HotelContentTab.BOOKING, label: '预订' },
  { contentTab: HotelContentTab.ORDER, label: '订单' },
  { contentTab: HotelContentTab.REVIEW, label: '评价' },
  { contentTab: HotelContentTab.SHOP, label: '店铺' }
];

export const HotelBookingNight = {
  NIGHT_LIST: [1, 2, 3, 5],
  DEFAULT_NIGHTS: 1
};

export const HotelBookingDate = {
  DAY_COUNT: 5
};

export const HotelBookingCalendar = {
  MONTH_COUNT: 6
};

export const HotelBookingGuest = {
  NAME_MAX_LENGTH: 64,
  CONTACT_MAX_LENGTH: 64
};

export const E164CallingCode = {
  CHINA_PREFIX: '+86'
};

export const HotelDateLabel = {
  TODAY: '今天',
  TOMORROW: '明天',
  CHECK_IN: '入住',
  CHECK_OUT: '离店',
  WEEKDAY_LIST: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  WEEKDAY_SHORT_LIST: ['日', '一', '二', '三', '四', '五', '六']
};

/**
 * 商铺选购页步骤。
 */
export const StoreSaleStep = {
  LIST: 'list',
  SUCCESS: 'success'
};

/**
 * 商铺内容 Tab。
 */
export const StoreContentTab = {
  SHOPPING: 'shopping',
  ORDER: 'order',
  REVIEW: 'review',
  SHOP: 'shop'
};

export const StoreContentTabItemList = [
  { contentTab: StoreContentTab.SHOPPING, label: '选购' },
  { contentTab: StoreContentTab.ORDER, label: '订单' },
  { contentTab: StoreContentTab.REVIEW, label: '评价' },
  { contentTab: StoreContentTab.SHOP, label: '门店' }
];

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

/**
 * 数据库连接时区。接口里的日期时间按这个偏移理解。
 */
export const DateTimeStorage = {
  TIME_ZONE_OFFSET: '+08:00'
};

export const PageSetting = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20
};

export const H5PagePath = {
  MEMBER: '/pages/member/index',
  POINT: '/pages/point/index',
  KTV_BOOKING: '/pages/ktv/booking',
  HOTEL_BOOKING: '/pages/hotel/booking',
  STORE_SHOP: '/pages/store/shop'
};

export const PageTitle = {
  DEFAULT: 'A380',
  MEMBER: '会员中心',
  POINT: '积分明细',
  KTV_BOOKING: 'KTV订房',
  HOTEL_BOOKING: '酒店订房',
  STORE_SHOP: '商铺选购'
};

export const BookingShopQuery = {
  SHOP_CODE: 'shopCode'
};

/**
 * 商铺选购页查询参数。
 */
export const StoreShopQuery = {
  ADDRESS: 'a'
};

/**
 * 本机记住的商铺收货地址。最新的一条放在最前。
 */
export const StoreDeliveryAddressHistory = {
  MAX_COUNT: 5,
  STORAGE_KEY: 'gv-a380-store-delivery-address-list'
};

/**
 * 门店记录状态。与后台一致。
 */
export const RecordStatus = {
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED'
};

/**
 * 门头上的营业状态。
 */
export const ShopOpenLabel = {
  OPEN: '营业中',
  REST: '休息中'
};

export const statusLabelMap = {
  RECHARGE: '充值',
  KTV_BOOKING: 'KTV预订',
  KTV_IN_STORE: 'KTV店内消费',
  HOTEL_ROOM_FEE: '酒店房费',
  HOTEL_IN_STORE: '酒店店内消费',
  SHOP_SCAN_PAY: '门店扫码付款',
  STORE_SALE: '商铺销售',
  REFUND: '退款',
  IN: '收入',
  OUT: '支出',
  PENDING_PAY: '待支付',
  PENDING_DELIVERY: '待发货',
  DELIVERING: '送货中',
  PENDING_VERIFY: '待核销',
  VERIFIED: '已核销',
  PENDING_REVIEW: '待评价',
  COMPLETED: '已完成',
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
