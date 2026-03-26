const { validationResult } = require('express-validator');

/**
 * Middleware: check validation results and return errors
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Ошибка валидации',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

module.exports = { validate };
