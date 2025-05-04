const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/fetch-token', userController.fetchToken);
router.get('/messages-left', userController.getMessagesLeft);
router.post('/deduct-message', userController.deductMessage);

module.exports = router;
