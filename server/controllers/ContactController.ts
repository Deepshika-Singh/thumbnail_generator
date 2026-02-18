import type { Request, Response } from "express";
import nodemailer from "nodemailer";

export const sendContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
      return res.status(500).json({
        success: false,
        message: "Email service not configured properly.",
      });
    }

    // 🚀 SMTP config (Render safe)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
      connectionTimeout: 10000, // prevent infinite timeout
    });

    await transporter.verify();

    const mailOptions = {
      from: `"ThumbnailGen Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || "deepshikasingh110@gmail.com",
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <h3>New Contact Form Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Message sent successfully!",
    });

  } catch (error: any) {
    console.error("Contact Email Error:", error);
    return res.status(500).json({
      success: false,
      message: "Email service failed. Check SMTP credentials.",
    });
  }
};
