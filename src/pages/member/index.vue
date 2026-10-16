<template>
  <view class="page">
    <view class="balance-card">
      <text class="name">{{ memberSummary.memberName }} {{ memberSummary.memberNo }}</text>
      <text class="label">余额（元）</text>
      <text class="balance">{{ memberSummary.balance }}</text>
      <text class="points">积分 {{ memberSummary.points }}</text>
    </view>
    <view class="section-title">充值记录</view>
    <view v-if="rechargeList.length === 0" class="empty">暂无充值记录</view>
    <view v-for="bill in rechargeList" :key="bill.id" class="bill-row">
      <view>
        <text class="bill-title">{{ statusLabel(bill.bizType) }}</text>
        <text class="bill-time">{{ bill.createdAt }}</text>
      </view>
      <text class="amount in">+{{ bill.amount }}</text>
    </view>
    <view class="section-title">账户流水</view>
    <view v-if="billList.length === 0" class="empty">暂无流水</view>
    <view v-for="bill in billList" :key="bill.id" class="bill-row">
      <view>
        <text class="bill-title">{{ statusLabel(bill.bizType) }}</text>
        <text class="bill-time">{{ bill.createdAt }} {{ bill.remark }}</text>
      </view>
      <text :class="isIncome(bill.direction) ? 'amount in' : 'amount out'">
        {{ isIncome(bill.direction) ? '+' : '-' }}{{ bill.amount }}
      </text>
    </view>
  </view>
</template>

<script>
import { request } from '../../utils/request.js';
import { FinanceBizType, FinanceDirection, PageSetting, statusLabel } from '../../utils/constants.js';
import { isEmpty } from '../../utils/tools.js';

export default {
  data() {
    return {
      memberSummary: {
        memberName: '',
        memberNo: '',
        balance: '0.00',
        points: 0,
      },
      rechargeList: [],
      billList: [],
    };
  },
  /**
   * 进入会员中心时刷新余额和流水。
   */
  onShow() {
    this.loadMemberCenter();
  },
  methods: {
    statusLabel,
    /**
     * 判断流水是否为入账。
     */
    isIncome(direction) {
      return direction === FinanceDirection.IN;
    },
    /**
     * 读取会员摘要、充值记录和全部流水。充值不能在这里发起。
     */
    async loadMemberCenter() {
      const memberSummary = await request({ url: '/app/member/summary', method: 'GET' });
      if (!isEmpty(memberSummary)) {
        this.memberSummary = memberSummary;
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
      this.rechargeList = isEmpty(rechargePage) ? [] : rechargePage.list;
      const billPage = await request({
        url: '/app/member/bills',
        method: 'GET',
        data: {
          page: PageSetting.DEFAULT_PAGE,
          pageSize: PageSetting.DEFAULT_PAGE_SIZE,
        },
      });
      this.billList = isEmpty(billPage) ? [] : billPage.list;
    },
  },
};
</script>

<style>
.page {
  padding: 24rpx;
}
.balance-card {
  background: #1f4b99;
  color: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}
.name,
.label,
.points,
.balance {
  display: block;
}
.balance {
  font-size: 56rpx;
  margin: 12rpx 0;
}
.section-title {
  margin: 28rpx 0 12rpx;
  font-weight: 600;
}
.bill-row {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
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
  margin-top: 6rpx;
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
