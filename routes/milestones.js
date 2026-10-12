const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  createMilestone,
  submitMilestone,
  projectMilestones,
  pendingMilestones,
  approveMilestone,
  rejectMilestone
} = require('../controllers/milestoneController');

router.use(auth);

// SME
router.post('/', role('sme'), createMilestone);
router.put('/:id/submit', role('sme'), submitMilestone);

// Admin
router.get('/pending', role('admin'), pendingMilestones);
router.put('/:id/approve', role('admin'), approveMilestone);
router.put('/:id/reject', role('admin'), rejectMilestone);

// SME (son projet), Investor (s'il a investi), Admin
router.get('/project/:projectId', projectMilestones);

module.exports = router;