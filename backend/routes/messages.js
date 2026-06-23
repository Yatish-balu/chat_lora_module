const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMessages,
  sendMessage,
  markMessagesRead,
  markMessagesDelivered,
  deleteMessage,
} = require('../controllers/messageController');

router.use(protect);

router.get('/:chatId', getMessages);
router.post('/send', sendMessage);
router.post('/read', markMessagesRead);
router.post('/delivered', markMessagesDelivered);
router.delete('/:messageId', deleteMessage);

module.exports = router;
