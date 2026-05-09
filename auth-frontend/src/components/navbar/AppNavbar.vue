<template>
  <nav class="bg-[#0b0e14] border-b border-[#1f2937] sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">

        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
            <span class="text-white font-bold text-sm">TS</span>
          </div>
          <span class="font-mono font-bold text-gray-200 tracking-wider text-sm uppercase">TechStore // Core</span>
        </div>

        <!-- Links -->
        <div class="flex items-center gap-2">
          <router-link
            to="/productos"
            class="px-3 py-2 rounded text-xs font-mono font-medium text-gray-400
                   hover:text-white hover:bg-[#1a2235] transition-colors uppercase tracking-wider"
            active-class="bg-[#1a2235] text-emerald-400 border-b-2 border-emerald-500">
            Inventario
          </router-link>

          <template v-if="authStore.isAdmin">
            <router-link
              to="/usuarios"
              class="px-3 py-2 rounded text-xs font-mono font-medium text-gray-400
                     hover:text-white hover:bg-[#1a2235] transition-colors uppercase tracking-wider"
              active-class="bg-[#1a2235] text-emerald-400 border-b-2 border-emerald-500">
              Usuarios
            </router-link>

            <router-link
              to="/roles"
              class="px-3 py-2 rounded text-xs font-mono font-medium text-gray-400
                     hover:text-white hover:bg-[#1a2235] transition-colors uppercase tracking-wider"
              active-class="bg-[#1a2235] text-emerald-400 border-b-2 border-emerald-500">
              Permisos
            </router-link>
          </template>
        </div>

        <!-- Usuario + logout -->
        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-mono text-gray-300">
              {{ authStore.usuario?.nombre_completo }}
            </p>
            <div class="flex gap-1 justify-end mt-1">
              <span
                v-for="rol in authStore.roles" :key="rol"
                class="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded bg-gray-800 text-gray-400 border border-gray-700">
                {{ rol }}
              </span>
            </div>
          </div>

          <button
            @click="authStore.logout()"
            class="bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-mono font-medium
                   py-1.5 px-3 rounded transition-colors uppercase tracking-wider">
            Log Out
          </button>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.store';
const authStore = useAuthStore();
</script>