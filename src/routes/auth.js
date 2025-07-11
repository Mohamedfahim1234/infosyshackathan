import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { hashPassword, comparePassword, generateOTP } from '../utils/crypto.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register user
router.post('/register', validateUserRegistration, async (req, res, next) => {
  try {
    const { email, mobile, password, fullName, role, officerId, district } = req.body;
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE email = ? OR mobile = ?',
        [email, mobile],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or mobile number'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    // Insert user
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (id, email, mobile, password_hash, full_name, role, officer_id, district)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, mobile, passwordHash, fullName, role, officerId, district],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Create user preferences
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO user_preferences (id, user_id) VALUES (?, ?)',
        [uuidv4(), userId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('User registered successfully', { userId, email, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId,
        email,
        fullName,
        role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    // Get user
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Update last login
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          officerId: user.officer_id,
          district: user.district
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT u.*, up.email_notifications, up.sms_notifications, up.language, up.timezone
         FROM users u
         LEFT JOIN user_preferences up ON u.id = up.user_id
         WHERE u.id = ?`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        fullName: user.full_name,
        role: user.role,
        officerId: user.officer_id,
        district: user.district,
        department: user.department,
        emailVerified: user.email_verified,
        mobileVerified: user.mobile_verified,
        preferences: {
          emailNotifications: user.email_notifications,
          smsNotifications: user.sms_notifications,
          language: user.language,
          timezone: user.timezone
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { fullName, mobile, language, emailNotifications, smsNotifications } = req.body;
    const db = getDatabase();

    // Update user
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET full_name = ?, mobile = ?, language_preference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [fullName, mobile, language, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Update preferences
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE user_preferences SET email_notifications = ?, sms_notifications = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [emailNotifications, smsNotifications, language, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('User profile updated', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDatabase();

    // Get current password hash
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPasswordHash, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Password changed successfully', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Send OTP for verification
router.post('/send-otp', authenticateToken, async (req, res, next) => {
  try {
    const { type } = req.body; // 'email' or 'mobile'
    const otp = generateOTP();
    
    // Store OTP in session (in production, use Redis or database)
    req.session.otp = {
      code: otp,
      type,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    if (type === 'email') {
      await sendEmail(
        req.user.email,
        'Email Verification OTP',
        `Your OTP for email verification is: ${otp}. Valid for 10 minutes.`
      );
    } else if (type === 'mobile') {
      await sendSMS(
        req.user.mobile,
        `Your OTP for mobile verification is: ${otp}. Valid for 10 minutes.`
      );
    }

    res.json({
      success: true,
      message: `OTP sent to your ${type}`
    });
  } catch (error) {
    next(error);
  }
});

// Verify OTP
router.post('/verify-otp', authenticateToken, async (req, res, next) => {
  try {
    const { otp, type } = req.body;
    
    if (!req.session.otp || req.session.otp.type !== type) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this verification type'
      });
    }

    if (Date.now() > req.session.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (req.session.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    const db = getDatabase();
    const field = type === 'email' ? 'email_verified' : 'mobile_verified';

    // Update verification status
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${field} = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Clear OTP from session
    delete req.session.otp;

    logger.info(`${type} verified successfully`, { userId: req.user.id });

    res.json({
      success: true,
      message: `${type} verified successfully`
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Session destruction error:', err);
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

export default router;