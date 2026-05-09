const { sequelize, Rol, Tienda, Usuario, UsuarioRol } = require('./models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    // Crear Tiendas
    const [tiendaLima] = await Tienda.findOrCreate({ where: { nombre: 'Lima Store' }, defaults: { ciudad: 'Lima', direccion: 'Av. Javier Prado' } });
    const [tiendaArequipa] = await Tienda.findOrCreate({ where: { nombre: 'Arequipa Store' }, defaults: { ciudad: 'Arequipa', direccion: 'Calle Mercaderes' } });

    // Crear Roles
    const roles = ['Admin', 'Gerente', 'Empleado', 'Auditor'];
    for (const nombre of roles) {
      await Rol.findOrCreate({ where: { nombre }, defaults: { descripcion: `Rol de ${nombre}` } });
    }

    // Obtener el ID del rol Admin
    const adminRol = await Rol.findOne({ where: { nombre: 'Admin' } });

    // Crear Usuario Admin
    const email = 'admin@techstore.com';
    const [adminUser, created] = await Usuario.findOrCreate({
      where: { email },
      defaults: {
        nombre_completo: 'Administrador del Sistema',
        password: await bcrypt.hash('TechStore2026*', 10), // Contraseña segura
        tienda_id: tiendaLima.id,
      }
    });

    if (created) {
      // Asignar el rol al Admin
      await UsuarioRol.create({
        usuario_id: adminUser.id,
        rol_id: adminRol.id,
        asignado_por: adminUser.id,
      });
      console.log('✅ Usuario Administrador creado:');
      console.log('Email: admin@techstore.com');
      console.log('Password: TechStore2026*');
    } else {
      console.log('ℹ️ El usuario administrador ya existe.');
    }

    console.log('🎉 Seed finalizado correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
}

seed();
