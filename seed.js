const bcrypt = require('bcryptjs');
const db = require('./config/db');

// Helper : date dans le passé (format SQLite)
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function seed() {
  console.log('🌱 Nettoyage des tables…');

  // Ordre respectant les FK
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM milestones;
    DELETE FROM investments;
    DELETE FROM projects;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const hash = (pwd) => bcrypt.hash(pwd, 10);
  const password = await hash('password123');
  const adminPwd = await hash('admin123');

  /* ---------------- USERS ---------------- */
  const insertUser = db.prepare(`
    INSERT INTO users (fullName, email, password, role, phone, city, companyName, sector, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run(
    'Admin TenderPool', 'admin@tenderpool.com', adminPwd, 'admin',
    '+237 600 000 000', 'Yaoundé', null, null, daysAgo(60)
  ).lastInsertRowid;

  const sme1Id = insertUser.run(
    'Samuel Nkeng', 'sam@test.com', password, 'sme',
    '+237 677 111 111', 'Buea', 'Nkeng Construction Ltd', 'BTP', daysAgo(45)
  ).lastInsertRowid;

  const sme2Id = insertUser.run(
    'Aminata Diallo', 'aminata@test.com', password, 'sme',
    '+237 677 222 222', 'Douala', 'Diallo Agri SARL', 'Agriculture', daysAgo(40)
  ).lastInsertRowid;

  const sme3Id = insertUser.run(
    'Jean Mbarga', 'jean@test.com', password, 'sme',
    '+237 677 333 333', 'Yaoundé', 'Mbarga Services', 'Services', daysAgo(35)
  ).lastInsertRowid;

  const inv1Id = insertUser.run(
    'Dr. Ngu Emmanuel', 'ngu@test.com', password, 'investor',
    '+237 699 444 444', 'Douala', null, null, daysAgo(30)
  ).lastInsertRowid;

  const inv2Id = insertUser.run(
    'Coopérative Buea Finance', 'coop@test.com', password, 'investor',
    '+237 699 555 555', 'Buea', null, null, daysAgo(28)
  ).lastInsertRowid;

  const inv3Id = insertUser.run(
    'Marie Fonkou', 'marie@test.com', password, 'investor',
    '+33 6 12 34 56 78', 'Paris', null, null, daysAgo(25)
  ).lastInsertRowid;

  /* ---------------- PROJECTS ---------------- */
  const insertProject = db.prepare(`
    INSERT INTO projects (
      smeId, title, description, sector,
      totalContractAmount, guaranteeAmount, amountRaised,
      roiEstimate, riskLevel, durationMonths, deadline, location,
      tenderDocument, executionPlan, supplierQuotes,
      status, rejectionReason, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const p1 = insertProject.run(
    sme1Id,
    "Construction d'une école à Buea",
    "Construction de 6 salles de classe, d'un bloc administratif et de latrines pour l'école publique de Buea. Fondations, maçonnerie, toiture et finitions.",
    'BTP',
    50000000, 5000000, 0,
    15, 'medium', 6, '2026-12-31', 'Buea',
    'https://example.com/docs/ao-ecole-buea.pdf',
    'https://example.com/docs/plan-execution.pdf',
    'https://example.com/docs/devis-fournisseurs.pdf',
    'collecting', null, daysAgo(20)
  ).lastInsertRowid;

  const p2 = insertProject.run(
    sme2Id,
    'Fourniture de semences certifiées',
    "Fourniture de 20 tonnes de semences de maïs certifiées pour le programme agricole régional. Inclut le transport et le stockage.",
    'Agriculture',
    25000000, 2500000, 0,
    12, 'low', 3, '2026-11-15', 'Douala',
    'https://example.com/docs/ao-semences.pdf',
    'https://example.com/docs/plan-semences.pdf',
    null,
    'collecting', null, daysAgo(18)
  ).lastInsertRowid;

  const p3 = insertProject.run(
    sme3Id,
    'Maintenance informatique ministère',
    "Contrat annuel de maintenance informatique pour 200 postes de travail. Assistance, mises à jour et remplacement de pièces.",
    'Services',
    18000000, 1800000, 0,
    18, 'medium', 12, '2026-10-30', 'Yaoundé',
    'https://example.com/docs/ao-maintenance.pdf',
    'https://example.com/docs/plan-maintenance.pdf',
    'https://example.com/docs/devis-maintenance.pdf',
    'escrow_secured', null, daysAgo(15)
  ).lastInsertRowid;

  const p4 = insertProject.run(
    sme1Id,
    'Réhabilitation route rurale',
    "Réhabilitation de 12 km de route rurale reliant Buea à Molyko. Terrassement, drainage et revêtement.",
    'BTP',
    80000000, 8000000, 0,
    20, 'high', 9, '2027-03-31', 'Buea',
    'https://example.com/docs/ao-route.pdf',
    'https://example.com/docs/plan-route.pdf',
    null,
    'executing', null, daysAgo(12)
  ).lastInsertRowid;

  const p5 = insertProject.run(
    sme2Id,
    'Livraison de matériel médical',
    "Fourniture d'équipements médicaux pour 3 centres de santé. Lits, stérilisateurs et matériel de diagnostic.",
    'Santé',
    15000000, 1500000, 0,
    10, 'low', 2, '2026-08-15', 'Douala',
    'https://example.com/docs/ao-medical.pdf',
    'https://example.com/docs/plan-medical.pdf',
    'https://example.com/docs/devis-medical.pdf',
    'completed', null, daysAgo(10)
  ).lastInsertRowid;

  insertProject.run(
    sme3Id,
    'Fourniture de bureaux',
    "Fourniture et installation de 50 bureaux et 100 chaises pour un nouveau bâtiment administratif.",
    'Fourniture',
    12000000, 1200000, 0,
    14, 'medium', 3, '2026-12-15', 'Yaoundé',
    'https://example.com/docs/ao-bureaux.pdf',
    null, null,
    'pending', null, daysAgo(3)
  );

  insertProject.run(
    sme1Id,
    'Construction entrepôt',
    "Construction d'un entrepôt de stockage de 500 m².",
    'BTP',
    30000000, 3000000, 0,
    16, 'high', 8, '2027-01-31', 'Buea',
    'https://example.com/docs/ao-entrepot.pdf',
    null, null,
    'rejected',
    "Documents incomplets : plan d'exécution et devis fournisseurs manquants",
    daysAgo(8)
  );

  /* ---------------- INVESTMENTS ---------------- */
  const insertInvestment = db.prepare(`
    INSERT INTO investments (
      investorId, projectId, amount, estimatedReturn, actualReturn,
      paymentMethod, status, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const investments = [
    // Projet 1 — collecting (ROI 15%)
    [inv1Id, p1, 2000000, 2300000, null, 'mtn_momo',     'active', daysAgo(9)],
    [inv2Id, p1, 1500000, 1725000, null, 'orange_money', 'active', daysAgo(7)],
    [inv3Id, p1,  500000,  575000, null, 'mtn_momo',     'active', daysAgo(4)],

    // Projet 2 — collecting (ROI 12%)
    [inv2Id, p2, 1000000, 1120000, null, 'orange_money', 'active', daysAgo(6)],
    [inv3Id, p2,  800000,  896000, null, 'mtn_momo',     'active', daysAgo(5)],

    // Projet 3 — escrow_secured (ROI 18%, total = 1 800 000)
    [inv1Id, p3, 1000000, 1180000, null, 'mtn_momo',     'active', daysAgo(10)],
    [inv2Id, p3,  500000,  590000, null, 'orange_money', 'active', daysAgo(9)],
    [inv3Id, p3,  300000,  354000, null, 'mtn_momo',     'active', daysAgo(8)],

    // Projet 4 — executing (ROI 20%, total = 8 000 000)
    [inv1Id, p4, 5000000, 6000000, null, 'mtn_momo',     'active', daysAgo(7)],
    [inv2Id, p4, 2000000, 2400000, null, 'orange_money', 'active', daysAgo(6)],
    [inv3Id, p4, 1000000, 1200000, null, 'mtn_momo',     'active', daysAgo(6)],

    // Projet 5 — completed (ROI 10%, remboursés)
    [inv1Id, p5, 1000000, 1100000, 1100000, 'mtn_momo',     'completed', daysAgo(9)],
    [inv2Id, p5,  500000,  550000,  550000, 'orange_money', 'completed', daysAgo(8)],
  ];

  for (const inv of investments) insertInvestment.run(...inv);

  // Met à jour amountRaised = somme des investissements de chaque projet
  db.prepare(`
    UPDATE projects
    SET amountRaised = (
      SELECT COALESCE(SUM(amount), 0) FROM investments WHERE projectId = projects.id
    )
  `).run();

  /* ---------------- MILESTONES ---------------- */
  const insertMilestone = db.prepare(`
    INSERT INTO milestones (
      projectId, title, description, photos, invoices,
      status, rejectionReason, submittedAt, approvedAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Projet 3 — escrow_secured : 3 jalons en attente
  insertMilestone.run(
    p3, 'Audit initial du parc informatique',
    "Inventaire complet des 200 postes et identification des priorités.",
    JSON.stringify([]), JSON.stringify([]),
    'pending', null, null, null, daysAgo(14)
  );
  insertMilestone.run(
    p3, 'Mise à jour des systèmes',
    "Déploiement des correctifs et mises à jour de sécurité sur les serveurs.",
    JSON.stringify([]), JSON.stringify([]),
    'pending', null, null, null, daysAgo(14)
  );
  insertMilestone.run(
    p3, 'Formation des utilisateurs',
    "Formation de 20 référents internes à l'utilisation des outils.",
    JSON.stringify([]), JSON.stringify([]),
    'pending', null, null, null, daysAgo(14)
  );

  // Projet 4 — executing : 1 approuvé, 1 soumis, 1 en attente
  insertMilestone.run(
    p4, 'Terrassement terminé',
    "12 km de terrassement achevés, profils conformes au plan.",
    JSON.stringify([
      'https://example.com/photos/terrassement-1.jpg',
      'https://example.com/photos/terrassement-2.jpg',
    ]),
    JSON.stringify(['https://example.com/invoices/facture-terrassement.pdf']),
    'approved', null, daysAgo(8), daysAgo(6), daysAgo(10)
  );
  insertMilestone.run(
    p4, 'Drainage et caniveaux',
    "Pose des caniveaux latéraux sur 8 km, en cours de finalisation.",
    JSON.stringify([
      'https://example.com/photos/drainage-1.jpg',
      'https://example.com/photos/drainage-2.jpg',
    ]),
    JSON.stringify(['https://example.com/invoices/facture-drainage.pdf']),
    'submitted', null, daysAgo(2), null, daysAgo(10)
  );
  insertMilestone.run(
    p4, 'Revêtement final',
    "Application de la couche de roulement sur toute la longueur.",
    JSON.stringify([]), JSON.stringify([]),
    'pending', null, null, null, daysAgo(10)
  );

  // Projet 5 — completed : 3 jalons approuvés
  insertMilestone.run(
    p5, 'Commande des équipements',
    "Achat et réception des lits, stérilisateurs et matériel de diagnostic.",
    JSON.stringify([
      'https://example.com/photos/equip-1.jpg',
      'https://example.com/photos/equip-2.jpg',
    ]),
    JSON.stringify(['https://example.com/invoices/facture-equipement.pdf']),
    'approved', null, daysAgo(20), daysAgo(18), daysAgo(22)
  );
  insertMilestone.run(
    p5, 'Livraison centres 1 et 2',
    "Livraison et installation dans les centres de santé de Bonabéri et Deido.",
    JSON.stringify([
      'https://example.com/photos/livraison-1.jpg',
      'https://example.com/photos/livraison-2.jpg',
    ]),
    JSON.stringify(['https://example.com/invoices/facture-livraison.pdf']),
    'approved', null, daysAgo(15), daysAgo(13), daysAgo(17)
  );
  insertMilestone.run(
    p5, 'Livraison centre 3 et formation',
    "Livraison au centre de santé de New Bell et formation du personnel.",
    JSON.stringify([
      'https://example.com/photos/formation-1.jpg',
      'https://example.com/photos/formation-2.jpg',
    ]),
    JSON.stringify(['https://example.com/invoices/facture-formation.pdf']),
    'approved', null, daysAgo(10), daysAgo(8), daysAgo(12)
  );

  /* ---------------- NOTIFICATIONS ---------------- */
  const insertNotif = db.prepare(`
    INSERT INTO notifications (userId, message, type, link, read, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const notifications = [
    // Admin
    [adminId, 'Le projet "Fourniture de bureaux" est en attente de validation.', 'project_pending', null, 0, daysAgo(3)],
    [adminId, 'Le jalon "Drainage et caniveaux" attend une validation.', 'milestone_submitted', null, 0, daysAgo(2)],

    // SME 1 (Samuel)
    [sme1Id, 'Bienvenue sur TenderPool, Samuel Nkeng !', 'welcome', null, 1, daysAgo(45)],
    [sme1Id, 'Votre projet "Construction d\'une école à Buea" est validé et visible dans la marketplace.', 'project_approved', `/projects/${p1}`, 0, daysAgo(19)],
    [sme1Id, 'Nouvel investissement de 2 000 000 FCFA dans "Construction d\'une école à Buea".', 'investment_made', `/projects/${p1}`, 0, daysAgo(9)],
    [sme1Id, 'Nouvel investissement de 1 500 000 FCFA dans "Construction d\'une école à Buea".', 'investment_made', `/projects/${p1}`, 0, daysAgo(7)],
    [sme1Id, 'Le séquestre du projet "Réhabilitation route rurale" est sécurisé.', 'escrow_secured', `/projects/${p4}`, 1, daysAgo(7)],
    [sme1Id, 'Votre jalon "Terrassement terminé" a été approuvé.', 'milestone_approved', `/projects/${p4}`, 0, daysAgo(6)],
    [sme1Id, 'Votre projet "Construction entrepôt" a été rejeté : Documents incomplets.', 'project_rejected', null, 1, daysAgo(8)],

    // SME 2 (Aminata)
    [sme2Id, 'Bienvenue sur TenderPool, Aminata Diallo !', 'welcome', null, 1, daysAgo(40)],
    [sme2Id, 'Votre projet "Fourniture de semences certifiées" est validé.', 'project_approved', `/projects/${p2}`, 0, daysAgo(17)],
    [sme2Id, 'Nouvel investissement de 1 000 000 FCFA dans "Fourniture de semences certifiées".', 'investment_made', `/projects/${p2}`, 0, daysAgo(6)],
    [sme2Id, 'Le projet "Livraison de matériel médical" est terminé. Les rendements ont été distribués.', 'project_completed', `/projects/${p5}`, 1, daysAgo(8)],

    // SME 3 (Jean)
    [sme3Id, 'Bienvenue sur TenderPool, Jean Mbarga !', 'welcome', null, 1, daysAgo(35)],
    [sme3Id, 'Le séquestre du projet "Maintenance informatique ministère" est sécurisé.', 'escrow_secured', `/projects/${p3}`, 0, daysAgo(14)],

    // Investisseur 1 (Dr. Ngu)
    [inv1Id, 'Bienvenue sur TenderPool, Dr. Ngu Emmanuel !', 'welcome', null, 1, daysAgo(30)],
    [inv1Id, 'Votre investissement de 2 000 000 FCFA dans "Construction d\'une école à Buea" est confirmé.', 'investment_confirmed', `/projects/${p1}`, 0, daysAgo(9)],
    [inv1Id, 'Le jalon "Terrassement terminé" du projet "Réhabilitation route rurale" a été validé.', 'milestone_approved', `/projects/${p4}`, 0, daysAgo(6)],
    [inv1Id, 'Le projet "Livraison de matériel médical" est terminé. Vous avez reçu 1 100 000 FCFA.', 'return_paid', `/projects/${p5}`, 0, daysAgo(8)],

    // Investisseur 2 (Coopérative)
    [inv2Id, 'Bienvenue sur TenderPool, Coopérative Buea Finance !', 'welcome', null, 1, daysAgo(28)],
    [inv2Id, 'Nouveau projet disponible : "Construction d\'une école à Buea".', 'project_available', `/projects/${p1}`, 1, daysAgo(19)],
    [inv2Id, 'Le séquestre du projet "Maintenance informatique ministère" est sécurisé.', 'escrow_secured', `/projects/${p3}`, 0, daysAgo(14)],
    [inv2Id, 'Vous avez reçu 550 000 FCFA pour le projet "Livraison de matériel médical".', 'return_paid', `/projects/${p5}`, 0, daysAgo(8)],

    // Investisseur 3 (Marie, diaspora)
    [inv3Id, 'Bienvenue sur TenderPool, Marie Fonkou !', 'welcome', null, 1, daysAgo(25)],
    [inv3Id, 'Votre investissement de 500 000 FCFA dans "Construction d\'une école à Buea" est confirmé.', 'investment_confirmed', `/projects/${p1}`, 0, daysAgo(4)],
    [inv3Id, 'Le projet "Fourniture de semences certifiées" approche de son objectif (72 %).', 'project_update', `/projects/${p2}`, 0, daysAgo(5)],
  ];

  for (const n of notifications) insertNotif.run(...n);

  console.log('✅ Seed terminé.');
  console.log('');
  console.log('Comptes disponibles :');
  console.log('  Admin         : admin@tenderpool.com / admin123');
  console.log('  PME 1         : sam@test.com         / password123');
  console.log('  PME 2         : aminata@test.com     / password123');
  console.log('  PME 3         : jean@test.com        / password123');
  console.log('  Investisseur  : ngu@test.com         / password123');
  console.log('  Investisseur  : coop@test.com        / password123');
  console.log('  Investisseur  : marie@test.com       / password123');
  console.log('');
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});