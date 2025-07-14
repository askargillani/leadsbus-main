const User = require('../models/domain/user');

async function getUserById(userId) {
  return await User.findOne({ userId });
}

async function createUser(userId, name, email) {
  const newUser = new User({ userId: userId, name: name, messagesLeft: 20000, email: email || null });
  return await newUser.save();
}

async function deductMessage(userId) {
  return await User.updateOne(
    { userId },
    { $inc: { messagesLeft: -1 } }
  );
}

module.exports = {
  getUserById,
  createUser,
  deductMessage,
};
