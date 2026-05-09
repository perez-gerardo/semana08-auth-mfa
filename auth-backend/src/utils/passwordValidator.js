const validarPassword = (password) => {
  const errores = [];

  if (!password || password.length < 8) {
    errores.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errores.push('Al menos una letra mayúscula');
  }
  if (!/[0-9]/.test(password)) {
    errores.push('Al menos un número');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errores.push('Al menos un carácter especial (!@#$%^&*...)');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};

module.exports = { validarPassword };