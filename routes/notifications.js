const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  list,
  markRead,
  markAllRead
} = require('../controllers/notificationController');

router.use(auth);

router.get('/', list);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;