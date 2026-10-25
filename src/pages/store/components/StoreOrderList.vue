<template>
  <p v-if="isEmpty(orderList)" class="empty">暂无订单</p>
  <PageVirtualList
    v-else
    :item-list="orderList"
    item-key="saleId"
    :has-more="hasMoreOrders"
    :loading="orderLoading"
    @load-more="emit('load-more')"
  >
    <template #default="{ item: saleRow }">
      <div class="order-row">
        <button class="order-info" type="button" @click="openOrderDetail(saleRow)">
          <div class="order-head">
            <h2>{{ saleRow.saleNo }}</h2>
            <span>{{ statusLabel(saleRow.saleStatus) }}</span>
          </div>
          <p class="order-sub">{{ formatShopDateTime(saleRow.createdAt, timeZone) }}</p>
          <div v-for="itemRow in saleRow.itemList" :key="`${saleRow.saleId}-${itemRow.productId}`" class="order-item">
            {{ itemRow.productName }} × {{ itemRow.quantity }}
          </div>
        </button>
        <div class="order-foot">
          <div>
            <strong class="order-amount">{{ readPaidAmount(saleRow) }}</strong>
            <p v-if="hasPointDeduct(saleRow)" class="order-deduct">积分抵扣 {{ saleRow.pointDeductAmount }} 元</p>
          </div>
          <div class="order-actions">
            <button v-if="canCancel(saleRow)" class="cancel-button" type="button" @click="openCancel(saleRow)">取消</button>
            <button v-if="canReceive(saleRow)" class="review-button" type="button" @click="openReceive(saleRow)">确认收货</button>
            <button v-if="canReview(saleRow)" class="review-button" type="button" @click="openReview(saleRow)">去评价</button>
          </div>
        </div>
      </div>
    </template>
  </PageVirtualList>
  <ConfirmDialog
    :open="isEmpty(pendingCancelSale) !== true"
    message="确定取消这笔订单？已支付将退回余额。"
    :confirming="orderActionSubmitting"
    :accent="ConfirmDialogAccent.STORE"
    @cancel="closeCancel"
    @confirm="submitCancel"
  />
  <ConfirmDialog
    :open="isEmpty(pendingReceiveSale) !== true"
    message="确认已经收到商品？"
    confirm-label="确认收货"
    :confirming="orderActionSubmitting"
    :accent="ConfirmDialogAccent.STORE"
    @cancel="closeReceive"
    @confirm="submitReceive"
  />
  <div v-if="isEmpty(detailSale) !== true" class="detail-mask" @click="closeOrderDetail">
    <section class="detail-card" @click.stop>
      <h2>订单详情</h2>
      <p class="detail-no">{{ detailSale.saleNo }}</p>
      <h3>收货信息</h3>
      <p v-if="isEmpty(detailSale.receiverName) !== true" class="detail-line">收货人 {{ detailSale.receiverName }}</p>
      <p v-if="isEmpty(detailSale.contact) !== true" class="detail-line">联系方式 {{ detailSale.contact }}</p>
      <p v-if="isEmpty(detailSale.deliveryAddress) !== true" class="detail-line">收货地址 {{ detailSale.deliveryAddress }}</p>
      <p v-if="hasReceiveInfo(detailSale) !== true" class="detail-line">暂无</p>
      <h3>送货信息</h3>
      <p v-if="isEmpty(detailSale.courierName) !== true" class="detail-line">送货人 {{ detailSale.courierName }}</p>
      <p v-if="isEmpty(detailSale.courierContact) !== true" class="detail-line">送货联系方式 {{ detailSale.courierContact }}</p>
      <p v-if="isEmpty(detailSale.deliveryNo) !== true" class="detail-line">送货号 {{ detailSale.deliveryNo }}</p>
      <p v-if="isEmpty(detailSale.deliveryRemark) !== true" class="detail-line">送货备注 {{ detailSale.deliveryRemark }}</p>
      <p v-if="hasDeliveryInfo(detailSale) !== true" class="detail-line">暂无</p>
      <p class="detail-line">实付 {{ readPaidAmount(detailSale) }}</p>
      <p v-if="hasPointDeduct(detailSale)" class="detail-line">积分抵扣 {{ detailSale.pointDeductAmount }} 元</p>
      <button class="detail-close" type="button" @click="closeOrderDetail">关闭</button>
    </section>
  </div>
  <ShopReviewDialog
    :open="isEmpty(pendingReviewSale) !== true"
    :biz-type="ShopReviewBizType.STORE_SALE"
    :biz-order-id="isEmpty(pendingReviewSale) ? '' : pendingReviewSale.saleId"
    @cancel="closeReview"
    @saved="onReviewSaved"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import PageVirtualList from '../../../components/PageVirtualList/PageVirtualList.vue';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog.vue';
