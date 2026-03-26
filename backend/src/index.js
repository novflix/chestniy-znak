require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const codeRoutes = require('./routes/codes');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Trust proxy for accurate IP logging
app.set('trust proxy', 1);

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/codes', codeRoutes);
app.use('/logs', logRoutes);

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.path} не найден` });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// ── Start server ────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app; // export for tests
