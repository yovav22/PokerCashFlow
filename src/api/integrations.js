// Integration functions for external services
import { apiClient } from './client';
import emailjs from '@emailjs/browser';

// Your EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Send an email using EmailJS
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body content
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const SendEmail = async ({ to, subject, body }) => {
  // Check if we have all required EmailJS configuration
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.log('Demo Mode: Simulating email send', { to, subject, body });
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Email sent (Demo Mode)',
      to,
      subject
    };
  }

  try {
    // Initialize EmailJS with your public key
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: to,
        to_name: to.split('@')[0], // Extract name from email
        subject: subject,
        message: body,
      }
    );

    return {
      success: true,
      message: 'Email sent successfully',
      response
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(error.text || 'Failed to send email');
  }
};

/**
 * Send an SMS using the server's SMS service
 * @param {Object} params - SMS parameters
 * @param {string} params.to - Recipient phone number
 * @param {string} params.body - SMS message content
 * @returns {Promise<Object>} - Response from the server
 */
export const SendSMS = async ({ to, body }) => {
  return apiClient.request('/integrations/sms', {
    method: 'POST',
    body: JSON.stringify({ to, body })
  });
};

/**
 * Send a WhatsApp message using the server's WhatsApp integration
 * @param {Object} params - WhatsApp parameters
 * @param {string} params.to - Recipient phone number
 * @param {string} params.body - Message content
 * @returns {Promise<Object>} - Response from the server
 */
export const SendWhatsApp = async ({ to, body }) => {
  return apiClient.request('/integrations/whatsapp', {
    method: 'POST',
    body: JSON.stringify({ to, body })
  });
}; 