import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const testDir = path.join(process.cwd(), "src", "test");
const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith(".test.ts"));

console.log(`\n==============================================================================`);
console.log(`M/S FRUITS & NUTS — UNIFIED TEST SUITE RUNNER`);
console.log(`Found ${testFiles.length} automated test suites in src/test/`);
console.log(`==============================================================================\n`);

let passedCount = 0;
let failedCount = 0;
const results: { file: string; passed: boolean; durationMs: number; error?: string }[] = [];

for (const file of testFiles) {
  const filePath = path.join(testDir, file);
  process.stdout.write(`▶ Running ${file.padEnd(35)} `);
  const start = Date.now();
  try {
    execSync(`npx tsx "${filePath}"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });
    const duration = Date.now() - start;
    console.log(`✅ PASSED (${duration}ms)`);
    passedCount++;
    results.push({ file, passed: true, durationMs: duration });
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`❌ FAILED (${duration}ms)`);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    failedCount++;
    results.push({ file, passed: false, durationMs: duration, error: err.message });
  }
}

console.log(`\n==============================================================================`);
console.log(`AUDIT RESULTS: ${passedCount}/${testFiles.length} SUITES PASSED (${failedCount} failed)`);
console.log(`==============================================================================\n`);

if (failedCount > 0) {
  process.exit(1);
}
