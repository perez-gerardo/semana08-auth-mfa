const { Usuario, Rol, UsuarioRol, Tienda } = require('../models');

// GET /api/usuarios
const getAll = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password', 'mfa_secret'] },
      include: [
        {
          model: Rol,
          as:    'roles',
          through: { attributes: ['fecha_asignacion'] },
        },
        {
          model:      Tienda,
          as:         'tienda',
          attributes: ['id', 'nombre', 'ciudad'],
        },
      ],
      order: [['id', 'ASC']],
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error en getAll usuarios:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/usuarios/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password', 'mfa_secret'] },
      include: [
        {
          model:   Rol,
          as:      'roles',
          through: { attributes: ['fecha_asignacion'] },
        },
        {
          model:      Tienda,
          as:         'tienda',
          attributes: ['id', 'nombre', 'ciudad'],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error('Error en getById usuario:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/usuarios/:id/roles — asignar rol a usuario
const asignarRol = async (req, res) => {
  try {
    const { id }    = req.params;
    const { rol_id } = req.body;
    const adminId   = req.usuario.id; // quien asigna

    if (!rol_id) {
      return res.status(400).json({ message: 'rol_id es obligatorio' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const rol = await Rol.findByPk(rol_id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Verificar si ya tiene ese rol
    const yaAsignado = await UsuarioRol.findOne({
      where: { usuario_id: id, rol_id },
    });
    if (yaAsignado) {
      return res.status(409).json({
        message: `El usuario ya tiene el rol "${rol.nombre}" asignado`,
      });
    }

    const asignacion = await UsuarioRol.create({
      usuario_id:   parseInt(id),
      rol_id:       parseInt(rol_id),
      asignado_por: adminId,
    });

    return res.status(201).json({
      message:    `Rol "${rol.nombre}" asignado correctamente`,
      asignacion: {
        usuario_id:      parseInt(id),
        rol_id:          parseInt(rol_id),
        rol_nombre:      rol.nombre,
        asignado_por:    adminId,
        fecha_asignacion: asignacion.fecha_asignacion,
      },
    });
  } catch (error) {
    console.error('Error en asignarRol:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/usuarios/:id/roles/:rolId — quitar rol a usuario
const quitarRol = async (req, res) => {
  try {
    const { id, rolId } = req.params;

    const asignacion = await UsuarioRol.findOne({
      where: { usuario_id: id, rol_id: rolId },
    });

    if (!asignacion) {
      return res.status(404).json({ message: 'El usuario no tiene ese rol asignado' });
    }

    // Verificar que el usuario no quede sin roles
    const totalRoles = await UsuarioRol.count({ where: { usuario_id: id } });
    if (totalRoles <= 1) {
      return res.status(400).json({
        message: 'El usuario debe tener al menos un rol asignado',
      });
    }

    await asignacion.destroy();

    const rol = await Rol.findByPk(rolId);

    return res.status(200).json({
      message: `Rol "${rol?.nombre}" removido correctamente`,
    });
  } catch (error) {
    console.error('Error en quitarRol:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /api/usuarios/:id/activar — activar o desactivar usuario
const toggleActivo = async (req, res) => {
  try {
    const { id }    = req.params;
    const adminId   = req.usuario.id;

    // Evitar que el Admin se desactive a sí mismo
    if (parseInt(id) === adminId) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
    }

    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password', 'mfa_secret'] },
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await usuario.update({ activo: !usuario.activo });

    return res.status(200).json({
      message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} correctamente`,
      usuario: {
        id:     usuario.id,
        email:  usuario.email,
        activo: usuario.activo,
      },
    });
  } catch (error) {
    console.error('Error en toggleActivo:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, asignarRol, quitarRol, toggleActivo };