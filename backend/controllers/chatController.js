const Chat = require('../models/Chat');
const User = require('../models/User');
const { AppError } = require('../middleware/error');

/**
 * @desc   Get all chats for the current user
 * @route  GET /api/chats
 * @access Private
 */
const getUserChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', '-passwordHash')
      .populate('lastMessage.sender', 'username avatar')
      .sort({ 'lastMessage.timestamp': -1 });

    // Attach unread count for the requesting user
    const enriched = chats.map((chat) => {
      const chatObj = chat.toObject();
      chatObj.myUnread = chat.unreadCounts?.get(String(req.user._id)) || 0;
      return chatObj;
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      chats: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create or get a direct chat between two users
 * @route  POST /api/chats
 * @body   { userId: string }
 * @access Private
 */
const createOrGetChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return next(new AppError('Target userId is required', 400));
    }

    if (String(userId) === String(req.user._id)) {
      return next(new AppError('Cannot create a chat with yourself', 400));
    }

    // Verify target user exists
    const targetUser = await User.findById(userId).select('-passwordHash');
    if (!targetUser) {
      return next(new AppError('Target user not found', 404));
    }

    // Find or create direct chat
    const chat = await Chat.findOrCreateDirect(req.user._id, userId);

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete a chat (soft — removes user from participants)
 * @route  DELETE /api/chats/:chatId
 * @access Private
 */
const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
    });

    if (!chat) {
      return next(new AppError('Chat not found', 404));
    }

    // Remove the requesting user from participants (soft delete)
    chat.participants = chat.participants.filter(
      (p) => String(p) !== String(req.user._id)
    );

    if (chat.participants.length === 0) {
      // No participants left — hard delete
      await Chat.findByIdAndDelete(chat._id);
    } else {
      await chat.save();
    }

    res.status(200).json({
      success: true,
      message: 'Chat deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserChats, createOrGetChat, deleteChat };
