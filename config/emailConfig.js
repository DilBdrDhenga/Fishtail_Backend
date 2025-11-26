import dotenv from "dotenv";

dotenv.config();

class EmailService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.apiUrl = "https://api.sendgrid.com/v3/mail/send";
  }

  async sendMail(mailOptions) {
    // If no API key, log and return success
    if (!this.apiKey) {
      console.log("📝 Email logged (SendGrid not configured):", {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from,
      });
      return { messageId: "logged-only" };
    }

    try {
      const data = {
        personalizations: [
          {
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
          },
        ],
        from: { email: mailOptions.from },
        content: [
          {
            type: "text/html",
            value: mailOptions.html || mailOptions.text,
          },
        ],
      };

      // Add reply-to if provided
      if (mailOptions.replyTo) {
        data.reply_to = { email: mailOptions.replyTo };
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${error}`);
      }

      console.log("✅ Email sent successfully via SendGrid API");
      return { messageId: "sent-via-api" };
    } catch (error) {
      console.error("❌ SendGrid API error:", error.message);
      throw error;
    }
  }
}

const emailService = new EmailService();
export default emailService;
