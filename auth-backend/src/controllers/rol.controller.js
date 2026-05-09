const { Rol, UsuarioRol, Usuario } = require('../models');

// GET /api/roles
const getAll = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      order: [['nombre', 'ASC']],
    });

    return res.status(200).json(roles);
  } catch (error) {
    console.error('Error en getAll roles:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/roles/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findByPk(id, {
      include: [{
        model:   Usuario,
        as:      'usuarios',
        through: { attributes: ['fecha_asignacion'] },
        attributes: ['id', 'email', 'nombre_completo', 'activo'],
      }],
    });

    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    return res.status(200).json(rol);
  } catch (error) {
    console.error('Error en getById rol:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/roles
const create = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'nombre es obligatorio' });
    }

    const rolesPermitidos = ['Admin', 'Gerente', 'Empleado', 'Auditor'];
    if (!rolesPermitidos.includes(nombre)) {
      return res.status(400).json({
        message: `Rol inválido. Permitidos: ${rolesPermitidos.join(', ')}`,
      });
    }

    const existe = await Rol.findOne({ where: { nombre } });
    if (existe) {
      return res.status(409).json({ message: `El rol "${nombre}" ya existe` });
    }

    const rol = await Rol.create({ nombre, descripcion: descripcion || null });

    return res.status(201).json({
      message: 'Rol creado correctamente',
      rol,
    });
  } catch (error) {
    console.error('Error en create rol:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/roles/:id
const update = async (req, res) => {
  try {
    const { id }                  = req.params;
    const { nombre, descripcion } = req.body;

    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Validar nombre si se está actualizando
    if (nombre) {
      const rolesPermitidos = ['Admin', 'Gerente', 'Empleado', 'Auditor'];
      if (!rolesPermitidos.includes(nombre)) {
        return res.status(400).json({
          message: `Rol inválido. Permitidos: ${rolesPermitidos.join(', ')}`,
        });
      }

      const duplicado = await Rol.findOne({ where: { nombre } });
      if (duplicado && duplicado.id !== parseInt(id)) {
        return res.status(409).json({ message: `El rol "${nombre}" ya existe` });
      }
    }

    await rol.update({
      nombre:      nombre      ?? rol.nombre,
      descripcion: descripcion ?? rol.descripcion,
    });

    return res.status(200).json({
      message: 'Rol actualizado correctamente',
      rol,
    });
  } catch (error) {
    console.error('Error en update rol:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/roles/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Verificar si tiene usuarios asignados
    const tieneUsuarios = await UsuarioRol.findOne({ where: { rol_id: id } });
    if (tieneUsuarios) {
      return res.status(409).json({
        message: 'No se puede eliminar el rol porque tiene usuarios asignados',
      });
    }

    await rol.destroy();

    return res.status(200).json({ message: 'Rol eliminado correctamente' });
  } catch (error) {
    console.error('Error en remove rol:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, remove };