const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Middleware: verify JWT token from HttpOnly cookie or Authorization header
 */
async function authenticate(req, res, next) {
  try {
    // Try cookie first, then Authorization header
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован. Войдите в систему.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data from DB
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Сессия истекла. Войдите снова.' });
    }
    return res.status(401).json({ error: 'Недействительный токен.' });
  }
}

/**
 * Middleware: require ADMIN role
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
