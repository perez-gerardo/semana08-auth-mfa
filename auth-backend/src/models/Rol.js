const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('Rol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isIn: [['Admin', 'Gerente', 'Empleado', 'Auditor']],
    },
  },
  descripcion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
});

module.exports = Rol;