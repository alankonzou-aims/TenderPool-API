const db = require('../config/db');

exports.create = (investment) => {
  const stmt = db.prepare(`
    INSERT INTO investments (
      investorId, projectId, amount, estimatedReturn, paymentMethod
    ) VALUES (
      @investorId, @projectId, @amount, @estimatedReturn, @paymentMethod
    )
  `);
  const info = stmt.run(investment);
  return exports.findById(info.lastInsertRowid);
};

exports.findById = (id) => {
  return db.prepare(`
    SELECT i.*, p.title AS projectTitle, p.sector AS projectSector,
           u.fullName AS investorName
    FROM investments i
    JOIN projects p ON p.id = i.projectId
    JOIN users u ON u.id = i.investorId
    WHERE i.id = ?
  `).get(id);
};

// Tous les investissements d'un investisseur (son portefeuille)
exports.findByInvestor = (investorId) => {
  return db.prepare(`
    SELECT i.*, p.title AS projectTitle, p.sector AS projectSector,
           p.status AS projectStatus, p.roiEstimate AS projectRoi
    FROM investments i
    JOIN projects p ON p.id = i.projectId
    WHERE i.investorId = ?
    ORDER BY i.createdAt DESC
  `).all(investorId);
};

// Tous les investisseurs d'un projet (pour SME et admin)
exports.findByProject = (projectId) => {
  return db.prepare(`
    SELECT i.*, u.fullName AS investorName, u.city AS investorCity
    FROM investments i
    JOIN users u ON u.id = i.investorId
    WHERE i.projectId = ?
    ORDER BY i.createdAt DESC
  `).all(projectId);
};

// Total investi par un utilisateur (pour le dashboard)
exports.sumByInvestor = (investorId) => {
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
    FROM investments WHERE investorId = ?
  `).get(investorId);
  return row;
};

// Total déjà investi par un investisseur dans un projet donné (optionnel)
exports.sumByInvestorAndProject = (investorId, projectId) => {
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM investments WHERE investorId = ? AND projectId = ?
  `).get(investorId, projectId);
  return row.total;
};

exports.completeAllForProject = (projectId, roiEstimate) => {
  const investments = db.prepare(`
    SELECT * FROM investments WHERE projectId = ? AND status = 'active'
  `).all(projectId);

  const stmt = db.prepare(`
    UPDATE investments
    SET actualReturn = ?, status = 'completed'
    WHERE id = ?
  `);

  const tx = db.transaction((rows) => {
    for (const inv of rows) {
      const actual = +(inv.amount * (1 + roiEstimate / 100)).toFixed(2);
      stmt.run(actual, inv.id);
    }
  });

  tx(investments);

  return investments.map((inv) => ({
    ...inv,
    actualReturn: +(inv.amount * (1 + roiEstimate / 100)).toFixed(2),
    status: 'completed'
  }));
};