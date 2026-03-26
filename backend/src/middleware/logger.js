const logRepository = require('../repositories/logRepository');

async function logAction(userId, action, details = {}, ipAddress = null) {
  try {
    await logRepository.create({ userId, action, details, ipAddress });
  } catch (err) {
    console.error('Logging error:', err.message);
  }
}

module.exports = { logAction };
