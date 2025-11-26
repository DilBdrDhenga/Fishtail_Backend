import emailService from "../config/emailConfig.js";

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
    // Log the contact form data
    console.log("📝 Contact Form Submission:", {
      name,
      email,
      subject,
      message: message.substring(0, 100) + "...", // Log first 100 chars only
      timestamp: new Date().toISOString(),
    });

    // Prepare email content
    const emailHtml = `
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
      </div>
    `;

    // Send email using the service
    await emailService.sendMail({
      from: "elido.bimal@gmail.com",
      to: "elido.bimal@gmail.com",
      subject: `Website Contact: ${subject}`,
      replyTo: email,
      html: emailHtml,
    });

    res.status(200).json({
      success: true,
      message:
        "Thank you! Your message has been received. We'll contact you soon.",
    });
  } catch (error) {
    console.error("Error in contact form:", error);

    // Always return success to the user
    res.status(200).json({
      success: true,
      message:
        "Thank you! Your message has been received. We'll contact you soon.",
    });
  }
};

// Test endpoint to check email configuration
const testEmail = async (req, res) => {
  const hasSendGrid = !!process.env.SENDGRID_API_KEY;

  res.json({
    success: true,
    message: hasSendGrid
      ? "SendGrid API configured"
      : "Running in logging mode",
    mode: hasSendGrid ? "api" : "logging",
  });
};

export { sendEmail, testEmail };
