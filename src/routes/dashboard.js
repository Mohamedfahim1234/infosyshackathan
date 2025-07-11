import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get user dashboard data
router.get('/user', authenticateToken, requireRole('citizen'), async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    // Get application statistics
    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_applications,
           COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
           COUNT(CASE WHEN status IN ('verified', 'mro_review', 'tahsildar_review') THEN 1 END) as in_progress_count,
           COUNT(CASE WHEN status IN ('signed', 'delivered') THEN 1 END) as completed_count,
           COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
         FROM applications 
         WHERE user_id = ?`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get recent applications
    const recentApplications = await new Promise((resolve, reject) => {
      db.all(
        `SELECT a.id, a.tracking_number, a.status, a.created_at, a.estimated_delivery_date,
                ct.name as certificate_type_name, cs.name as certificate_subtype_name
         FROM applications a
         LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
         LEFT JOIN certificate_subtypes cs ON a.certificate_subtype_id = cs.id
         WHERE a.user_id = ?
         ORDER BY a.created_at DESC
         LIMIT 5`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get recent notifications
    const recentNotifications = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, title, message, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get pending actions (applications that need user attention)
    const pendingActions = await new Promise((resolve, reject) => {
      db.all(
        `SELECT a.id, a.tracking_number, a.status, ct.name as certificate_type_name
         FROM applications a
         LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
         WHERE a.user_id = ? AND a.status IN ('submitted', 'verified')
         ORDER BY a.created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: {
        statistics: stats,
        recentApplications,
        recentNotifications,
        pendingActions
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get officer dashboard data
router.get('/officer', authenticateToken, requireRole(['officer', 'admin']), async (req, res, next) => {
  try {
    const db = getDatabase();
    const officerId = req.user.id;

    // Get application statistics for officer
    let statsQuery = `
      SELECT 
        COUNT(*) as total_assigned,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN status = 'mro_review' THEN 1 END) as mro_review_count,
        COUNT(CASE WHEN status = 'tahsildar_review' THEN 1 END) as tahsildar_review_count,
        COUNT(CASE WHEN status IN ('signed', 'delivered') THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
      FROM applications a
    `;
    
    let statsParams = [];
    
    if (req.user.role === 'officer') {
      statsQuery += ' WHERE assigned_officer_id = ?';
      statsParams.push(officerId);
    }

    const stats = await new Promise((resolve, reject) => {
      db.get(statsQuery, statsParams, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Get pending applications for review
    let pendingQuery = `
      SELECT a.id, a.tracking_number, a.status, a.created_at, a.priority_level,
             ct.name as certificate_type_name, u.full_name as applicant_name
      FROM applications a
      LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status IN ('submitted', 'verified', 'mro_review', 'tahsildar_review')
    `;
    
    let pendingParams = [];
    
    if (req.user.role === 'officer') {
      pendingQuery += ' AND (a.assigned_officer_id = ? OR a.assigned_officer_id IS NULL)';
      pendingParams.push(officerId);
    }
    
    pendingQuery += ' ORDER BY a.priority_level DESC, a.created_at ASC LIMIT 10';

    const pendingApplications = await new Promise((resolve, reject) => {
      db.all(pendingQuery, pendingParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get recent activity
    const recentActivity = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ash.*, a.tracking_number, u.full_name as applicant_name
         FROM application_status_history ash
         JOIN applications a ON ash.application_id = a.id
         JOIN users u ON a.user_id = u.id
         WHERE ash.officer_id = ?
         ORDER BY ash.created_at DESC
         LIMIT 10`,
        [officerId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get performance metrics
    const performanceMetrics = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_processed,
           AVG(CASE WHEN a.status = 'delivered' THEN 
             julianday(a.updated_at) - julianday(a.created_at) 
           END) as avg_processing_days,
           COUNT(CASE WHEN a.updated_at >= date('now', '-7 days') THEN 1 END) as processed_this_week,
           COUNT(CASE WHEN a.updated_at >= date('now', '-30 days') THEN 1 END) as processed_this_month
         FROM applications a
         WHERE a.assigned_officer_id = ?`,
        [officerId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      data: {
        statistics: stats,
        pendingApplications,
        recentActivity,
        performanceMetrics: {
          ...performanceMetrics,
          avg_processing_days: Math.round(performanceMetrics.avg_processing_days || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get admin dashboard data
router.get('/admin', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDatabase();

    // Get overall system statistics
    const systemStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_applications,
           COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
           COUNT(CASE WHEN status IN ('verified', 'mro_review', 'tahsildar_review') THEN 1 END) as in_progress_count,
           COUNT(CASE WHEN status IN ('signed', 'delivered') THEN 1 END) as completed_count,
           COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
           AVG(CASE WHEN status = 'delivered' THEN 
             julianday(updated_at) - julianday(created_at) 
           END) as avg_processing_days
         FROM applications`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get user statistics
    const userStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_users,
           COUNT(CASE WHEN role = 'citizen' THEN 1 END) as citizen_count,
           COUNT(CASE WHEN role = 'officer' THEN 1 END) as officer_count,
           COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_users_this_month
         FROM users
         WHERE is_active = 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get certificate type statistics
    const certificateTypeStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ct.name, COUNT(a.id) as count
         FROM certificate_types ct
         LEFT JOIN applications a ON ct.id = a.certificate_type_id
         WHERE ct.is_active = 1
         GROUP BY ct.id, ct.name
         ORDER BY count DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get district-wise statistics
    const districtStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           u.district,
           COUNT(a.id) as application_count,
           COUNT(CASE WHEN a.status IN ('signed', 'delivered') THEN 1 END) as completed_count,
           AVG(CASE WHEN a.status = 'delivered' THEN 
             julianday(a.updated_at) - julianday(a.created_at) 
           END) as avg_processing_days
         FROM users u
         LEFT JOIN applications a ON u.id = a.user_id
         WHERE u.district IS NOT NULL AND u.role = 'citizen'
         GROUP BY u.district
         ORDER BY application_count DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get recent system activity
    const recentActivity = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           'application' as type,
           a.tracking_number as reference,
           a.status,
           a.created_at,
           u.full_name as user_name
         FROM applications a
         JOIN users u ON a.user_id = u.id
         WHERE a.created_at >= date('now', '-7 days')
         
         UNION ALL
         
         SELECT 
           'user' as type,
           u.email as reference,
           'registered' as status,
           u.created_at,
           u.full_name as user_name
         FROM users u
         WHERE u.created_at >= date('now', '-7 days')
         
         ORDER BY created_at DESC
         LIMIT 20`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get top performing officers
    const topOfficers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           u.full_name,
           u.district,
           COUNT(a.id) as applications_processed,
           AVG(CASE WHEN a.status = 'delivered' THEN 
             julianday(a.updated_at) - julianday(a.created_at) 
           END) as avg_processing_days
         FROM users u
         LEFT JOIN applications a ON u.id = a.assigned_officer_id
         WHERE u.role = 'officer' AND u.is_active = 1
         GROUP BY u.id
         HAVING applications_processed > 0
         ORDER BY applications_processed DESC, avg_processing_days ASC
         LIMIT 10`,
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
        systemStats: {
          ...systemStats,
          avg_processing_days: Math.round(systemStats.avg_processing_days || 0)
        },
        userStats,
        certificateTypeStats,
        districtStats: districtStats.map(district => ({
          ...district,
          avg_processing_days: Math.round(district.avg_processing_days || 0),
          completion_rate: district.application_count > 0 
            ? Math.round((district.completed_count / district.application_count) * 100)
            : 0
        })),
        recentActivity,
        topOfficers: topOfficers.map(officer => ({
          ...officer,
          avg_processing_days: Math.round(officer.avg_processing_days || 0)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get application analytics
router.get('/analytics', authenticateToken, requireRole(['officer', 'admin']), async (req, res, next) => {
  try {
    const { period = '30', district } = req.query;
    const db = getDatabase();

    // Get daily application counts for the period
    let dailyStatsQuery = `
      SELECT 
        date(created_at) as date,
        COUNT(*) as applications_submitted,
        COUNT(CASE WHEN status IN ('signed', 'delivered') THEN 1 END) as applications_completed
      FROM applications
      WHERE created_at >= date('now', '-' || ? || ' days')
    `;
    const dailyStatsParams = [period];

    if (district && req.user.role === 'officer') {
      dailyStatsQuery += ` AND user_id IN (
        SELECT id FROM users WHERE district = ?
      )`;
      dailyStatsParams.push(district);
    }

    dailyStatsQuery += ' GROUP BY date(created_at) ORDER BY date';

    const dailyStats = await new Promise((resolve, reject) => {
      db.all(dailyStatsQuery, dailyStatsParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get status distribution
    let statusDistQuery = `
      SELECT status, COUNT(*) as count
      FROM applications
      WHERE created_at >= date('now', '-' || ? || ' days')
    `;
    const statusDistParams = [period];

    if (district && req.user.role === 'officer') {
      statusDistQuery += ` AND user_id IN (
        SELECT id FROM users WHERE district = ?
      )`;
      statusDistParams.push(district);
    }

    statusDistQuery += ' GROUP BY status';

    const statusDistribution = await new Promise((resolve, reject) => {
      db.all(statusDistQuery, statusDistParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get processing time trends
    const processingTrends = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           date(updated_at) as date,
           AVG(julianday(updated_at) - julianday(created_at)) as avg_processing_days
         FROM applications
         WHERE status = 'delivered' 
           AND updated_at >= date('now', '-' || ? || ' days')
         GROUP BY date(updated_at)
         ORDER BY date`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: {
        dailyStats,
        statusDistribution,
        processingTrends: processingTrends.map(trend => ({
          ...trend,
          avg_processing_days: Math.round(trend.avg_processing_days || 0)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;