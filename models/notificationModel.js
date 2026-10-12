const db = require('../config/db');

exports.create = ({ userId, message, type = null, link = null }) => {
  const stmt = db.prepare(`
    INSERT INTO notifications (userId, message, type, link)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(userId, message, type, link);
  return exports.findById(info.lastInsertRowid);
};

exports.findById = (id) => {
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
};

exports.findByUser = (userId) => {
  return db.prepare(`
    SELECT * FROM notifications
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 50
  `).all(userId);
};

exports.countUnread = (userId) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS count FROM notifications
    WHERE userId = ? AND read = 0
  `).get(userId);
  return row.count;
};

exports.markAsRead = (id, userId) => {
  db.prepare(`
    UPDATE notifications SET read = 1
    WHERE id = ? AND userId = ?
  `).run(id, userId);
  return exports.findById(id);
};

exports.markAllAsRead = (userId) => {
  db.prepare(`UPDATE notifications SET read = 1 WHERE userId = ?`).run(userId);
};

exports.createMany = (items) => {
  const stmt = db.prepare(`
    INSERT INTO notifications (userId, message, type, link)
    VALUES (@userId, @message, @type, @link)
  `);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      stmt.run({
        userId: r.userId,
        message: r.message,
        type: r.type || null,
        link: r.link || null
      });
    }
  });
  tx(items);
};