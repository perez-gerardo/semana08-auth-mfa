<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">🔑 Roles</h1>
        <p class="text-gray-500 text-sm mt-1">Gestión de roles del sistema</p>
      </div>
      <button @click="abrirModalCrear" class="btn-primary flex items-center gap-2">
        ➕ Nuevo Rol
      </button>
    </div>

    <!-- Alert global -->
    <div v-if="alertMsg"
         :class="alertType === 'success'
           ? 'bg-green-50 border-green-200 text-green-700'
           : 'bg-red-50 border-red-200 text-red-700'"
         class="border p-4 rounded-lg text-sm font-medium flex justify-between items-center">
      <span>{{ alertType === 'success' ? '✅' : '❌' }} {{ alertMsg }}</span>
      <button @click="alertMsg = ''" class="text-lg leading-none opacity-60 hover:opacity-100">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4
                  border-gray-200 border-t-primary-600"></div>
    </div>

    <!-- Grid de roles -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="rol in roles" :key="rol.id"
        class="card hover:shadow-md transition-shadow">

        <!-- Header card -->
        <div class="flex items-start justify-between mb-3">
          <span :class="`badge-${rol.nombre.toLowerCase()}`" class="text-sm px-3 py-1">
            {{ rol.nombre }}
          </span>
          <div class="flex gap-1">
            <button
              @click="abrirModalEditar(rol)"
              class="text-gray-400 hover:text-primary-600 transition-colors p-1 rounded">
              ✏️
            </button>
            <button
              @click="confirmarEliminar(rol)"
              class="text-gray-400 hover:text-red-500 transition-colors p-1 rounded">
              🗑️
            </button>
          </div>
        </div>

        <!-- Descripción -->
        <p class="text-sm text-gray-600 mb-4 min-h-[40px]">
          {{ rol.descripcion || 'Sin descripción' }}
        </p>

        <!-- Permisos por rol -->
        <div class="border-t border-gray-100 pt-3 space-y-1">
          <p class="text-xs font-semibold text-gray-500 mb-2">PERMISOS</p>
          <div v-for="permiso in getPermisos(rol.nombre)" :key="permiso"
               class="flex items-center gap-2 text-xs text-gray-600">
            <span class="text-green-500">✓</span> {{ permiso }}
          </div>
        </div>

        <!-- Footer -->
        <p class="text-xs text-gray-400 mt-4">
          Creado: {{ formatFecha(rol.fecha_creacion) }}
        </p>
      </div>

      <!-- Empty -->
      <div v-if="!roles.length && !loading"
           class="col-span-4 card text-center py-12 text-gray-400">
        No hay roles registrados
      </div>
    </div>

    <!-- ── Modal Crear / Editar ── -->
    <AppModal
      :open="modalForm"
      :title="modoEditar ? '✏️ Editar Rol' : '➕ Nuevo Rol'"
      @close="cerrarModal">

      <form @submit.prevent="guardarRol" class="space-y-4">

        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nombre del rol
          </label>
          <select v-model="form.nombre" class="input-field" required>
            <option value="">Seleccionar...</option>
            <option value="Admin">Admin</option>
            <option value="Gerente">Gerente</option>
            <option value="Empleado">Empleado</option>
            <option value="Auditor">Auditor</option>
          </select>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            v-model="form.descripcion"
            rows="3"
            placeholder="Describe los permisos de este rol..."
            class="input-field resize-none">
          </textarea>
        </div>

        <!-- Alert modal -->
        <div v-if="errorModal"
             class="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          ❌ {{ errorModal }}
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary flex-1" :disabled="loadingForm">
            {{ loadingForm ? 'Guardando...' : (modoEditar ? 'Actualizar' : 'Crear rol') }}
          </button>
          <button type="button" @click="cerrarModal" class="btn-secondary flex-1">
            Cancelar
          </button>
        </div>

      </form>
    </AppModal>

    <!-- ── Modal Confirmar Eliminar ── -->
    <AppModal
      :open="modalEliminar"
      title="🗑️ Eliminar Rol"
      @close="modalEliminar = false">

      <div class="space-y-5">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          ⚠️ ¿Estás seguro de eliminar el rol
          <strong>"{{ rolAEliminar?.nombre }}"</strong>?
          Esta acción no se puede deshacer.
        </div>

        <p class="text-sm text-gray-600">
          Si el rol tiene usuarios asignados, la eliminación fallará.
        </p>

        <!-- Alert modal -->
        <div v-if="errorModal"
             class="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          ❌ {{ errorModal }}
        </div>

        <div class="flex gap-3">
          <button
            @click="eliminarRol"
            :disabled="loadingForm"
            class="btn-danger flex-1">
            {{ loadingForm ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
          <button
            @click="modalEliminar = false"
            class="btn-secondary flex-1">
            Cancelar
          </button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api      from '../../api/axios';
import AppModal from '../../components/ui/AppModal.vue';

// ── State ────────────────────────────────────────────────
const roles       = ref([]);
const loading     = ref(false);
const alertMsg    = ref('');
const alertType   = ref('success');
const modalForm   = ref(false);
const modalEliminar = ref(false);
const modoEditar  = ref(false);
const loadingForm = ref(false);
const errorModal  = ref('');
const rolAEliminar = ref(null);
const rolEditando  = ref(null);

const form = reactive({ nombre: '', descripcion: '' });

// ── Cargar roles ─────────────────────────────────────────
const cargarRoles = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/roles');
    roles.value = data;
  } catch (err) {
    mostrarAlerta('Error al cargar roles', 'error');
  } finally {
    loading.value = false;
  }
};

