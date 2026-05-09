<template>
  <div class="space-y-8 font-mono text-gray-300">

    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#1f2937] pb-4">
      <div>
        <h1 class="text-xl font-bold text-gray-100 uppercase tracking-wider">Gestión de Nodos / Usuarios</h1>
        <p class="text-gray-500 text-xs mt-1 uppercase tracking-wider">> Panel de Administración</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="text-emerald-500 text-xs tracking-wider animate-pulse">[ CARGANDO DATOS... ]</div>
    </div>

    <!-- Error -->
    <div v-else-if="error"
         class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded text-xs tracking-wider uppercase">
      [ERR] {{ error }}
    </div>

    <!-- Tabla -->
    <div v-else class="border border-[#1f2937] rounded overflow-hidden bg-[#0b0e14]">
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="text-gray-500 uppercase bg-[#1a2235] border-b border-[#1f2937] tracking-wider">
            <tr>
              <th class="px-6 py-3 font-medium">Identificador</th>
              <th class="px-6 py-3 font-medium">Nodo_Asignado</th>
              <th class="px-6 py-3 font-medium">Privilegios</th>
              <th class="px-6 py-3 font-medium">MFA_STATUS</th>
              <th class="px-6 py-3 font-medium">SYS_STATUS</th>
              <th class="px-6 py-3 font-medium text-right">Operaciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#1f2937]">
            <tr v-for="usuario in usuarios" :key="usuario.id"
                class="hover:bg-[#1a2235] transition-colors">

              <!-- Usuario -->
              <td class="px-6 py-4">
                <div class="font-bold text-gray-200">{{ usuario.nombre_completo }}</div>
                <div class="text-gray-500 text-[10px] mt-0.5">{{ usuario.email }}</div>
              </td>

              <!-- Tienda -->
              <td class="px-6 py-4 text-gray-400 uppercase tracking-wider text-[10px]">
                {{ usuario.tienda?.nombre || '—' }}
              </td>

              <!-- Roles -->
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="rol in usuario.roles" :key="rol.id"
                    class="px-2 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider
                           border-gray-600 bg-gray-800 text-gray-300">
                    [{{ rol.nombre }}]
                  </span>
                  <span v-if="!usuario.roles?.length"
                        class="text-red-500 text-[10px] uppercase tracking-wider">
                    [UNASSIGNED]
                  </span>
                </div>
              </td>

              <!-- MFA -->
              <td class="px-6 py-4">
                <span :class="usuario.mfa_habilitado
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                  : 'text-gray-500 bg-gray-800 border-gray-600'"
                  class="text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded">
                  {{ usuario.mfa_habilitado ? 'ENFORCE' : 'DISABLED' }}
                </span>
              </td>

              <!-- Estado -->
              <td class="px-6 py-4">
                <span :class="usuario.activo
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                  : 'text-red-400 bg-red-400/10 border-red-400/20'"
                  class="text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded">
                  {{ usuario.activo ? 'ONLINE' : 'OFFLINE' }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="abrirModalRoles(usuario)"
                    class="text-[10px] tracking-wider uppercase border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-2 py-1 rounded transition-colors">
                    CHMOD
                  </button>
                  <button
                    @click="toggleActivo(usuario)"
                    :class="usuario.activo
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                      : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'"
                    class="text-[10px] tracking-wider uppercase border px-2 py-1 rounded transition-colors">
                    {{ usuario.activo ? 'KILL' : 'REVIVE' }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-if="!usuarios.length">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500 text-xs tracking-wider uppercase">
                [ SYS.WARN: DB_EMPTY ]
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal asignación de roles -->
    <AppModal
      :open="modalRoles"
      title="CONFIGURACIÓN_PRIVILEGIOS"
      @close="cerrarModalRoles">

      <div v-if="usuarioSeleccionado" class="space-y-6 font-mono text-xs text-gray-300">

        <!-- Info usuario -->
        <div class="bg-[#1a2235] border border-[#1f2937] rounded p-4">
          <p class="font-bold text-gray-100 uppercase tracking-wider">> TARGET: {{ usuarioSeleccionado.nombre_completo }}</p>
          <p class="text-[10px] text-gray-500 uppercase tracking-wider">UID: {{ usuarioSeleccionado.email }}</p>
        </div>

        <!-- Roles actuales -->
        <div>
          <p class="text-[10px] text-emerald-500 mb-2 uppercase tracking-wider">> GRUPOS ASIGNADOS:</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="rol in usuarioSeleccionado.roles" :key="rol.id"
              class="flex items-center border border-gray-600 bg-gray-800 rounded px-2 py-1">
              <span class="text-gray-300 uppercase tracking-wider text-[10px] mr-2">[{{ rol.nombre }}]</span>
              <button
                @click="quitarRol(usuarioSeleccionado.id, rol.id)"
                class="text-red-500 hover:text-red-400 transition-colors font-bold text-[10px]">
                [X]
              </button>
            </div>
            <span v-if="!usuarioSeleccionado.roles?.length"
                  class="text-red-500 text-[10px] uppercase tracking-wider">[ VACÍO ]</span>
          </div>
        </div>

        <!-- Asignar nuevo rol -->
        <div>
          <p class="text-[10px] text-emerald-500 mb-2 uppercase tracking-wider">> ADJUNTAR PRIVILEGIO:</p>
          <div class="flex gap-2">
            <select v-model="rolSeleccionado" class="w-full bg-[#030712] border border-[#1f2937] text-gray-300 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 transition-colors uppercase tracking-wider">
              <option value="" disabled selected>[ SELECCIONAR_GRUPO ]</option>
              <option
                v-for="rol in rolesDisponibles" :key="rol.id"
                :value="rol.id">
                {{ rol.nombre }}
              </option>
            </select>
            <button
              @click="asignarRol"
              :disabled="!rolSeleccionado || loadingRol"
              class="border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-4 rounded tracking-wider uppercase transition-colors disabled:opacity-50">
              {{ loadingRol ? '...' : 'ADD' }}
            </button>
          </div>
        </div>

        <!-- Alert modal -->
        <div v-if="errorModal"
             class="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded tracking-wider uppercase">
          [ERR] {{ errorModal }}
        </div>
        <div v-if="successModal"
             class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded tracking-wider uppercase">
          [SYS.OK] {{ successModal }}
        </div>

      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api       from '../../api/axios';
import AppModal  from '../../components/ui/AppModal.vue';

// ── State ────────────────────────────────────────────────
const usuarios           = ref([]);
const roles              = ref([]);
const loading            = ref(false);
const error              = ref('');
const modalRoles         = ref(false);
const usuarioSeleccionado = ref(null);
const rolSeleccionado    = ref('');
const loadingRol         = ref(false);
const errorModal         = ref('');
const successModal       = ref('');

// ── Roles disponibles para asignar (filtra los que ya tiene) ─
const rolesDisponibles = computed(() => {
  if (!usuarioSeleccionado.value) return roles.value;
  const rolesActuales = usuarioSeleccionado.value.roles.map(r => r.id);
  return roles.value.filter(r => !rolesActuales.includes(r.id));
});

// ── Cargar datos ─────────────────────────────────────────
const cargarUsuarios = async () => {
  loading.value = true;
  error.value   = '';
  try {
    const { data } = await api.get('/usuarios');
    usuarios.value = data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar usuarios';
  } finally {
    loading.value = false;
  }
};

const cargarRoles = async () => {
  try {
    const { data } = await api.get('/roles');
    roles.value = data;
  } catch (err) {
    console.error('Error al cargar roles:', err.message);
  }
};

// ── Modal roles ──────────────────────────────────────────
const abrirModalRoles = (usuario) => {
  usuarioSeleccionado.value = { ...usuario, roles: [...usuario.roles] };
  rolSeleccionado.value     = '';
  errorModal.value          = '';
  successModal.value        = '';
  modalRoles.value          = true;
};

const cerrarModalRoles = () => {
  modalRoles.value          = false;
  usuarioSeleccionado.value = null;
};

// ── Asignar rol ──────────────────────────────────────────
const asignarRol = async () => {
  if (!rolSeleccionado.value) return;

  errorModal.value   = '';
  successModal.value = '';
  loadingRol.value   = true;

  try {
    await api.post(`/usuarios/${usuarioSeleccionado.value.id}/roles`, {
      rol_id: rolSeleccionado.value,
    });

    // Actualizar lista local
    const rolObj = roles.value.find(r => r.id === parseInt(rolSeleccionado.value));
    usuarioSeleccionado.value.roles.push(rolObj);
    rolSeleccionado.value = '';
    successModal.value    = `Rol "${rolObj.nombre}" asignado correctamente`;

    // Actualizar tabla principal
    await cargarUsuarios();
  } catch (err) {
    errorModal.value = err.response?.data?.message || 'Error al asignar rol';
  } finally {
    loadingRol.value = false;
  }
};

// ── Quitar rol ───────────────────────────────────────────
const quitarRol = async (usuarioId, rolId) => {
  errorModal.value   = '';
  successModal.value = '';

  try {
    await api.delete(`/usuarios/${usuarioId}/roles/${rolId}`);
    usuarioSeleccionado.value.roles =
      usuarioSeleccionado.value.roles.filter(r => r.id !== rolId);
    successModal.value = 'Rol removido correctamente';
    await cargarUsuarios();
  } catch (err) {
    errorModal.value = err.response?.data?.message || 'Error al quitar rol';
  }
};

// ── Toggle activo ────────────────────────────────────────
const toggleActivo = async (usuario) => {
  try {
    await api.patch(`/usuarios/${usuario.id}/activar`);
    await cargarUsuarios();
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cambiar estado';
  }
};

onMounted(() => {
  cargarUsuarios();
  cargarRoles();
});
</script>