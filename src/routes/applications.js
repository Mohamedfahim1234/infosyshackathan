import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateApplicationSubmission, validateApplicationStatusUpdate, validatePagination, validateId } from '../middleware/validation.js';
import { generateTrackingNumber, generateApplicationId } from '../utils/crypto.js';
import { generateTrackingQR } from '../utils/qrcode.js';
import { logger } from '../utils/logger.js';
import { sendEmail, sendSMS, getNotificationTemplate, replaceTemplateVariables } from '../utils/notifications.js';

const router = express.Router();

// Submit new application
router.post('/', authenticateToken, requireRole('citizen'), validateApplicationSubmission, async (req, res, next) => {
  try {
    const { certificateTypeId, certificateSubtypeId, applicationData } = req.body;
    const db = getDatabase();

    const applicationId = generateApplicationId();
    const trackingNumber = generateTrackingNumber();
    const qrCode = await generateTrackingQR(trackingNumber);

    // Calculate estimated delivery date (default 7 days)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

    // Insert application
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO applications (
          id, user_id, certificate_type_id, certificate_subtype_id, 
          application_data, tracking_number, qr_code, estimated_delivery_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applicationId,
          req.user.id,
          certificateTypeId,
          certificateSubtypeId,
          JSON.stringify(applicationData),
          trackingNumber,
          qrCode,
          estimatedDeliveryDate.toISOString()
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Add status history
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO application_status_history (id, application_id, status, comments) VALUES (?, ?, ?, ?)',
        [uuidv4(), applicationId, 'submitted', 'Application submitted by user'],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Send notification
    const template = getNotificationTemplate('application_submitted', req.user.language_preference || 'en');
    if (template) {
      const variables = { trackingNumber };
      
      // Send email notification
      await sendEmail(
        req.user.email,
        template.subject,
        replaceTemplateVariables(template.email, variables)
      );

      // Send SMS notification if mobile is verified
      if (req.user.mobile_verified) {
        await sendSMS(
          req.user.mobile,
          replaceTemplateVariables(template.sms, variables)
        );
      }

      // Store notification in database
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO notifications (id, user_id, application_id, type, title, message) VALUES (?, ?, ?, ?, ?, ?)',
          [
            uuidv4(),
            req.user.id,
            applicationId,
            'email',
            template.subject,
            replaceTemplateVariables(template.email, variables)
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
    }

    logger.info('Application submitted successfully', { 
      applicationId, 
      trackingNumber, 
      userId: req.user.id 
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId,
        trackingNumber,
        qrCode,
        estimatedDeliveryDate
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's applications
router.get('/my-applications', authenticateToken, requireRole('citizen'), validatePagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const db = getDatabase();

    let query = `
      SELECT a.*, ct.name as certificate_type_name, cs.name as certificate_subtype_name
      FROM applications a
      LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
      LEFT JOIN certificate_subtypes cs ON a.certificate_subtype_id = cs.id
      WHERE a.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const applications = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM applications WHERE user_id = ?';
    const countParams = [req.user.id];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
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
        applications: applications.map(app => ({
          ...app,
          application_data: JSON.parse(app.application_data)
        })),
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

// Get application by ID
router.get('/:id', authenticateToken, validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const application = await new Promise((resolve, reject) => {
      db.get(
        `SELECT a.*, ct.name as certificate_type_name, cs.name as certificate_subtype_name,
                u.full_name as applicant_name, u.email as applicant_email
         FROM applications a
         LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
         LEFT JOIN certificate_subtypes cs ON a.certificate_subtype_id = cs.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = ?`,
        [id],
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

    // Check access permissions
    if (req.user.role === 'citizen' && application.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get status history
    const statusHistory = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ash.*, u.full_name as officer_name
         FROM application_status_history ash
         LEFT JOIN users u ON ash.officer_id = u.id
         WHERE ash.application_id = ?
         ORDER BY ash.created_at ASC`,
        [id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get files
    const files = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, original_name, file_size, mime_type, file_type, is_verified, created_at FROM files WHERE application_id = ?',
        [id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: {
        ...application,
        application_data: JSON.parse(application.application_data),
        status_history: statusHistory,
        files
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update application status (Officer/Admin only)
router.patch('/:id/status', authenticateToken, requireRole(['officer', 'admin']), validateApplicationStatusUpdate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments, rejectionReason } = req.body;
    const db = getDatabase();

    // Get current application
    const application = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM applications WHERE id = ?',
        [id],
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

    // Update application status
    const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateParams = [status];

    if (status === 'rejected' && rejectionReason) {
      updateFields.push('rejection_reason = ?');
      updateParams.push(rejectionReason);
    }

    if (!application.assigned_officer_id) {
      updateFields.push('assigned_officer_id = ?');
      updateParams.push(req.user.id);
    }

    updateParams.push(id);

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE applications SET ${updateFields.join(', ')} WHERE id = ?`,
        updateParams,
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Add status history
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO application_status_history (id, application_id, status, officer_id, comments) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), id, status, req.user.id, comments || `Status updated to ${status}`],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Get user details for notification
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT email, mobile, language_preference FROM users WHERE id = ?',
        [application.user_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Send notification
    const template = getNotificationTemplate('status_updated', user.language_preference || 'en');
    if (template) {
      const variables = { 
        trackingNumber: application.tracking_number,
        status: status.replace('_', ' ').toUpperCase()
      };
      
      // Send email notification
      await sendEmail(
        user.email,
        template.subject,
        replaceTemplateVariables(template.email, variables)
      );

      // Send SMS notification
      if (user.mobile) {
        await sendSMS(
          user.mobile,
          replaceTemplateVariables(template.sms, variables)
        );
      }

      // Store notification in database
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO notifications (id, user_id, application_id, type, title, message) VALUES (?, ?, ?, ?, ?, ?)',
          [
            uuidv4(),
            application.user_id,
            id,
            'email',
            template.subject,
            replaceTemplateVariables(template.email, variables)
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
    }

    logger.info('Application status updated', { 
      applicationId: id, 
      status, 
      officerId: req.user.id 
    });

    res.json({
      success: true,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get applications for officer review
router.get('/officer/pending', authenticateToken, requireRole(['officer', 'admin']), validatePagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, certificateType, priority } = req.query;
    const offset = (page - 1) * limit;
    const db = getDatabase();

    let query = `
      SELECT a.*, ct.name as certificate_type_name, cs.name as certificate_subtype_name,
             u.full_name as applicant_name, u.email as applicant_email, u.mobile as applicant_mobile
      FROM applications a
      LEFT JOIN certificate_types ct ON a.certificate_type_id = ct.id
      LEFT JOIN certificate_subtypes cs ON a.certificate_subtype_id = cs.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status IN ('submitted', 'verified', 'mro_review', 'tahsildar_review')
    `;
    const params = [];

    if (req.user.role === 'officer' && req.user.district) {
      // Officers can only see applications from their district
      query += ' AND u.district = ?';
      params.push(req.user.district);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (certificateType) {
      query += ' AND ct.id = ?';
      params.push(certificateType);
    }

    if (priority) {
      query += ' AND a.priority_level = ?';
      params.push(priority);
    }

    query += ' ORDER BY a.priority_level DESC, a.created_at ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const applications = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        applications: applications.map(app => ({
          ...app,
          application_data: JSON.parse(app.application_data)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Assign application to officer
router.patch('/:id/assign', authenticateToken, requireRole(['officer', 'admin']), validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { officerId } = req.body;
    const db = getDatabase();

    const targetOfficerId = officerId || req.user.id;

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE applications SET assigned_officer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [targetOfficerId, id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Application assigned', { applicationId: id, officerId: targetOfficerId });

    res.json({
      success: true,
      message: 'Application assigned successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;