const router = require('express').Router();
const codeController = require('../controllers/codeController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/generate', codeController.generate);
router.post('/verify', codeController.verify);
router.get('/stats', codeController.stats);

module.exports = router;
