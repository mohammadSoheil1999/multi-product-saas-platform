const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsAppMessage = (phoneNumber, message) => {
  return client.messages.create({
    body: message,
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
  });
};

module.exports = { sendWhatsAppMessage };