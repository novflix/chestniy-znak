require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const codeRoutes    = require('./routes/codes');
const logRoutes     = require('./routes/logs');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth',     authRoutes);
app.use('/products', productRoutes);
app.use('/codes',    codeRoutes);
app.use('/logs',     logRoutes);

app.use((req, res) => res.status(404).json({ error: `Маршрут ${req.method} ${req.path} не найден` }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Внутренняя ошибка сервера' }); });

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 «Честный знак» API → http://localhost:${PORT}`);
    console.log(`📦 Supabase: ${process.env.SUPABASE_URL}`);
  });
}

module.exports = app;
