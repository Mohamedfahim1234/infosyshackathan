import QRCode from 'qrcode';
import { config } from '../config/index.js';

export const generateQRCode = async (data) => {
  try {
    const qrCodeData = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeData;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

export const generateTrackingQR = async (trackingNumber) => {
  const trackingUrl = `${config.app.frontendUrl}/track/${trackingNumber}`;
  return await generateQRCode(trackingUrl);
};

export const generateApplicationQR = async (applicationId) => {
  const applicationUrl = `${config.app.frontendUrl}/application/${applicationId}`;
  return await generateQRCode(applicationUrl);
};