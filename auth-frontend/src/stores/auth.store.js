import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/axios';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {

  // ── State ────────────────────────────────────────────────
  const usuario   = ref(JSON.parse(localStorage.getItem('usuario'))   || null);
  const token     = ref(localStorage.getItem('access_token')          || null);
  const mfaToken  = ref(localStorage.getItem('mfa_token')             || null);

  // ── Getters ──────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value);
  const roles           = computed(() => usuario.value?.roles || []);
  const tiendaId        = computed(() => usuario.value?.tienda_id);

  const isAdmin    = computed(() => roles.value.includes('Admin'));
  const isGerente  = computed(() => roles.value.includes('Gerente'));
  const isEmpleado = computed(() => roles.value.includes('Empleado'));
  const isAuditor  = computed(() => roles.value.includes('Auditor'));

  const hasRole = (...rolesRequeridos) => {
    return rolesRequeridos.some(r => roles.value.includes(r));
  };

  // ── Actions ──────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    if (data.mfa_requerido) {
      mfaToken.value = data.mfa_token;
      localStorage.setItem('mfa_token', data.mfa_token);
      return { mfa_requerido: true };
    }

    _guardarSesion(data.access_token, data.usuario);
    return { mfa_requerido: false };
  };

  const verificarMfa = async (codigo) => {
    const { data } = await api.post('/auth/mfa/verify', { codigo }, {
      headers: { Authorization: `Bearer ${mfaToken.value}` },
    });

    _guardarSesion(data.access_token, data.usuario);

    // Limpiar mfa_token temporal
    mfaToken.value = null;
    localStorage.removeItem('mfa_token');
  };

  const logout = () => {
    usuario.value  = null;
    token.value    = null;
    mfaToken.value = null;
    localStorage.clear();
    router.push('/login');
  };

  // Helper privado
  const _guardarSesion = (accessToken, usuarioData) => {
    token.value   = accessToken;
    usuario.value = usuarioData;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
  };

  return {
    usuario, token, mfaToken,
    isAuthenticated, roles, tiendaId,
    isAdmin, isGerente, isEmpleado, isAuditor,
    hasRole,
    login, verificarMfa, logout,
  };
});