const userRepository = require('../repositories/userRepository');
const tokenUtil = require('../utils/tokenUtil');
const FetchTokenRequest = require('../models/dto/fetchTokenRequest');

exports.fetchToken = async (req, res) => {
  try {
    const fetchTokenRequest = new FetchTokenRequest(req.body.userId);
    if (!fetchTokenRequest.userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }
    let user = await userRepository.getUserById(fetchTokenRequest.userId);

    if (!user) {
      // If user does not exist, create with default messagesLeft = 10
      user = await userRepository.createUser(fetchTokenRequest.userId, req.body.name, req.body.email);
    }

    const accessToken = tokenUtil.generateToken(user.userId);
    if(user.messagesLeft <= 0) {
      return res.status(400).json({ message: 'No messages left' });
    }
    else
    return res.json({ accessToken: accessToken, messagesLeft: user.messagesLeft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMessagesLeft = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Access token missing' });
    }

    const token = authHeader.split(' ')[1];
    const userId = tokenUtil.verifyToken(token);

    const user = await userRepository.getUserById(userId);
    

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ messagesLeft: user.messagesLeft });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.deductMessage = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Access token missing' });
    }

    const token = authHeader.split(' ')[1];
    const userId = tokenUtil.verifyToken(token);

    const user = await userRepository.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.messagesLeft <= 0) {
      return res.status(400).json({ message: 'No messages left' });
    }

    await userRepository.deductMessage(userId);

    return res.json({ messagesLeft: user.messagesLeft - 1 });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
