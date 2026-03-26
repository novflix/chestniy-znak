const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

/**
 * Verify JWT from HttpOnly cookie or Authorization header.
 */
async function authenticate(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ error: 'Не авторизован. Войдите в систему.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepository.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Сессия истекла. Войдите снова.' });
    return res.status(401).json({ error: 'Недействительный токен.' });
  }
}

/**
 * Require ADMIN role — call after authenticate().
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN')
    return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
  next();
}

module.exports = { authenticate, requireAdmin };
