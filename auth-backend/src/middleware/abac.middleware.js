const { Producto } = require('../models');

// ── Helper: extrae el primer rol del usuario ──────────────
const getRol = (req) => req.usuario?.roles?.[0];

// ── Helper: verifica si el usuario pertenece a la tienda ─
const esDeSuTienda = (req, tienda_id) => {
  return req.usuario?.tienda_id === tienda_id;
};

// ── ABAC SELECT ───────────────────────────────────────────
// Inyecta filtro de tienda en req para que el controller lo use
const canSelect = (req, res, next) => {
  const rol = getRol(req);

  if (!rol) {
    return res.status(403).json({ message: 'Sin rol asignado' });
  }

  switch (rol) {
    case 'Admin':
    case 'Auditor':
      // Ven todos los productos — sin filtro
      req.filtroTienda = null;
      break;

    case 'Gerente':
    case 'Empleado':
      // Solo ven productos de su tienda
      if (!req.usuario.tienda_id) {
        return res.status(403).json({
          message: 'No tienes tienda asignada',
        });
      }
      req.filtroTienda = req.usuario.tienda_id;
      break;

    default:
      return res.status(403).json({ message: 'Rol no reconocido' });
  }

  next();
};

// ── ABAC INSERT ───────────────────────────────────────────
const canInsert = (req, res, next) => {
  const rol = getRol(req);

  if (rol === 'Auditor') {
    return res.status(403).json({ message: 'Auditores no pueden crear productos' });
  }

  if (rol === 'Admin') {
    // Puede crear en cualquier tienda — tienda_id viene del body
    return next();
  }

  if (rol === 'Gerente') {
    // Solo en su tienda
    const tiendaBody = parseInt(req.body.tienda_id);
    if (tiendaBody !== req.usuario.tienda_id) {
      return res.status(403).json({
        message: 'Gerentes solo pueden crear productos en su propia tienda',
      });
    }
    return next();
  }

  if (rol === 'Empleado') {
    // Solo en su tienda y NO premium
    const tiendaBody = parseInt(req.body.tienda_id);
    if (tiendaBody !== req.usuario.tienda_id) {
      return res.status(403).json({
        message: 'Empleados solo pueden crear productos en su propia tienda',
      });
    }
    if (req.body.es_premium === true || req.body.es_premium === 'true') {
      return res.status(403).json({
        message: 'Empleados no pueden crear productos premium',
      });
    }
    return next();
  }

  return res.status(403).json({ message: 'Acceso denegado' });
};

// ── ABAC UPDATE ───────────────────────────────────────────
const canUpdate = async (req, res, next) => {
  const rol = getRol(req);

  if (rol === 'Auditor') {
    return res.status(403).json({ message: 'Auditores no pueden modificar productos' });
  }

  if (rol === 'Empleado') {
    return res.status(403).json({
      message: 'Auditores no pueden modificar productos',
    });
  }

  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Adjuntar producto al request para no buscarlo de nuevo en el controller
    req.producto = producto;

    if (rol === 'Admin') {
      // Todo permitido
      return next();
    }

    if (rol === 'Gerente') {
      // Solo en su tienda
      if (!esDeSuTienda(req, producto.tienda_id)) {
        return res.status(403).json({
          message: 'Gerentes solo pueden modificar productos de su tienda',
        });
      }
      // No puede cambiar categoría
      if (req.body.categoria !== undefined) {
        return res.status(403).json({
          message: 'Gerentes no pueden modificar la categoría del producto',
        });
      }
      return next();
    }

    if (rol === 'Empleado') {
      // Solo stock, solo en su tienda
      if (!esDeSuTienda(req, producto.tienda_id)) {
        return res.status(403).json({
          message: 'Empleados solo pueden modificar productos de su tienda',
        });
      }

      const camposEnviados = Object.keys(req.body);
      const camposPermitidos = ['stock'];
      const camposNoPermitidos = camposEnviados.filter(c => !camposPermitidos.includes(c));

      if (camposNoPermitidos.length > 0) {
        return res.status(403).json({
          message: `Empleados solo pueden modificar el campo: stock. Campos no permitidos: ${camposNoPermitidos.join(', ')}`,
        });
      }
      return next();
    }

  } catch (error) {
    console.error('Error en canUpdate ABAC:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ── ABAC DELETE ───────────────────────────────────────────
const canDelete = async (req, res, next) => {
  const rol = getRol(req);

  if (rol === 'Auditor' || rol === 'Empleado') {
    return res.status(403).json({
      message: `${rol}es no pueden eliminar productos`,
    });
  }

  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    req.producto = producto;

    if (rol === 'Admin') {
      // Puede eliminar cualquier producto
      return next();
    }

    if (rol === 'Gerente') {
      // Solo en su tienda y NO premium
      if (!esDeSuTienda(req, producto.tienda_id)) {
        return res.status(403).json({
          message: 'Gerentes solo pueden eliminar productos de su tienda',
        });
      }
      if (producto.es_premium) {
        return res.status(403).json({
          message: 'Gerentes no pueden eliminar productos premium',
        });
      }
      return next();
    }

  } catch (error) {
    console.error('Error en canDelete ABAC:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { canSelect, canInsert, canUpdate, canDelete };