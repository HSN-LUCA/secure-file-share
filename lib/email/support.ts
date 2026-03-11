/**
 * Enterprise Support Email Module
 * Handles sending support-related emails
 */

import nodemailer from 'nodemailer';
import { getEnv } from '@/lib/env';

interface SupportEmailOptions {
  to: string;
  subject: string;
  ticketId: string;
  userMessage: string;
}

/**
 * Create email transporter
 */
function getTransporter() {
  // Use environment variables for email configuration
  // This can be configured with SendGrid, Gmail, or any SMTP service
  const env = getEnv();
  
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT, 10),
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  // Fallback: return null if not configured
  return null;
}

/**
 * Send support ticket confirmation email
 */
export async function sendSupportEmail(options: SupportEmailOptions): Promise<void> {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not configured. Skipping email send.');
    return;
  }

  const env = getEnv();
  const fromEmail = env.SUPPORT_EMAIL || 'support@example.com';
    <h2>Support Ticket Received</h2>
    <p>Thank you for contacting our enterprise support team.</p>
    
    <h3>Ticket Details</h3>
    <ul>
      <li><strong>Ticket ID:</strong> ${options.ticketId}</li>
      <li><strong>Subject:</strong> ${escapeHtml(options.subject)}</li>
      <li><strong>Status:</strong> Open</li>
    </ul>
    
    <h3>Your Message</h3>
    <p>${escapeHtml(options.userMessage).replace(/\n/g, '<br>')}</p>
    
    <p>Our support team will review your ticket and respond within 24 hours.</p>
    
    <p>
      <strong>Ticket ID for reference:</strong> ${options.ticketId}
    </p>
  `;

  const textContent = `
Support Ticket Received

Thank you for contacting our enterprise support team.

Ticket Details:
- Ticket ID: ${options.ticketId}
- Subject: ${options.subject}
- Status: Open

Your Message:
${options.userMessage}

Our support team will review your ticket and respond within 24 hours.

Ticket ID for reference: ${options.ticketId}
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: textContent,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Failed to send support email:', error);
    throw error;
  }
}

/**
 * Send support ticket update email
 */
export async function sendTicketUpdateEmail(
  to: string,
  ticketId: string,
  status: string,
  message: string
): Promise<void> {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not configured. Skipping email send.');
    return;
  }

  const env = getEnv();
  const fromEmail = env.SUPPORT_EMAIL || 'support@example.com';

  const htmlContent = `
    <h2>Support Ticket Update</h2>
    <p>Your support ticket has been updated.</p>
    
    <h3>Ticket Details</h3>
    <ul>
      <li><strong>Ticket ID:</strong> ${ticketId}</li>
      <li><strong>Status:</strong> ${status}</li>
    </ul>
    
    <h3>Update</h3>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `;

  const textContent = `
Support Ticket Update

Your support ticket has been updated.

Ticket Details:
- Ticket ID: ${ticketId}
- Status: ${status}

Update:
${message}
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to,
      subject: `Support Ticket Update: ${ticketId}`,
      text: textContent,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Failed to send ticket update email:', error);
    throw error;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
