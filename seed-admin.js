const bcrypt = require('bcryptjs');
const db = require('./config/db');

const email = process.argv[2] || 'admin@tenderpool.com';
const password = process.argv[3] || 'admin123';

(async () => {
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 10);
  db.prepare(`
    INSERT INTO users (fullName, email, password, role)
    VALUES (?, ?, ?, 'admin')
  `).run('Admin TenderPool', email, hashed);
  console.log(`Admin created: ${email} / ${password}`);
  process.exit(0);
})();