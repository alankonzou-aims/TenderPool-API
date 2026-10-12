const Milestone = require('../models/milestoneModel');
const Project = require('../models/projectModel');
const Investment = require('../models/investmentModel');
const db = require('../config/db');
const Notification = require('../models/notificationModel');

// POST /api/milestones — SME crée un jalon (squelette, status pending)
exports.createMilestone = (req, res) => {
  try {
    const { projectId, title, description } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ message: 'projectId and title are required' });
    }

    const project = Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.smeId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // On accepte la création dès que le projet est financé/séquestré/en exécution
    const allowed = ['escrow_secured', 'executing'];
    if (!allowed.includes(project.status)) {
      return res.status(400).json({
        message: `Cannot add milestones while project status is "${project.status}"`
      });
    }

    const milestone = Milestone.create({
      projectId: project.id,
      title,
      description,
      photos: [],
      invoices: []
    });

    res.status(201).json(milestone);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/milestones/:id/submit — SME soumet la preuve
exports.submitMilestone = (req, res) => {
  try {
    const { description, photos, invoices } = req.body;

    const milestone = Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (milestone.projectSmeId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (milestone.status === 'approved') {
      return res.status(400).json({ message: 'Milestone already approved' });
    }
    if (milestone.status === 'submitted') {
      return res.status(400).json({ message: 'Milestone already submitted' });
    }

    if (!Array.isArray(photos) || photos.length < 2) {
      return res.status(400).json({
        message: 'At least 2 photos are required as evidence'
      });
    }

    const updated = Milestone.submit(milestone.id, {
      description: description || milestone.description,
      photos,
      invoices: invoices || []
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/milestones/project/:projectId
exports.projectMilestones = (req, res) => {
  try {
    const project = Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // SME ne voit que ses projets ; investisseur doit avoir investi ; admin voit tout
    if (req.user.role === 'sme' && project.smeId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'investor') {
      const total = Investment.sumByInvestorAndProject(req.user.id, project.id);
      if (total <= 0) {
        return res.status(403).json({ message: 'You did not invest in this project' });
      }
    }

    const milestones = Milestone.findByProject(project.id);
    res.json(milestones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/milestones/pending — Admin
exports.pendingMilestones = (req, res) => {
  try {
    res.json(Milestone.findAllSubmitted());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/milestones/:id/approve — Admin
exports.approveMilestone = (req, res) => {
  try {
    const milestone = Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted milestones can be approved' });
    }

    const updated = Milestone.approve(milestone.id);
    const project = db.prepare('SELECT smeId, title FROM projects WHERE id = ?').get(milestone.projectId);

    Notification.create({
        userId: project.smeId,
        message: `Votre jalon "${updated.title}" a été approuvé.`,
        type: 'milestone_approved',
        link: `/projects/${milestone.projectId}`
    });

    // Notifier les investisseurs
    const investors = Investment.findByProject(milestone.projectId);
    const notifs = investors.map((inv) => ({
    userId: inv.investorId,
    message: `Le jalon "${updated.title}" du projet "${project.title}" a été validé.`,
    type: 'milestone_approved',
    link: `/projects/${milestone.projectId}`
    }));
    if (notifs.length) Notification.createMany(notifs);

    // Si tous les jalons du projet sont approuvés, on laisse l'admin clôturer manuellement
    const allDone = Milestone.allApprovedForProject(milestone.projectId);

    res.json({ milestone: updated, allMilestonesApproved: allDone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/milestones/:id/reject — Admin
exports.rejectMilestone = (req, res) => {
  try {
    const { reason } = req.body;
    const milestone = Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted milestones can be rejected' });
    }

    const updated = Milestone.reject(milestone.id, reason);
    const project = db.prepare('SELECT smeId FROM projects WHERE id = ?').get(milestone.projectId);
    Notification.create({
        userId: project.smeId,
        message: `Votre jalon "${milestone.title}" a été rejeté${reason ? ` : ${reason}` : '.'}`,
        type: 'milestone_rejected',
        link: `/projects/${milestone.projectId}`
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};