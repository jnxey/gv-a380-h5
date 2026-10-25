/**
 * 酒店接口地址（相对 API_PREFIX）。
 */
export const HotelApi = {
  ROOM_TYPES: '/hotel/room-types',
  BOOKING_ORDERS: '/hotel/booking-orders',
  /**
   * 会员取消预订。
   */
  bookingOrderCancel(bookingOrderId) {
    return `/hotel/booking-orders/${bookingOrderId}/cancel`;
  }
};
