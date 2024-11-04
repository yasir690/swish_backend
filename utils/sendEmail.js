import nodemailer from "nodemailer";
import { emailConfig } from "../config/emailConfig.js";

// create reusable transporter object using the default SMTP transport
const transport = nodemailer.createTransport(emailConfig);

// send mail with defined transport object

export const sendEmails = async (to, subject, content, next) => {
  console.log(" Sending email to:", to); // Log the recipient email address

  try {
    const message = {
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_USERNAME,
      },
      to: to,
      subject: subject,
      html: content,
    };
    console.log("Sending email message:", message); // Log the email message before sending
    await transport.sendMail(message);
  } catch (error) {
    console.error(error);
    if (typeof next === "function") {
      next(error); // Call the callback function with the error
    }
  }
};
