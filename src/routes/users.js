import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireRole('admin'), validatePagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, district, search } = req.query;
    const offset = (page - 1) * limit;
    const db = getDatabase();

    let query = 'SELECT id, email, mobile, full_name, role, officer_id, district, department, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }

    if (district) {
      countQuery += ' AND district = ?';
      countParams.push(district);
    }

    if (search) {
      countQuery += ' AND (full_name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
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
        users,
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

// Get user by ID (Admin/Officer can view any, User can view own)
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check permissions
    if (req.user.role === 'citizen' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.officer_id, 
                u.district, u.department, u.email_verified, u.mobile_verified, 
                u.is_active, u.created_at, u.updated_at,
                up.email_notifications, up.sms_notifications, up.language, up.timezone
         FROM users u
         LEFT JOIN user_preferences up ON u.id = up.user_id
         WHERE u.id = ?`,
        [id],
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

    // Get user statistics if viewing own profile or admin
    let statistics = null;
    if (req.user.id === id || req.user.role === 'admin') {
      if (user.role === 'citizen') {
        statistics = await new Promise((resolve, reject) => {
          db.get(
            `SELECT 
               COUNT(*) as total_applications,
               COUNT(CASE WHEN status IN ('signed', 'delivered') THEN 1 END) as completed_applications,
               COUNT(CASE WHEN status IN ('submitted', 'verified', 'mro_review', 'tahsildar_review') THEN 1 END) as pending_applications
             FROM applications 
             WHERE user_id = ?`,
            [id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
      } else if (user.role === 'officer') {
        statistics = await new Promise((resolve, reject) => {
          db.get(
            `SELECT 
               COUNT(*) as total_assigned,
               COUNT(CASE WHEN status IN ('signed', 'delivered') THEN 1 END) as completed_applications,
               AVG(CASE WHEN status = 'delivered' THEN 
                 julianday(updated_at) - julianday(created_at) 
               END) as avg_processing_days
             FROM applications 
             WHERE assigned_officer_id = ?`,
            [id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        statistics: statistics ? {
          ...statistics,
          avg_processing_days: Math.round(statistics.avg_processing_days || 0)
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user status (Admin only)
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [isActive ? 1 : 0, id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('User status updated', {
      userId: id,
      isActive,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// Update user role (Admin only)
router.patch('/:id/role', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, officerId, district, department } = req.body;
    const db = getDatabase();

    if (!['citizen', 'officer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET role = ?, officer_id = ?, district = ?, department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [role, officerId, district, department, id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('User role updated', {
      userId: id,
      newRole: role,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get user activity log (Admin/Officer can view any, User can view own)
router.get('/:id/activity', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const db = getDatabase();

    // Check permissions
    if (req.user.role === 'citizen' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const activities = await new Promise((resolve, reject) => {
      db.all(
        'SELECT action, resource_type, resource_id, created_at FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [id, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const totalResult = await new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as total FROM audit_logs WHERE user_id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      data: {
        activities,
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

// Get officers list (for assignment purposes)
router.get('/officers/list', authenticateToken, requireRole(['officer', 'admin']), async (req, res, next) => {
  try {
    const { district } = req.query;
    const db = getDatabase();

    let query = 'SELECT id, full_name, officer_id, district, department FROM users WHERE role = "officer" AND is_active = 1';
    const params = [];

    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }

    query += ' ORDER BY full_name';

    const officers = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        officers
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDatabase();

    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_users,
           COUNT(CASE WHEN role = 'citizen' THEN 1 END) as citizens,
           COUNT(CASE WHEN role = 'officer' THEN 1 END) as officers,
           COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
           COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
           COUNT(CASE WHEN email_verified = 1 THEN 1 END) as verified_emails,
           COUNT(CASE WHEN mobile_verified = 1 THEN 1 END) as verified_mobiles,
           COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_users_this_month
         FROM users`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get district-wise user distribution
    const districtStats = await new Promise((resolve, reject) => {
      db.all(
        'SELECT district, COUNT(*) as user_count FROM users WHERE district IS NOT NULL GROUP BY district ORDER BY user_count DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: {
        overview: stats,
        districtDistribution: districtStats
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;