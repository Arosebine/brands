const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized:false,
    },
  });
  try {
    const message = {
      from: process.env.FROM_EMAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
      attachments: options.attachments,
    };

    const m = await transporter.sendMail(message);
    // console.log(m);
  } catch (error) {
    return error;
  }
};


module.exports = sendEmail;
