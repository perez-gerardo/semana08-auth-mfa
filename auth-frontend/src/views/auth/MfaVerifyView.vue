<template>
  <div class="min-h-screen bg-[#030712] font-mono flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 border-2 border-emerald-500 rounded flex items-center justify-center animate-pulse">
            <span class="text-emerald-500 font-bold text-3xl">MFA</span>
          </div>
        </div>
        <h1 class="text-2xl font-bold text-gray-100 uppercase tracking-wider">Verificación de 2 Pasos</h1>
        <p class="text-gray-500 text-xs mt-2 uppercase tracking-wider">
          > Inserte el código TOTP
        </p>
      </div>

      <!-- Card -->
      <div class="bg-[#0b0e14] border border-[#1f2937] p-6 rounded shadow-2xl">
        <form @submit.prevent="handleVerify" class="space-y-6">

          <!-- Alert error -->
          <div v-if="error"
               class="flex items-start gap-3 p-3 rounded text-xs font-medium tracking-wider
                      bg-red-500/10 text-red-400 border border-red-500/30 uppercase">
            [ERR] {{ error }}
          </div>

          <!-- Alert bloqueado -->
          <div v-if="bloqueado"
               class="flex items-start gap-3 p-3 rounded text-xs font-medium tracking-wider
                      bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 uppercase">
            [LOCKED] Demasiados intentos.
          </div>

          <!-- Info -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-[10px] text-blue-400 uppercase tracking-wider">
            [SYS.INFO] Abre Google Authenticator e ingresa el token de 6 dígitos.
          </div>

          <!-- 6 inputs -->
          <div>
            <label class="block text-[10px] font-medium text-emerald-500 mb-3 text-center uppercase tracking-wider">
              > TOKEN TOTP
            </label>
            <div class="flex gap-2 justify-center">
              <input
                v-for="(_, i) in 6" :key="i"
                :ref="el => { if (el) inputs[i] = el }"
                v-model="digits[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="w-12 h-14 text-center text-xl font-bold bg-[#030712] border border-[#1f2937] text-gray-200
                       rounded focus:outline-none focus:border-emerald-500 transition-colors"
                :class="error ? 'border-red-500/50 text-red-400' : ''"
                :disabled="loading || bloqueado"
                @input="handleInput(i, $event)"
                @keydown.backspace="handleBackspace(i)"
                @paste.prevent="handlePaste"
              />
            </div>
          </div>

          <!-- Intentos -->
          <p v-if="intentos > 0" class="text-center text-[10px] text-yellow-500 font-medium tracking-wider uppercase">
            [WARN] FALLOS REGISTRADOS: {{ intentos }}/3
          </p>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full border border-emerald-500/50 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/20 py-3 rounded uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-50"
            :disabled="loading || bloqueado || codigoCompleto.length < 6">
            <span v-if="loading" class="flex items-center justify-center gap-2 animate-pulse">
              [ VERIFICANDO... ]
            </span>
            <span v-else>AUTHORIZE // TOTP</span>
          </button>

          <!-- Volver -->
          <button type="button" @click="volverAlLogin" class="w-full text-[10px] text-gray-500 hover:text-gray-300 uppercase tracking-widest transition-colors mt-4">
            [<] ABORT_MISSION
          </button>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore }  from '../../stores/auth.store';

const authStore = useAuthStore();

const digits    = ref(['', '', '', '', '', '']);
const inputs    = ref([]);
const loading   = ref(false);
const error     = ref('');
const bloqueado = ref(false);
const intentos  = ref(0);

const codigoCompleto = computed(() => digits.value.join(''));

const handleInput = (index, event) => {
  const val = event.target.value.replace(/\D/g, '');
  digits.value[index] = val;
  if (val && index < 5) inputs.value[index + 1]?.focus();
  if (codigoCompleto.value.length === 6) handleVerify();
};

const handleBackspace = (index) => {
  if (!digits.value[index] && index > 0) {
    digits.value[index - 1] = '';
    inputs.value[index - 1]?.focus();
  }
};

const handlePaste = (event) => {
  const paste = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
  paste.split('').forEach((char, i) => { digits.value[i] = char; });
  inputs.value[Math.min(paste.length, 5)]?.focus();
};

const handleVerify = async () => {
  if (codigoCompleto.value.length < 6 || loading.value) return;

  error.value   = '';
  loading.value = true;

  try {
    await authStore.verificarMfa(codigoCompleto.value);
    window.location.replace('/productos');
  } catch (err) {
    const status = err.response?.status;
    if (status === 423) {
      bloqueado.value = true;
    } else {
      intentos.value++;
      digits.value = ['', '', '', '', '', ''];
      setTimeout(() => inputs.value[0]?.focus(), 100);
    }
    error.value = err.response?.data?.message || 'Código inválido';
  } finally {
    loading.value = false;
  }
};

const volverAlLogin = () => {
  localStorage.removeItem('mfa_token');
  window.location.replace('/login');
};
</script>