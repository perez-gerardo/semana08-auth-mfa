const speakeasy = require('speakeasy');
const QRCode    = require('qrcode');
const { Usuario, Rol } = require('../models');
const { generarAccessToken } = require('./auth.controller');

// ── POST /api/auth/mfa/setup ──────────────────────────────────────────────────
// Genera el secret y retorna el QR — requiere access_token normal (MFA aún no activo)
const setup = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.mfa_habilitado) {
      return res.status(400).json({ message: 'MFA ya está habilitado en esta cuenta' });
    }

    // Generar secret TOTP
    const secret = speakeasy.generateSecret({
      name:   `AuthMFA (${usuario.email})`, // nombre que aparece en Google Authenticator
      length: 20,
    });

    // Guardar secret temporal en BD (aún no está activado)
    await usuario.update({ mfa_secret: secret.base32 });

    // Generar QR como imagen base64
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      message: 'Escanea el QR con Google Authenticator y luego activa MFA en /api/auth/mfa/activate',
      qr_code:      qrCodeUrl,   // imagen base64 — renderizable en frontend
      secret_manual: secret.base32, // por si el usuario no puede escanear el QR
    });
  } catch (error) {
    console.error('Error en mfa/setup:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ── POST /api/auth/mfa/activate ───────────────────────────────────────────────
// Verifica el primer código TOTP y activa MFA definitivamente
const activate = async (req, res) => {
  try {
    const { codigo } = req.body;
    const usuarioId  = req.usuario.id;

    if (!codigo) {
      return res.status(400).json({ message: 'codigo es obligatorio' });
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.mfa_habilitado) {
      return res.status(400).json({ message: 'MFA ya está activado' });
    }

    if (!usuario.mfa_secret) {
      return res.status(400).json({
        message: 'Primero genera el QR en /api/auth/mfa/setup',
      });
    }

    // Verificar código TOTP
    const valido = speakeasy.totp.verify({
      secret:   usuario.mfa_secret,
      encoding: 'base32',
      token:    codigo,
      window:   1, // acepta ±30 segundos de margen
    });

    if (!valido) {
      return res.status(400).json({
        message: 'Código inválido. Verifica que el tiempo de tu dispositivo sea correcto',
      });
    }

    // Activar MFA
    await usuario.update({ mfa_habilitado: true });

    return res.status(200).json({
      message: 'MFA activado correctamente. Desde ahora lo necesitarás en cada login ✅',
    });
  } catch (error) {
    console.error('Error en mfa/activate:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ── POST /api/auth/mfa/verify ─────────────────────────────────────────────────
// Verifica código TOTP durante el login — requiere mfa_token temporal
const verify = async (req, res) => {
  try {
    const { codigo }  = req.body;
    const usuarioId   = req.mfaUsuarioId; // viene del middleware verifyMfaToken

    if (!codigo) {
      return res.status(400).json({ message: 'codigo es obligatorio' });
    }

    // Buscar usuario con roles
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{
        model: Rol,
        as:    'roles',
        through: { attributes: [] },
      }],
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.mfa_habilitado || !usuario.mfa_secret) {
      return res.status(400).json({ message: 'MFA no está configurado para este usuario' });
    }

    // ── Control de intentos MFA ──────────────────────────
    // Reutilizamos intentos_fallidos solo durante la ventana MFA
    if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
      const minutosRestantes = Math.ceil(
        (new Date(usuario.bloqueado_hasta) - new Date()) / 1000 / 60
      );
      return res.status(423).json({
        message: `Demasiados intentos MFA fallidos. Intenta en ${minutosRestantes} minuto(s)`,
      });
    }

    // Verificar código TOTP
    const valido = speakeasy.totp.verify({
      secret:   usuario.mfa_secret,
      encoding: 'base32',
      token:    codigo,
      window:   1,
    });

    if (!valido) {
      const intentos = (usuario.intentos_fallidos || 0) + 1;

      if (intentos >= 3) {
        const bloqueadoHasta = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await usuario.update({
          intentos_fallidos: intentos,
          bloqueado_hasta:   bloqueadoHasta,
        });

        return res.status(423).json({
          message: 'Cuenta bloqueada por 10 minutos tras 3 intentos MFA fallidos',
        });
      }

      await usuario.update({ intentos_fallidos: intentos });

      return res.status(401).json({
        message: `Código MFA inválido. Intentos: ${intentos}/3`,
      });
    }

    // ── Código correcto — resetear intentos y emitir access_token ────────────
    await usuario.update({
      intentos_fallidos: 0,
      bloqueado_hasta:   null,
    });

    const accessToken = generarAccessToken(usuario, usuario.roles);

    return res.status(200).json({
      message:      'MFA verificado correctamente. Acceso concedido ✅',
      access_token: accessToken,
      usuario: {
        id:              usuario.id,
        email:           usuario.email,
        nombre_completo: usuario.nombre_completo,
        tienda_id:       usuario.tienda_id,
        roles:           usuario.roles.map(r => r.nombre),
      },
    });
  } catch (error) {
    console.error('Error en mfa/verify:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ── POST /api/auth/mfa/disable ────────────────────────────────────────────────
// Desactiva MFA — requiere confirmación con código TOTP actual
const disable = async (req, res) => {
  try {
    const { codigo } = req.body;
    const usuarioId  = req.usuario.id;

    if (!codigo) {
      return res.status(400).json({ message: 'codigo TOTP actual es obligatorio para desactivar MFA' });
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.mfa_habilitado) {
      return res.status(400).json({ message: 'MFA no está habilitado' });
    }

    // Verificar código antes de desactivar
    const valido = speakeasy.totp.verify({
      secret:   usuario.mfa_secret,
      encoding: 'base32',
      token:    codigo,
      window:   1,
    });

    if (!valido) {
      return res.status(401).json({ message: 'Código inválido. No se desactivó MFA' });
    }

    await usuario.update({
      mfa_habilitado: false,
      mfa_secret:     null,
    });

    return res.status(200).json({ message: 'MFA desactivado correctamente' });
  } catch (error) {
    console.error('Error en mfa/disable:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { setup, activate, verify, disable };