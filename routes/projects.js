const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  createProject,
  listMarketplace,
  myProjects,
  allProjects,
  getProject,
  approveProject,
  rejectProject,
  secureEscrow,
  releaseFunds,    // nouveau
  closeProject     // nouveau
} = require('../controllers/projectController');

// Toutes les routes sont protégées
router.use(auth);

// SME
router.post('/', role('sme'), createProject);
router.get('/my-projects', role('sme'), myProjects);

// Admin
router.get('/all', role('admin'), allProjects);
router.put('/:id/approve', role('admin'), approveProject);
router.put('/:id/reject', role('admin'), rejectProject);
router.put('/:id/secure-escrow', role('admin'), secureEscrow);

// Public (investisseur connecté, admin, etc.)
router.get('/', listMarketplace);
router.get('/:id', getProject);

module.exports = router;