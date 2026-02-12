require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

(async () => {
  try {
    await transporter.sendMail({
      from: `"InstaChat Test" <${process.env.SMTP_EMAIL}>`,
      to: "yourpersonalemail@gmail.com",
      subject: "SMTP Test Success",
      text: "If you got this email, SMTP is working 🎉",
    });

    console.log("✅ SMTP working");
  } catch (err) {
    console.error("❌ SMTP error", err);
  }
})();
