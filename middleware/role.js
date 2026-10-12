module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    // On récupère le rôle depuis la DB car le JWT ne contient que l'id
    const db = require('../config/db');
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    req.user.role = user.role;
    next();
  };
};