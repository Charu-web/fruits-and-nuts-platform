import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load local environment files (.env.local has precedence over .env)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { NotificationService } from "../services/notification.service";

async function main() {
  console.log("=================================================================");
  console.log("M/S FRUITS & NUTS — GMAIL SMTP SYSTEM VERIFICATION");
  console.log("Target Admin Email: fruitsnutswebsite@gmail.com");
  console.log("=================================================================\n");

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = process.env.SMTP_PORT || "587";
  const secure = process.env.SMTP_SECURE || "false";
  const user = process.env.SMTP_USER || "fruitsnutswebsite@gmail.com";
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM_ADDRESS || `Fruits & Nuts <${user}>`;
  const activeProvider = NotificationService.getEmailProvider();

  console.log("📋 Current SMTP Configuration Profile:");
  console.log(`   • Provider:    ${activeProvider}`);
  console.log(`   • Host:        ${host}`);
  console.log(`   • Port:        ${port} (STARTTLS, secure=${secure})`);
  console.log(`   • Username:    ${user}`);
  console.log(`   • From:        ${from}`);
  console.log(`   • Credentials: ${pass && pass.length > 0 ? `Configured (${pass.length} characters, redacted)` : "NOT CONFIGURED (Empty)"}`);
  console.log("");

  // 1. Test TCP connection to verify network reachability
  console.log("▶ Step 1: Testing TCP socket connectivity to smtp.gmail.com:587...");
  const connResult = await NotificationService.testSmtpConnection();
  if (connResult.success) {
    console.log(`✅ Socket connectivity verified: ${connResult.message}\n`);
  } else {
    console.warn(`⚠️ Socket connection warning: ${connResult.message}\n`);
  }

  if (!pass || pass.trim() === "" || pass.startsWith("placeholder_")) {
    console.log("⚠️  STATUS: SMTP_PASS is currently empty or unconfigured.");
    console.log("-----------------------------------------------------------------");
    console.log("To activate live email dispatch, please enter your Gmail App Password:");
    console.log("1. Open your local `.env` or `.env.local` file in your editor.");
    console.log("2. Locate the line: SMTP_PASS=\"\"");
    console.log("3. Enter your 16-character Google App Password (without spaces):");
    console.log("   SMTP_PASS=\"your-16-char-app-password\"");
    console.log("4. Save the file and run:");
    console.log("   npm run email:test");
    console.log("-----------------------------------------------------------------");
    console.log("🔒 Security reminder: Never share or paste your App Password in chat.");
    return;
  }

  // 2. Dispatch real test email to fruitsnutswebsite@gmail.com
  console.log(`▶ Step 2: Attempting authenticated delivery to ${user}...`);
  const dispatchResult = await NotificationService.sendTestEmail(user);

  if (dispatchResult.success) {
    console.log("=================================================================");
    console.log("🎉 SUCCESS: LIVE TEST EMAIL DELIVERED TO GMAIL!");
    console.log(`   • Recipient: ${dispatchResult.recipient}`);
    console.log(`   • Timestamp: ${dispatchResult.timestamp}`);
    console.log("   • Status:    Message accepted by smtp.gmail.com (250 OK)");
    console.log("=================================================================");
    console.log("\nPlease check the inbox of fruitsnutswebsite@gmail.com to view the test email.");
  } else {
    console.log("=================================================================");
    console.log("❌ SMTP DISPATCH FAILED");
    console.log(`   • Error: ${dispatchResult.message}`);
    console.log("=================================================================");
  }
}

main().catch((err) => {
  console.error("Diagnostic execution error:", err.message);
  process.exit(1);
});
