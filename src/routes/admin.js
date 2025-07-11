import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get system statistics
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDatabase();

    // Get overall system stats
    const systemStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
           (SELECT COUNT(*) FROM applications) as total_applications,
           (SELECT COUNT(*) FROM applications WHERE status IN ('signed', 'delivered')) as completed_applications,
           (SELECT COUNT(*) FROM applications WHERE status IN ('submitted', 'verified', 'mro_review', 'tahsildar_review')) as pending_applications,
           (SELECT COUNT(*) FROM files) as total_files,
           (SELECT COUNT(*) FROM notifications WHERE created_at >= date('now', '-24 hours')) as notifications_24h`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get performance metrics
    const performanceStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           AVG(CASE WHEN status = 'delivered' THEN 
             julianday(updated_at) - julianday(created_at) 
           END) as avg_processing_days,
           COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as applications_this_week,
           COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as applications_this_month
         FROM applications`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      data: {
        system: systemStats,
        performance: {
          ...performanceStats,
          avg_processing_days: Math.round(performanceStats.avg_processing_days || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Manage certificate types
router.get('/certificate-types', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDatabase();

    const certificateTypes = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM certificate_types ORDER BY name',
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
          'SELECT * FROM certificate_subtypes WHERE certificate_type_id = ?',
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

// Create certificate type
router.post('/certificate-types', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      name, nameHi, nameTa, description, descriptionHi, descriptionTa,
      category, processingDays, feeAmount, requiredDocuments, formFields
    } = req.body;
    const db = getDatabase();

    const certificateTypeId = uuidv4();

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO certificate_types (
          id, name, name_hi, name_ta, description, description_hi, description_ta,
          category, processing_days, fee_amount, required_documents, form_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          certificateTypeId, name, nameHi, nameTa, description, descriptionHi, descriptionTa,
          category, processingDays, feeAmount, JSON.stringify(requiredDocuments), JSON.stringify(formFields)
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Certificate type created', {
      certificateTypeId,
      name,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Certificate type created successfully',
      data: {
        certificateTypeId
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update certificate type
router.put('/certificate-types/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, nameHi, nameTa, description, descriptionHi, descriptionTa,
      category, processingDays, feeAmount, requiredDocuments, formFields, isActive
    } = req.body;
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE certificate_types SET 
          name = ?, name_hi = ?, name_ta = ?, description = ?, description_hi = ?, description_ta = ?,
          category = ?, processing_days = ?, fee_amount = ?, required_documents = ?, form_fields = ?, is_active = ?
         WHERE id = ?`,
        [
          name, nameHi, nameTa, description, descriptionHi, descriptionTa,
          category, processingDays, feeAmount, JSON.stringify(requiredDocuments), JSON.stringify(formFields), isActive, id
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Certificate type updated', {
      certificateTypeId: id,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Certificate type updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Create certificate subtype
router.post('/certificate-subtypes', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      certificateTypeId, name, nameHi, nameTa, description, formFields, requiredDocuments
    } = req.body;
    const db = getDatabase();

    const subtypeId = uuidv4();

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO certificate_subtypes (
          id, certificate_type_id, name, name_hi, name_ta, description, form_fields, required_documents
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subtypeId, certificateTypeId, name, nameHi, nameTa, description,
          JSON.stringify(formFields), JSON.stringify(requiredDocuments)
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Certificate subtype created', {
      subtypeId,
      certificateTypeId,
      name,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Certificate subtype created successfully',
      data: {
        subtypeId
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, requireRole('admin'), validatePagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, resourceType, userId, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;
    const db = getDatabase();

    let query = `
      SELECT al.*, u.full_name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    if (resourceType) {
      query += ' AND al.resource_type = ?';
      params.push(resourceType);
    }

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (dateFrom) {
      query += ' AND al.created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND al.created_at <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const auditLogs = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          old_values: row.old_values ? JSON.parse(row.old_values) : null,
          new_values: row.new_values ? JSON.parse(row.new_values) : null
        })));
      });
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = [];

    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }

    if (resourceType) {
      countQuery += ' AND resource_type = ?';
      countParams.push(resourceType);
    }

    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(userId);
    }

    if (dateFrom) {
      countQuery += ' AND created_at >= ?';
      countParams.push(dateFrom);
    }

    if (dateTo) {
      countQuery += ' AND created_at <= ?';
      countParams.push(dateTo);
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
        auditLogs,
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

// Get system health
router.get('/health', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDatabase();

    // Check database connectivity
    const dbHealth = await new Promise((resolve, reject) => {
      db.get('SELECT 1 as test', [], (err, row) => {
        if (err) {
          resolve({ status: 'error', message: err.message });
        } else {
          resolve({ status: 'healthy', message: 'Database connection OK' });
        }
      });
    });

    // Check recent error rates
    const errorStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(CASE WHEN action LIKE '%error%' THEN 1 END) as error_count,
           COUNT(*) as total_actions
         FROM audit_logs 
         WHERE created_at >= datetime('now', '-1 hour')`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Check application processing health
    const processingHealth = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(CASE WHEN created_at >= datetime('now', '-24 hours') THEN 1 END) as applications_24h,
           COUNT(CASE WHEN status = 'submitted' AND created_at < datetime('now', '-7 days') THEN 1 END) as stale_applications
         FROM applications`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const overallHealth = dbHealth.status === 'healthy' && 
                         errorStats.error_count < (errorStats.total_actions * 0.1) &&
                         processingHealth.stale_applications < 10;

    res.json({
      success: true,
      data: {
        overall: {
          status: overallHealth ? 'healthy' : 'warning',
          timestamp: new Date().toISOString()
        },
        components: {
          database: dbHealth,
          errorRate: {
            status: errorStats.error_count < (errorStats.total_actions * 0.1) ? 'healthy' : 'warning',
            errorCount: errorStats.error_count,
            totalActions: errorStats.total_actions,
            errorRate: errorStats.total_actions > 0 ? (errorStats.error_count / errorStats.total_actions * 100).toFixed(2) + '%' : '0%'
          },
          processing: {
            status: processingHealth.stale_applications < 10 ? 'healthy' : 'warning',
            applications24h: processingHealth.applications_24h,
            staleApplications: processingHealth.stale_applications
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Manage districts
router.get('/districts', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDatabase();

    const districts = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM districts ORDER BY name',
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
        districts
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create district
router.post('/districts', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, nameHi, nameTa, state } = req.body;
    const db = getDatabase();

    const districtId = uuidv4();

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO districts (id, name, name_hi, name_ta, state) VALUES (?, ?, ?, ?, ?)',
        [districtId, name, nameHi, nameTa, state],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('District created', {
      districtId,
      name,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: {
        districtId
      }
    });
  } catch (error) {
    next(error);
  }
});

// Manage departments
router.get('/departments', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDatabase();

    const departments = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM departments ORDER BY name',
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
        departments
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create department
router.post('/departments', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, nameHi, nameTa, description } = req.body;
    const db = getDatabase();

    const departmentId = uuidv4();

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO departments (id, name, name_hi, name_ta, description) VALUES (?, ?, ?, ?, ?)',
        [departmentId, name, nameHi, nameTa, description],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Department created', {
      departmentId,
      name,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: {
        departmentId
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;