const logRepository = require('../repositories/logRepository');
const { logAction } = require('../middleware/logger');

class LogController {
  /**
   * GET /logs
   */
  getAll = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const action = req.query.action || null;
      // Non-admins can only see their own logs
      const userId = req.user.role === 'ADMIN' ? (req.query.userId || null) : req.user.id;

      const result = await logRepository.findAll({ page, limit, action, userId });

      await logAction(req.user.id, 'LOGS_VIEW', { page, limit }, req.ip);

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
}

module.exports = new LogController();