import ShopReviewDialog from '../../../components/ShopReviewDialog/ShopReviewDialog.vue';
import { StoreApi } from '../../../api/store.js';
import { ConfirmDialogAccent, ShopReviewBizType, StoreSaleStatus, statusLabel } from '../../../utils/constants.js';
import { request } from '../../../utils/request.js';
import { formatShopDateTime, isEmpty } from '../../../utils/tools.js';

const props = defineProps({
  orderList: {
    default() {
      return [];
    },
  },
  orderTotal: {
    default: 0,
  },
  orderLoading: {
    default: false,
  },
  timeZone: {
    default: '',
  },
});

const emit = defineEmits(['load-more', 'refresh-orders']);

const pendingReviewSale = ref(null);
const pendingCancelSale = ref(null);
const pendingReceiveSale = ref(null);
const detailSale = ref(null);
const orderActionSubmitting = ref(false);

/**
 * 收货人、联系方式、收货地址里有一项就算有收货信息。
 */
function hasReceiveInfo(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return isEmpty(saleRow.receiverName) !== true || isEmpty(saleRow.contact) !== true || isEmpty(saleRow.deliveryAddress) !== true;
}

/**
 * 送货人、联系方式、送货号、备注里有一项就算有送货信息。
 */
function hasDeliveryInfo(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return isEmpty(saleRow.courierName) !== true
    || isEmpty(saleRow.courierContact) !== true
    || isEmpty(saleRow.deliveryNo) !== true
    || isEmpty(saleRow.deliveryRemark) !== true;
}

/**
 * 实付金额。原价减去本单记下的积分抵扣。
 */
function readPaidAmount(saleRow) {
  if (isEmpty(saleRow) || isEmpty(saleRow.amount)) {
    return '';
  }
  const goodsAmount = Number(saleRow.amount);
  const deductAmount = isEmpty(saleRow.pointDeductAmount) ? 0 : Number(saleRow.pointDeductAmount);
  if (Number.isFinite(goodsAmount) !== true) {
    return saleRow.amount;
  }
  const paidAmount = goodsAmount - (Number.isFinite(deductAmount) === true ? deductAmount : 0);
  return paidAmount.toFixed(2);
}

/**
 * 这笔订单是否用积分抵扣了一部分。
 */
function hasPointDeduct(saleRow) {
  return isEmpty(saleRow) !== true && isEmpty(saleRow.pointDeductPoints) !== true && saleRow.pointDeductPoints > 0;
}

/**
 * 打开订单的收货和送货详情。
 */
function openOrderDetail(saleRow) {
  if (isEmpty(saleRow)) {
    return;
  }
  detailSale.value = saleRow;
}

/**
 * 关掉订单详情。
 */
function closeOrderDetail() {
  detailSale.value = null;
}

/**
 * 待发货销售单可以取消。
 */
function canCancel(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return saleRow.saleStatus === StoreSaleStatus.PENDING_DELIVERY;
}

/**
 * 送货中的销售单可以确认收货。
 */
function canReceive(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return saleRow.saleStatus === StoreSaleStatus.DELIVERING;
}

/**
 * 打开取消确认。
 */
function openCancel(saleRow) {
  if (canCancel(saleRow) !== true) {
    return;
  }
  pendingCancelSale.value = saleRow;
}

/**
 * 关掉取消确认。
 */
