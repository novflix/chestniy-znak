const router = require('express').Router();
const logController = require('../controllers/logController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', logController.getAll);

module.exports = router;
