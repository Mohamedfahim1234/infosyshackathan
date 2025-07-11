# Government Service Transparency Portal - Backend

A secure, scalable backend API for a government service transparency portal built with Node.js, Express, and SQLite.

## Features

### Core Functionality
- **User Authentication**: JWT-based authentication with role-based access control (citizen, officer, admin)
- **Application Management**: Submit, track, and manage certificate applications
- **Dynamic Workflows**: Multi-step application process with configurable certificate types and subtypes
- **File Management**: Secure file upload, storage, and access control
- **Real-time Tracking**: 7-step application progress tracking with QR codes
- **Notification System**: SMS and email notifications for status updates
- **Multi-language Support**: English, Hindi, and Tamil language support

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting and request throttling
- Input validation and sanitization
- File type validation and secure storage
- Audit logging for all actions
- Session management

### Admin Features
- System statistics and analytics
- User management
- Certificate type configuration
- Audit trail monitoring
- System health monitoring

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/logout` - Logout user

### Applications
- `POST /api/applications` - Submit new application
- `GET /api/applications/my-applications` - Get user's applications
- `GET /api/applications/:id` - Get application by ID
- `PATCH /api/applications/:id/status` - Update application status (Officer/Admin)
- `GET /api/applications/officer/pending` - Get pending applications for review
- `PATCH /api/applications/:id/assign` - Assign application to officer

### Files
- `POST /api/files/upload` - Upload files
- `GET /api/files/:id` - View file
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/application/:applicationId` - Get files for application
- `PATCH /api/files/:id/verify` - Verify file (Officer/Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all notifications as read
- `GET /api/notifications/stats` - Get notification statistics
- `POST /api/notifications/send` - Send notification (Officer/Admin)
- `POST /api/notifications/send-bulk` - Send bulk notifications (Admin)

### Dashboard
- `GET /api/dashboard/user` - Get user dashboard data
- `GET /api/dashboard/officer` - Get officer dashboard data
- `GET /api/dashboard/admin` - Get admin dashboard data
- `GET /api/dashboard/analytics` - Get application analytics

### Public Endpoints
- `GET /api/public/track/:trackingNumber` - Track application by tracking number
- `GET /api/public/audit-wall` - Get audit wall data
- `GET /api/public/heatmap` - Get heatmap data
- `GET /api/public/about` - Get about information
- `GET /api/public/certificate-types` - Get certificate types

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/certificate-types` - Manage certificate types
- `POST /api/admin/certificate-types` - Create certificate type
- `PUT /api/admin/certificate-types/:id` - Update certificate type
- `POST /api/admin/certificate-subtypes` - Create certificate subtype
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/health` - Get system health
- `GET /api/admin/districts` - Get districts
- `POST /api/admin/districts` - Create district
- `GET /api/admin/departments` - Get departments
- `POST /api/admin/departments` - Create department

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/status` - Update user status (Admin)
- `PATCH /api/users/:id/role` - Update user role (Admin)
- `GET /api/users/:id/activity` - Get user activity log
- `GET /api/users/officers/list` - Get officers list
- `GET /api/users/stats/overview` - Get user statistics (Admin)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Initialize the database:
   ```bash
   npm run migrate
   ```

6. Seed the database with sample data:
   ```bash
   npm run seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required environment variables.

### Required Configuration
- `JWT_SECRET`: Secret key for JWT tokens
- `SESSION_SECRET`: Secret key for sessions
- Database configuration
- Email configuration (for notifications)
- SMS configuration (for notifications)

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `applications` - Certificate applications
- `certificate_types` - Available certificate types
- `certificate_subtypes` - Certificate subtypes
- `files` - Uploaded documents
- `notifications` - User notifications
- `audit_logs` - System audit trail
- `application_status_history` - Application status changes

## Sample Credentials

After seeding the database, you can use these sample credentials:

- **Admin**: admin@government-portal.gov / admin123
- **Officer**: officer.mumbai@gov.in / officer123
- **Citizen**: citizen@example.com / citizen123

## Application Status Flow

Applications follow a 7-step process:
1. **Submitted** - Application received
2. **Verified** - Documents verified
3. **MRO Review** - Under MRO review
4. **Tahsildar Review** - Under Tahsildar review
5. **Generated** - Certificate generated
6. **Signed** - Certificate signed
7. **Delivered** - Certificate delivered

## File Upload

- Supported formats: PDF, JPG, PNG
- Maximum file size: 5MB per file
- Files are processed and compressed automatically
- Secure storage with access control

## Notifications

The system supports:
- Email notifications via SMTP
- SMS notifications via Twilio
- Multi-language notification templates
- Bulk notification sending

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Request throttling
- Input validation with Joi
- File type validation
- SQL injection prevention
- XSS protection
- CORS configuration

## Logging

- Winston logger with file rotation
- Request/response logging
- Error logging with stack traces
- Audit logging for all actions

## Development

```bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Check database migration
npm run migrate

# Seed database with sample data
npm run seed
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up email and SMS services
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure monitoring and logging

## API Documentation

The API follows RESTful conventions with consistent response formats:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors if applicable
  ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.