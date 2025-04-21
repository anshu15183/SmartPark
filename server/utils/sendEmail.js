
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('Attempting to send email with nodemailer...');

  // Validate recipients
  if (!options.to && !options.email) {
    throw new Error('No recipient email address provided');
  }

  // Get email credentials from environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  if (!emailUser || !emailPass) {
    console.error('Email credentials missing in environment variables');
    throw new Error('Email configuration is incomplete. Check EMAIL_USER and EMAIL_PASS environment variables.');
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  // Ensure recipient email is properly set
  const recipientEmail = options.to || options.email;
  if (!recipientEmail) {
    throw new Error('No recipient email address provided');
  }

  // Define mail options with proper sender name and recipient
  const mailOptions = {
    from: `"SmartPark Support" <${emailUser}>`,
    to: recipientEmail,
    subject: options.subject || 'Message from SmartPark',
    html: options.html || options.text || 'No content provided'
  };

  console.log(`Sending email to: ${recipientEmail}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;
