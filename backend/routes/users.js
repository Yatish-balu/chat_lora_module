const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllUsers,
  searchUsers,
  getUserById,
  getOnlineUsers,
} = require('../controllers/userController');

router.use(protect); // All user routes require auth

router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/online', getOnlineUsers);
router.get('/:id', getUserById);

module.exports = router;
