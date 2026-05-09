const { Producto, Tienda, Usuario } = require('../models');
const { Op } = require('sequelize');

// GET /api/productos
const getAll = async (req, res) => {
  try {
    const where = req.filtroTienda ? { tienda_id: req.filtroTienda } : {};

    const productos = await Producto.findAll({
      where,
      include: [
        { model: Tienda,   as: 'tienda',  attributes: ['id', 'nombre', 'ciudad'] },
        { model: Usuario,  as: 'creador', attributes: ['id', 'nombre_completo'] },
      ],
      order: [['id', 'ASC']],
    });

    return res.status(200).json(productos);
  } catch (error) {
    console.error('Error en getAll productos:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/productos/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const where = { id };
    if (req.filtroTienda) {
      where.tienda_id = req.filtroTienda;
    }

    const producto = await Producto.findOne({
      where,
      include: [
        { model: Tienda,  as: 'tienda',  attributes: ['id', 'nombre', 'ciudad'] },
        { model: Usuario, as: 'creador', attributes: ['id', 'nombre_completo'] },
      ],
    });

    if (!producto) {
      return res.status(404).json({
        message: 'Producto no encontrado o no pertenece a tu tienda',
      });
    }

    return res.status(200).json(producto);
  } catch (error) {
    console.error('Error en getById producto:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/productos
const create = async (req, res) => {
  try {
    const {
      nombre, descripcion, precio,
      stock, categoria, tienda_id,
      es_premium,
    } = req.body;

    // Validar campos obligatorios
    if (!nombre || !precio || !tienda_id) {
      return res.status(400).json({
        message: 'nombre, precio y tienda_id son obligatorios',
      });
    }

    // Validar tienda
    const tienda = await Tienda.findByPk(tienda_id);
    if (!tienda) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const producto = await Producto.create({
      nombre,
      descripcion:  descripcion  || null,
      precio,
      stock:        stock        || 0,
      categoria:    categoria    || null,
      tienda_id:    parseInt(tienda_id),
      es_premium:   es_premium   || false,
      creado_por:   req.usuario.id,
    });

    return res.status(201).json({
      message: 'Producto creado correctamente',
      producto,
    });
  } catch (error) {
    console.error('Error en create producto:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/productos/:id
const update = async (req, res) => {
  try {
    // req.producto ya viene del middleware canUpdate
    const producto = req.producto;

    const {
      nombre, descripcion, precio,
      stock, categoria, tienda_id,
      es_premium,
    } = req.body;

    await producto.update({
      nombre:       nombre       ?? producto.nombre,
      descripcion:  descripcion  ?? producto.descripcion,
      precio:       precio       ?? producto.precio,
      stock:        stock        ?? producto.stock,
      categoria:    categoria    ?? producto.categoria,
      tienda_id:    tienda_id    ?? producto.tienda_id,
      es_premium:   es_premium   ?? producto.es_premium,
    });

    return res.status(200).json({
      message: 'Producto actualizado correctamente',
      producto,
    });
  } catch (error) {
    console.error('Error en update producto:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/productos/:id
const remove = async (req, res) => {
  try {
    // req.producto ya viene del middleware canDelete
    await req.producto.destroy();

    return res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error en remove producto:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, remove };