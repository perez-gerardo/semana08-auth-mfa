const { Router } = require('express');
const {
  getAll, getById, create, update, remove,
} = require('../controllers/producto.controller');
const { verifyToken }                        = require('../middleware/auth.middleware');
const { canSelect, canInsert, canUpdate, canDelete } = require('../middleware/abac.middleware');

const router = Router();

// verifyToken → ABAC → controller
router.get('/',    verifyToken, canSelect, getAll);
router.get('/:id', verifyToken, canSelect, getById);
router.post('/',   verifyToken, canInsert, create);
router.put('/:id', verifyToken, canUpdate, update);
router.delete('/:id', verifyToken, canDelete, remove);

module.exports = router;