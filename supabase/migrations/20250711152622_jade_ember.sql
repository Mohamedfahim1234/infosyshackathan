-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'officer', 'admin')),
  officer_id TEXT UNIQUE,
  district TEXT,
  department TEXT,
  language_preference TEXT DEFAULT 'en',
  email_verified BOOLEAN DEFAULT FALSE,
  mobile_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Certificate types table
CREATE TABLE IF NOT EXISTS certificate_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_hi TEXT,
  name_ta TEXT,
  description TEXT,
  description_hi TEXT,
  description_ta TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  processing_days INTEGER DEFAULT 7,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  required_documents TEXT, -- JSON array
  form_fields TEXT, -- JSON schema
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Certificate subtypes table
CREATE TABLE IF NOT EXISTS certificate_subtypes (
  id TEXT PRIMARY KEY,
  certificate_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_hi TEXT,
  name_ta TEXT,
  description TEXT,
  form_fields TEXT, -- JSON schema for additional fields
  required_documents TEXT, -- JSON array
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  certificate_type_id TEXT NOT NULL,
  certificate_subtype_id TEXT,
  application_data TEXT NOT NULL, -- JSON data
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'mro_review', 'tahsildar_review', 'generated', 'signed', 'delivered', 'rejected')),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 7,
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  assigned_officer_id TEXT,
  rejection_reason TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  qr_code TEXT UNIQUE,
  tracking_number TEXT UNIQUE,
  fee_paid BOOLEAN DEFAULT FALSE,
  fee_amount DECIMAL(10,2),
  payment_reference TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id),
  FOREIGN KEY (certificate_subtype_id) REFERENCES certificate_subtypes(id),
  FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
);

-- Application status history table
CREATE TABLE IF NOT EXISTS application_status_history (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  status TEXT NOT NULL,
  officer_id TEXT,
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (officer_id) REFERENCES users(id)
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('document', 'photo', 'certificate')),
  uploaded_by TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  application_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'push')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at DATETIME,
  read_at DATETIME,
  metadata TEXT, -- JSON for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sessions table (for session storage)
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire INTEGER NOT NULL
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_hi TEXT,
  name_ta TEXT,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_hi TEXT,
  name_ta TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_tracking_number ON applications(tracking_number);
CREATE INDEX IF NOT EXISTS idx_files_application_id ON files(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);