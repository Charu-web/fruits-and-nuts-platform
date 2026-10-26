import { PrismaClient, RoleType } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import readline from "readline";

const ADMIN_EMAIL = "fruitsnutswebsite@gmail.com";

function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one numeric digit (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one special character (!@#$%^&*...)." };
  }
  return { isValid: true };
}

async function promptPassword(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter private initial password for fruitsnutswebsite@gmail.com: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("=================================================================");
  console.log("M/S FRUITS & NUTS — SUPER ADMINISTRATOR INITIAL SETUP");
  console.log(`Target Admin Email: ${ADMIN_EMAIL}`);
  console.log("=================================================================\n");

  let rawPassword = process.argv[2]?.trim() || process.env.ADMIN_INITIAL_PASSWORD?.trim();

  if (!rawPassword) {
    rawPassword = await promptPassword();
  }

  if (!rawPassword) {
    console.error("❌ Error: No password provided. Please supply a password via argument or ADMIN_INITIAL_PASSWORD.");
    process.exit(1);
  }

  const check = validatePasswordStrength(rawPassword);
  if (!check.isValid) {
    console.error(`❌ Password does not meet security policy: ${check.message}`);
    process.exit(1);
  }

  console.log("🔒 Generating cryptographic Bcrypt salt (12 rounds)...");
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  // 1. Persist to PostgreSQL if connected
  const prisma = new PrismaClient();
  let dbSuccess = false;
  try {
    await prisma.$connect();

    // Ensure role exists
    await prisma.role.upsert({
      where: { id: RoleType.SUPER_ADMIN },
      update: {},
      create: {
        id: RoleType.SUPER_ADMIN,
        name: "Super Administrator",
        description: "Unrestricted imperial system, financial, and catalog control",
      },
    });

    // Upsert admin user
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        passwordHash,
        roleId: RoleType.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: ADMIN_EMAIL,
        passwordHash,
        roleId: RoleType.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            firstName: "Super",
            lastName: "Administrator",
          },
        },
      },
    });

    console.log("✅ Super Admin credentials saved to PostgreSQL database.");
    dbSuccess = true;
  } catch (dbErr: any) {
    console.warn(`⚠️ PostgreSQL offline or unreachable (${dbErr.message}).`);
    console.log("ℹ️ Storing credentials securely in local environment file for development fallback.");
  } finally {
    await prisma.$disconnect();
  }

  // 2. Persist hash in .env.local
  const envFileName = ".env.local";
  const envFilePath = path.resolve(process.cwd(), envFileName);
  try {
    let content = "";
    if (fs.existsSync(envFilePath)) {
      content = fs.readFileSync(envFilePath, "utf-8");
    }

    // Single quotes prevent Next.js from performing variable expansion on $ prefixes in bcrypt hashes
    const hashEntry = `INITIAL_ADMIN_PASSWORD_HASH='${passwordHash}'`;
    if (content.includes("INITIAL_ADMIN_PASSWORD_HASH=")) {
      content = content.replace(/INITIAL_ADMIN_PASSWORD_HASH=.*(\r?\n|$)/g, `${hashEntry}\n`);
    } else {
      content += `\n# Authoritative Super Admin Password Hash (fruitsnutswebsite@gmail.com)\n${hashEntry}\n`;
    }

    fs.writeFileSync(envFilePath, content, "utf-8");
    console.log(`✅ Saved INITIAL_ADMIN_PASSWORD_HASH securely in ${envFileName}.`);
  } catch (fsErr: any) {
    console.warn(`⚠️ Could not update ${envFileName}:`, fsErr.message);
  }

  console.log("\n=================================================================");
  console.log("ADMIN SETUP COMPLETED SUCCESSFULLY!");
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log("Role:     SUPER_ADMIN");
  console.log(`Database: ${dbSuccess ? "Synchronized" : "Local Environment Fallback Active"}`);
  console.log("=================================================================");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
