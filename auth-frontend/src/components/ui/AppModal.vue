<template>
  <Teleport to="body">
    <div v-if="open"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono"
         @click.self="$emit('close')">

      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <!-- Modal -->
      <div class="relative bg-[#0b0e14] border border-[#1f2937] rounded shadow-2xl w-full max-w-md z-10">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-[#1f2937] bg-[#1a2235]">
          <h3 class="text-sm font-bold text-gray-200 uppercase tracking-wider">> {{ title }}</h3>
          <button @click="$emit('close')"
                  class="text-gray-500 hover:text-white transition-colors text-xs">
            [X]
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  open:  { type: Boolean, required: true },
  title: { type: String,  default: '' },
});
defineEmits(['close']);
</script>