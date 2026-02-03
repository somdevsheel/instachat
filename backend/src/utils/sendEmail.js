const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"InstaChat" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