// ── Modal crear ──────────────────────────────────────────
const abrirModalCrear = () => {
  modoEditar.value      = false;
  form.nombre           = '';
  form.descripcion      = '';
  errorModal.value      = '';
  modalForm.value       = true;
};

// ── Modal editar ─────────────────────────────────────────
const abrirModalEditar = (rol) => {
  modoEditar.value      = true;
  rolEditando.value     = rol;
  form.nombre           = rol.nombre;
  form.descripcion      = rol.descripcion || '';
  errorModal.value      = '';
  modalForm.value       = true;
};

const cerrarModal = () => {
  modalForm.value  = false;
  errorModal.value = '';
};

// ── Guardar (crear o editar) ─────────────────────────────
const guardarRol = async () => {
  errorModal.value  = '';
  loadingForm.value = true;

  try {
    if (modoEditar.value) {
      await api.put(`/roles/${rolEditando.value.id}`, {
        nombre:      form.nombre,
        descripcion: form.descripcion,
      });
      mostrarAlerta(`Rol "${form.nombre}" actualizado correctamente`, 'success');
    } else {
      await api.post('/roles', {
        nombre:      form.nombre,
        descripcion: form.descripcion,
      });
      mostrarAlerta(`Rol "${form.nombre}" creado correctamente`, 'success');
    }

    cerrarModal();
    await cargarRoles();
  } catch (err) {
    errorModal.value = err.response?.data?.message || 'Error al guardar el rol';
  } finally {
    loadingForm.value = false;
  }
};

// ── Confirmar eliminar ───────────────────────────────────
const confirmarEliminar = (rol) => {
  rolAEliminar.value = rol;
  errorModal.value   = '';
  modalEliminar.value = true;
};

// ── Eliminar ─────────────────────────────────────────────
const eliminarRol = async () => {
  errorModal.value  = '';
  loadingForm.value = true;

  try {
    await api.delete(`/roles/${rolAEliminar.value.id}`);
    mostrarAlerta(`Rol "${rolAEliminar.value.nombre}" eliminado`, 'success');
    modalEliminar.value = false;
    await cargarRoles();
  } catch (err) {
    errorModal.value = err.response?.data?.message || 'Error al eliminar el rol';
  } finally {
    loadingForm.value = false;
  }
};

// ── Helpers ──────────────────────────────────────────────
const mostrarAlerta = (msg, type = 'success') => {
  alertMsg.value  = msg;
  alertType.value = type;
  setTimeout(() => { alertMsg.value = ''; }, 4000);
};

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const getPermisos = (nombre) => {
  const permisos = {
    Admin:    ['Acceso total al sistema', 'Gestión de usuarios', 'Gestión de roles', 'Todos los productos'],
    Gerente:  ['Productos de su tienda', 'Crear productos no premium', 'Editar sin cambiar categoría'],
    Empleado: ['Ver productos de su tienda', 'Crear productos no premium', 'Solo editar stock'],
    Auditor:  ['Ver todos los productos', 'Solo lectura'],
  };
  return permisos[nombre] || [];
};

onMounted(cargarRoles);
</script>