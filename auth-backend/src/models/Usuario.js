const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  nombre_completo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  tienda_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Admin puede no tener tienda asignada
    references: { model: 'tiendas', key: 'id' },
  },
  // ── MFA ─────────────────────────────────────────
  mfa_habilitado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  mfa_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // ── Control de acceso ───────────────────────────
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  intentos_fallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  bloqueado_hasta: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
});

module.exports = Usuario;