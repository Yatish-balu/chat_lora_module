const User = require('../models/User');
const { AppError } = require('../middleware/error');

/**
 * @desc   Get all users (excluding self and password)
 * @route  GET /api/users
 * @access Private
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-passwordHash')
      .sort({ status: 1, username: 1 }); // online users first

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Search users by username or displayName
 * @route  GET /api/users/search?q=query
 * @access Private
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({ success: true, users: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    let users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { displayName: regex }, { email: regex }],
    })
      .select('-passwordHash')
      .limit(20);

    // If search results don't have an exact username match and query is a valid username pattern,
    // dynamically register the username as a local placeholder contact so the user can start a chat.
    const queryTrim = q.trim();
    const hasExactMatch = users.some(u => u.username.toLowerCase() === queryTrim.toLowerCase());

    if (!hasExactMatch && /^[a-zA-Z0-9_]{3,30}$/.test(queryTrim) && queryTrim.toLowerCase() !== req.user.username.toLowerCase()) {
      let remoteUser = await User.findOne({
        username: new RegExp('^' + queryTrim.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i')
      });

      if (!remoteUser) {
        remoteUser = await User.create({
          username: queryTrim.toLowerCase(),
          email: `${queryTrim.toLowerCase()}@antigravity.chat`,
          passwordHash: 'default_password_remote',
          displayName: queryTrim,
          avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(queryTrim)}`,
          status: 'offline',
        });
      }

      if (String(remoteUser._id) !== String(req.user._id)) {
        const uObj = remoteUser.toObject();
        delete uObj.passwordHash;
        users.push(uObj);
      }
    }

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get a single user by ID
 * @route  GET /api/users/:id
 * @access Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get online users only
 * @route  GET /api/users/online
 * @access Private
 */
const getOnlineUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      status: { $in: ['online', 'away'] },
    }).select('-passwordHash');

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, searchUsers, getUserById, getOnlineUsers };
