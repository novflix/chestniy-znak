const pool = require('../config/database');

class CodeRepository {
  async create({ productId, code, createdBy }) {
    const result = await pool.query(
      `INSERT INTO codes (product_id, code, status, created_by)
       VALUES ($1, $2, 'valid', $3)
       RETURNING *`,
      [productId, code, createdBy]
    );
    return result.rows[0];
  }

  async createMany(codes) {
    if (codes.length === 0) return [];

    const placeholders = codes.map((_, i) => 
      `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
    ).join(',');

    const values = codes.flatMap(c => [c.productId, c.code, c.createdBy]);

    const result = await pool.query(
      `INSERT INTO codes (product_id, code, created_by)
       VALUES ${placeholders}
       RETURNING *`,
      values
    );
    return result.rows;
  }

  async findByCode(code) {
    const result = await pool.query(
      `SELECT c.*, p.name AS product_name, p.category AS product_category
       FROM codes c
       JOIN products p ON c.product_id = p.id
       WHERE c.code = $1`,
      [code]
    );
    return result.rows[0] || null;
  }

  async markAsUsed(code, userId) {
    const result = await pool.query(
      `UPDATE codes 
       SET status = 'used', used_at = NOW()
       WHERE code = $1 AND status = 'valid'
       RETURNING *`,
      [code]
    );
    return result.rows[0] || null;
  }

  async markAsInvalid(code) {
    const result = await pool.query(
      `UPDATE codes SET status = 'invalid' WHERE code = $1 RETURNING *`,
      [code]
    );
    return result.rows[0] || null;
  }

  async codeExists(code) {
    const result = await pool.query(
      'SELECT id FROM codes WHERE code = $1',
      [code]
    );
    return result.rows.length > 0;
  }

  async findByProduct(productId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT * FROM codes WHERE product_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );
    return result.rows;
  }

  async getStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'valid') AS valid,
        COUNT(*) FILTER (WHERE status = 'used') AS used,
        COUNT(*) FILTER (WHERE status = 'invalid') AS invalid
      FROM codes
    `);
    return result.rows[0];
  }
}

module.exports = new CodeRepository();
