const pool = require('../config/database');

/**
 * Log an action to the database
 */
async function logAction(userId, action, details = {}, ipAddress = null) {
  try {
    await pool.query(
      'INSERT INTO logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [userId || null, action, JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    // Don't fail the request if logging fails
    console.error('Logging error:', err.message);
  }
}

/**
 * Middleware factory: logs action after request completes
 */
function createLogger(action) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
      // Log after response
      const userId = req.user?.id || null;
      const ip = req.ip || req.connection?.remoteAddress;
      
      logAction(userId, action, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      }, ip);
      
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = { logAction, createLogger };
