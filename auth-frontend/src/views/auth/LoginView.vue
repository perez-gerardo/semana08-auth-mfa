<template>
  <div class="min-h-screen bg-[#030712] font-mono flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-emerald-500 rounded flex items-center justify-center">
            <span class="text-white font-bold text-3xl">TS</span>
          </div>
        </div>
        <h1 class="text-2xl font-bold text-gray-100 uppercase tracking-wider">TechStore // Core</h1>
        <p class="text-gray-500 text-xs mt-2 uppercase tracking-wider">Sistema de Autenticación Central</p>
      </div>

      <!-- Card -->
      <div class="bg-[#0b0e14] border border-[#1f2937] p-6 rounded shadow-2xl">
        <form @submit.prevent="handleLogin" class="space-y-6">

          <!-- Alert -->
          <div v-if="error"
               class="flex items-start gap-3 p-3 rounded text-xs font-medium tracking-wider
                      bg-red-500/10 text-red-400 border border-red-500/30 uppercase">
            [ERR] {{ error }}
          </div>

          <!-- Bloqueado -->
          <div v-if="bloqueado"
               class="flex items-start gap-3 p-3 rounded text-xs font-medium tracking-wider
                      bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 uppercase">
            [LOCKED] {{ error }}
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              SYS.LOGIN_ID
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="admin@techstore.com"
              class="w-full bg-[#030712] border border-[#1f2937] text-gray-200 px-4 py-3 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              :disabled="loading"
              required
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              SYS.SECRET_KEY
            </label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="********"
                class="w-full bg-[#030712] border border-[#1f2937] text-gray-200 px-4 py-3 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-10"
                :disabled="loading"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
                       hover:text-emerald-400 transition-colors text-xs font-bold uppercase">
                {{ showPassword ? '[H]' : '[S]' }}
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full border border-emerald-500/50 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/20 py-3 rounded uppercase tracking-widest text-xs font-bold transition-all"
            :disabled="loading">
            <span v-if="loading" class="flex items-center justify-center gap-2 animate-pulse">
              [ AUTHENTICATING... ]
            </span>
            <span v-else>INIT // SESSION</span>
          </button>

        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest">
        PROTOCOLO SEGURO ACTIVO (MFA / RBAC / ABAC)
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter }     from 'vue-router';
import { useAuthStore }  from '../../stores/auth.store';

const router    = useRouter();
const authStore = useAuthStore();

const form = reactive({ email: '', password: '' });
const loading      = ref(false);
const error        = ref('');
const bloqueado    = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
  error.value   = '';
  loading.value = true;

  try {
    const result = await authStore.login(form.email, form.password);

    if (result.mfa_requerido) {
      window.location.replace('/mfa');
    } else {
      window.location.replace('/productos');
    }
  } catch (err) {
    const status  = err.response?.status;
    const mensaje = err.response?.data?.message || 'Error al iniciar sesión';
    if (status === 423) bloqueado.value = true;
    error.value   = mensaje;
    loading.value = false;
  }
};
</script>