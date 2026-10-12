const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  me,
  updateProfile,
  changePassword
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);

module.exports = router;