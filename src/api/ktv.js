/**
 * KTV 接口地址（相对 API_PREFIX）。
 */
export const KtvApi = {
  ROOM_TYPES: '/ktv/room-types',
  BOOKING_ORDERS: '/ktv/booking-orders',
  /**
   * 会员取消预订。
   */
  bookingOrderCancel(bookingOrderId) {
    return `/ktv/booking-orders/${bookingOrderId}/cancel`;
  }
};
