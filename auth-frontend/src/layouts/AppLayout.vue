<template>
  <div class="min-h-screen bg-[#030712] text-gray-300 font-mono">
    <AppNavbar />
    <main class="max-w-7xl mx-auto px-4 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import AppNavbar from '../components/navbar/AppNavbar.vue';
</script>