const jwt = require('jsonwebtoken');
require('dotenv').config();
const secret = process.env.JWT_SECRET;
console.log("secret",secret);
function generateToken(userId) {
  return jwt.sign({ userId }, secret, { expiresIn: '5h' });
}

function verifyToken(token) {
  const decoded = jwt.verify(token, secret);
  return decoded.userId;
}

module.exports = { generateToken, verifyToken };
