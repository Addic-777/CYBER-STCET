const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  districts: [{ name: String, footsteps: { type: Number, default: 0 } }],
  points: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
