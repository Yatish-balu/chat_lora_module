const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/error');

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return next(new AppError('Username, email, and password are required', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return next(
        new AppError(
          existingUser.email === email.toLowerCase()
            ? 'Email already registered'
            : 'Username already taken',
          409
        )
      );
    }

    // Generate avatar URL using DiceBear
    const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

    // Create user — passwordHash field triggers bcrypt pre-save hook
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash: password,
      displayName: displayName || username,
      avatar: avatarUrl,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Login user
 * @route  POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email: emailOrName, password } = req.body;

    if (!emailOrName || !password) {
      return next(new AppError('Username/Email and password are required', 400));
    }

    const inputClean = emailOrName.trim().toLowerCase();
    const isEmail = /^\S+@\S+\.\S+$/.test(inputClean);

    // Find user by email or username (case-insensitive)
    let user = await User.findOne({
      $or: [
        { email: inputClean },
        { username: new RegExp('^' + inputClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      ]
    }).select('+passwordHash');

    if (!user) {
      // User doesn't exist — auto-register them!
      // 1. Generate valid username (alphanumeric + underscores only, 3-30 chars)
      let username = inputClean.replace(/[^a-zA-Z0-9_]/g, '');
      if (username.length < 3) {
        username = 'user_' + username;
      }
      if (username.length > 30) {
        username = username.slice(0, 30);
      }

      // Ensure unique username
      let tempUsername = username;
      let suffix = 1;
      while (await User.findOne({ username: tempUsername })) {
        tempUsername = `${username}${suffix}`;
        suffix++;
      }
      username = tempUsername;

      // 2. Generate email
      let email = inputClean;
      if (!isEmail) {
        email = `${username}@antigravity.chat`;
      }

      // Ensure unique email
      let tempEmail = email;
      let emailSuffix = 1;
      while (await User.findOne({ email: tempEmail })) {
        const parts = email.split('@');
        tempEmail = `${parts[0]}${emailSuffix}@${parts[1]}`;
        emailSuffix++;
      }
      email = tempEmail;

      // 3. Password needs to be at least 6 chars for validation
      let passwordToSave = password;
      if (passwordToSave.length < 6) {
        passwordToSave = passwordToSave.padEnd(6, '0');
      }

      // 4. Create user
      user = await User.create({
        username,
        email,
        passwordHash: passwordToSave,
        displayName: emailOrName.trim(), // Keep original typed name as display name
        avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
        status: 'online',
      });
    } else {
      // User exists! Since ANY password should work, if they entered a different password
      // than the one stored, we update their password to prevent future credential mismatch.
      user.status = 'online';
      
      if (password) {
        let passwordToSave = password;
        if (passwordToSave.length < 6) {
          passwordToSave = passwordToSave.padEnd(6, '0');
        }
        user.passwordHash = passwordToSave; // Pre-save hook will hash it
      }
      
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        status: user.status,
        preferredMode: user.preferredMode,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get logged-in user profile
 * @route  GET /api/auth/profile
 * @access Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');

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
 * @desc   Update user profile (display name, avatar, preferred mode)
 * @route  PUT /api/auth/profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatar, preferredMode } = req.body;

    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (avatar) updates.avatar = avatar;
    if (preferredMode) updates.preferredMode = preferredMode;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true, select: '-passwordHash' }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Logout — mark user offline (JWT is stateless; client discards token)
 * @route  POST /api/auth/logout
 * @access Private
 */
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { status: 'offline', lastSeen: new Date(), socketId: null },
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile, logout };
