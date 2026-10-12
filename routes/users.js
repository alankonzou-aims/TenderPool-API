const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { list } = require('../controllers/userController');

router.use(auth);
router.get('/', role('admin'), list);

module.exports = router;