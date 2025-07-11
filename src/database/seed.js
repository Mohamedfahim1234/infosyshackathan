import { v4 as uuidv4 } from 'uuid';
import { getDatabase, initializeDatabase } from './init.js';
import { hashPassword } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

async function seedDatabase() {
  try {
    await initializeDatabase();
    const db = getDatabase();

    logger.info('Starting database seeding...');

    // Seed districts
    const districts = [
      { id: uuidv4(), name: 'Mumbai', name_hi: 'मुंबई', name_ta: 'மும்பை', state: 'Maharashtra' },
      { id: uuidv4(), name: 'Delhi', name_hi: 'दिल्ली', name_ta: 'டெல்லி', state: 'Delhi' },
      { id: uuidv4(), name: 'Bangalore', name_hi: 'बैंगलोर', name_ta: 'பெங்களூர்', state: 'Karnataka' },
      { id: uuidv4(), name: 'Chennai', name_hi: 'चेन्नई', name_ta: 'சென்னை', state: 'Tamil Nadu' },
      { id: uuidv4(), name: 'Kolkata', name_hi: 'कोलकाता', name_ta: 'கொல்கத்தா', state: 'West Bengal' }
    ];

    for (const district of districts) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO districts (id, name, name_hi, name_ta, state) VALUES (?, ?, ?, ?, ?)',
          [district.id, district.name, district.name_hi, district.name_ta, district.state],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
    }

    // Seed departments
    const departments = [
      { id: uuidv4(), name: 'Revenue Department', name_hi: 'राजस्व विभाग', name_ta: 'வருவாய் துறை', description: 'Handles revenue related certificates' },
      { id: uuidv4(), name: 'Civil Registration', name_hi: 'नागरिक पंजीकरण', name_ta: 'சிவில் பதிவு', description: 'Birth, death, marriage certificates' },
      { id: uuidv4(), name: 'Social Welfare', name_hi: 'समाज कल्याण', name_ta: 'சமூக நலன்', description: 'Caste and other social certificates' }
    ];

    for (const department of departments) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO departments (id, name, name_hi, name_ta, description) VALUES (?, ?, ?, ?, ?)',
          [department.id, department.name, department.name_hi, department.name_ta, department.description],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
    }

    // Seed certificate types
    const certificateTypes = [
      {
        id: uuidv4(),
        name: 'Birth Certificate',
        name_hi: 'जन्म प्रमाणपत्र',
        name_ta: 'பிறப்பு சான்றிதழ்',
        description: 'Official birth registration certificate',
        description_hi: 'आधिकारिक जन्म पंजीकरण प्रमाणपत्र',
        description_ta: 'அதிகாரப்பூர்வ பிறப்பு பதிவு சான்றிதழ்',
        category: 'civil_registration',
        processing_days: 3,
        fee_amount: 50.00,
        required_documents: JSON.stringify(['parent_id_proof', 'medical_record', 'address_proof']),
        form_fields: JSON.stringify({
          child_name: { type: 'text', required: true },
          date_of_birth: { type: 'date', required: true },
          father_name: { type: 'text', required: true },
          mother_name: { type: 'text', required: true },
          place_of_birth: { type: 'text', required: true }
        })
      },
      {
        id: uuidv4(),
        name: 'Income Certificate',
        name_hi: 'आय प्रमाणपत्र',
        name_ta: 'வருமான சான்றிதழ்',
        description: 'Certificate of annual income',
        description_hi: 'वार्षिक आय का प्रमाणपत्र',
        description_ta: 'ஆண்டு வருமான சான்றிதழ்',
        category: 'revenue',
        processing_days: 7,
        fee_amount: 100.00,
        required_documents: JSON.stringify(['salary_slip', 'bank_statement', 'id_proof']),
        form_fields: JSON.stringify({
          annual_income: { type: 'number', required: true },
          occupation: { type: 'text', required: true },
          employer_name: { type: 'text', required: false }
        })
      },
      {
        id: uuidv4(),
        name: 'Caste Certificate',
        name_hi: 'जाति प्रमाणपत्र',
        name_ta: 'சாதி சான்றிதழ்',
        description: 'Caste verification certificate',
        description_hi: 'जाति सत्यापन प्रमाणपत्र',
        description_ta: 'சாதி சரிபார்ப்பு சான்றிதழ்',
        category: 'social_welfare',
        processing_days: 10,
        fee_amount: 75.00,
        required_documents: JSON.stringify(['family_tree', 'community_certificate', 'id_proof']),
        form_fields: JSON.stringify({
          caste: { type: 'text', required: true },
          sub_caste: { type: 'text', required: false },
          religion: { type: 'text', required: true }
        })
      },
      {
        id: uuidv4(),
        name: 'Domicile Certificate',
        name_hi: 'निवास प्रमाणपत्र',
        name_ta: 'குடியிருப்பு சான்றிதழ்',
        description: 'Proof of residence certificate',
        description_hi: 'निवास का प्रमाण पत्र',
        description_ta: 'குடியிருப்பு ஆதார சான்றிதழ்',
        category: 'revenue',
        processing_days: 5,
        fee_amount: 60.00,
        required_documents: JSON.stringify(['address_proof', 'utility_bills', 'id_proof']),
        form_fields: JSON.stringify({
          years_of_residence: { type: 'number', required: true },
          current_address: { type: 'textarea', required: true },
          permanent_address: { type: 'textarea', required: true }
        })
      }
    ];

    for (const certType of certificateTypes) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO certificate_types (
            id, name, name_hi, name_ta, description, description_hi, description_ta,
            category, processing_days, fee_amount, required_documents, form_fields
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            certType.id, certType.name, certType.name_hi, certType.name_ta,
            certType.description, certType.description_hi, certType.description_ta,
            certType.category, certType.processing_days, certType.fee_amount,
            certType.required_documents, certType.form_fields
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
    }

    // Seed certificate subtypes for Birth Certificate
    const birthCertificateId = certificateTypes[0].id;
    const birthSubtypes = [
      {
        id: uuidv4(),
        certificate_type_id: birthCertificateId,
        name: 'New Registration',
        name_hi: 'नया पंजीकरण',
        name_ta: 'புதிய பதிவு',
        description: 'Register a new birth certificate',
        form_fields: JSON.stringify({
          hospital_name: { type: 'text', required: false },
          delivery_type: { type: 'select', options: ['normal', 'cesarean'], required: false }
        }),
        required_documents: JSON.stringify(['hospital_certificate'])
      },
      {
        id: uuidv4(),
        certificate_type_id: birthCertificateId,
        name: 'Certificate Update',
        name_hi: 'प्रमाणपत्र अपडेट',
        name_ta: 'சான்றிதழ் புதுப்பிப்பு',
        description: 'Update existing birth certificate information',
        form_fields: JSON.stringify({
          existing_certificate_number: { type: 'text', required: true },
          update_reason: { type: 'select', options: ['name_correction', 'date_correction', 'other'], required: true }
        }),
        required_documents: JSON.stringify(['existing_certificate', 'correction_proof'])
      }
    ];

    for (const subtype of birthSubtypes) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO certificate_subtypes (
            id, certificate_type_id, name, name_hi, name_ta, description, form_fields, required_documents
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            subtype.id, subtype.certificate_type_id, subtype.name, subtype.name_hi, subtype.name_ta,
            subtype.description, subtype.form_fields, subtype.required_documents
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
    }

    // Seed admin user
    const adminPassword = await hashPassword('admin123');
    const adminId = uuidv4();
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users (
          id, email, mobile, password_hash, full_name, role, is_active, email_verified, mobile_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [adminId, 'admin@government-portal.gov', '9999999999', adminPassword, 'System Administrator', 'admin', 1, 1, 1],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Create admin preferences
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO user_preferences (id, user_id) VALUES (?, ?)',
        [uuidv4(), adminId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Seed sample officers
    const officers = [
      {
        id: uuidv4(),
        email: 'officer.mumbai@gov.in',
        mobile: '9876543210',
        full_name: 'Rajesh Kumar',
        officer_id: 'OFF001',
        district: 'Mumbai',
        department: 'Revenue Department'
      },
      {
        id: uuidv4(),
        email: 'officer.delhi@gov.in',
        mobile: '9876543211',
        full_name: 'Priya Sharma',
        officer_id: 'OFF002',
        district: 'Delhi',
        department: 'Civil Registration'
      }
    ];

    const officerPassword = await hashPassword('officer123');

    for (const officer of officers) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO users (
            id, email, mobile, password_hash, full_name, role, officer_id, district, department, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            officer.id, officer.email, officer.mobile, officerPassword, officer.full_name,
            'officer', officer.officer_id, officer.district, officer.department, 1
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });

      // Create officer preferences
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO user_preferences (id, user_id) VALUES (?, ?)',
          [uuidv4(), officer.id],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
    }

    // Seed sample citizen
    const citizenPassword = await hashPassword('citizen123');
    const citizenId = uuidv4();
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users (
          id, email, mobile, password_hash, full_name, role, district, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [citizenId, 'citizen@example.com', '9876543212', citizenPassword, 'John Doe', 'citizen', 'Mumbai', 1],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Create citizen preferences
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO user_preferences (id, user_id) VALUES (?, ?)',
        [uuidv4(), citizenId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    logger.info('Database seeding completed successfully');
    logger.info('Sample credentials:');
    logger.info('Admin: admin@government-portal.gov / admin123');
    logger.info('Officer: officer.mumbai@gov.in / officer123');
    logger.info('Citizen: citizen@example.com / citizen123');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };