const Project = require('../models/projectModel');

const Notification = require('../models/notificationModel');
const Investment = require('../models/investmentModel');
const db = require('../config/db');
const Milestone = require('../models/milestoneModel');

// POST /api/projects — SME crée un projet
exports.createProject = (req, res) => {
  try {
    const {
      title, description, sector,
      totalContractAmount, guaranteeAmount,
      roiEstimate, riskLevel, durationMonths,
      deadline, location,
      tenderDocument, executionPlan, supplierQuotes
    } = req.body;

    if (!title || !totalContractAmount || !guaranteeAmount) {
      return res.status(400).json({
        message: 'title, totalContractAmount and guaranteeAmount are required'
      });
    }

    const project = Project.create({
      smeId: req.user.id,
      title,
      description: description || null,
      sector: sector || null,
      totalContractAmount: Number(totalContractAmount),
      guaranteeAmount: Number(guaranteeAmount),
      roiEstimate: roiEstimate ? Number(roiEstimate) : null,
      riskLevel: riskLevel || 'medium',
      durationMonths: durationMonths ? Number(durationMonths) : null,
      deadline: deadline || null,
      location: location || null,
      tenderDocument: tenderDocument || null,
      executionPlan: executionPlan || null,
      supplierQuotes: supplierQuotes || null
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects — Marketplace (investisseurs)
exports.listMarketplace = (req, res) => {
  try {
    const projects = Project.findMarketplace({
      sector: req.query.sector,
      riskLevel: req.query.riskLevel,
      minRoi: req.query.minRoi
    });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/my-projects — SME
exports.myProjects = (req, res) => {
  try {
    const projects = Project.findBySme(req.user.id);
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/all — Admin
exports.allProjects = (req, res) => {
  try {
    const projects = Project.findAll();
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/:id
exports.getProject = (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/projects/:id/approve — Admin
exports.approveProject = (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending projects can be approved' });
    }
    const updated = Project.updateStatus(project.id, 'collecting');
    Notification.create({
        userId: project.smeId,
        message: `Votre projet "${project.title}" a été validé. Il est maintenant visible dans la Marketplace.`,
        type: 'project_approved',
        link: `/projects/${project.id}`
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/projects/:id/reject — Admin
exports.rejectProject = (req, res) => {
  try {
    const { reason } = req.body;
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending projects can be rejected' });
    }
    const updated = Project.updateStatus(project.id, 'rejected', reason || null);
    Notification.create({
        userId: project.smeId,
        message: `Votre projet "${project.title}" a été rejeté${reason ? ` : ${reason}` : '.'}`,
        type: 'project_rejected',
        link: `/projects/${project.id}`
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/projects/:id/secure-escrow — Admin
exports.secureEscrow = (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.status !== 'collecting') {
      return res.status(400).json({ message: 'Only collecting projects can be secured' });
    }
    if (project.amountRaised < project.guaranteeAmount) {
      return res.status(400).json({ message: 'Guarantee not fully raised yet' });
    }
    const updated = Project.updateStatus(project.id, 'escrow_secured');
    Notification.create({
        userId: project.smeId,
        message: `Le séquestre du projet "${project.title}" est sécurisé. Vous pouvez commencer l'exécution.`,
        type: 'escrow_secured',
        link: `/projects/${project.id}`
    });

    // Notifier les investisseurs
    const notifs = investors.map((inv) => ({
    userId: inv.investorId,
    message: `Le séquestre du projet "${project.title}" est sécurisé.`,
    type: 'escrow_secured',
    link: `/projects/${project.id}`
    }));
    if (notifs.length) Notification.createMany(notifs);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// PUT /api/projects/:id/close — Admin
exports.closeProject = (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!['escrow_secured', 'executing'].includes(project.status)) {
      return res.status(400).json({
        message: `Cannot close a project with status "${project.status}"`
      });
    }

    if (!Milestone.allApprovedForProject(project.id)) {
      return res.status(400).json({
        message: 'All milestones must be approved before closing'
      });
    }

    // Distribution des rendements
    const updatedInvestments = Investment.completeAllForProject(
      project.id,
      project.roiEstimate || 0
    );

    const notifs = updatedInvestments.map((inv) => ({
    userId: inv.investorId,
    message: `Le projet "${project.title}" est terminé. Vous avez reçu ${inv.actualReturn} FCFA.`,
    type: 'return_paid',
    link: `/projects/${project.id}`
    }));
    if (notifs.length) Notification.createMany(notifs);

    // Notifier aussi le SME
    Notification.create({
    userId: project.smeId,
    message: `Votre projet "${project.title}" est clôturé. Les rendements ont été distribués.`,
    type: 'project_completed',
    link: `/projects/${project.id}`
    });

    const updatedProject = Project.updateStatus(project.id, 'completed');

    res.json({
      message: 'Project closed. Returns distributed.',
      project: updatedProject,
      investments: updatedInvestments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/projects/:id/release-funds — Admin
exports.releaseFunds = (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.status !== 'escrow_secured') {
      return res.status(400).json({ message: 'Project must be in escrow first' });
    }
    const updated = Project.updateStatus(project.id, 'executing');
    const investors = Investment.findByProject(project.id);
    const notifs = investors.map((inv) => ({
    userId: inv.investorId,
        message: `Le projet "${project.title}" entre en phase d'exécution.`,
        type: 'executing',
        link: `/projects/${project.id}`
    }));
    if (notifs.length) Notification.createMany(notifs);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

