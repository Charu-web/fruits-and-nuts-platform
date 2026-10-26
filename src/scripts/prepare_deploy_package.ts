import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const publicDir = path.join(root, "public");
const staticDir = path.join(root, ".next", "static");
const cacheDir = path.join(root, "node_modules", ".cache");

console.log("=== PREPARING DEPLOYMENT BUNDLE ===");

// 1. Copy public directory into standalone
const destPublic = path.join(standaloneDir, "public");
if (!fs.existsSync(destPublic)) {
  fs.mkdirSync(destPublic, { recursive: true });
}
console.log("Copying public assets to standalone/public...");
execSync(`xcopy /E /I /Y /Q "${publicDir}" "${destPublic}"`, { stdio: "inherit" });

// 2. Copy .next/static into standalone/.next/static
const destStatic = path.join(standaloneDir, ".next", "static");
if (!fs.existsSync(destStatic)) {
  fs.mkdirSync(destStatic, { recursive: true });
}
console.log("Copying .next/static to standalone/.next/static...");
execSync(`xcopy /E /I /Y /Q "${staticDir}" "${destStatic}"`, { stdio: "inherit" });

// 3. Copy cached product catalog & orders
const destCache = path.join(standaloneDir, "node_modules", ".cache");
if (!fs.existsSync(destCache)) {
  fs.mkdirSync(destCache, { recursive: true });
}
console.log("Copying persistent product and order caches...");
if (fs.existsSync(path.join(cacheDir, "fruits-nuts-dev-products.json"))) {
  fs.copyFileSync(
    path.join(cacheDir, "fruits-nuts-dev-products.json"),
    path.join(destCache, "fruits-nuts-dev-products.json")
  );
}
if (fs.existsSync(path.join(cacheDir, "fruits-nuts-dev-orders.json"))) {
  fs.copyFileSync(
    path.join(cacheDir, "fruits-nuts-dev-orders.json"),
    path.join(destCache, "fruits-nuts-dev-orders.json")
  );
}

// 4. Copy .env.local if exists
if (fs.existsSync(path.join(root, ".env.local"))) {
  fs.copyFileSync(path.join(root, ".env.local"), path.join(standaloneDir, ".env.local"));
}

console.log("Creating deploy.tar.gz archive...");
const archivePath = path.join(root, "deploy_fruitsandnuts.tar.gz");
if (fs.existsSync(archivePath)) {
  fs.unlinkSync(archivePath);
}

// Use tar (Windows 10/11 built-in)
execSync(`tar -czf "${archivePath}" -C "${standaloneDir}" .`, { stdio: "inherit" });

const stats = fs.statSync(archivePath);
console.log(`Bundle created successfully: ${archivePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
