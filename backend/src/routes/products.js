const router = require('express').Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', productController.getAll);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getById);
router.post('/', productController.create);

module.exports = router;
