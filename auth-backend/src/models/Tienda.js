const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tienda = sequelize.define('Tienda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'tiendas',
  timestamps: true,
});

module.exports = Tienda;