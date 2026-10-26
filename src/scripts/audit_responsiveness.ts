import { spawn, ChildProcess } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

const VIEWPORTS = [
  { name: "320px (Compact Mobile)", width: 320, height: 640 },
  { name: "360px (Android Standard)", width: 360, height: 740 },
  { name: "375px (iPhone SE)", width: 375, height: 667 },
  { name: "390px (iPhone 12/13/14)", width: 390, height: 844 },
  { name: "414px (iPhone XR/Plus)", width: 414, height: 896 },
  { name: "430px (iPhone 14/15 Pro Max)", width: 430, height: 932 },
  { name: "768px (Tablet Portrait)", width: 768, height: 1024 },
  { name: "1024px (Tablet Landscape/Laptop)", width: 1024, height: 768 },
  { name: "1280px (Standard Desktop)", width: 1280, height: 800 },
  { name: "1440px (Large Display)", width: 1440, height: 900 },
];

const PAGES_TO_TEST = [
  { name: "Home", path: "/" },
  { name: "Shop All", path: "/shop" },
  { name: "Tea Category", path: "/category/tea" },
  { name: "Dry Fruits Category", path: "/category/dry-fruits" },
  { name: "Product Detail", path: "/product/kashmiri-mamra-almonds" },
  { name: "Cart", path: "/cart" },
  { name: "Checkout", path: "/checkout" },
  { name: "Customer Login", path: "/login" },
  { name: "Customer Register", path: "/register" },
  { name: "Account Profile", path: "/account/profile" },
  { name: "Admin Login", path: "/admin/login" },
];

const SCREENSHOT_DIR = path.join(
  "C:", "Users", "Asus", ".gemini", "antigravity", "brain",
  "7e140920-11b7-473c-a16f-195b7c6f7e0a", "screenshots", "pre_deployment_audit"
);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

class CDPClient {
  private ws: WebSocket;
  private idCounter = 1;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  async send(method: string, params: Record<string, any> = {}): Promise<any> {
    const id = this.idCounter++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function runAudit() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const port = 9333;
  const chromeProc: ChildProcess = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "about:blank",
  ]);

  console.log("Waiting for Chrome to initialize on port " + port + "...");
  let versionInfo: any = null;
  for (let i = 0; i < 20; i++) {
    try {
      versionInfo = await getJson(`http://127.0.0.1:${port}/json/version`);
      if (versionInfo && versionInfo.webSocketDebuggerUrl) {
        break;
      }
    } catch {}
    await wait(500);
  }

  if (!versionInfo?.webSocketDebuggerUrl) {
    console.error("Failed to connect to Chrome remote debugging port.");
    chromeProc.kill();
    process.exit(1);
  }

  const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find((t: any) => t.type === "page") || targets[0];
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  console.log("Connected to Chrome via CDP!");

  await client.send("Page.enable");
  await client.send("DOM.enable");

  const auditResults: Array<{
    page: string;
    viewport: string;
    width: number;
    scrollWidth: number;
    hasOverflow: boolean;
    overflowElements: string[];
    screenshotFile?: string;
  }> = [];

  for (const page of PAGES_TO_TEST) {
    const url = `http://localhost:3000${page.path}`;
    console.log(`\n========================================`);
    console.log(`Auditing Page: ${page.name} (${url})`);
    console.log(`========================================`);

    // Navigate to page
    await client.send("Page.navigate", { url });
    await wait(3000); // Allow Next.js page to render and hydrate

    for (const vp of VIEWPORTS) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });
      await wait(800);

      // Evaluate overflow
      const evalRes = await client.send("Runtime.evaluate", {
        expression: `
          (() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollW = document.documentElement.scrollWidth;
            const bodyScrollW = document.body ? document.body.scrollWidth : 0;
            const maxScrollW = Math.max(scrollW, bodyScrollW);
            const overflowing = [];

            const all = document.querySelectorAll('*');
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > docWidth + 1) {
                const tag = el.tagName.toLowerCase();
                const cls = (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 3).join('.') : '';
                const id = el.id ? '#' + el.id : '';
                overflowing.push(tag + id + (cls ? '.' + cls : '') + ' [w:' + Math.round(rect.width) + 'px, r:' + Math.round(rect.right) + 'px]');
                if (overflowing.length >= 5) break;
              }
            }

            return {
              docWidth,
              maxScrollW,
              hasOverflow: maxScrollW > docWidth + 1,
              overflowing
            };
          })()
        `,
        returnByValue: true,
      });

      const data = evalRes.result?.value || { docWidth: vp.width, maxScrollW: vp.width, hasOverflow: false, overflowing: [] };
      const hasOverflow = data.hasOverflow;
      
      console.log(`[${vp.name}] Target: ${vp.width}px | Actual: ${data.maxScrollW}px | Overflow: ${hasOverflow ? "FAIL ⚠️" : "PASS ✓"}`);
      if (hasOverflow && data.overflowing.length > 0) {
        console.log(`  -> Offending elements:`, data.overflowing);
      }

      // Capture screenshot for key viewports (320px, 390px, 768px, 1440px)
      let screenshotFilename = "";
      if ([320, 390, 768, 1440].includes(vp.width)) {
        const cleanPageName = page.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        screenshotFilename = `${cleanPageName}_${vp.width}px.png`;
        const ssRes = await client.send("Page.captureScreenshot", {
          format: "png",
          clip: {
            x: 0,
            y: 0,
            width: vp.width,
            height: Math.min(vp.height * 2, 1800),
            scale: 1,
          },
        });
        if (ssRes.data) {
          fs.writeFileSync(path.join(SCREENSHOT_DIR, screenshotFilename), Buffer.from(ssRes.data, "base64"));
        }
      }

      auditResults.push({
        page: page.name,
        viewport: vp.name,
        width: vp.width,
        scrollWidth: data.maxScrollW,
        hasOverflow,
        overflowElements: data.overflowing || [],
        screenshotFile: screenshotFilename || undefined,
      });
    }
  }

  client.close();
  chromeProc.kill();

  const summaryPath = path.join(SCREENSHOT_DIR, "audit_summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(auditResults, null, 2));

  console.log("\n========================================");
  console.log("RESPONSIVENESS AUDIT COMPLETE");
  console.log("Total Viewport Checks:", auditResults.length);
  const totalFailures = auditResults.filter((r) => r.hasOverflow);
  console.log("Total Overflow Failures:", totalFailures.length);
  console.log("Audit summary saved to:", summaryPath);
  console.log("========================================");
}

runAudit().catch(console.error);
