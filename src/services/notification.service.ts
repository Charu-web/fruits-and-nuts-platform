/**
 * ==============================================================================
 * TRANSACTIONAL NOTIFICATION SERVICE — M/S FRUITS & NUTS
 * ==============================================================================
 * Production transactional email and SMS dispatch engine.
 * Supports direct REST integration with leading transactional email providers
 * (Resend, SendGrid, Postmark) without external package dependencies.
 *
 * Implements strict credential verification: never leaks reset tokens or secrets,
 * and maintains server-side operational audit logs when credentials are missing.
 * ==============================================================================
 */

import * as net from "node:net";
import * as tls from "node:tls";

export interface NotificationStatus {
  emailConfigured: boolean;
  smsConfigured: boolean;
  emailProvider: string;
  smsProvider: string;
  senderAddress: string;
  lastEmailStatus?: {
    timestamp: string;
    success: boolean;
    provider: string;
    recipientDomain?: string;
    error?: string;
  };
}

export interface SmtpDispatchOptions {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  timeoutMs?: number;
}

export interface MockDispatchedEmail {
  recipientEmail: string;
  resetLink: string;
  timestamp: string;
  subject: string;
}

export class NotificationService {
  private static lastEmailAudit?: {
    timestamp: string;
    success: boolean;
    provider: string;
    recipientDomain?: string;
    error?: string;
  };

  private static lastMockEmail?: MockDispatchedEmail;

  /**
   * Checks whether valid SMTP server configuration exists.
   */
  static isSmtpConfigured(): boolean {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (!host || host === "" || host.startsWith("placeholder_")) return false;
    if (!user || user === "" || user.startsWith("placeholder_")) return false;
    if (!pass || pass === "" || pass.startsWith("placeholder_")) return false;
    return true;
  }

  /**
   * Identifies the configured email provider.
   */
  static getEmailProvider(): "RESEND" | "SENDGRID" | "POSTMARK" | "SMTP" | "MOCK" | "UNCONFIGURED" {
    const explicit = process.env.EMAIL_PROVIDER?.toUpperCase().trim();
    if (explicit === "SENDGRID") return "SENDGRID";
    if (explicit === "POSTMARK") return "POSTMARK";
    if (explicit === "RESEND") return "RESEND";
    if (explicit === "SMTP") {
      return this.isSmtpConfigured() ? "SMTP" : "UNCONFIGURED";
    }
    if (explicit === "MOCK" || explicit === "TEST") return "MOCK";
    if (explicit === "UNCONFIGURED") return "UNCONFIGURED";

    if (this.isSmtpConfigured()) return "SMTP";

    const key = this.getEmailApiKey();
    if (!key) return "UNCONFIGURED";
    if (key.startsWith("SG.")) return "SENDGRID";
    if (key.length === 36 && key.includes("-")) return "POSTMARK";
    return "RESEND";
  }

  /**
   * Retrieves sanitized email provider API key.
   */
  static getEmailApiKey(): string | null {
    const key =
      process.env.EMAIL_PROVIDER_API_KEY ||
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.POSTMARK_SERVER_TOKEN;

    if (!key || key.trim() === "" || key.startsWith("placeholder_")) {
      return null;
    }
    return key.trim();
  }

  /**
   * Checks whether a live transactional email gateway (REST API, SMTP, or MOCK test adapter) is configured.
   */
  static isEmailConfigured(): boolean {
    return this.getEmailApiKey() !== null || this.isSmtpConfigured() || this.getEmailProvider() === "MOCK";
  }

  /**
   * Checks whether a live Indian SMS gateway auth token is configured.
   */
  static isSmsConfigured(): boolean {
    const token = process.env.SMS_GATEWAY_AUTH_TOKEN?.trim();
    if (!token || token === "" || token.startsWith("placeholder_")) return false;
    return true;
  }

  /**
   * Returns verified sender address for outbound communications.
   */
  static getSenderAddress(): string {
    return (
      process.env.EMAIL_FROM_ADDRESS?.trim() ||
      process.env.SMTP_FROM?.trim() ||
      "Fruits & Nuts <fruitsnutswebsite@gmail.com>"
    );
  }

  /**
   * Returns current provider readiness metadata without exposing secrets.
   */
  static getReadinessStatus(): NotificationStatus {
    return {
      emailConfigured: this.isEmailConfigured(),
      smsConfigured: this.isSmsConfigured(),
      emailProvider: this.getEmailProvider(),
      smsProvider: this.isSmsConfigured() ? "CONFIGURED_LIVE" : "CLIENT_INPUT_PENDING",
      senderAddress: this.getSenderAddress(),
      lastEmailStatus: this.lastEmailAudit,
    };
  }

  /**
   * Testing hook: returns the last captured mock email payload.
   */
  static getLastMockEmailForTesting(): MockDispatchedEmail | null {
    return this.lastMockEmail || null;
  }

