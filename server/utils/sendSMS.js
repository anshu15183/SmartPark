
const twilio = require('twilio');

const sendSMS = async (options) => {
  // console.log('Attempting to send SMS with Twilio...');

  try {
    // Create twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Send message
    const message = await client.messages.create({
      body: options.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phone
    });

    // console.log('SMS sent successfully:', message.sid);
    return message;
  } catch (error) {
    // console.error('Error sending SMS:', error);
    throw error;
  }
};

module.exports = sendSMS;
