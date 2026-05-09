const { Router } = require('express');
const {
  getAll,
  getById,
  asignarRol,
  quitarRol,
  toggleActivo,
} = require('../controllers/usuario.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

const router = Router();

// Solo Admin gestiona usuarios
router.get('/',    verifyToken, checkRole('Admin'), getAll);
router.get('/:id', verifyToken, checkRole('Admin'), getById);

// Asignación de roles
router.post('/:id/roles',           verifyToken, checkRole('Admin'), asignarRol);
router.delete('/:id/roles/:rolId',  verifyToken, checkRole('Admin'), quitarRol);

// Activar / desactivar
router.patch('/:id/activar', verifyToken, checkRole('Admin'), toggleActivo);

module.exports = router;