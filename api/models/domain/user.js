const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  messagesLeft: { type: Number, default: 20000 },
  name: { type: String, required: true, default: '' },
  email: {type: String, unique: true}
});

module.exports = mongoose.model('User', userSchema);
