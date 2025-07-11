import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateNotificationSend, validatePagination, validateId } from '../middleware/validation.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly } = req.query;
    const offset = (page - 1) * limit;
    const db = getDatabase();

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (unreadOnly === 'true') {
      query += ' AND read_at IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const notifications = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const countParams = [req.user.id];

    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    if (unreadOnly === 'true') {
      countQuery += ' AND read_at IS NULL';
    }

    const totalResult = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Verify notification belongs to user
    const notification = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM notifications WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark as read
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
        [req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_notifications,
           COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread_count,
           COUNT(CASE WHEN type = 'email' THEN 1 END) as email_count,
           COUNT(CASE WHEN type = 'sms' THEN 1 END) as sms_count,
           COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as recent_count
         FROM notifications 
         WHERE user_id = ?`,
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Send notification (Admin/Officer only)
router.post('/send', authenticateToken, requireRole(['officer', 'admin']), validateNotificationSend, async (req, res, next) => {
  try {
    const { userId, type, title, message, applicationId } = req.body;
    const db = getDatabase();

    // Get user details
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT email, mobile, language_preference FROM users WHERE id = ? AND is_active = 1',
        [userId],
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

    const notificationId = uuidv4();
    let sent = false;

    // Send notification based on type
    if (type === 'email' && user.email) {
      sent = await sendEmail(user.email, title, message);
    } else if (type === 'sms' && user.mobile) {
      sent = await sendSMS(user.mobile, message);
    }

    // Store notification in database
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO notifications (id, user_id, application_id, type, title, message, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          notificationId,
          userId,
          applicationId,
          type,
          title,
          message,
          sent ? 'sent' : 'failed',
          sent ? new Date().toISOString() : null
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Notification sent', {
      notificationId,
      userId,
      type,
      sent,
      sentBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: sent ? 'Notification sent successfully' : 'Notification queued but delivery failed',
      data: {
        notificationId,
        sent
      }
    });
  } catch (error) {
    next(error);
  }
});

// Send bulk notifications (Admin only)
router.post('/send-bulk', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { userIds, type, title, message } = req.body;
    const db = getDatabase();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const results = [];

    for (const userId of userIds) {
      try {
        // Get user details
        const user = await new Promise((resolve, reject) => {
          db.get(
            'SELECT email, mobile, language_preference FROM users WHERE id = ? AND is_active = 1',
            [userId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (!user) {
          results.push({ userId, sent: false, error: 'User not found' });
          continue;
        }

        const notificationId = uuidv4();
        let sent = false;

        // Send notification based on type
        if (type === 'email' && user.email) {
          sent = await sendEmail(user.email, title, message);
        } else if (type === 'sms' && user.mobile) {
          sent = await sendSMS(user.mobile, message);
        }

        // Store notification in database
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO notifications (id, user_id, type, title, message, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              notificationId,
              userId,
              type,
              title,
              message,
              sent ? 'sent' : 'failed',
              sent ? new Date().toISOString() : null
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });

        results.push({ userId, notificationId, sent });

      } catch (error) {
        results.push({ userId, sent: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.sent).length;
    const failureCount = results.length - successCount;

    logger.info('Bulk notifications sent', {
      totalUsers: userIds.length,
      successCount,
      failureCount,
      sentBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: `Bulk notifications processed: ${successCount} sent, ${failureCount} failed`,
      data: {
        results,
        summary: {
          total: userIds.length,
          sent: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticateToken, validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Verify notification belongs to user
    const notification = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM notifications WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete notification
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM notifications WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;