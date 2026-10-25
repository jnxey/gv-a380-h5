<template>
  <div v-if="open === true" class="confirm-mask" @click="onMaskClick">
    <section class="confirm-card" :class="accentClassName" @click.stop>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="confirm-dismiss" type="button" :disabled="confirming === true" @click="emit('cancel')">
          再想想
        </button>
        <button class="confirm-submit" type="button" :disabled="confirming === true" @click="emit('confirm')">
          确定取消
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ConfirmDialogAccent } from '../../utils/constants.js';

const props = defineProps({
  open: {
    default: false,
  },
  message: {
    default: '',
  },
  confirming: {
    default: false,
  },
  accent: {
    default: ConfirmDialogAccent.KTV,
  },
});

const emit = defineEmits(['cancel', 'confirm']);

/**
 * 按业务线套主色。
 */
const accentClassName = computed(() => {
  if (props.accent === ConfirmDialogAccent.HOTEL) {
    return 'is-hotel';
  }
  return 'is-ktv';
});

/**
 * 提交中点遮罩不关，避免误关。
 */
function onMaskClick() {
  if (props.confirming === true) {
    return;
  }
  emit('cancel');
}
</script>

<style scoped>
.confirm-mask {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-top: calc(16px + var(--gv-safe-top, 0px));
  padding-bottom: calc(16px + var(--gv-safe-bottom, 0px));
  background: rgba(18, 12, 24, 0.46);
}
.confirm-card {
  box-sizing: border-box;
  width: min(280px, calc(100% - 48px));
  padding: 20px 16px 16px;
  border-radius: 22px;
  background: #fff;
  text-align: center;
}
.confirm-message {
  margin: 0;
  color: #111827;
  font-size: 15px;
  line-height: 1.6;
}
.confirm-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.confirm-dismiss,
.confirm-submit {
  flex: 1;
  padding: 12px 0;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 15px;
}
.confirm-dismiss {
  background: #f3f4f6;
  color: #6b7280;
}
.confirm-card.is-ktv .confirm-submit {
  background: #6d28d9;
  color: #fff;
}
.confirm-card.is-hotel .confirm-submit {
  background: #1f8a70;
  color: #fff;
}
.confirm-dismiss:disabled,
.confirm-submit:disabled {
  opacity: 0.5;
}
</style>
