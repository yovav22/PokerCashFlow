// Integration functions for external services
import { apiClient } from './client';

/**
 * Send an email using the server's email service
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body content
 * @returns {Promise<Object>} - Response from the server
 */
export const SendEmail = async ({ to, subject, body }) => {
  return apiClient.request('/notifications/email', {
    method: 'POST',
    body: JSON.stringify({ to, subject, body })
  });
};

/**
 * Send an SMS using the server's SMS service
 * @param {Object} params - SMS parameters
 * @param {string} params.to - Recipient phone number
 * @param {string} params.body - SMS message content
 * @returns {Promise<Object>} - Response from the server
 */
export const SendSMS = async ({ to, body }) => {
  return apiClient.request('/notifications/sms', {
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
  return apiClient.request('/notifications/whatsapp', {
    method: 'POST',
    body: JSON.stringify({ to, body })
  });
}; 