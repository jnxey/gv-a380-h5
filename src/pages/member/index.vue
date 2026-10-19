<template>
  <div class="page">
    <div class="balance-card">
      <span class="name">{{ memberSummary.username }}</span>
      <span v-if="isEmpty(memberSummary.contact) !== true" class="contact">{{ memberSummary.contact }}</span>
      <span class="label">余额（元）</span>
      <span class="balance">{{ memberSummary.balance }}</span>
    </div>
    <div class="section-title">充值记录</div>
    <div v-if="rechargeList.length === 0" class="empty">暂无充值记录</div>
    <div v-for="bill in rechargeList" :key="bill.id" class="bill-row">
      <div>
        <span class="bill-title">{{ statusLabel(bill.bizType) }}</span>
        <span class="bill-time">{{ bill.createdAt }}</span>
      </div>
      <span class="amount in">+{{ bill.amount }}</span>
    </div>
    <div class="section-title">账户流水</div>
    <div v-if="billList.length === 0" class="empty">暂无流水</div>
    <div v-for="bill in billList" :key="bill.id" class="bill-row">
      <div>
        <span class="bill-title">{{ statusLabel(bill.bizType) }}</span>
        <span class="bill-time">{{ bill.createdAt }} {{ bill.remark }}</span>
      </div>
      <span :class="isIncome(bill.direction) ? 'amount in' : 'amount out'">
        {{ isIncome(bill.direction) ? '+' : '-' }}{{ bill.amount }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { request } from '../../utils/request.js';
import { FinanceBizType, FinanceDirection, PageSetting, statusLabel } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

const memberSummary = ref({
  username: '',
  contact: '',
  balance: '0.00',
});
const rechargeList = ref([]);
const billList = ref([]);

/**
 * 判断流水是否为入账。
 */
function isIncome(direction) {
  return direction === FinanceDirection.IN;
}

/**
 * 读取会员摘要、充值记录和全部流水。充值不能在这里发起。
 */
async function loadMemberCenter() {
  const memberSummaryResult = await request({ url: '/app/member/summary', method: 'GET' });
  if (!isEmpty(memberSummaryResult)) {
    memberSummary.value = memberSummaryResult;
  }
  const rechargePage = await request({
    url: '/app/member/bills',
    method: 'GET',
    data: {
      bizType: FinanceBizType.RECHARGE,
      page: PageSetting.DEFAULT_PAGE,
      pageSize: PageSetting.DEFAULT_PAGE_SIZE,
    },
  });
  rechargeList.value = isEmpty(rechargePage) ? [] : rechargePage.list;
  const billPage = await request({
    url: '/app/member/bills',
    method: 'GET',
    data: {
      page: PageSetting.DEFAULT_PAGE,
      pageSize: PageSetting.DEFAULT_PAGE_SIZE,
    },
  });
  billList.value = isEmpty(billPage) ? [] : billPage.list;
}

/**
 * 进入会员中心时刷新余额和流水。
 */
onMounted(() => {
  loadMemberCenter();
});
</script>

<style>
.page {
  padding: 12px;
}
.balance-card {
  background: #1f4b99;
  color: #fff;
  border-radius: 8px;
  padding: 16px;
}
.name,
.contact,
.label,
.balance {
  display: block;
}
.balance {
  font-size: 28px;
  margin: 6px 0;
}
.section-title {
  margin: 14px 0 6px;
  font-weight: 600;
}
.bill-row {
  background: #fff;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bill-title,
.bill-time {
  display: block;
}
.bill-time {
  color: #6b7280;
  margin-top: 3px;
}
.amount.in {
  color: #047857;
}
.amount.out {
  color: #b91c1c;
}
.empty {
  color: #6b7280;
}
</style>
