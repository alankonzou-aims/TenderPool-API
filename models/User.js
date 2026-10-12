const db = require('../config/db');

exports.findByEmail = (email) => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
};

exports.findById = (id) => {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
};

exports.findAll = () => {
  return db.prepare(`
    SELECT id, fullName, email, role, phone, city, companyName, sector, createdAt
    FROM users
    ORDER BY createdAt DESC
  `).all();
};

exports.create = (user) => {
  const stmt = db.prepare(`
    INSERT INTO users (fullName, email, password, role, phone, city)
    VALUES (@fullName, @email, @password, @role, @phone, @city)
  `);
  const info = stmt.run({
    fullName: user.fullName,
    email: user.email,
    password: user.password,
    role: user.role,
    phone: user.phone || null,
    city: user.city || null
  });
  return { id: info.lastInsertRowid, ...user };
};

exports.updateProfile = (id, fields) => {
  const allowed = ['companyName', 'sector', 'phone', 'city'];
  const updates = [];
  const values = {};

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      updates.push(`${key} = @${key}`);
      values[key] = fields[key];
    }
  });

  if (updates.length === 0) return exports.findById(id);

  values.id = id;
  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = @id`);
  stmt.run(values);
  return exports.findById(id);
};