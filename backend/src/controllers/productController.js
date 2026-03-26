const { body, query } = require('express-validator');
const productService = require('../services/productService');
const { validate } = require('../middleware/validate');
const { logAction } = require('../middleware/logger');

const createRules = [
  body('name')
    .trim().notEmpty().withMessage('Название товара обязательно')
    .isLength({ max: 255 }).withMessage('Название не должно превышать 255 символов'),
  body('category')
    .trim().notEmpty().withMessage('Категория обязательна')
    .isLength({ max: 100 }).withMessage('Категория не должна превышать 100 символов'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Описание не должно превышать 1000 символов'),
];

class ProductController {
  /**
   * GET /products
   */
  getAll = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const category = req.query.category || null;

      const result = await productService.getAll({ page, limit, category });
      
      await logAction(req.user.id, 'PRODUCT_LIST', { page, limit, category }, req.ip);
      
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
    }
  };

  /**
   * GET /products/categories
   */
  getCategories = async (req, res) => {
    try {
      const categories = await productService.getCategories();
      res.json({ categories });
    } catch (err) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };

  /**
   * GET /products/:id
   */
  getById = async (req, res) => {
    try {
      const product = await productService.getById(req.params.id);
      res.json({ product });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
    }
  };

  /**
   * POST /products
   */
  create = [
    ...createRules,
    validate,
    async (req, res) => {
      try {
        const product = await productService.create({
          ...req.body,
          userId: req.user.id,
        });

        await logAction(req.user.id, 'PRODUCT_CREATE', {
          productId: product.id,
          name: product.name,
          category: product.category
        }, req.ip);

        res.status(201).json({ product, message: 'Товар создан' });
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
      }
    }
  ];
}

module.exports = new ProductController();
