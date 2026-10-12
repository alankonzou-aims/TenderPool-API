const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, phone, city } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['sme', 'investor'].includes(role)) {
      // admin ne peut pas s'auto-inscrire via cette route
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const exists = User.findByEmail(email);
    if (exists) {
      return res.status(400).json({ message: 'Email already used' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = User.create({
      fullName,
      email,
      password: hashed,
      role,
      phone,
      city
    });

    res.status(201).json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me
exports.me = (req, res) => {
  const user = User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  delete user.password;
  res.json(user);
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, city, companyName, sector } = req.body;

    const user = User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Champs autorisés selon le rôle
    const fields = {};

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({ message: 'Full name cannot be empty' });
      }
      fields.fullName = fullName.trim();
    }
    if (phone !== undefined) fields.phone = phone.trim() || null;
    if (city !== undefined)  fields.city = city.trim() || null;

    if (user.role === 'sme') {
      if (companyName !== undefined) fields.companyName = companyName.trim() || null;
      if (sector !== undefined)      fields.sector = sector.trim() || null;
    }

    // Met à jour fullName directement (pas via updateProfile du model qui ne gère que les champs pro)
    const db = require('../config/db');
    const updates = [];
    const values = { id: req.user.id };

    Object.keys(fields).forEach((key) => {
      updates.push(`${key} = @${key}`);
      values[key] = fields[key];
    });

    if (updates.length > 0) {
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = @id`).run(values);
    }

    const updated = User.findById(req.user.id);
    delete updated.password;
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const db = require('../config/db');
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};