<template>
  <div class="point-center">
    <header class="hero">
      <p class="kicker">积分余额</p>
      <h1>{{ pointSummary.balance }}</h1>
      <p v-if="isEmpty(pointSummary.pointsAccount) !== true" class="account">
        <span class="account-text">积分账号：{{ pointSummary.pointsAccount }}</span>
      </p>
    </header>
    <p v-if="pointCenterLoaded && billList.length === 0" class="banner">暂无流水</p>
    <ul v-else class="list">
      <li v-for="bill in billList" :key="bill.id" class="row" :class="isIncome(bill.direction) ? 'increase' : 'decrease'">
        <div class="mark">{{ isIncome(bill.direction) ? '+' : '−' }}</div>
        <div>
          <div class="name">{{ bill.bizType }}</div>
          <div class="time">{{ bill.createdAt }}</div>
          <div v-if="isEmpty(bill.remark) !== true" class="remark">{{ bill.remark }}</div>
        </div>
        <div class="money">
          <strong>{{ formatBillAmount(bill) }}</strong>
          <div v-if="isEmpty(bill.balanceAfter) !== true" class="after">余额 {{ bill.balanceAfter }}</div>
        </div>
      </li>
    </ul>
    <button v-if="hasMoreBills" class="more" type="button" :disabled="billLoading" @click="loadMoreBills">{{ billLoading ? '加载中' : '加载更多' }}</button>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { PointApi } from '../../api/point.js';
import { request } from '../../utils/request.js';
import { FinanceDirection, PageSetting } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

const pointSummary = ref({
  pointsAccount: '',
  balance: '0',
});
const billList = ref([]);
const billTotal = ref(0);
const billPage = ref(PageSetting.DEFAULT_PAGE);
const billLoading = ref(false);
const pointCenterLoaded = ref(false);

/**
 * 已加载条数还没到总数时，可以继续翻页。
 */
const hasMoreBills = computed(() => {
  return billList.value.length < billTotal.value;
});

/**
 * 判断流水是否为入账。
 */
function isIncome(direction) {
  return direction === FinanceDirection.IN;
}

/**
 * 按方向给金额加上正负号。
 */
function formatBillAmount(bill) {
  const amountText = String(isEmpty(bill.amount) ? '' : bill.amount).replace(/^[+-]/, '');
  if (isIncome(bill.direction)) {
    return `+${amountText}`;
  }
  return `-${amountText}`;
}

/**
 * 读取一页积分流水。第一页替换列表，之后追加。空页时不再继续翻。
 */
async function loadBillPage(page) {
  // 1. 按页拉取当前会员的积分流水
  const billPageResult = await request({
    url: PointApi.BILLS,
    method: 'GET',
    data: {
      page,
      pageSize: PageSetting.DEFAULT_PAGE_SIZE,
    },
  });
  const nextList = isEmpty(billPageResult) || isEmpty(billPageResult.list) ? [] : billPageResult.list;
  const nextTotal = isEmpty(billPageResult) || isEmpty(billPageResult.total) ? 0 : Number(billPageResult.total);
  // 2. 第一页覆盖，后续页接到后面。这一页没有数据就停在已有条数
  if (page !== PageSetting.DEFAULT_PAGE && nextList.length === 0) {
    billTotal.value = billList.value.length;
    return;
  }
  if (page === PageSetting.DEFAULT_PAGE) {
    billList.value = nextList;
  } else {
    billList.value = billList.value.concat(nextList);
  }
  billTotal.value = Number.isFinite(nextTotal) ? nextTotal : billList.value.length;
  billPage.value = page;
}

/**
 * 读取积分余额和第一页流水。
 */
async function loadPointCenter() {
  const pointSummaryResult = await request({ url: PointApi.SUMMARY, method: 'GET' });
  if (!isEmpty(pointSummaryResult)) {
    pointSummary.value = pointSummaryResult;
  }
  await loadBillPage(PageSetting.DEFAULT_PAGE);
  pointCenterLoaded.value = true;
}

/**
 * 加载下一页流水。正在请求或已经到末页时不重复请求。
 */
async function loadMoreBills() {
  if (billLoading.value || hasMoreBills.value !== true) {
    return;
  }
  billLoading.value = true;
  try {
    await loadBillPage(billPage.value + 1);
  } finally {
    billLoading.value = false;
  }
}

/**
 * 进入积分明细时刷新余额和流水。
 */
onMounted(() => {
  loadPointCenter();
});
</script>

<style scoped>
.point-center {
  min-height: 100vh;
  padding: 18px 16px calc(28px + env(safe-area-inset-bottom));
  color: #14241c;
  background:
    radial-gradient(1200px 420px at 50% -80px, rgba(31, 138, 112, 0.12), transparent 60%),
    #f3efe8;
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 22px 20px 20px;
  border-radius: 24px;
  color: #f7f3ea;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), transparent 42%),
    #14241c;
  box-shadow: 0 18px 40px rgba(20, 36, 28, 0.16);
}

.hero::after {
  content: '';
  position: absolute;
  right: -28px;
  top: -36px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, #1f8a70 0%, transparent 68%);
  opacity: 0.55;
  pointer-events: none;
}

.kicker {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.kicker::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1f8a70;
}

.hero h1 {
  position: relative;
  z-index: 1;
  margin: 14px 0 0;
  font-size: 32px;
  line-height: 1.2;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.account {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  margin: 12px 0 0;
  font-size: 16px;
}

.account-text {
  min-width: 0;
  word-break: break-all;
}

.banner {
  margin: 18px 4px 0;
  color: #6d655c;
  font-size: 14px;
  line-height: 1.6;
}

.list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  padding: 14px 14px 14px 12px;
  border: 1px solid rgba(20, 36, 28, 0.08);
  border-radius: 18px;
  background: #fffdf9;
  box-shadow: 0 8px 20px rgba(42, 33, 22, 0.04);
}

.mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 700;
}

.increase .mark {
  color: #0f7a56;
  background: rgba(15, 122, 86, 0.1);
}

.decrease .mark {
  color: #c2412d;
  background: rgba(194, 65, 45, 0.1);
}

.name {
  font-size: 16px;
  font-weight: 600;
}

.time,
.remark,
.after {
  margin-top: 4px;
  color: #6d655c;
  font-size: 12px;
  line-height: 1.45;
}

.money {
  text-align: right;
}

.money strong {
  display: block;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.increase .money strong {
  color: #0f7a56;
}

.decrease .money strong {
  color: #c2412d;
}

.after {
  font-variant-numeric: tabular-nums;
}

.more {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 13px 16px;
  border: 1px solid rgba(20, 36, 28, 0.08);
  border-radius: 999px;
  background: transparent;
  color: #14241c;
  font-size: 14px;
}

.more:disabled {
  opacity: 0.55;
}
</style>
