import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { config } from '../config/index.js';
import { logger } from './logger.js';

// Email transporter
let emailTransporter = null;
if (config.email.user && config.email.pass) {
  emailTransporter = nodemailer.createTransporter({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
}

// SMS client
let smsClient = null;
if (config.sms.accountSid && config.sms.authToken) {
  smsClient = twilio(config.sms.accountSid, config.sms.authToken);
}

export const sendEmail = async (to, subject, text, html = null) => {
  if (!emailTransporter) {
    logger.warn('Email transporter not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      text,
      html: html || text
    };

    const result = await emailTransporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { to, subject, messageId: result.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { to, subject, error: error.message });
    return false;
  }
};

export const sendSMS = async (to, message) => {
  if (!smsClient) {
    logger.warn('SMS client not configured');
    return false;
  }

  try {
    const result = await smsClient.messages.create({
      body: message,
      from: config.sms.fromNumber,
      to
    });

    logger.info('SMS sent successfully', { to, sid: result.sid });
    return true;
  } catch (error) {
    logger.error('Failed to send SMS', { to, error: error.message });
    return false;
  }
};

export const getNotificationTemplate = (type, language = 'en') => {
  const templates = {
    application_submitted: {
      en: {
        subject: 'Application Submitted Successfully',
        email: 'Your application has been submitted successfully. Tracking Number: {{trackingNumber}}',
        sms: 'Your application {{trackingNumber}} has been submitted successfully.'
      },
      hi: {
        subject: 'आवेदन सफलतापूर्वक जमा किया गया',
        email: 'आपका आवेदन सफलतापूर्वक जमा किया गया है। ट्रैकिंग नंबर: {{trackingNumber}}',
        sms: 'आपका आवेदन {{trackingNumber}} सफलतापूर्वक जमा किया गया है।'
      },
      ta: {
        subject: 'விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது',
        email: 'உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. கண்காணிப்பு எண்: {{trackingNumber}}',
        sms: 'உங்கள் விண்ணப்பம் {{trackingNumber}} வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது।'
      }
    },
    status_updated: {
      en: {
        subject: 'Application Status Updated',
        email: 'Your application {{trackingNumber}} status has been updated to: {{status}}',
        sms: 'Application {{trackingNumber}} status updated to: {{status}}'
      },
      hi: {
        subject: 'आवेदन स्थिति अपडेट की गई',
        email: 'आपके आवेदन {{trackingNumber}} की स्थिति अपडेट की गई है: {{status}}',
        sms: 'आवेदन {{trackingNumber}} की स्थिति अपडेट: {{status}}'
      },
      ta: {
        subject: 'விண்ணப்ப நிலை புதுப்பிக்கப்பட்டது',
        email: 'உங்கள் விண்ணப்பம் {{trackingNumber}} நிலை புதுப்பிக்கப்பட்டது: {{status}}',
        sms: 'விண்ணப்பம் {{trackingNumber}} நிலை புதுப்பிப்பு: {{status}}'
      }
    },
    certificate_ready: {
      en: {
        subject: 'Certificate Ready for Download',
        email: 'Your certificate is ready for download. Application: {{trackingNumber}}',
        sms: 'Certificate ready for download. Application: {{trackingNumber}}'
      },
      hi: {
        subject: 'प्रमाणपत्र डाउनलोड के लिए तैयार',
        email: 'आपका प्रमाणपत्र डाउनलोड के लिए तैयार है। आवेदन: {{trackingNumber}}',
        sms: 'प्रमाणपत्र डाउनलोड के लिए तैयार। आवेदन: {{trackingNumber}}'
      },
      ta: {
        subject: 'சான்றிதழ் பதிவிறக்கத்திற்கு தயார்',
        email: 'உங்கள் சான்றிதழ் பதிவிறக்கத்திற்கு தயார். விண்ணப்பம்: {{trackingNumber}}',
        sms: 'சான்றிதழ் பதிவிறக்கத்திற்கு தயார். விண்ணப்பம்: {{trackingNumber}}'
      }
    }
  };

  return templates[type]?.[language] || templates[type]?.en;
};

export const replaceTemplateVariables = (template, variables) => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};