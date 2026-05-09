import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path:      '/login',
    name:      'login',
    component: () => import('../views/auth/LoginView.vue'),
  },
  {
    path:      '/mfa',
    name:      'mfa',
    component: () => import('../views/auth/MfaVerifyView.vue'),
  },
  {
    path:      '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: '/productos' },
      {
        path:      'productos',
        name:      'productos',
        component: () => import('../views/productos/ProductosView.vue'),
        meta:      { requiresAuth: true },
      },
      {
        path:      'usuarios',
        name:      'usuarios',
        component: () => import('../views/usuarios/UsuariosView.vue'),
        meta:      { requiresAuth: true, roles: ['Admin'] },
      },
      {
        path:      'roles',
        name:      'roles',
        component: () => import('../views/roles/RolesView.vue'),
        meta:      { requiresAuth: true, roles: ['Admin'] },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Rutas completamente públicas — sin guard
const RUTAS_PUBLICAS = ['/login', '/mfa'];

router.beforeEach((to, _from) => {
  // Si es ruta pública → siempre dejar pasar
  if (RUTAS_PUBLICAS.includes(to.path)) {
    return true;
  }

  const accessToken = localStorage.getItem('access_token');
  const usuario     = JSON.parse(localStorage.getItem('usuario') || 'null');
  const roles       = usuario?.roles || [];

  // Sin token → login
  if (!accessToken) return '/login';

  // Verificar rol si la ruta lo requiere
  if (to.meta.roles && !to.meta.roles.some(r => roles.includes(r))) {
    return '/productos';
  }

  return true;
});

export default router;