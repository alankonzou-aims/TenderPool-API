const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'tenderpool.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('sme','investor','admin')) NOT NULL,
    phone TEXT,
    city TEXT,
    companyName TEXT,
    sector TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    smeId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sector TEXT,
    totalContractAmount REAL NOT NULL,
    guaranteeAmount REAL NOT NULL,
    amountRaised REAL DEFAULT 0,
    roiEstimate REAL,
    riskLevel TEXT CHECK(riskLevel IN ('low','medium','high')) DEFAULT 'medium',
    durationMonths INTEGER,
    deadline TEXT,
    location TEXT,
    tenderDocument TEXT,
    executionPlan TEXT,
    supplierQuotes TEXT,
    rejectionReason TEXT,
    status TEXT CHECK(status IN (
      'pending','approved','collecting',
      'escrow_secured','executing','completed','rejected'
    )) DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (smeId) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investorId INTEGER NOT NULL,
    projectId INTEGER NOT NULL,
    amount REAL NOT NULL,
    estimatedReturn REAL NOT NULL,
    actualReturn REAL,
    paymentMethod TEXT,
    status TEXT CHECK(status IN ('active','completed','cancelled')) DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investorId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

// Table milestones
db.exec(`
  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    photos TEXT,       -- JSON array en string
    invoices TEXT,     -- JSON array en string
    status TEXT CHECK(status IN ('pending','submitted','approved','rejected')) DEFAULT 'pending',
    rejectionReason TEXT,
    submittedAt DATETIME,
    approvedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

// Table notifications
// Table notifications
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    link TEXT,
    read INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`);



module.exports = db;