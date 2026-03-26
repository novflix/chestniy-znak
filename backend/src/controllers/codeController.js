const { body } = require('express-validator');
const codeService = require('../services/codeService');
const { validate } = require('../middleware/validate');
const { logAction } = require('../middleware/logger');

const generateRules = [
  body('productId')
    .notEmpty().withMessage('ID товара обязателен')
    .isUUID().withMessage('Неверный формат ID товара'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Количество кодов: от 1 до 500'),
];

const verifyRules = [
  body('code')
    .notEmpty().withMessage('Код маркировки обязателен')
    .trim()
    .toUpperCase(),
  body('markAsUsed')
    .optional()
    .isBoolean().withMessage('markAsUsed должен быть булевым значением'),
];

class CodeController {
  /**
   * POST /codes/generate
   */
  generate = [
    ...generateRules,
    validate,
    async (req, res) => {
      try {
        const { productId, count = 1 } = req.body;

        const codes = await codeService.generate({
          productId,
          count: parseInt(count),
          userId: req.user.id,
        });

        await logAction(req.user.id, 'CODE_GENERATE', {
          productId,
          count: codes.length,
          codes: codes.map(c => c.code),
        }, req.ip);

        res.status(201).json({
          message: `Сгенерировано кодов: ${codes.length}`,
          codes,
        });
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
      }
    }
  ];

  /**
   * POST /codes/verify
   */
  verify = [
    ...verifyRules,
    validate,
    async (req, res) => {
      try {
        const { code, markAsUsed = false } = req.body;

        const result = await codeService.verify({
          code: code.trim().toUpperCase(),
          markAsUsed,
          userId: req.user.id,
        });

        await logAction(req.user.id, 'CODE_VERIFY', {
          code,
          result: result.status,
          markAsUsed,
        }, req.ip);

        const statusCode = result.valid ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
      }
    }
  ];

  /**
   * GET /codes/stats
   */
  stats = async (req, res) => {
    try {
      const stats = await codeService.getStats();
      res.json({ stats });
    } catch (err) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
}

module.exports = new CodeController();
