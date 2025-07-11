import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('mobile').isMobilePhone('en-IN'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('fullName').isLength({ min: 2, max: 100 }).trim(),
  body('role').isIn(['citizen', 'officer', 'admin']),
  handleValidationErrors
];

export const validateUserLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

// Application validation rules
export const validateApplicationSubmission = [
  body('certificateTypeId').isUUID(),
  body('applicationData').isObject(),
  handleValidationErrors
];

export const validateApplicationStatusUpdate = [
  param('id').isUUID(),
  body('status').isIn(['submitted', 'verified', 'mro_review', 'tahsildar_review', 'generated', 'signed', 'delivered', 'rejected']),
  body('comments').optional().isString().trim(),
  handleValidationErrors
];

// File validation rules
export const validateFileUpload = [
  body('applicationId').isUUID(),
  body('fileType').isIn(['document', 'photo', 'certificate']),
  handleValidationErrors
];

// Query validation rules
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors
];

export const validateApplicationFilters = [
  query('status').optional().isIn(['submitted', 'verified', 'mro_review', 'tahsildar_review', 'generated', 'signed', 'delivered', 'rejected']),
  query('certificateType').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  handleValidationErrors
];

// Notification validation rules
export const validateNotificationSend = [
  body('userId').isUUID(),
  body('type').isIn(['sms', 'email', 'push']),
  body('title').isLength({ min: 1, max: 200 }).trim(),
  body('message').isLength({ min: 1, max: 1000 }).trim(),
  handleValidationErrors
];

// ID validation
export const validateId = [
  param('id').isUUID(),
  handleValidationErrors
];

export const validateTrackingNumber = [
  param('trackingNumber').isAlphanumeric().isLength({ min: 8, max: 20 }),
  handleValidationErrors
];