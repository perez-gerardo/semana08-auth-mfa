const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('../controllers/rol.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

const router = Router();

// Todos los autenticados pueden ver roles
router.get('/',    verifyToken, getAll);
router.get('/:id', verifyToken, getById);

// Solo Admin puede crear, editar y eliminar
router.post('/',      verifyToken, checkRole('Admin'), create);
router.put('/:id',    verifyToken, checkRole('Admin'), update);
router.delete('/:id', verifyToken, checkRole('Admin'), remove);

module.exports = router;