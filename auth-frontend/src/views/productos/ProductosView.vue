<template>
  <div class="space-y-8 font-mono">

    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#1f2937] pb-4">
      <div>
        <h1 class="text-xl font-bold text-gray-100 tracking-wider uppercase">Inventario</h1>
        <p class="text-gray-500 text-xs mt-1 uppercase tracking-wider">
          > {{ descripcionAcceso }}
        </p>
      </div>
      <button
        v-if="puedeCrear"
        @click="abrirModalCrear"
        class="border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 px-4 py-2 rounded text-xs tracking-wider uppercase transition-colors">
        [+] Nuevo Item
      </button>
    </div>

    <!-- Alert global -->
    <div v-if="alertMsg"
         :class="alertType === 'success'
           ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
           : 'bg-red-500/10 border-red-500/30 text-red-400'"
         class="border p-3 text-xs tracking-wider flex justify-between items-center rounded">
      <span>{{ alertType === 'success' ? '[SYS.OK]' : '[SYS.ERR]' }} {{ alertMsg }}</span>
      <button @click="alertMsg = ''" class="hover:text-white transition-colors">[x]</button>
    </div>

    <!-- Info rol -->
    <div class="bg-[#0b0e14] border border-[#1f2937] rounded p-3 text-xs text-gray-400
                flex items-center gap-2 uppercase tracking-wider">
      <span class="text-emerald-500">></span> SYS.USER_CTX:
      <span v-for="rol in authStore.roles" :key="rol"
            class="text-emerald-400 font-bold">
        [{{ rol }}]
      </span>
      <span v-if="authStore.tiendaId" class="text-gray-500 ml-2">
        NODE_ID: {{ authStore.tiendaId }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="text-emerald-500 text-xs tracking-wider animate-pulse">[ CARGANDO DATOS... ]</div>
    </div>

    <!-- Tabla -->
    <div v-else class="border border-[#1f2937] rounded overflow-hidden bg-[#0b0e14]">
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left text-gray-300">
          <thead class="text-gray-500 uppercase bg-[#1a2235] border-b border-[#1f2937] tracking-wider">
            <tr>
              <th class="px-6 py-3 font-medium">Producto</th>
              <th class="px-6 py-3 font-medium">Categoría</th>
              <th class="px-6 py-3 font-medium">Precio</th>
              <th class="px-6 py-3 font-medium">Stock</th>
              <th class="px-6 py-3 font-medium">Nodo</th>
              <th class="px-6 py-3 font-medium">Tier</th>
              <th class="px-6 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#1f2937]">
            <tr v-for="producto in productos" :key="producto.id"
                class="hover:bg-[#1a2235] transition-colors">

              <!-- Producto -->
              <td class="px-6 py-4">
                <div class="font-medium text-gray-200">{{ producto.nombre }}</div>
                <div class="text-gray-500 text-[10px] mt-0.5">{{ producto.descripcion || '—' }}</div>
              </td>

              <!-- Categoría -->
              <td class="px-6 py-4 text-gray-400 uppercase tracking-wider text-[10px]">
                {{ producto.categoria || '—' }}
              </td>

              <!-- Precio -->
              <td class="px-6 py-4 font-medium text-emerald-400">
                S/ {{ Number(producto.precio).toFixed(2) }}
              </td>

              <!-- Stock -->
              <td class="px-6 py-4">
                <span :class="producto.stock > 10
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                  : producto.stock > 0
                    ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                    : 'text-red-400 bg-red-400/10 border-red-400/20'"
                  class="text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded">
                  {{ producto.stock }} UDS
                </span>
              </td>

              <!-- Tienda -->
              <td class="px-6 py-4 text-gray-400">
                {{ producto.tienda?.nombre || '—' }}
              </td>

              <!-- Premium -->
              <td class="px-6 py-4">
                <span v-if="producto.es_premium"
                      class="text-purple-400 bg-purple-400/10 border border-purple-400/20 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
                  PRO
                </span>
                <span v-else class="text-gray-600 text-[10px] uppercase tracking-wider">STD</span>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <!-- Editar: Admin y Gerente siempre, Empleado solo stock -->
                  <button
                    v-if="puedeEditar(producto)"
                    @click="abrirModalEditar(producto)"
                    class="text-[10px] tracking-wider uppercase border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-2 py-1 rounded transition-colors">
                    {{ authStore.isEmpleado ? 'STOCK' : 'EDIT' }}
                  </button>

                  <!-- Eliminar: Admin y Gerente (Gerente no puede premium) -->
                  <button
                    v-if="puedeEliminar(producto)"
                    @click="confirmarEliminar(producto)"
                    class="text-[10px] tracking-wider uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors">
                    DEL
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-if="!productos.length">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500 text-xs tracking-wider uppercase">
                [ SYS.WARN: NO HAY DATOS ]
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Modal Crear / Editar ── -->
    <AppModal
      :open="modalForm"
      :title="modoEditar ? 'ACTUALIZAR_REGISTRO' : 'NUEVO_REGISTRO'"
      @close="cerrarModal">

      <form @submit.prevent="guardarProducto" class="space-y-4 font-mono text-xs">

        <!-- Solo stock para Empleado -->
        <template v-if="authStore.isEmpleado">
          <div class="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-yellow-400 tracking-wider">
            [SYS.WARN] PERMISOS RESTRINGIDOS. SOLO EDICIÓN DE INVENTARIO FÍSICO.
          </div>
          <div>
            <label class="block text-gray-400 mb-1 uppercase tracking-wider">Stock QTY</label>
            <input v-model.number="form.stock" type="number" min="0"
                   class="w-full bg-[#0b0e14] border border-[#1f2937] text-gray-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" required />
          </div>
        </template>

        <!-- Formulario completo para Admin y Gerente -->
        <template v-else>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-gray-400 mb-1 uppercase tracking-wider">Designación</label>
              <input v-model="form.nombre" type="text" placeholder="Nombre..."
                     class="w-full bg-[#0b0e14] border border-[#1f2937] text-gray-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" required />
            </div>

            <div class="col-span-2">
              <label class="block text-gray-400 mb-1 uppercase tracking-wider">Especificaciones</label>
              <textarea v-model="form.descripcion" rows="2"
                        placeholder="..."
                        class="w-full bg-[#0b0e14] border border-[#1f2937] text-gray-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"></textarea>
            </div>

            <div>
              <label class="block text-gray-400 mb-1 uppercase tracking-wider">Valor (S/)</label>
              <input v-model.number="form.precio" type="number" min="0" step="0.01"
                     class="w-full bg-[#0b0e14] border border-[#1f2937] text-gray-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" required />
            </div>

            <div>
              <label class="block text-gray-400 mb-1 uppercase tracking-wider">Stock</label>
              <input v-model.number="form.stock" type="number" min="0"
                     class="w-full bg-[#0b0e14] border border-[#1f2937] text-gray-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" required />
            </div>

            <!-- Categoría — Gerente no puede modificarla en edición -->
            <div :class="modoEditar && authStore.isGerente ? 'opacity-50' : ''">
              <label class="block text-gray-400 mb-1 uppercase tracking-wider flex justify-between">
                Categoría
                <span v-if="modoEditar && authStore.isGerente" class="text-[10px] text-red-500">[LOCKED]</span>
              </label>
              <input v-model="form.categoria" type="text"
                     placeholder="Ej: SYS"
                     :disabled="modoEditar && authStore.isGerente"
                     class="w-full bg-[#0b0e14] border border-[#1f2937] text-gray-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:cursor-not-allowed" />
            </div>

            <!-- Tienda — solo Admin puede cambiarla -->
            <div>
              <label class="block text-gray-400 mb-1 uppercase tracking-wider">ID Nodo</label>
              <input v-model.number="form.tienda_id" type="number"
                     :disabled="authStore.isGerente"
                     class="w-full bg-[#0b0e14] border border-[#1f2937] text-gray-200 px-3 py-2 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" required />
            </div>

            <!-- Premium — Empleado no puede marcarlo -->
            <div class="col-span-2 flex items-center gap-3 mt-2">
              <input v-model="form.es_premium" type="checkbox"
                     id="es_premium"
                     class="w-4 h-4 bg-[#0b0e14] border-[#1f2937] text-emerald-500 focus:ring-emerald-500"
                     :disabled="authStore.isEmpleado" />
              <label for="es_premium" class="text-gray-300 uppercase tracking-wider flex items-center gap-2">
                Clase PRO
                <span v-if="authStore.isEmpleado" class="text-[10px] text-red-500">[LOCKED]</span>
              </label>
            </div>
          </div>
        </template>

        <!-- Alert modal -->
        <div v-if="errorModal"
             class="bg-red-500/10 border border-red-500/30 text-red-400 tracking-wider p-3 rounded">
          [ERR] {{ errorModal }}
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 py-2 rounded uppercase tracking-wider transition-colors disabled:opacity-50" :disabled="loadingForm">
            {{ loadingForm ? 'PROCESANDO...' : 'EJECUTAR' }}
          </button>
          <button type="button" @click="cerrarModal" class="flex-1 border border-gray-600 text-gray-400 hover:bg-gray-800 py-2 rounded uppercase tracking-wider transition-colors">
            ABORTAR
          </button>
        </div>

      </form>
    </AppModal>

    <!-- ── Modal Confirmar Eliminar ── -->
    <AppModal
      :open="modalEliminar"
      title="CONFIRMAR_PURGA"
      @close="modalEliminar = false">

      <div class="space-y-5 font-mono text-xs">
        <div class="bg-red-500/10 border border-red-500/30 rounded p-4 text-red-400 tracking-wider">
          [!] ATENCIÓN: ¿Purgar registro "{{ productoAEliminar?.nombre }}"?<br>
          <span class="text-[10px] text-gray-500 mt-2 block">Esta acción destruirá los datos permanentemente en la DB.</span>
        </div>

        <div v-if="errorModal"
             class="bg-red-500/10 border border-red-500/30 text-red-400 tracking-wider p-3 rounded">
          [ERR] {{ errorModal }}
        </div>

        <div class="flex gap-3">
          <button @click="eliminarProducto" :disabled="loadingForm" class="flex-1 border border-red-500/50 text-red-400 hover:bg-red-500/10 py-2 rounded uppercase tracking-wider transition-colors disabled:opacity-50">
            {{ loadingForm ? 'PURGANDO...' : 'CONFIRMAR PURGA' }}
          </button>
          <button @click="modalEliminar = false" class="flex-1 border border-gray-600 text-gray-400 hover:bg-gray-800 py-2 rounded uppercase tracking-wider transition-colors">
            ABORTAR
          </button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api          from '../../api/axios';
import AppModal     from '../../components/ui/AppModal.vue';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();

// ── State ────────────────────────────────────────────────
const productos        = ref([]);
const loading          = ref(false);
const alertMsg         = ref('');
const alertType        = ref('success');
const modalForm        = ref(false);
const modalEliminar    = ref(false);
const modoEditar       = ref(false);
const loadingForm      = ref(false);
const errorModal       = ref('');
const productoAEliminar = ref(null);
const productoEditando  = ref(null);

const form = reactive({
  nombre:      '',
  descripcion: '',
  precio:      0,
  stock:       0,
  categoria:   '',
  tienda_id:   authStore.tiendaId || '',
  es_premium:  false,
});

// ── Descripción de acceso según rol ──────────────────────
const descripcionAcceso = computed(() => {
  if (authStore.isAdmin)    return 'Todos los productos de todas las tiendas';
  if (authStore.isAuditor)  return 'Solo lectura — todos los productos';
  if (authStore.isGerente)  return 'Productos de tu tienda asignada';
  if (authStore.isEmpleado) return 'Productos de tu tienda — solo puedes editar stock';
  return '';
});

// ── Permisos ABAC en el frontend ─────────────────────────
const puedeCrear = computed(() => {
  return authStore.hasRole('Admin', 'Gerente', 'Empleado');
});

const puedeEditar = (producto) => {
  if (authStore.isAdmin)   return true;
  if (authStore.isAuditor) return false;
  // Gerente y Empleado solo su tienda
  return producto.tienda_id === authStore.tiendaId;
};

const puedeEliminar = (producto) => {
  if (authStore.isAdmin)            return true;
  if (authStore.isAuditor)          return false;
  if (authStore.isEmpleado)         return false;
  // Gerente: solo su tienda y no premium
  if (authStore.isGerente) {
    return producto.tienda_id === authStore.tiendaId && !producto.es_premium;
  }
  return false;
};

// ── Cargar productos ─────────────────────────────────────
const cargarProductos = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/productos');
    productos.value = data;
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Error al cargar productos', 'error');
  } finally {
    loading.value = false;
  }
};

