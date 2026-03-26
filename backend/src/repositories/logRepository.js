const pool = require('../config/database');

class LogRepository {
  async findAll({ page = 1, limit = 50, action, userId } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [limit, offset];
    let pIdx = 3;

    if (action) {
      conditions.push(`l.action = $${pIdx++}`);
      params.push(action);
    }
    if (userId) {
      conditions.push(`l.user_id = $${pIdx++}`);
      params.push(userId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT 
         l.id, l.action, l.details, l.ip_address, l.timestamp,
         u.email AS user_email, u.role AS user_role
       FROM logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${where}
       ORDER BY l.timestamp DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM logs l ${where}`,
      params.slice(2)
    );

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  async create({ userId, action, details, ipAddress }) {
    const result = await pool.query(
      `INSERT INTO logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId || null, action, JSON.stringify(details || {}), ipAddress || null]
    );
    return result.rows[0];
  }
}

module.exports = new LogRepository();
