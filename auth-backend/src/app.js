const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
dotenv.config();

const { sequelize } = require('./models');

const authRoutes     = require('./routes/auth.routes');
const rolRoutes      = require('./routes/rol.routes');
const usuarioRoutes  = require('./routes/usuario.routes');
const productoRoutes = require('./routes/producto.routes');

const app = express();

// ── CORS — debe ir ANTES de las rutas ────────────────────
app.use(cors({
  origin:      'http://localhost:5173', // URL del frontend Vue
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/roles',     rolRoutes);
app.use('/api/usuarios',  usuarioRoutes);
app.use('/api/productos', productoRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Auth MFA API corriendo ✅' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Ruta ${req.method} ${req.url} no encontrada` });
});

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a PostgreSQL establecida');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ Error al conectar:', err.message));

module.exports = app;