function closeCancel() {
  if (orderActionSubmitting.value === true) {
    return;
  }
  pendingCancelSale.value = null;
}

/**
 * 确认取消待发货订单，成功后刷新列表。
 */
async function submitCancel() {
  if (orderActionSubmitting.value === true || isEmpty(pendingCancelSale.value)) {
    return;
  }
  orderActionSubmitting.value = true;
  try {
    await request({
      url: StoreApi.saleCancel(pendingCancelSale.value.saleId),
      method: 'POST',
    });
    pendingCancelSale.value = null;
    emit('refresh-orders');
  } finally {
    orderActionSubmitting.value = false;
  }
}

/**
 * 打开确认收货。
 */
function openReceive(saleRow) {
  if (canReceive(saleRow) !== true) {
    return;
  }
  pendingReceiveSale.value = saleRow;
}

/**
 * 关掉确认收货。
 */
function closeReceive() {
  if (orderActionSubmitting.value === true) {
    return;
  }
  pendingReceiveSale.value = null;
}

/**
 * 确认收货，成功后刷新列表。
 */
async function submitReceive() {
  if (orderActionSubmitting.value === true || isEmpty(pendingReceiveSale.value)) {
    return;
  }
  orderActionSubmitting.value = true;
  try {
    await request({
      url: StoreApi.saleReceive(pendingReceiveSale.value.saleId),
      method: 'POST',
    });
    pendingReceiveSale.value = null;
    emit('refresh-orders');
  } finally {
    orderActionSubmitting.value = false;
  }
}

/**
 * 已加载条数还没到总数时，滚到底可以继续加载。
 */
const hasMoreOrders = computed(() => {
  return props.orderList.length < Number(props.orderTotal);
});

/**
 * 待评价销售单可以写评价。
 */
function canReview(saleRow) {
  if (isEmpty(saleRow)) {
    return false;
  }
  return saleRow.saleStatus === StoreSaleStatus.PENDING_REVIEW;
}

/**
 * 打开评价弹层。
 */
function openReview(saleRow) {
  if (canReview(saleRow) !== true) {
    return;
  }
  pendingReviewSale.value = saleRow;
}

/**
 * 关掉评价弹层。
 */
function closeReview() {
  pendingReviewSale.value = null;
}

/**
 * 评价成功后刷新订单列表。
 */
function onReviewSaved() {
  pendingReviewSale.value = null;
  emit('refresh-orders');
}
</script>

<style scoped>
.empty {
  margin: 24px 0;
  text-align: center;
  color: #98a2b3;
  font-size: 14px;
}

.order-row {
  padding: 14px 0;
  border-bottom: 1px solid #eef0f3;
}

.order-info {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.order-head h2 {
  margin: 0;
  font-size: 15px;
  color: #111827;
}

.order-head span {
  color: #667085;
  font-size: 13px;
}

.order-sub,
.order-item {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
}

.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.order-amount {
  color: #0f766e;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.order-deduct {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.order-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.cancel-button,
.review-button {
  border: 0;
  border-radius: 999px;
  font: inherit;
}

.cancel-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #eef4f1;
  color: #1f8a70;
  font-size: 13px;
}

.review-button {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #0f766e;
  color: #fff;
  font-size: 13px;
}

.detail-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(20, 36, 28, 0.46);
}

.detail-card {
  box-sizing: border-box;
  width: min(520px, 100%);
  max-height: min(70vh, 520px);
  overflow: auto;
  padding: 16px 16px calc(16px + var(--ct-safe-bottom, 0px));
  border-radius: 22px 22px 0 0;
  background: #fff;
}

.detail-card h2,
.detail-card h3 {
  margin: 0;
  color: #111827;
}

.detail-card h2 {
  font-size: 18px;
}

.detail-card h3 {
  margin-top: 16px;
  font-size: 15px;
}

.detail-no,
.detail-line {
  margin: 8px 0 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.detail-close {
  width: 100%;
  margin-top: 16px;
  padding: 12px 0;
  border: 0;
  border-radius: 999px;
  background: #1f8a70;
  color: #fff;
  font: inherit;
  font-size: 16px;
}
</style>
