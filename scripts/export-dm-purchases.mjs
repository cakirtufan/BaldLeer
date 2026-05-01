import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DM_PURCHASES_URL = "https://account.dm.de/purchases";

const SESSION_DIR = path.join(process.cwd(), ".playwright-dm-session");
const OUT_DIR = path.join(process.cwd(), "data", "dm-receipts");
const LOG_OUT = path.join(OUT_DIR, "download-log.json");

const downloadLog = [];
const capturedPdfUrls = new Set();

function safeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 180);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function attachHandlers(page) {
  page.on("download", async (download) => {
    try {
      const suggested = download.suggestedFilename();
      const filename = safeFilename(`${timestamp()}_${suggested || "dm-receipt.pdf"}`);
      const targetPath = path.join(OUT_DIR, filename);

      await download.saveAs(targetPath);

      const entry = {
        type: "download",
        savedAs: targetPath,
        suggestedFilename: suggested,
        pageUrl: page.url(),
        time: new Date().toISOString(),
      };

      downloadLog.push(entry);
      await fs.writeFile(LOG_OUT, JSON.stringify(downloadLog, null, 2), "utf-8");

      console.log("");
      console.log("Saved receipt download:");
      console.log(targetPath);
      console.log("");
    } catch (error) {
      console.error("Could not save download:", error);
    }
  });

  page.on("response", async (response) => {
    try {
      const url = response.url();
      const contentType = response.headers()["content-type"] || "";

      const looksLikePdf =
        contentType.toLowerCase().includes("application/pdf") ||
        url.toLowerCase().includes(".pdf");

      if (!looksLikePdf) {
        return;
      }

      if (capturedPdfUrls.has(url)) {
        return;
      }

      capturedPdfUrls.add(url);

      const body = await response.body();

      if (!body || body.length < 1000) {
        return;
      }

      const filename = safeFilename(`${timestamp()}_dm-receipt-from-response.pdf`);
      const targetPath = path.join(OUT_DIR, filename);

      await fs.writeFile(targetPath, body);

      const entry = {
        type: "pdf-response",
        savedAs: targetPath,
        url,
        pageUrl: page.url(),
        time: new Date().toISOString(),
      };

      downloadLog.push(entry);
      await fs.writeFile(LOG_OUT, JSON.stringify(downloadLog, null, 2), "utf-8");

      console.log("");
      console.log("Saved PDF response:");
      console.log(targetPath);
      console.log("");
    } catch {
      // Some responses cannot be read; ignore.
    }
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false,
    acceptDownloads: true,
    viewport: {
      width: 1400,
      height: 1000,
    },
  });

  browser.on("page", async (page) => {
    await attachHandlers(page);
  });

  const page = await browser.newPage();
  await attachHandlers(page);

  console.log("");
  console.log("Opening dm purchases page...");
  console.log(DM_PURCHASES_URL);
  console.log("");

  await page.goto(DM_PURCHASES_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("");
  console.log("Now use the opened browser normally:");
  console.log("1. Log in to dm if needed.");
  console.log("2. Open Meine Einkäufe / purchases.");
  console.log("3. Click one purchase.");
  console.log("4. Click the receipt/eBon download button.");
  console.log("");
  console.log("Every downloaded receipt should be saved automatically to:");
  console.log(OUT_DIR);
  console.log("");
  console.log("When you are finished, come back here and press ENTER.");
  console.log("");

  const rl = readline.createInterface({ input, output });
  await rl.question("Press ENTER to stop the script...");
  rl.close();

  await fs.writeFile(LOG_OUT, JSON.stringify(downloadLog, null, 2), "utf-8");

  console.log("");
  console.log("Finished.");
  console.log("Saved receipts are in:");
  console.log(OUT_DIR);
  console.log("");
  console.log("Download log:");
  console.log(LOG_OUT);
  console.log("");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});