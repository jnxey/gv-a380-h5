/**
 * 商超接口地址（相对 API_PREFIX）。
 */
export const StoreApi = {
  PRODUCT_CATEGORIES: '/store/product-categories',
  PRODUCTS: '/store/products',
  SALES: '/store/sales',
  saleCancel: (saleId) => `/store/sales/${saleId}/cancel`,
  saleReceive: (saleId) => `/store/sales/${saleId}/receive`,
};