// ── Modal crear ──────────────────────────────────────────
const abrirModalCrear = () => {
  modoEditar.value    = false;
  errorModal.value    = '';
  form.nombre         = '';
  form.descripcion    = '';
  form.precio         = 0;
  form.stock          = 0;
  form.categoria      = '';
  form.tienda_id      = authStore.tiendaId || '';
  form.es_premium     = false;
  modalForm.value     = true;
};

// ── Modal editar ─────────────────────────────────────────
const abrirModalEditar = (producto) => {
  modoEditar.value      = true;
  productoEditando.value = producto;
  errorModal.value      = '';
  form.nombre           = producto.nombre;
  form.descripcion      = producto.descripcion || '';
  form.precio           = producto.precio;
  form.stock            = producto.stock;
  form.categoria        = producto.categoria || '';
  form.tienda_id        = producto.tienda_id;
  form.es_premium       = producto.es_premium;
  modalForm.value       = true;
};

const cerrarModal = () => {
  modalForm.value  = false;
  errorModal.value = '';
};

// ── Guardar ──────────────────────────────────────────────
const guardarProducto = async () => {
  errorModal.value  = '';
  loadingForm.value = true;

  try {
    if (modoEditar.value) {
      // Empleado solo envía stock
      const payload = authStore.isEmpleado
        ? { stock: form.stock }
        : {
            nombre:      form.nombre,
            descripcion: form.descripcion,
            precio:      form.precio,
            stock:       form.stock,
            categoria:   authStore.isGerente ? undefined : form.categoria,
            tienda_id:   form.tienda_id,
            es_premium:  form.es_premium,
          };

      await api.put(`/productos/${productoEditando.value.id}`, payload);
      mostrarAlerta('Producto actualizado correctamente', 'success');
    } else {
      await api.post('/productos', {
        nombre:      form.nombre,
        descripcion: form.descripcion,
        precio:      form.precio,
        stock:       form.stock,
        categoria:   form.categoria,
        tienda_id:   form.tienda_id,
        es_premium:  form.es_premium,
      });
      mostrarAlerta('Producto creado correctamente', 'success');
    }

    cerrarModal();
    await cargarProductos();
  } catch (err) {
    errorModal.value = err.response?.data?.message || 'Error al guardar el producto';
  } finally {
    loadingForm.value = false;
  }
};

// ── Eliminar ─────────────────────────────────────────────
const confirmarEliminar = (producto) => {
  productoAEliminar.value = producto;
  errorModal.value        = '';
  modalEliminar.value     = true;
};

const eliminarProducto = async () => {
  errorModal.value  = '';
  loadingForm.value = true;

  try {
    await api.delete(`/productos/${productoAEliminar.value.id}`);
    mostrarAlerta('Producto eliminado correctamente', 'success');
    modalEliminar.value = false;
    await cargarProductos();
  } catch (err) {
    errorModal.value = err.response?.data?.message || 'Error al eliminar';
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

onMounted(cargarProductos);
</script>