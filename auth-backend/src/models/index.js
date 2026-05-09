const sequelize = require('../config/database');

const Tienda     = require('./Tienda');
const Rol        = require('./Rol');
const Usuario    = require('./Usuario');
const UsuarioRol = require('./UsuarioRol');
const Producto   = require('./Producto');

// ── Usuario ↔ Tienda ────────────────────────────────────
Usuario.belongsTo(Tienda, { foreignKey: 'tienda_id', as: 'tienda' });
Tienda.hasMany(Usuario,   { foreignKey: 'tienda_id', as: 'usuarios' });

// ── Usuario ↔ Rol (muchos a muchos via UsuarioRol) ──────
Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: 'usuario_id',
  otherKey: 'rol_id',
  as: 'roles',
});
Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: 'rol_id',
  otherKey: 'usuario_id',
  as: 'usuarios',
});

// Acceso directo a la tabla intermedia
Usuario.hasMany(UsuarioRol, { foreignKey: 'usuario_id' });
UsuarioRol.belongsTo(Rol,   { foreignKey: 'rol_id', as: 'rol' });

// ── Producto ↔ Tienda ───────────────────────────────────
Producto.belongsTo(Tienda,   { foreignKey: 'tienda_id', as: 'tienda' });
Tienda.hasMany(Producto,     { foreignKey: 'tienda_id', as: 'productos' });

// ── Producto ↔ Usuario (creador) ────────────────────────
Producto.belongsTo(Usuario, { foreignKey: 'creado_por', as: 'creador' });

module.exports = {
  sequelize,
  Tienda,
  Rol,
  Usuario,
  UsuarioRol,
  Producto,
};