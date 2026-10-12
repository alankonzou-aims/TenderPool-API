const Investment = require('../models/investmentModel');
const Project = require('../models/projectModel');
const Notification = require('../models/notificationModel');
const db = require('../config/db');
const MIN_INVESTMENT = 10000;

// POST /api/investments — Investir dans un projet
exports.invest = (req, res) => {
  try {
    const { projectId, amount, paymentMethod } = req.body;

    if (!projectId || !amount) {
      return res.status(400).json({ message: 'projectId and amount are required' });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt < MIN_INVESTMENT) {
      return res.status(400).json({
        message: `Minimum investment is ${MIN_INVESTMENT} FCFA`
      });
    }

    const project = Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'collecting') {
      return res.status(400).json({
        message: 'This project is not open for investment'
      });
    }

    const remaining = project.guaranteeAmount - project.amountRaised;
    if (amt > remaining) {
      return res.status(400).json({
        message: `Only ${remaining} FCFA remaining to fill this guarantee`
      });
    }

    // Calcul du rendement estimé
    const roi = project.roiEstimate || 0;
    const estimatedReturn = +(amt * (1 + roi / 100)).toFixed(2);

    // 1) Enregistrer l'investissement
    const investment = Investment.create({
      investorId: req.user.id,
      projectId: project.id,
      amount: amt,
      estimatedReturn,
      paymentMethod: paymentMethod || 'mtn_momo'
    });

    // 2) Mettre à jour le montant collecté du projet
    const updatedProject = Project.incrementAmountRaised(project.id, amt);

    // Notifier le SME
    const sme = db.prepare('SELECT smeId, title FROM projects WHERE id = ?').get(project.id);
    Notification.create({
        userId: sme.smeId,
        message: `Nouvel investissement de ${amt} FCFA dans "${sme.title}".`,
        type: 'investment_made',
        link: `/projects/${project.id}`
    });

    // Notifier l'investisseur (confirmation)
    Notification.create({
        userId: req.user.id,
        message: `Votre investissement de ${amt} FCFA dans "${sme.title}" est confirmé.`,
        type: 'investment_confirmed',
        link: `/projects/${project.id}`
    });

    res.status(201).json({
      message: 'Investment successful',
      investment,
      project: updatedProject
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/investments/my-portfolio
exports.myPortfolio = (req, res) => {
  try {
    const investments = Investment.findByInvestor(req.user.id);
    const totals = Investment.sumByInvestor(req.user.id);

    const totalEstimated = investments.reduce(
      (sum, i) => sum + (i.estimatedReturn || 0),
      0
    );

    res.json({
      summary: {
        totalInvested: totals.total,
        numberOfInvestments: totals.count,
        totalEstimatedReturn: +totalEstimated.toFixed(2)
      },
      investments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/investments/project/:projectId — SME propriétaire ou admin
exports.projectInvestors = (req, res) => {
  try {
    const project = Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Un SME ne peut voir que ses propres projets
    if (req.user.role === 'sme' && project.smeId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const investors = Investment.findByProject(project.id).map((inv) => ({
      ...inv,
      // anonymisation partielle : "Samuel N." -> "S***l N."
      investorName: anonymize(inv.investorName)
    }));

    res.json(investors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function anonymize(name) {
  if (!name) return 'Anonymous';
  return name
    .split(' ')
    .map((part) =>
      part.length <= 2
        ? part[0] + '*'
        : part[0] + '***' + part[part.length - 1]
    )
    .join(' ');
}