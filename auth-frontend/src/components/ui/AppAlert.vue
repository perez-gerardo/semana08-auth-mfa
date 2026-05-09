<template>
  <div v-if="message"
       class="flex items-start gap-3 p-4 rounded-lg text-sm font-medium"
       :class="styles[type]">
    <span>{{ icon }}</span>
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String,  default: '' },
  type:    { type: String,  default: 'error' },
});

const styles = {
  error:   'bg-red-50   text-red-700   border border-red-200',
  success: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  info:    'bg-blue-50  text-blue-700  border border-blue-200',
};

const icons = {
  error: '❌', success: '✅', warning: '⚠️', info: 'ℹ️',
};

const icon = icons[defineProps.type] ?? '❌';
</script>