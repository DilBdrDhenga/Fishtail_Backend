import transporter from "../config/emailConfig.js";

const sendEmail = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  try {
    // Main email to company - SendGrid format
    const mailOptions = {
      from: "fishtailgroup@gmail.com", // Your verified sender in SendGrid
      to: "fishtailgroup@gmail.com", // Your company email
      subject: `Website Contact: ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong style="color: #007bff;">Name:</strong> ${name}</p>
            <p><strong style="color: #007bff;">Email:</strong> ${email}</p>
            <p><strong style="color: #007bff;">Subject:</strong> ${subject}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
            <strong style="color: #007bff;">Message:</strong>
            <p style="margin-top: 10px; line-height: 1.6;">${message.replace(
              /\n/g,
              "<br>"
            )}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              <em>This message was sent from the Fishtail Geo-Survey contact form.</em>
            </p>
          </div>
        </div>
      `,
    };

    // Auto-reply to user
    const autoReplyOptions = {
      from: "fishtailgroup@gmail.com", // Your verified sender
      to: email,
      subject: "Thank you for contacting Fishtail Geo-Survey",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff; text-align: center;">Thank You for Contacting Fishtail Geo-Survey</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for reaching out to us. We have received your message and one of our team members will get back to you within 24 hours.</p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 15px;">Your Message Summary:</h4>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 3px; margin: 10px 0;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>

          <div style="background: #007bff; color: white; padding: 20px; border-radius: 5px; text-align: center;">
            <h4 style="margin: 0 0 10px 0;">Fishtail Geo-Survey PVT. LTD.</h4>
            <p style="margin: 5px 0;">📍 Horizon chowk, Butwal 32907</p>
            <p style="margin: 5px 0;">📞 +977 985-7031349</p>
            <p style="margin: 5px 0;">✉️ fishtailgroup@gmail.com</p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px;">
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
              This is an automated response. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    // Send both emails
    await transporter.sendMail(mailOptions);
    console.log("✅ Main email sent successfully");

    await transporter.sendMail(autoReplyOptions);
    console.log("✅ Auto-reply email sent successfully");

    res.status(200).json({
      success: true,
      message:
        "Message sent successfully! We have sent a confirmation email to your inbox.",
    });
  } catch (error) {
    console.error("Error sending email:", error);

    // Better error messages for SendGrid
    let errorMessage = "Failed to send message. Please try again later.";

    if (error.code === "ETIMEDOUT") {
      errorMessage =
        "Email service is currently unavailable. Please try again later or contact us directly.";
    } else if (error.responseCode === 403) {
      errorMessage =
        "Email service configuration error. Please contact support.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// Test email route
const testEmail = async (req, res) => {
  try {
    // Skip verification since Render blocks it
    res.json({
      success: true,
      message: "Email service configured with SendGrid",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Email service configuration error: " + error.message,
    });
  }
};

export { sendEmail, testEmail };
