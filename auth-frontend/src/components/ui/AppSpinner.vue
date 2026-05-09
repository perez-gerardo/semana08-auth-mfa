<template>
  <div class="flex items-center justify-center" :class="fullScreen ? 'min-h-screen' : 'py-8'">
    <div class="animate-spin rounded-full border-4 border-gray-200 border-t-primary-600"
         :class="size === 'sm' ? 'h-6 w-6' : 'h-10 w-10'">
    </div>
  </div>
</template>

<script setup>
defineProps({
  fullScreen: { type: Boolean, default: false },
  size:       { type: String,  default: 'md' },
});
</script>