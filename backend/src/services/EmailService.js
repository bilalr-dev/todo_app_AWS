// Email Service for Todo App v0.7
// Handles email notifications using Nodemailer

const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      const emailConfig = {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      // For development, use a test account if no credentials provided
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Email credentials not provided. Using test configuration.');
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass'
          }
        });
      } else {
        this.transporter = nodemailer.createTransporter(emailConfig);
      }

      // Verify connection
      await this.transporter.verify();
      this.initialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.initialized = false;
    }
  }

  // Send notification email
  async sendNotification(email, type, data) {
    if (!this.initialized) {
      logger.warn('Email service not initialized. Skipping email notification.');
      return { success: false, error: 'Email service not available' };
    }

    try {
      const template = this.getEmailTemplate(type, data);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@todoapp.com',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email notification sent to ${email}: ${type}`, {
        messageId: result.messageId,
        type: type
      });

      return { 
        success: true, 
        messageId: result.messageId,
        type: type
      };
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      return { 
        success: false, 
        error: error.message,
        type: type
      };
    }
  }

  // Get email template based on notification type
  getEmailTemplate(type, data) {
    const templates = {
      due_date_reminder: {
        subject: `⏰ Due Date Reminder: ${data.todo_title}`,
        html: this.getDueDateReminderHTML(data),
        text: this.getDueDateReminderText(data)
      },
      todo_created_high_priority: {
        subject: `🚨 High Priority Todo Created: ${data.todo_title}`,
        html: this.getHighPriorityTodoHTML(data),
        text: this.getHighPriorityTodoText(data)
      },
      todo_state_changed: {
        subject: `📋 Todo Status Updated: ${data.todo_title}`,
        html: this.getStateChangedHTML(data),
        text: this.getStateChangedText(data)
      },
      file_uploaded: {
        subject: `📎 File Uploaded: ${data.filename}`,
        html: this.getFileUploadedHTML(data),
        text: this.getFileUploadedText(data)
      },
      bulk_action_completed: {
        subject: `✅ Bulk Action Completed: ${data.action}`,
        html: this.getBulkActionHTML(data),
        text: this.getBulkActionText(data)
      },
      system_notification: {
        subject: `🔔 System Notification: ${data.title}`,
        html: this.getSystemNotificationHTML(data),
        text: this.getSystemNotificationText(data)
      }
    };

    return templates[type] || templates.system_notification;
  }

  // Due date reminder email template
  getDueDateReminderHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Due Date Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .todo-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .priority-high { border-left: 4px solid #ef4444; }
          .priority-medium { border-left: 4px solid #f59e0b; }
          .priority-low { border-left: 4px solid #10b981; }
          .due-date { color: #ef4444; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Due Date Reminder</h1>
            <p>Your todo is due soon!</p>
          </div>
          <div class="content">
            <div class="todo-card priority-${data.priority}">
              <h2>${data.todo_title}</h2>
              <p><strong>Due Date:</strong> <span class="due-date">${new Date(data.due_date).toLocaleString()}</span></p>
              <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
              ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
              ${data.category ? `<p><strong>Category:</strong> ${data.category}</p>` : ''}
            </div>
            <p>Don't forget to complete this task on time!</p>
            <div class="footer">
              <p>This is an automated reminder from Todo App</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getDueDateReminderText(data) {
    return `
Due Date Reminder

Your todo "${data.todo_title}" is due soon!

Due Date: ${new Date(data.due_date).toLocaleString()}
Priority: ${data.priority.toUpperCase()}
${data.description ? `Description: ${data.description}` : ''}
${data.category ? `Category: ${data.category}` : ''}

Don't forget to complete this task on time!

This is an automated reminder from Todo App
    `;
  }

  // High priority todo email template
  getHighPriorityTodoHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>High Priority Todo Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .todo-card { background: white; border: 1px solid #e2e8f0; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 High Priority Todo Created</h1>
            <p>You've created an urgent task!</p>
          </div>
          <div class="content">
            <div class="todo-card">
              <h2>${data.todo_title}</h2>
              <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
              ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
              ${data.category ? `<p><strong>Category:</strong> ${data.category}</p>` : ''}
              ${data.due_date ? `<p><strong>Due Date:</strong> ${new Date(data.due_date).toLocaleString()}</p>` : ''}
            </div>
            <p>This high priority task requires your immediate attention!</p>
            <div class="footer">
              <p>This is an automated notification from Todo App</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getHighPriorityTodoText(data) {
    return `
High Priority Todo Created

You've created an urgent task: "${data.todo_title}"

Priority: ${data.priority.toUpperCase()}
${data.description ? `Description: ${data.description}` : ''}
${data.category ? `Category: ${data.category}` : ''}
${data.due_date ? `Due Date: ${new Date(data.due_date).toLocaleString()}` : ''}

This high priority task requires your immediate attention!

This is an automated notification from Todo App
    `;
  }

  // State changed email template
  getStateChangedHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Todo Status Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .todo-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .status-change { background: #dbeafe; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Todo Status Updated</h1>
            <p>Your todo status has changed!</p>
          </div>
          <div class="content">
            <div class="todo-card">
              <h2>${data.todo_title}</h2>
              <div class="status-change">
                <strong>Status Changed:</strong> ${data.from_state} → ${data.to_state}
              </div>
              ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
              ${data.category ? `<p><strong>Category:</strong> ${data.category}</p>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from Todo App</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getStateChangedText(data) {
    return `
Todo Status Updated

Your todo "${data.todo_title}" status has changed!

Status Changed: ${data.from_state} → ${data.to_state}
${data.description ? `Description: ${data.description}` : ''}
${data.category ? `Category: ${data.category}` : ''}

This is an automated notification from Todo App
    `;
  }

  // File uploaded email template
  getFileUploadedHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>File Uploaded</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .file-info { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📎 File Uploaded</h1>
            <p>A file has been uploaded to your todo!</p>
          </div>
          <div class="content">
            <div class="file-info">
              <h2>${data.filename}</h2>
              <p><strong>File Size:</strong> ${this.formatFileSize(data.file_size)}</p>
              <p><strong>Todo:</strong> ${data.todo_title}</p>
              <p><strong>Uploaded:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Todo App</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getFileUploadedText(data) {
    return `
File Uploaded

A file has been uploaded to your todo!

File: ${data.filename}
File Size: ${this.formatFileSize(data.file_size)}
Todo: ${data.todo_title}
Uploaded: ${new Date().toLocaleString()}

This is an automated notification from Todo App
    `;
  }

  // Bulk action email template
  getBulkActionHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bulk Action Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .results { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Bulk Action Completed</h1>
            <p>Your bulk operation has finished!</p>
          </div>
          <div class="content">
            <div class="results">
              <h2>Bulk ${data.action.toUpperCase()} Results</h2>
              <p><strong>Total Items:</strong> ${data.total}</p>
              <p><strong>Successful:</strong> ${data.successful}</p>
              <p><strong>Failed:</strong> ${data.failed}</p>
              <p><strong>Completed:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Todo App</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getBulkActionText(data) {
    return `
Bulk Action Completed

Your bulk operation has finished!

Bulk ${data.action.toUpperCase()} Results:
Total Items: ${data.total}
Successful: ${data.successful}
Failed: ${data.failed}
Completed: ${new Date().toLocaleString()}

This is an automated notification from Todo App
    `;
  }

  // System notification email template
  getSystemNotificationHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>System Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .notification { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 System Notification</h1>
            <p>Important system update</p>
          </div>
          <div class="content">
            <div class="notification">
              <h2>${data.title}</h2>
              <p>${data.message}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Todo App</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getSystemNotificationText(data) {
    return `
System Notification

${data.title}

${data.message}

Date: ${new Date().toLocaleString()}

This is an automated notification from Todo App
    `;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Test email functionality
  async testEmail(email) {
    return await this.sendNotification(email, 'system_notification', {
      title: 'Email Service Test',
      message: 'This is a test email to verify the email service is working correctly.'
    });
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.initialized,
      service: process.env.EMAIL_SERVICE || 'gmail',
      from: process.env.EMAIL_FROM || 'noreply@todoapp.com'
    };
  }
}

module.exports = EmailService;



