import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import sanitize from 'sanitize-filename';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateFileUpload, validateId } from '../middleware/validation.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), config.upload.path);
await fs.mkdir(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF, JPG, and PNG files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
    files: 10 // Maximum 10 files per request
  }
});

// Upload files
router.post('/upload', authenticateToken, upload.array('files', 10), validateFileUpload, async (req, res, next) => {
  try {
    const { applicationId, fileType } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const db = getDatabase();

    // Verify application exists and user has access
    const application = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM applications WHERE id = ?',
        [applicationId],
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

    if (req.user.role === 'citizen' && application.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Validate file type using file-type library
        const detectedType = await fileTypeFromBuffer(file.buffer);
        if (!detectedType || !config.upload.allowedTypes.includes(detectedType.mime)) {
          throw new AppError(`Invalid file type for ${file.originalname}`, 400);
        }

        // Generate unique filename
        const fileId = uuidv4();
        const sanitizedName = sanitize(file.originalname);
        const fileExtension = path.extname(sanitizedName);
        const filename = `${fileId}${fileExtension}`;
        const filePath = path.join(uploadDir, filename);

        let processedBuffer = file.buffer;

        // Process images (compress and resize if needed)
        if (detectedType.mime.startsWith('image/')) {
          processedBuffer = await sharp(file.buffer)
            .resize(2048, 2048, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 85 })
            .toBuffer();
        }

        // Save file to disk
        await fs.writeFile(filePath, processedBuffer);

        // Save file info to database
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO files (
              id, application_id, original_name, filename, file_path, 
              file_size, mime_type, file_type, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              fileId,
              applicationId,
              sanitizedName,
              filename,
              filePath,
              processedBuffer.length,
              detectedType.mime,
              fileType,
              req.user.id
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });

        uploadedFiles.push({
          id: fileId,
          originalName: sanitizedName,
          filename,
          size: processedBuffer.length,
          mimeType: detectedType.mime
        });

        logger.info('File uploaded successfully', {
          fileId,
          applicationId,
          originalName: sanitizedName,
          userId: req.user.id
        });

      } catch (fileError) {
        logger.error('Error processing file', {
          filename: file.originalname,
          error: fileError.message
        });
        // Continue with other files
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were successfully uploaded'
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get file by ID
router.get('/:id', authenticateToken, validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const file = await new Promise((resolve, reject) => {
      db.get(
        `SELECT f.*, a.user_id as application_user_id
         FROM files f
         JOIN applications a ON f.application_id = a.id
         WHERE f.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && file.application_user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists on disk
    try {
      await fs.access(file.file_path);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
    res.setHeader('Content-Length', file.file_size);

    // Stream file
    const fileBuffer = await fs.readFile(file.file_path);
    res.send(fileBuffer);

  } catch (error) {
    next(error);
  }
});

// Download file
router.get('/:id/download', authenticateToken, validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const file = await new Promise((resolve, reject) => {
      db.get(
        `SELECT f.*, a.user_id as application_user_id
         FROM files f
         JOIN applications a ON f.application_id = a.id
         WHERE f.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && file.application_user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists on disk
    try {
      await fs.access(file.file_path);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Set download headers
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Length', file.file_size);

    // Stream file
    const fileBuffer = await fs.readFile(file.file_path);
    res.send(fileBuffer);

    logger.info('File downloaded', {
      fileId: id,
      userId: req.user.id
    });

  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:id', authenticateToken, validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const file = await new Promise((resolve, reject) => {
      db.get(
        `SELECT f.*, a.user_id as application_user_id
         FROM files f
         JOIN applications a ON f.application_id = a.id
         WHERE f.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && file.application_user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete from database
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM files WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Delete from disk
    try {
      await fs.unlink(file.file_path);
    } catch (error) {
      logger.warn('Failed to delete file from disk', {
        fileId: id,
        filePath: file.file_path,
        error: error.message
      });
    }

    logger.info('File deleted', {
      fileId: id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get files for application
router.get('/application/:applicationId', authenticateToken, validateId, async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const db = getDatabase();

    // Verify application access
    const application = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM applications WHERE id = ?',
        [applicationId],
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

    if (req.user.role === 'citizen' && application.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get files
    const files = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, original_name, file_size, mime_type, file_type, is_verified, created_at FROM files WHERE application_id = ? ORDER BY created_at DESC',
        [applicationId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      data: {
        files
      }
    });

  } catch (error) {
    next(error);
  }
});

// Verify file (Officer/Admin only)
router.patch('/:id/verify', authenticateToken, requireRole(['officer', 'admin']), validateId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE files SET is_verified = ? WHERE id = ?',
        [verified ? 1 : 0, id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('File verification updated', {
      fileId: id,
      verified,
      officerId: req.user.id
    });

    res.json({
      success: true,
      message: `File ${verified ? 'verified' : 'unverified'} successfully`
    });

  } catch (error) {
    next(error);
  }
});

export default router;