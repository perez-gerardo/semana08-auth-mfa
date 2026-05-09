const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const { Op }      = require('sequelize');
const { Usuario, Rol, UsuarioRol, Tienda } = require('../models');
const { validarPassword } = require('../utils/passwordValidator');

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_INTENTOS    = 5;
const MINUTOS_BLOQUEO = 15;

// Genera JWT temporal — solo permite acceder a /auth/mfa/verify
const generarMfaToken = (usuarioId) => {
  return jwt.sign(
    { id: usuarioId, tipo: 'mfa_pendiente' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' } // 10 minutos para completar MFA
  );
};

// Genera JWT completo — acceso total según roles
const generarAccessToken = (usuario, roles) => {
  return jwt.sign(
    {
      id:              usuario.id,
      email:           usuario.email,
      nombre_completo: usuario.nombre_completo,
      tienda_id:       usuario.tienda_id,
      roles:           roles.map(r => r.nombre),
      tipo:            'access',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, nombre_completo, tienda_id } = req.body;

    // Validar campos obligatorios
    if (!email || !password || !nombre_completo) {
      return res.status(400).json({
        message: 'email, password y nombre_completo son obligatorios',
      });
    }

    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Formato de email inválido' });
    }

    // Validar password fuerte
    const { valido, errores } = validarPassword(password);
    if (!valido) {
      return res.status(400).json({
        message: 'Password no cumple los requisitos',
        errores,
      });
    }

    // Verificar email duplicado
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    // Validar tienda si se proporciona
    if (tienda_id) {
      const tienda = await Tienda.findByPk(tienda_id);
      if (!tienda) {
        return res.status(404).json({ message: 'Tienda no encontrada' });
      }
    }

    // Hashear password
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const usuario = await Usuario.create({
      email,
      password:        hashedPassword,
      nombre_completo,
      tienda_id:       tienda_id || null,
      mfa_habilitado:  false,
      activo:          true,
      intentos_fallidos: 0,
    });

    // Asignar rol Empleado por defecto
    const rolEmpleado = await Rol.findOne({ where: { nombre: 'Empleado' } });
    if (rolEmpleado) {
      await UsuarioRol.create({
        usuario_id:  usuario.id,
        rol_id:      rolEmpleado.id,
        asignado_por: null,
      });
    }

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      usuario: {
        id:              usuario.id,
        email:           usuario.email,
        nombre_completo: usuario.nombre_completo,
        tienda_id:       usuario.tienda_id,
        mfa_habilitado:  usuario.mfa_habilitado,
      },
    });
  } catch (error) {
    console.error('Error en register:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son obligatorios' });
    }

    // Buscar usuario con sus roles
    const usuario = await Usuario.findOne({
      where: { email },
      include: [{
        model: Rol,
        as: 'roles',
        through: { attributes: [] },
      }],
    });

    // Credenciales inválidas — mismo mensaje para email y password (anti-enumeración)
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(403).json({ message: 'Cuenta desactivada. Contacta al administrador' });
    }

    // ── Verificar bloqueo ────────────────────────────────
    if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
      const minutosRestantes = Math.ceil(
        (new Date(usuario.bloqueado_hasta) - new Date()) / 1000 / 60
      );
      return res.status(423).json({
        message: `Cuenta bloqueada por demasiados intentos fallidos. Intenta en ${minutosRestantes} minuto(s)`,
      });
    }

    // ── Verificar password ───────────────────────────────
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      // Incrementar intentos fallidos
      const intentos = (usuario.intentos_fallidos || 0) + 1;

      if (intentos >= MAX_INTENTOS) {
        // Bloquear cuenta
        const bloqueadoHasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000);
        await usuario.update({
          intentos_fallidos: intentos,
          bloqueado_hasta:   bloqueadoHasta,
        });

        return res.status(423).json({
          message: `Cuenta bloqueada por ${MINUTOS_BLOQUEO} minutos tras ${MAX_INTENTOS} intentos fallidos`,
        });
      }

      await usuario.update({ intentos_fallidos: intentos });

      return res.status(401).json({
        message: `Credenciales inválidas. Intentos fallidos: ${intentos}/${MAX_INTENTOS}`,
      });
    }

    // ── Password correcto — resetear intentos ────────────
    await usuario.update({
      intentos_fallidos: 0,
      bloqueado_hasta:   null,
    });

    // ── Verificar si tiene MFA habilitado ────────────────
    if (usuario.mfa_habilitado) {
      // Retorna token temporal — flujo MFA obligatorio
      const mfaToken = generarMfaToken(usuario.id);

      return res.status(200).json({
        message:    'Credenciales válidas. Se requiere verificación MFA',
        mfa_requerido: true,
        mfa_token:  mfaToken,
      });
    }

    // ── Sin MFA — retorna access token directo ───────────
    const accessToken = generarAccessToken(usuario, usuario.roles);

    return res.status(200).json({
      message:       'Login exitoso',
      mfa_requerido: false,
      access_token:  accessToken,
      usuario: {
        id:              usuario.id,
        email:           usuario.email,
        nombre_completo: usuario.nombre_completo,
        tienda_id:       usuario.tienda_id,
        roles:           usuario.roles.map(r => r.nombre),
      },
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { register, login, generarAccessToken };