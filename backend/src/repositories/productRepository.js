const pool = require('../config/database');

class ProductRepository {
  async findAll({ page = 1, limit = 20, category } = {}) {
    const offset = (page - 1) * limit;
    const params = [limit, offset];
    let where = '';

    if (category) {
      where = 'WHERE p.category = $3';
      params.push(category);
    }

    const result = await pool.query(
      `SELECT 
         p.id, p.name, p.category, p.description, p.created_at,
         u.email AS created_by_email,
         COUNT(c.id) AS code_count,
         COUNT(c.id) FILTER (WHERE c.status = 'valid') AS valid_codes
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN codes c ON c.product_id = p.id
       ${where}
       GROUP BY p.id, u.email
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products p ${where}`,
      category ? [category] : []
    );

    return {
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT p.*, u.email AS created_by_email
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async create({ name, category, description, createdBy }) {
    const result = await pool.query(
      `INSERT INTO products (name, category, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, category, description || null, createdBy]
    );
    return result.rows[0];
  }

  async exists(id) {
    const result = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    return result.rows.length > 0;
  }

  async getCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    return result.rows.map(r => r.category);
  }
}

module.exports = new ProductRepository();
