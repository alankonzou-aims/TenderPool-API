const db = require('../config/db');

exports.create = (project) => {
  const stmt = db.prepare(`
    INSERT INTO projects (
      smeId, title, description, sector,
      totalContractAmount, guaranteeAmount, roiEstimate,
      riskLevel, durationMonths, deadline, location,
      tenderDocument, executionPlan, supplierQuotes
    ) VALUES (
      @smeId, @title, @description, @sector,
      @totalContractAmount, @guaranteeAmount, @roiEstimate,
      @riskLevel, @durationMonths, @deadline, @location,
      @tenderDocument, @executionPlan, @supplierQuotes
    )
  `);
  const info = stmt.run(project);
  return exports.findById(info.lastInsertRowid);
};

exports.findById = (id) => {
  return db.prepare(`
    SELECT p.*, u.fullName AS smeName, u.companyName AS smeCompany
    FROM projects p
    JOIN users u ON u.id = p.smeId
    WHERE p.id = ?
  `).get(id);
};

// Projets d'un SME
exports.findBySme = (smeId) => {
  return db.prepare(`
    SELECT * FROM projects WHERE smeId = ? ORDER BY createdAt DESC
  `).all(smeId);
};

// Marketplace : uniquement les projets visibles aux investisseurs
exports.findMarketplace = (filters = {}) => {
  let query = `
    SELECT p.*, u.fullName AS smeName, u.companyName AS smeCompany
    FROM projects p
    JOIN users u ON u.id = p.smeId
    WHERE p.status IN ('approved','collecting')
  `;
  const params = {};

  if (filters.sector) {
    query += ` AND p.sector = @sector`;
    params.sector = filters.sector;
  }
  if (filters.riskLevel) {
    query += ` AND p.riskLevel = @riskLevel`;
    params.riskLevel = filters.riskLevel;
  }
  if (filters.minRoi) {
    query += ` AND p.roiEstimate >= @minRoi`;
    params.minRoi = Number(filters.minRoi);
  }

  query += ` ORDER BY p.createdAt DESC`;
  return db.prepare(query).all(params);
};

// Tous les projets (admin)
exports.findAll = () => {
  return db.prepare(`
    SELECT p.*, u.fullName AS smeName, u.companyName AS smeCompany
    FROM projects p
    JOIN users u ON u.id = p.smeId
    ORDER BY p.createdAt DESC
  `).all();
};

exports.updateStatus = (id, status, rejectionReason = null) => {
  db.prepare(`
    UPDATE projects SET status = ?, rejectionReason = ? WHERE id = ?
  `).run(status, rejectionReason, id);
  return exports.findById(id);
};

exports.incrementAmountRaised = (id, amount) => {
  db.prepare(`
    UPDATE projects SET amountRaised = amountRaised + ? WHERE id = ?
  `).run(amount, id);
  return exports.findById(id);
};