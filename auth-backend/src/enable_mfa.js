const { sequelize, Usuario } = require('./models');
const speakeasy = require('speakeasy');

async function enableMfa() {
  try {
    const admin = await Usuario.findOne({ where: { email: 'admin@techstore.com' } });
    
    // Generar secreto de MFA
    const secret = speakeasy.generateSecret({ name: 'TechStore: admin@techstore.com' });
    
    admin.mfa_secret = secret.base32;
    admin.mfa_habilitado = true;
    await admin.save();

    console.log('✅ MFA habilitado para el Administrador.');
    console.log('🔑 SECRETO (Cópialo):', secret.base32);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enableMfa();
