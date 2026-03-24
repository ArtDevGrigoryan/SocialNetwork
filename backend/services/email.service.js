const nodemailer = require("nodemailer");
const env = require("@helpers/env");
const generateCode = require("@utilities/random-code");

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async init() {
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
    return this;
  }

  async sendEmail(to, subject, text) {
    if (!this.transporter) {
      await this.init();
    }
    return this.transporter.sendMail({
      from: env.EMAIL_USER,
      to,
      subject,
      text,
    });
  }

  async sendVerificationEmail(to, code) {
    const subject = "Email Verification";
    const text = `Please verify your email by using the following code: ${code}`;
    return this.sendEmail(to, subject, text);
  }
  async sendPasswordResetEmail(to, code) {
    const subject = "Password Reset Request";
    const text = `You requested a password reset. Use the following code to reset your password: ${code}`;
    return this.sendEmail(to, subject, text);
  }
}

module.exports = new EmailService().init();
