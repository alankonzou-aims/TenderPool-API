const User = require('../models/userModel');

exports.list = (req, res) => {
  try {
    res.json(User.findAll());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};