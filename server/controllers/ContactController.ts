import type { Request, Response } from "express";
import nodemailer from "nodemailer";

export const sendContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    console.log("📬 Contact form submission received");

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials missing");
      return res.status(500).json({
        success: false,
        message: "Email service not configured",
      });
    }

    console.log("📧 Configuring email transporter...");
    console.log("Email user:", process.env.EMAIL_USER);
    console.log("Email pass length:", process.env.EMAIL_PASS?.length);

    // Create transporter with correct Gmail settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for 587
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Must be App Password
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
        ciphers: 'SSLv3'
      },
      debug: true, // Enable debug logs
      logger: true // Log to console
    });

    // Verify connection
    try {
      console.log("🔄 Verifying SMTP connection...");
      await transporter.verify();
      console.log("✅ SMTP connection verified successfully");
    } catch (verifyError: any) {
      console.error("❌ SMTP verification failed:", verifyError.message);
      console.error("Error code:", verifyError.code);
      console.error("Error command:", verifyError.command);
      console.error("Error response:", verifyError.response);
      
      return res.status(500).json({
        success: false,
        message: "Email service connection failed. Check credentials.",
      });
    }

    // Email options
    const mailOptions = {
      from: `"ThumbnailGen Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Message: ${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Contact Form Message
          </h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong style="color: #4b5563;">Name:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong style="color: #4b5563;">Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong style="color: #4b5563;">Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${message.replace(/\n/g, '<br/>')}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Sent from ThumbnailGen Contact Form
          </p>
        </div>
      `,
    };

    // Send email
    console.log("📧 Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);

    return res.json({
      success: true,
      message: "Message sent successfully! We'll get back to you soon.",
    });

  } catch (error: any) {
    console.error("❌ Contact form error:");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Command:", error.command);
    console.error("- Response:", error.response);
    console.error("- Stack:", error.stack);

    // User-friendly error message
    let errorMessage = "Failed to send message. ";
    if (error.code === 'EAUTH') {
      errorMessage += "Email authentication failed. Please use an App Password.";
    } else if (error.code === 'ESOCKET') {
      errorMessage += "Network connection issue.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage += "Connection timed out.";
    } else {
      errorMessage += "Please try again later.";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};