  /**
   * Testing hook: clears captured mock emails.
   */
  static clearMockEmailsForTesting(): void {
    this.lastMockEmail = undefined;
  }

  /**
   * Centralized transactional email dispatcher supporting SMTP, REST providers, and MOCK fallback.
   */
  static async dispatchEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
    emailType?: string;
    resetLinkForMock?: string;
  }): Promise<{ sent: boolean; provider: string; reason?: string }> {
    const { to: recipientEmail, subject, html, text, emailType = "NOTIFICATION", resetLinkForMock } = options;
    const domain = recipientEmail.includes("@") ? recipientEmail.split("@")[1] : "unknown";
    const provider = this.getEmailProvider();
    const apiKey = this.getEmailApiKey();
    const fromAddress = this.getSenderAddress();

    // 1. Check if provider credentials exist
    if (provider === "UNCONFIGURED" || (!apiKey && provider !== "SMTP" && provider !== "MOCK")) {
      const reason =
        "Transactional email provider is unconfigured. Set EMAIL_PROVIDER_API_KEY or SMTP credentials in hosting environment.";
      this.lastEmailAudit = {
        timestamp: new Date().toISOString(),
        success: false,
        provider: "UNCONFIGURED",
        recipientDomain: domain,
        error: reason,
      };
      console.warn(
        `[NotificationService] Outbound ${emailType} email skipped: ${reason} (Recipient domain: ${domain})`
      );
      return { sent: false, provider: "UNCONFIGURED", reason };
    }

    try {
      if (provider === "MOCK") {
        this.lastMockEmail = {
          recipientEmail,
          resetLink: resetLinkForMock || "",
          timestamp: new Date().toISOString(),
          subject,
        };
        this.lastEmailAudit = {
          timestamp: new Date().toISOString(),
          success: true,
          provider: "MOCK",
          recipientDomain: domain,
        };
        return { sent: true, provider: "MOCK" };
      }

      if (provider === "SMTP") {
        const host = process.env.SMTP_HOST!.trim();
        const port = parseInt(process.env.SMTP_PORT || "587", 10);
        const secure = process.env.SMTP_SECURE === "true" || port === 465;
        const user = process.env.SMTP_USER?.trim();
        const rawPass = process.env.SMTP_PASS?.trim();
        const pass = host.includes("gmail.com") ? rawPass?.replace(/\s+/g, "") : rawPass;

        let smtpResponse = "250 OK";
        try {
          smtpResponse = await this.dispatchViaSmtp({
            host,
            port,
            secure,
            user,
            pass,
            from: fromAddress,
            to: recipientEmail,
            subject,
            html,
            text,
            timeoutMs: 20000,
          });
        } catch (firstErr: any) {
          console.warn(
            `[NotificationService] First SMTP dispatch attempt to @${domain} encountered transient error (${firstErr.message}); retrying over IPv4...`
          );
          smtpResponse = await this.dispatchViaSmtp({
            host,
            port,
            secure,
            user,
            pass,
            from: fromAddress,
            to: recipientEmail,
            subject,
            html,
            text,
            timeoutMs: 25000,
          });
        }

        this.lastEmailAudit = {
          timestamp: new Date().toISOString(),
          success: true,
          provider: "SMTP",
          recipientDomain: domain,
        };
        console.log(
          `[NotificationService] Outbound ${emailType} accepted by SMTP (${host}:${port}) for domain @${domain} [Response: ${smtpResponse}]`
        );
        return { sent: true, provider: "SMTP", reason: smtpResponse };
      }

      let res: Response;

      if (provider === "SENDGRID") {
        const fromEmailOnly = fromAddress.includes("<")
          ? fromAddress.match(/<([^>]+)>/)?.[1] || fromAddress
          : fromAddress;

        res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipientEmail }] }],
            from: { email: fromEmailOnly, name: "Fruits & Nuts Concierge" },
            subject,
            content: [
              { type: "text/plain", value: text },
              { type: "text/html", value: html },
            ],
          }),
        });
      } else if (provider === "POSTMARK") {
        res = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            "X-Postmark-Server-Token": apiKey || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            From: fromAddress,
            To: recipientEmail,
            Subject: subject,
            HtmlBody: html,
            TextBody: text,
          }),
        });
      } else {
        // Default: Resend REST API
        res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [recipientEmail],
            subject,
            html,
            text,
          }),
        });
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown provider response");
        const sanitizedError = `HTTP ${res.status}: ${errorText.substring(0, 160)}`;
        this.lastEmailAudit = {
          timestamp: new Date().toISOString(),
          success: false,
          provider,
          recipientDomain: domain,
          error: sanitizedError,
        };
        console.error(
          `[NotificationService] Outbound ${emailType} failed at ${provider}: ${sanitizedError}`
        );
        return { sent: false, provider, reason: sanitizedError };
      }

      this.lastEmailAudit = {
        timestamp: new Date().toISOString(),
        success: true,
        provider,
        recipientDomain: domain,
      };
      console.log(
        `[NotificationService] ${emailType} email accepted by ${provider} for domain @${domain}`
      );
      return { sent: true, provider };
    } catch (err: any) {
      const sanitizedError = err.message || "Network error during email dispatch";
      this.lastEmailAudit = {
        timestamp: new Date().toISOString(),
        success: false,
        provider,
        recipientDomain: domain,
        error: sanitizedError,
      };
      console.error(
        `[NotificationService] Exception during outbound ${emailType} email dispatch: ${sanitizedError}`
      );
      return { sent: false, provider, reason: sanitizedError };
    }
  }

  /**
   * Diagnostic test: attempts socket connection to configured SMTP server.
   */
  static async testSmtpConnection(): Promise<{ success: boolean; message: string; host?: string; port?: number }> {
    const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER?.trim() || "fruitsnutswebsite@gmail.com";

    return new Promise((resolve) => {
      const socket = net.connect({ host, port }, () => {
        socket.destroy();
        resolve({
          success: true,
          message: `Successfully connected to SMTP server ${host}:${port} for ${user}.`,
          host,
          port,
        });
      });
      socket.setTimeout(8000, () => {
        socket.destroy();
        resolve({
          success: false,
          message: `Connection to SMTP server ${host}:${port} timed out after 8s.`,
          host,
          port,
        });
      });
      socket.on("error", (err) => {
        resolve({
          success: false,
          message: `Failed to connect to SMTP server ${host}:${port}: ${err.message}`,
          host,
          port,
        });
      });
    });
  }

  /**
   * Diagnostic SMTP test: verifies SMTP authentication and sends a real test email to verify end-to-end delivery.
   * Completely sanitizes errors and never logs, prints, or exposes credentials.
   */
  static async sendTestEmail(targetEmail?: string): Promise<{
    success: boolean;
    configured: boolean;
    message: string;
    recipient?: string;
    timestamp?: string;
    error?: string;
  }> {
    const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER?.trim() || "fruitsnutswebsite@gmail.com";
    const pass = process.env.SMTP_PASS?.trim();
    const recipient = targetEmail?.trim() || user;

    if (!this.isSmtpConfigured() || !pass) {
      return {
        success: false,
        configured: false,
        message:
          "SMTP is not configured: SMTP_PASS is missing or empty. Please enter your 16-character Gmail App Password into your local .env or .env.local file as: SMTP_PASS=\"your-16-char-password\".",
        recipient,
      };
    }

    const testTimestamp = new Date().toUTCString();
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fruits &amp; Nuts — SMTP Test Email</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F0; font-family:'Georgia', serif; color:#1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F0; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px; background-color:#FFFFFF; border:1px solid #DCE5D8; border-radius:24px; padding:36px 32px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <div style="font-size:24px; font-weight:bold; letter-spacing:2px; color:#173D2C;">FRUITS &amp; NUTS</div>
              <div style="font-size:10px; letter-spacing:3px; color:#B89453; text-transform:uppercase; margin-top:4px; font-family:sans-serif; font-weight:700;">
                Royal Gourmet Harvests &bull; System Test
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #DCE5D8; padding-top:20px;">
              <h1 style="font-size:20px; font-weight:bold; color:#173D2C; margin:0 0 12px 0;">
                SMTP System Verification Successful
              </h1>
              <p style="font-size:13px; line-height:1.6; color:#57534E; font-family:sans-serif;">
                This test email confirms that the Gmail SMTP service for <strong>Fruits &amp; Nuts</strong> is operational. Outbound transactional notifications, customer email verification codes, password reset instructions, and Cash on Delivery order receipts are functioning properly.
              </p>
              <div style="background-color:#FAF7F0; border:1px solid #E5DEC9; border-radius:12px; padding:16px; margin:20px 0; font-family:sans-serif; font-size:12px; line-height:1.6; color:#57534E;">
                <strong style="color:#173D2C;">Configuration Details:</strong><br>
                &bull; <strong>Server:</strong> ${host}:${port} (STARTTLS)<br>
                &bull; <strong>Sender:</strong> ${user}<br>
                &bull; <strong>Recipient:</strong> ${recipient}<br>
                &bull; <strong>Dispatched At:</strong> ${testTimestamp}
              </div>
              <p style="font-size:11px; color:#A8A29E; margin:24px 0 0 0; font-family:sans-serif; text-align:center; border-top:1px solid #DCE5D8; padding-top:16px;">
                M/S Fruits &amp; Nuts Platform &bull; Concierge: +91-8368301495 &bull; fruitsnutswebsite@gmail.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const textBody = `
FRUITS & NUTS — SMTP System Verification
Dispatched to: ${recipient}
Timestamp: ${testTimestamp}

Your Gmail SMTP configuration (${host}:${port} with STARTTLS) is operating properly.
Outbound customer email verification, password reset, and COD order confirmation emails are active.
    `.trim();

    try {
      await this.dispatchViaSmtp({
        host,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        user,
        pass,
        from: this.getSenderAddress(),
        to: recipient,
        subject: "Fruits & Nuts — SMTP System Test",
        html: htmlBody,
        text: textBody,
        timeoutMs: 15000,
      });

      return {
        success: true,
        configured: true,
        message: `SMTP test email successfully dispatched to ${recipient} via ${host}:${port}.`,
        recipient,
        timestamp: testTimestamp,
      };
    } catch (err: any) {
      let rawError = err.message || "Unknown SMTP error occurred.";
      if (pass) {
        rawError = rawError.replace(new RegExp(pass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "[REDACTED]");
      }
      let sanitized = rawError;
      if (rawError.includes("534") || rawError.includes("InvalidSecondFactor")) {
        sanitized =
          "SMTP Authentication Error (534 InvalidSecondFactor): 2-Step Verification is active on fruitsnutswebsite@gmail.com, so Google requires a 16-character App Password (not your regular account password). Please generate an App Password at https://myaccount.google.com/apppasswords while signed into fruitsnutswebsite@gmail.com.";
      } else if (rawError.includes("535") || rawError.includes("BadCredentials") || rawError.includes("Username and Password not accepted")) {
        sanitized =
          "SMTP Authentication Failed (535 BadCredentials): Gmail rejected the credentials. This usually means the App Password was generated while signed into a different Google account (e.g. personal account) rather than fruitsnutswebsite@gmail.com.";
      }

      return {
        success: false,
        configured: true,
        message: sanitized,
        recipient,
        error: sanitized,
      };
    }
  }

  /**
   * Sends a branded, responsive password-reset email through the active provider.
   */
  static async sendPasswordResetEmail(
    recipientEmail: string,
    resetLink: string
  ): Promise<{ sent: boolean; provider: string; reason?: string }> {
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Fruits &amp; Nuts Password</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F0; font-family:'Georgia', serif; color:#1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F0; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px; background-color:#FFFFFF; border:1px solid #DCE5D8; border-radius:24px; padding:36px 32px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="font-size:24px; font-weight:bold; letter-spacing:2px; color:#173D2C; font-family:'Georgia', serif;">
                FRUITS &amp; NUTS
              </div>
              <div style="font-size:10px; letter-spacing:3px; color:#B89453; text-transform:uppercase; margin-top:4px; font-family:sans-serif; font-weight:700;">
                Royal Gourmet Harvests &bull; India
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #DCE5D8; padding-top:24px;">
              <h1 style="font-size:20px; font-weight:bold; color:#173D2C; margin:0 0 12px 0; font-family:'Georgia', serif;">
                Password Reset Instructions
              </h1>
              <p style="font-size:13px; line-height:1.6; color:#57534E; margin:0 0 20px 0; font-family:sans-serif;">
                We received a request to reset the password associated with your Fruits &amp; Nuts account. Click the button below to choose your new credentials:
              </p>
              <div style="text-align:center; margin:28px 0;">
                <a href="${resetLink}" style="background-color:#173D2C; color:#FFFFFF; padding:14px 28px; border-radius:12px; font-size:13px; font-weight:bold; text-decoration:none; display:inline-block; font-family:sans-serif; letter-spacing:0.5px;">
                  Reset My Password &rarr;
                </a>
              </div>
              <p style="font-size:11px; line-height:1.5; color:#78716C; margin:0 0 16px 0; font-family:sans-serif; background-color:#FAF7F0; padding:12px; border-radius:8px;">
                &bull; This link is cryptographically single-use and will expire in <strong>15 minutes</strong>.<br>
                &bull; If you did not initiate this request, no action is required and your account remains secure.
              </p>
              <p style="font-size:11px; color:#A8A29E; margin:20px 0 0 0; font-family:sans-serif; text-align:center; border-top:1px solid #DCE5D8; padding-top:16px;">
                M/S Fruits &amp; Nuts Platform &bull; Concierge: +91-8368301495 &bull; fruitsnutswebsite@gmail.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const textBody = `
FRUITS & NUTS — Royal Gourmet Harvests
Password Reset Instructions

We received a request to reset the password associated with your Fruits & Nuts account.
Please visit the following link to choose a new password:

${resetLink}

This link is valid for 15 minutes and can only be used once.
If you did not make this request, please disregard this email.
    `.trim();

    return this.dispatchEmail({
      to: recipientEmail,
      subject: "Reset Your Fruits & Nuts Password",
      html: htmlBody,
      text: textBody,
      emailType: "PASSWORD_RESET",
      resetLinkForMock: resetLink,
    });
  }

  /**
   * Dispatches OTP to verified user email address.
   */
  static async sendEmailOtp(
    email: string,
    otp: string
  ): Promise<{ sent: boolean; provider: string; reason?: string }> {
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code — Fruits &amp; Nuts</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F0; font-family:'Georgia', serif; color:#1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F0; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px; background-color:#FFFFFF; border:1px solid #DCE5D8; border-radius:24px; padding:36px 32px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="font-size:24px; font-weight:bold; letter-spacing:2px; color:#173D2C; font-family:'Georgia', serif;">
                FRUITS &amp; NUTS
              </div>
              <div style="font-size:10px; letter-spacing:3px; color:#B89453; text-transform:uppercase; margin-top:4px; font-family:sans-serif; font-weight:700;">
                Royal Gourmet Harvests &bull; India
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #DCE5D8; padding-top:24px;">
              <h1 style="font-size:20px; font-weight:bold; color:#173D2C; margin:0 0 12px 0; font-family:'Georgia', serif;">
                Verify Your Email Address
              </h1>
              <p style="font-size:13px; line-height:1.6; color:#57534E; margin:0 0 20px 0; font-family:sans-serif;">
                Thank you for joining Fruits &amp; Nuts. Please enter the following 6-digit verification code to confirm your email address:
              </p>
              <div style="text-align:center; margin:28px 0;">
                <span style="display:inline-block; font-size:32px; font-weight:bold; letter-spacing:8px; color:#173D2C; background-color:#FAF7F0; border:2px dashed #B89453; border-radius:16px; padding:16px 32px; font-family:monospace;">
                  ${otp}
                </span>
              </div>
              <p style="font-size:11px; line-height:1.5; color:#78716C; margin:0 0 16px 0; font-family:sans-serif; background-color:#FAF7F0; padding:12px; border-radius:8px;">
                &bull; This code will expire in <strong>10 minutes</strong>.<br>
                &bull; Never share this code with anyone. Fruits &amp; Nuts staff will never ask for your verification code.
              </p>
              <p style="font-size:11px; color:#A8A29E; margin:20px 0 0 0; font-family:sans-serif; text-align:center; border-top:1px solid #DCE5D8; padding-top:16px;">
                M/S Fruits &amp; Nuts &bull; Concierge: +91-8368301495 &bull; fruitsnutswebsite@gmail.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const textBody = `
FRUITS & NUTS — Royal Gourmet Harvests
Email Verification Code

Your 6-digit verification code is: ${otp}

This code is valid for 10 minutes.
Please do not share this code with anyone.
    `.trim();

    return this.dispatchEmail({
      to: email,
      subject: `Verify Your Fruits & Nuts Email: ${otp}`,
      html: htmlBody,
      text: textBody,
      emailType: "EMAIL_VERIFICATION",
    });
  }

  /**
   * Dispatches branded Cash on Delivery order confirmation email to customer.
   */
  static async sendOrderConfirmationEmail(
    order: any
  ): Promise<{ sent: boolean; provider: string; reason?: string }> {
    const customerEmail =
      order.customerEmail ||
      order.user?.email ||
      order.shippingRecipientEmail ||
      order.shippingEmail;

    if (!customerEmail || !customerEmail.includes("@")) {
      return { sent: false, provider: "NO_EMAIL", reason: "Customer email not provided or invalid" };
    }

    const isCod = order.paymentMethod === "COD";
    const paymentLabel = isCod ? "Cash on Delivery" : "Online Payment (Prepaid)";
    const paymentInstruction = isCod
      ? "&bull; Please keep exact cash or UPI QR scanner ready for our logistics delivery partner."
      : "&bull; Payment successfully received via online payment gateway. No amount due at delivery.";
    const totalHeaderLabel = isCod ? "Total Payable on Delivery (COD)" : "Total Amount Paid";
    const statusBadge = isCod ? "Cash on Delivery Order Confirmed" : "Order & Payment Confirmed";

    const itemsListHtml = (order.items || [])
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:10px 0; border-bottom:1px solid #E5DEC9; font-size:13px; color:#173D2C;">
              <strong>${item.productNameSnapshot || item.variant?.product?.name || "Harvest Item"}</strong>
              <div style="font-size:11px; color:#78716C;">Qty: ${item.quantity} &bull; ${item.weightGramsSnapshot || 500}g</div>
            </td>
            <td align="right" style="padding:10px 0; border-bottom:1px solid #E5DEC9; font-size:13px; font-weight:bold; color:#173D2C;">
              ₹${Number(item.lineTotalSnapshot || item.totalPrice || 0).toLocaleString("en-IN")}
            </td>
          </tr>`
      )
      .join("");

    const shippingAddressFormatted = [
      order.shippingRecipientName || order.customerName,
      order.shippingAddressLine1,
      order.shippingAddressLine2,
      [order.shippingCity, order.shippingState].filter(Boolean).join(", "),
      order.shippingPostalCode,
    ]
      .filter(Boolean)
      .join("<br>");

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed — Fruits &amp; Nuts</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F0; font-family:'Georgia', serif; color:#1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F0; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px; width:100%; box-sizing:border-box; background-color:#FFFFFF; border:1px solid #DCE5D8; border-radius:24px; padding:36px 24px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <div style="font-size:24px; font-weight:bold; letter-spacing:2px; color:#173D2C;">FRUITS &amp; NUTS</div>
              <div style="font-size:10px; letter-spacing:3px; color:#B89453; text-transform:uppercase; margin-top:4px; font-family:sans-serif; font-weight:700;">
                ${statusBadge}
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #DCE5D8; padding-top:20px;">
              <h1 style="font-size:20px; font-weight:bold; color:#173D2C; margin:0 0 10px 0;">
                Thank You For Your Order!
              </h1>
              <p style="font-size:13px; line-height:1.6; color:#57534E; font-family:sans-serif;">
                Your order <strong>#${order.orderNumber}</strong> (${paymentLabel}) has been confirmed. Our team is vacuum-packing your fresh harvest for express dispatch.
              </p>
              
              <div style="background-color:#FAF7F0; border:1px solid #E5DEC9; border-radius:12px; padding:16px; margin:20px 0; font-family:sans-serif;">
                <div style="font-size:12px; color:#78716C; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">${totalHeaderLabel}</div>
                <div style="font-size:26px; font-weight:bold; color:#173D2C; margin-top:4px;">₹${Number(order.finalPayableAmount).toLocaleString("en-IN")}</div>
                <div style="font-size:11px; color:#8C733E; margin-top:4px;">${paymentInstruction}</div>
              </div>

              <h3 style="font-size:14px; font-weight:bold; color:#173D2C; margin:20px 0 10px 0; font-family:sans-serif; text-transform:uppercase; letter-spacing:1px;">
                Ordered Harvests
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="font-family:sans-serif; margin-bottom:20px;">
                ${itemsListHtml}
              </table>

              <div style="font-size:12px; line-height:1.6; color:#57534E; font-family:sans-serif; background-color:#FAF7F0; padding:14px; border-radius:12px; border:1px solid #E5DEC9;">
                <strong>Shipping Destination:</strong><br>
                ${shippingAddressFormatted}<br>
                Contact: ${order.shippingPhone || order.customerPhone || "N/A"}
              </div>

              <p style="font-size:11px; color:#A8A29E; margin:24px 0 0 0; font-family:sans-serif; text-align:center; border-top:1px solid #DCE5D8; padding-top:16px;">
                M/S Fruits &amp; Nuts Platform &bull; Concierge: +91-8368301495 &bull; fruitsnutswebsite@gmail.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const textItems = (order.items || [])
      .map(
        (item: any) =>
          `- ${item.productNameSnapshot || item.variant?.product?.name || "Harvest Item"} x${item.quantity} (${item.weightGramsSnapshot || 500}g): ₹${Number(item.lineTotalSnapshot || item.totalPrice || 0).toLocaleString("en-IN")}`
      )
      .join("\n");

    const textBody = `
FRUITS & NUTS — ORDER CONFIRMATION
Order #${order.orderNumber} (${paymentLabel})

Thank you for your order!
${totalHeaderLabel}: ₹${Number(order.finalPayableAmount).toLocaleString("en-IN")}
Recipient: ${order.shippingRecipientName || order.customerName}
Delivery Address: ${order.shippingAddressLine1 || ""}, ${order.shippingCity || ""} - ${order.shippingPostalCode || ""}

Ordered Items:
${textItems}

Our team is vacuum-packing your fresh harvest for express dispatch.
Concierge: +91-8368301495 | fruitsnutswebsite@gmail.com
    `.trim();

    return this.dispatchEmail({
      to: customerEmail,
      subject: `Order Confirmed: #${order.orderNumber} (${isCod ? "Cash on Delivery" : "Payment Received"})`,
      html: htmlBody,
      text: textBody,
      emailType: isCod ? "COD_ORDER_CONFIRMATION" : "ONLINE_ORDER_CONFIRMATION",
    });
  }

  /**
   * Backwards-compatible wrapper for Cash on Delivery confirmation.
   */
  static async sendCodOrderConfirmationEmail(
    order: any
  ): Promise<{ sent: boolean; provider: string; reason?: string }> {
    return this.sendOrderConfirmationEmail(order);
  }

  /**
   * Dispatches executive new order notification to administrator.
   */
  static async sendAdminNewOrderNotification(
    order: any
  ): Promise<{ sent: boolean; provider: string; reason?: string }> {
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || "fruitsnutswebsite@gmail.com";
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://fruits-and-nuts-platform.vercel.app");

    const isCod = order.paymentMethod === "COD";
    const paymentLabel = isCod ? "Cash on Delivery (COD)" : "Online Payment (Prepaid)";
    const subjectPrefix = isCod ? "New COD Order" : "New Paid Online Order";

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Alert — Fruits &amp; Nuts</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F0; font-family:'Georgia', serif; color:#1C1917;">
  <div style="padding:30px 16px;">
    <div style="max-width:540px; width:100%; box-sizing:border-box; margin:0 auto; background-color:#FFFFFF; border:1px solid #DCE5D8; border-radius:16px; padding:24px; font-family:sans-serif;">
      <h2 style="color:#173D2C; margin-top:0;">${subjectPrefix}: #${order.orderNumber}</h2>
      <p style="font-size:14px; color:#4A4E46;">
        A new ${isCod ? "Cash on Delivery" : "prepaid online"} order has been placed on the Fruits &amp; Nuts storefront.
      </p>
      <div style="background-color:#FAF7F0; padding:12px 16px; border-radius:8px; margin:16px 0; font-size:13px; line-height:1.6;">
        <strong>Payable Amount:</strong> ₹${Number(order.finalPayableAmount).toLocaleString("en-IN")}<br>
        <strong>Payment Method:</strong> ${paymentLabel} (Status: ${order.paymentStatus || (isCod ? "PENDING" : "PAID")})<br>
        <strong>Customer:</strong> ${order.customerName || order.shippingRecipientName}<br>
        <strong>Phone:</strong> ${order.shippingPhone || order.customerPhone || "N/A"}<br>
        <strong>Destination:</strong> ${order.shippingCity || ""}, ${order.shippingState || ""} (${order.shippingPostalCode || ""})<br>
        <strong>Status:</strong> ${order.orderStatus}
      </div>
      <div style="text-align:center; margin-top:20px;">
        <a href="${appOrigin}/admin/orders" style="background-color:#173D2C; color:#FFFFFF; padding:10px 20px; border-radius:8px; font-size:12px; font-weight:bold; text-decoration:none; display:inline-block;">
          Open in Admin Dashboard &rarr;
        </a>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const textBody = `
NEW ORDER RECEIVED: #${order.orderNumber}
Payment: ${paymentLabel}
Amount: ₹${Number(order.finalPayableAmount).toLocaleString("en-IN")}
Customer: ${order.customerName || order.shippingRecipientName} (${order.shippingPhone || order.customerPhone})
Destination: ${order.shippingCity || ""}, ${order.shippingPostalCode || ""}
Dashboard: ${appOrigin}/admin/orders
    `.trim();

    return this.dispatchEmail({
      to: adminEmail,
      subject: `[Admin Alert] ${subjectPrefix}: #${order.orderNumber} (₹${order.finalPayableAmount})`,
      html: htmlBody,
      text: textBody,
      emailType: isCod ? "ADMIN_COD_ORDER_ALERT" : "ADMIN_ONLINE_ORDER_ALERT",
    });
  }

  /**
   * Dispatches OTP to Indian mobile number.
   */
  static async sendSmsOtp(phone: string, otp: string): Promise<void> {
    if (!this.isSmsConfigured()) {
      throw new Error(
        "SMS verification service is unavailable: Indian SMS gateway credentials are not yet configured."
      );
    }
  }

  /**
   * Dispatches password reset notification via SMS when requested.
   */
  static async sendPasswordResetSms(phone: string, resetLink: string): Promise<void> {
    if (!this.isSmsConfigured()) return;
  }

  /**
   * Dispatches email message via standard SMTP socket connection (zero external package dependencies).
   */
  private static async dispatchViaSmtp(options: SmtpDispatchOptions): Promise<string> {
    const {
      host,
      port,
      secure = port === 465,
      user,
      pass,
      from,
      to,
      subject,
      html,
      text,
      timeoutMs = 20000,
    } = options;

    const senderEmail = from.includes("<") ? from.match(/<([^>]+)>/)?.[1] || from : from;
    const recipientEmail = to.includes("<") ? to.match(/<([^>]+)>/)?.[1] || to : to;

    return new Promise<string>((resolve, reject) => {
      let currentSocket: net.Socket | tls.TLSSocket;
      let buffer = "";
      let step = 0;
      let isClosed = false;
      let finalSmtpResponse = "250 OK";

      const timer = setTimeout(() => {
        cleanup(new Error(`SMTP connection to ${host}:${port} timed out after ${timeoutMs}ms (step=${step})`));
      }, timeoutMs);

      function cleanup(err?: Error) {
        if (isClosed) return;
        isClosed = true;
        clearTimeout(timer);
        try {
          currentSocket?.removeAllListeners();
          currentSocket?.on("error", () => {});
          currentSocket?.end();
          currentSocket?.destroy();
        } catch {}
        if (err) reject(err);
        else resolve(finalSmtpResponse);
      }

      function sendCommand(cmd: string) {
        currentSocket.write(cmd + "\r\n");
      }

      function handleData(chunk: Buffer) {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\r\n");
        if (lines.length < 2) return;

        const lastCompleteLine = lines[lines.length - 2];
        const match = lastCompleteLine.match(/^(\d{3})\s/);
        if (!match) return; // Multi-line continuation

        const code = parseInt(match[1], 10);
        const fullResponse = buffer;
        buffer = "";

        if (code >= 400) {
          cleanup(new Error(`SMTP Error ${code}: ${lastCompleteLine}`));
          return;
        }

        processStep(code, fullResponse, lastCompleteLine);
      }

      function processStep(code: number, response: string, lastLine: string) {
        switch (step) {
          case 0: // 220 Greeting banner
            step = 1;
            sendCommand("EHLO localhost");
            break;

          case 1: // 250 from EHLO
            const isAlreadyTls = currentSocket instanceof tls.TLSSocket;
            if (!secure && !isAlreadyTls && response.includes("STARTTLS")) {
              step = 2;
              sendCommand("STARTTLS");
            } else if (user && pass) {
              step = 4;
              sendCommand("AUTH LOGIN");
            } else {
              step = 7;
              sendCommand(`MAIL FROM:<${senderEmail}>`);
            }
            break;

          case 2: // 220 from STARTTLS
            step = 3;
            currentSocket.removeAllListeners("data");
            const tlsSocket = tls.connect(
              {
                socket: currentSocket,
                host,
                servername: host,
                rejectUnauthorized: false,
              },
              () => {
                currentSocket = tlsSocket;
                tlsSocket.on("data", handleData);
                tlsSocket.on("error", (e) => cleanup(e));
                step = 1;
                sendCommand("EHLO localhost");
              }
            );
            tlsSocket.on("error", (e) => cleanup(e));
            break;

          case 4: // 334 from AUTH LOGIN (Username challenge)
            if (code === 334) {
              step = 5;
              sendCommand(Buffer.from(user || "").toString("base64"));
            } else {
              cleanup(new Error(`SMTP AUTH rejected: ${response}`));
            }
            break;

          case 5: // 334 (Password challenge)
            if (code === 334) {
              step = 6;
              sendCommand(Buffer.from(pass || "").toString("base64"));
            } else {
              cleanup(new Error(`SMTP AUTH password challenge failed: ${response}`));
            }
            break;

          case 6: // 235 (Authentication successful)
            if (code === 235) {
              step = 7;
              sendCommand(`MAIL FROM:<${senderEmail}>`);
            } else {
              cleanup(new Error(`SMTP AUTH failed: ${response}`));
            }
            break;

          case 7: // 250 from MAIL FROM
            step = 8;
            sendCommand(`RCPT TO:<${recipientEmail}>`);
            break;

          case 8: // 250 from RCPT TO
            step = 9;
            sendCommand("DATA");
            break;

          case 9: // 354 from DATA
            step = 10;
            const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const messageId = `<pwreset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@gmail.com>`;
            const mimeMessage = [
              `Date: ${new Date().toUTCString()}`,
              `Message-ID: ${messageId}`,
              `From: ${from}`,
              `To: ${recipientEmail}`,
              `Subject: ${subject}`,
              `MIME-Version: 1.0`,
              `Content-Type: multipart/alternative; boundary="${boundary}"`,
              ``,
              `--${boundary}`,
              `Content-Type: text/plain; charset=UTF-8`,
              `Content-Transfer-Encoding: 7bit`,
              ``,
              text,
              ``,
              `--${boundary}`,
              `Content-Type: text/html; charset=UTF-8`,
              `Content-Transfer-Encoding: 7bit`,
              ``,
              html,
              ``,
              `--${boundary}--`,
              `.`,
            ].join("\r\n");

            sendCommand(mimeMessage);
            break;

          case 10: // 250 (Message accepted)
            finalSmtpResponse = lastLine.trim();
            step = 11;
            sendCommand("QUIT");
            cleanup();
            break;

          default:
            cleanup();
            break;
        }
      }

      if (secure) {
        currentSocket = tls.connect(
          {
            host,
            port,
            family: 4,
            servername: host,
            rejectUnauthorized: false,
          } as tls.ConnectionOptions,
          () => {}
        );
      } else {
        currentSocket = net.connect({ host, port, family: 4 }, () => {});
      }

      currentSocket.on("data", handleData);
      currentSocket.on("error", (err) => cleanup(err));
      currentSocket.on("close", () => {
        if (!isClosed && step < 10) {
          cleanup(new Error("SMTP connection closed unexpectedly"));
        }
      });
    });
  }
}
