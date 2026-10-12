const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  invest,
  myPortfolio,
  projectInvestors
} = require('../controllers/investmentController');

router.use(auth);

router.post('/', role('investor'), invest);
router.get('/my-portfolio', role('investor'), myPortfolio);
router.get('/project/:projectId', role('sme', 'admin'), projectInvestors);

module.exports = router;