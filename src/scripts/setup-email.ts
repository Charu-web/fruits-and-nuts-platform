import fs from "fs";
import path from "path";
import readline from "readline";

const ENV_LOCAL_PATH = path.resolve(process.cwd(), ".env.local");

function promptAppPassword(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "Enter your 16-character Google App Password for fruitsnutswebsite@gmail.com (spaces are stripped automatically): ",
      (answer) => {
        rl.close();
        resolve(answer.replace(/\s+/g, "").trim());
      }
    );
  });
}

async function main() {
  console.log("=================================================================");
  console.log("FRUITS & NUTS — LOCAL GMAIL SMTP APP PASSWORD SETUP");
  console.log("Target File: .env.local (Ignored by Git)");
  console.log("=================================================================\n");

  const sanitizedPass = await promptAppPassword();

  if (!sanitizedPass) {
    console.error("❌ No password entered. .env.local was not modified.");
    process.exit(1);
  }

  let content = "";
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    content = fs.readFileSync(ENV_LOCAL_PATH, "utf-8");
  }

  if (content.includes("SMTP_PASS=")) {
    content = content.replace(/SMTP_PASS=.*(\r?\n|$)/g, `SMTP_PASS="${sanitizedPass}"\n`);
  } else {
    content += `\nSMTP_PASS="${sanitizedPass}"\n`;
  }

  fs.writeFileSync(ENV_LOCAL_PATH, content, "utf-8");
  console.log(`\n✅ Saved SMTP_PASS (${sanitizedPass.length} characters, redacted) to .env.local.`);
  console.log("👉 Next step: Run `npm run email:test` or tell the assistant you have saved the file.");
}

main().catch((err) => {
  console.error("Setup error:", err.message);
  process.exit(1);
});
