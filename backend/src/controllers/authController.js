const { body } = require('express-validator');
const authService = require('../services/authService');
const { validate } = require('../middleware/validate');
const { logAction } = require('../middleware/logger');

// Validation rules
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Введите корректный email'),
  body('password')
    .isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов')
    .matches(/\d/).withMessage('Пароль должен содержать хотя бы одну цифру'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'USER']).withMessage('Роль должна быть ADMIN или USER'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Введите корректный email'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

class AuthController {
  /**
   * POST /auth/register
   */
  register = [
    ...registerRules,
    validate,
    async (req, res) => {
      try {
        const { email, password, role } = req.body;
        const { user, token } = await authService.register({ email, password, role });

        // Set HttpOnly cookie
        res.cookie('token', token, authService.getCookieOptions());

        await logAction(user.id, 'AUTH_REGISTER', { email }, req.ip);

        res.status(201).json({
          message: 'Регистрация успешна',
          user: { id: user.id, email: user.email, role: user.role }
        });
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
      }
    }
  ];

  /**
   * POST /auth/login
   */
  login = [
    ...loginRules,
    validate,
    async (req, res) => {
      try {
        const { email, password } = req.body;
        const { user, token } = await authService.login({ email, password });

        res.cookie('token', token, authService.getCookieOptions());

        await logAction(user.id, 'AUTH_LOGIN', { email }, req.ip);

        res.json({
          message: 'Вход выполнен',
          user: { id: user.id, email: user.email, role: user.role },
          token // Also return token for clients that prefer header auth
        });
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
      }
    }
  ];

  /**
   * POST /auth/logout
   */
  logout = async (req, res) => {
    if (req.user) {
      await logAction(req.user.id, 'AUTH_LOGOUT', {}, req.ip);
    }
    res.clearCookie('token');
    res.json({ message: 'Выход выполнен' });
  };

  /**
   * GET /auth/me - get current user info
   */
  me = async (req, res) => {
    res.json({ user: req.user });
  };
}

module.exports = new AuthController();
