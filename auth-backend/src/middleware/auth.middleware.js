const jwt = require('jsonwebtoken');

// Verifica access_token completo
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Formato inválido. Usa: Bearer <token>' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Bloquear si es token MFA temporal
    if (decoded.tipo === 'mfa_pendiente') {
      return res.status(401).json({
        message: 'Token temporal MFA. Completa la verificación en /api/auth/mfa/verify',
      });
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Verifica mfa_token temporal — solo para /auth/mfa/verify
const verifyMfaToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token MFA no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tipo !== 'mfa_pendiente') {
      return res.status(401).json({ message: 'Se requiere token MFA temporal' });
    }

    req.mfaUsuarioId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token MFA expirado. Inicia sesión nuevamente' });
    }
    return res.status(401).json({ message: 'Token MFA inválido' });
  }
};

// Control de acceso por rol
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tieneRol = req.usuario.roles?.some(r => roles.includes(r));
    if (!tieneRol) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, verifyMfaToken, checkRole };