import express from 'express';
import { getDatabase } from '../database/init.js';
import { validateTrackingNumber } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Track application by tracking number (public endpoint)
router.get('/track/:trackingNumber', validateTrackingNumber, async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;
    const db = getDatabase();

    const application = await new Promise((resolve, reject) => {
      db.get(
        `SELECT a.id, a.tracking_number, a.status, a.current_step, a.total_steps,
                a.estimated_delivery_date, a.created_at, a.qr_code,
                ct.name as certificate_type_name, cs.name as certificate_subtype_name,
                u.full_name as applicant_name
         FROM applications a
         LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
         LEFT JOIN certificate_subtypes cs ON a.certificate_subtype_id = cs.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.tracking_number = ?`,
        [trackingNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get status history
    const statusHistory = await new Promise((resolve, reject) => {
      db.all(
        `SELECT status, comments, created_at
         FROM application_status_history
         WHERE application_id = ?
         ORDER BY created_at ASC`,
        [application.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Define status steps
    const statusSteps = [
      { key: 'submitted', name: 'Submitted', name_hi: 'जमा किया गया', name_ta: 'சமர்ப்பிக்கப்பட்டது' },
      { key: 'verified', name: 'Verified', name_hi: 'सत्यापित', name_ta: 'சரிபார்க்கப்பட்டது' },
      { key: 'mro_review', name: 'MRO Review', name_hi: 'MRO समीक्षा', name_ta: 'MRO மறுபரிசீலனை' },
      { key: 'tahsildar_review', name: 'Tahsildar Review', name_hi: 'तहसीलदार समीक्षा', name_ta: 'தாசில்தார் மறுபரிசீலனை' },
      { key: 'generated', name: 'Generated', name_hi: 'जेनरेट किया गया', name_ta: 'உருவாக்கப்பட்டது' },
      { key: 'signed', name: 'Signed', name_hi: 'हस्ताक्षरित', name_ta: 'கையொப்பமிடப்பட்டது' },
      { key: 'delivered', name: 'Delivered', name_hi: 'वितरित', name_ta: 'வழங்கப்பட்டது' }
    ];

    // Calculate progress
    const currentStatusIndex = statusSteps.findIndex(step => step.key === application.status);
    const progress = currentStatusIndex >= 0 ? ((currentStatusIndex + 1) / statusSteps.length) * 100 : 0;

    logger.info('Application tracked', { trackingNumber });

    res.json({
      success: true,
      data: {
        trackingNumber: application.tracking_number,
        status: application.status,
        certificateType: application.certificate_type_name,
        certificateSubtype: application.certificate_subtype_name,
        applicantName: application.applicant_name,
        submittedAt: application.created_at,
        estimatedDeliveryDate: application.estimated_delivery_date,
        currentStep: currentStatusIndex + 1,
        totalSteps: statusSteps.length,
        progress,
        qrCode: application.qr_code,
        statusSteps: statusSteps.map(step => ({
          ...step,
          completed: statusHistory.some(h => h.status === step.key),
          current: step.key === application.status
        })),
        statusHistory
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get audit wall data (public endpoint)
router.get('/audit-wall', optionalAuth, async (req, res, next) => {
  try {
    const { limit = 50, district, dateFrom, dateTo } = req.query;
    const db = getDatabase();

    let query = `
      SELECT a.tracking_number, a.status, a.created_at, a.updated_at,
             ct.name as certificate_type, u.full_name as applicant_name,
             officer.full_name as officer_name, officer.district
      FROM applications a
      LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users officer ON a.assigned_officer_id = officer.id
      WHERE a.status IN ('signed', 'delivered')
    `;
    const params = [];

    if (district) {
      query += ' AND officer.district = ?';
      params.push(district);
    }

    if (dateFrom) {
      query += ' AND a.updated_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND a.updated_at <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY a.updated_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const completedApplications = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get statistics
    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(*) as total_applications,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
           COUNT(CASE WHEN status = 'signed' THEN 1 END) as signed_count,
           AVG(CASE WHEN status = 'delivered' THEN 
             julianday(updated_at) - julianday(created_at) 
           END) as avg_processing_days
         FROM applications
         WHERE created_at >= date('now', '-30 days')`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get district-wise statistics
    const districtStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT officer.district, COUNT(*) as count
         FROM applications a
         LEFT JOIN users officer ON a.assigned_officer_id = officer.id
         WHERE a.status IN ('signed', 'delivered')
           AND a.updated_at >= date('now', '-30 days')
           AND officer.district IS NOT NULL
         GROUP BY officer.district
         ORDER BY count DESC`,
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
        recentCompletions: completedApplications,
        statistics: {
          totalApplications: stats.total_applications,
          deliveredCount: stats.delivered_count,
          signedCount: stats.signed_count,
          averageProcessingDays: Math.round(stats.avg_processing_days || 0)
        },
        districtStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get heatmap data (public endpoint)
router.get('/heatmap', async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days
    const db = getDatabase();

    const heatmapData = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           officer.district,
           COUNT(*) as application_count,
           AVG(CASE WHEN a.status = 'delivered' THEN 
             julianday(a.updated_at) - julianday(a.created_at) 
           END) as avg_processing_days,
           COUNT(CASE WHEN a.status = 'delivered' THEN 1 END) as completed_count,
           COUNT(CASE WHEN a.status IN ('submitted', 'verified', 'mro_review', 'tahsildar_review') THEN 1 END) as pending_count
         FROM applications a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN users officer ON a.assigned_officer_id = officer.id
         WHERE a.created_at >= date('now', '-' || ? || ' days')
           AND officer.district IS NOT NULL
         GROUP BY officer.district`,
        [period],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get certificate type distribution
    const certificateTypeStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ct.name, COUNT(*) as count
         FROM applications a
         LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
         WHERE a.created_at >= date('now', '-' || ? || ' days')
         GROUP BY ct.name
         ORDER BY count DESC`,
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
        districts: heatmapData.map(district => ({
          name: district.district,
          applicationCount: district.application_count,
          averageProcessingDays: Math.round(district.avg_processing_days || 0),
          completedCount: district.completed_count,
          pendingCount: district.pending_count,
          completionRate: district.application_count > 0 
            ? Math.round((district.completed_count / district.application_count) * 100)
            : 0
        })),
        certificateTypes: certificateTypeStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get about us information
router.get('/about', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Government Service Transparency Portal',
      description: 'A digital platform for transparent and efficient government service delivery',
      features: [
        'Online application submission',
        'Real-time status tracking',
        'Multi-language support',
        'Secure document upload',
        'SMS and email notifications',
        'Public audit trail'
      ],
      contact: {
        email: 'support@government-portal.gov.in',
        phone: '1800-123-4567',
        address: 'Government Digital Services, New Delhi'
      },
      version: '1.0.0'
    }
  });
});

// Get certificate types (public endpoint)
router.get('/certificate-types', async (req, res, next) => {
  try {
    const db = getDatabase();

    const certificateTypes = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, name, name_hi, name_ta, description, category, processing_days, fee_amount FROM certificate_types WHERE is_active = 1 ORDER BY name',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get subtypes for each certificate type
    for (const certType of certificateTypes) {
      const subtypes = await new Promise((resolve, reject) => {
        db.all(
          'SELECT id, name, name_hi, name_ta, description FROM certificate_subtypes WHERE certificate_type_id = ?',
          [certType.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      certType.subtypes = subtypes;
    }

    res.json({
      success: true,
      data: {
        certificateTypes
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;