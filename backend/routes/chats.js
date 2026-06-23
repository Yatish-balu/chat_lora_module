const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserChats,
  createOrGetChat,
  deleteChat,
} = require('../controllers/chatController');

router.use(protect);

router.get('/', getUserChats);
router.post('/', createOrGetChat);
router.delete('/:chatId', deleteChat);

module.exports = router;
