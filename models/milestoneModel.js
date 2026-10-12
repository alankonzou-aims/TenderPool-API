const db = require('../config/db');

function parseRow(row) {
  if (!row) return row;
  return {
    ...row,
    photos: row.photos ? JSON.parse(row.photos) : [],
    invoices: row.invoices ? JSON.parse(row.invoices) : []
  };
}

exports.create = (milestone) => {
  const stmt = db.prepare(`
    INSERT INTO milestones (projectId, title, description, photos, invoices)
    VALUES (@projectId, @title, @description, @photos, @invoices)
  `);
  const info = stmt.run({
    projectId: milestone.projectId,
    title: milestone.title,
    description: milestone.description || null,
    photos: JSON.stringify(milestone.photos || []),
    invoices: JSON.stringify(milestone.invoices || [])
  });
  return exports.findById(info.lastInsertRowid);
};

exports.findById = (id) => {
  const row = db.prepare(`
    SELECT m.*, p.title AS projectTitle, p.smeId AS projectSmeId
    FROM milestones m
    JOIN projects p ON p.id = m.projectId
    WHERE m.id = ?
  `).get(id);
  return parseRow(row);
};

exports.findByProject = (projectId) => {
  const rows = db.prepare(`
    SELECT * FROM milestones
    WHERE projectId = ?
    ORDER BY createdAt ASC
  `).all(projectId);
  return rows.map(parseRow);
};

// Tous les jalons en attente de validation admin
exports.findAllSubmitted = () => {
  const rows = db.prepare(`
    SELECT m.*, p.title AS projectTitle, u.fullName AS smeName
    FROM milestones m
    JOIN projects p ON p.id = m.projectId
    JOIN users u ON u.id = p.smeId
    WHERE m.status = 'submitted'
    ORDER BY m.submittedAt ASC
  `).all();
  return rows.map(parseRow);
};

// SME soumet la preuve d'un jalon
exports.submit = (id, { description, photos, invoices }) => {
  db.prepare(`
    UPDATE milestones
    SET description = ?, photos = ?, invoices = ?,
        status = 'submitted', submittedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    description || null,
    JSON.stringify(photos || []),
    JSON.stringify(invoices || []),
    id
  );
  return exports.findById(id);
};

exports.approve = (id) => {
  db.prepare(`
    UPDATE milestones
    SET status = 'approved', approvedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
  return exports.findById(id);
};

exports.reject = (id, reason) => {
  db.prepare(`
    UPDATE milestones
    SET status = 'rejected', rejectionReason = ?
    WHERE id = ?
  `).run(reason || null, id);
  return exports.findById(id);
};

// Vérifie que tous les jalons d'un projet sont approuvés
exports.allApprovedForProject = (projectId) => {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved
    FROM milestones WHERE projectId = ?
  `).get(projectId);
  return row.total > 0 && row.total === row.approved;
};