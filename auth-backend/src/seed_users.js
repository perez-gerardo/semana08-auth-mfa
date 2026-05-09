const { sequelize, Rol, Tienda, Usuario, UsuarioRol } = require('./models');
const bcrypt = require('bcryptjs');

async function seedUsers() {
  try {
    const tiendaLima = await Tienda.findOne({ where: { nombre: 'Lima Store' } });
    const tiendaArequipa = await Tienda.findOne({ where: { nombre: 'Arequipa Store' } });

    const roles = {
      Gerente: await Rol.findOne({ where: { nombre: 'Gerente' } }),
      Empleado: await Rol.findOne({ where: { nombre: 'Empleado' } }),
      Auditor: await Rol.findOne({ where: { nombre: 'Auditor' } }),
      Admin: await Rol.findOne({ where: { nombre: 'Admin' } })
    };

    const adminUser = await Usuario.findOne({ where: { email: 'admin@techstore.com' } });
    const password = await bcrypt.hash('TechStore2026*', 10);

    const usersToCreate = [
      {
        email: 'gerente@techstore.com',
        nombre_completo: 'Gerente Lima',
        password,
        tienda_id: tiendaLima.id,
        rol: roles.Gerente
      },
      {
        email: 'empleado@techstore.com',
        nombre_completo: 'Empleado Lima',
        password,
        tienda_id: tiendaLima.id,
        rol: roles.Empleado
      },
      {
        email: 'auditor@techstore.com',
        nombre_completo: 'Auditor Global',
        password,
        tienda_id: null,
        rol: roles.Auditor
      }
    ];

    for (const u of usersToCreate) {
      const [user, created] = await Usuario.findOrCreate({
        where: { email: u.email },
        defaults: {
          nombre_completo: u.nombre_completo,
          password: u.password,
          tienda_id: u.tienda_id
        }
      });

      if (created) {
        await UsuarioRol.create({
          usuario_id: user.id,
          rol_id: u.rol.id,
          asignado_por: adminUser ? adminUser.id : user.id
        });
        console.log(`✅ Creado: ${u.email}`);
      }
    }
    
    console.log('🎉 Usuarios de prueba creados.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedUsers();
