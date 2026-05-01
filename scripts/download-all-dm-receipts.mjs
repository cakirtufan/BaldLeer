import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DM_PURCHASES_URL = "https://account.dm.de/purchases";

const SESSION_DIR = path.join(process.cwd(), ".playwright-dm-session");
const OUT_DIR = path.join(process.cwd(), "data", "dm-receipts");
const LOG_OUT = path.join(OUT_DIR, "download-all-log.json");
const LINKS_OUT = path.join(OUT_DIR, "purchase-detail-links.json");

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

function absoluteUrl(href) {
  try {
    return new URL(href, DM_PURCHASES_URL).toString();
  } catch {
    return null;
  }
}

async function saveLog() {
  await fs.writeFile(LOG_OUT, JSON.stringify(downloadLog, null, 2), "utf-8");
}

async function attachDownloadHandlers(page) {
  page.on("download", async (download) => {
    try {
      const suggested = download.suggestedFilename() || "dm-receipt.pdf";
      const filename = safeFilename(`${timestamp()}_${suggested}`);
      const targetPath = path.join(OUT_DIR, filename);

      await download.saveAs(targetPath);

      downloadLog.push({
        type: "download",
        savedAs: targetPath,
        suggestedFilename: suggested,
        pageUrl: page.url(),
        time: new Date().toISOString(),
      });

      await saveLog();

      console.log("Saved receipt:", targetPath);
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

      if (!looksLikePdf) return;
      if (capturedPdfUrls.has(url)) return;

      capturedPdfUrls.add(url);

      const body = await response.body();

      if (!body || body.length < 1000) return;

      const filename = safeFilename(`${timestamp()}_dm-receipt-from-response.pdf`);
      const targetPath = path.join(OUT_DIR, filename);

      await fs.writeFile(targetPath, body);

      downloadLog.push({
        type: "pdf-response",
        savedAs: targetPath,
        url,
        pageUrl: page.url(),
        time: new Date().toISOString(),
      });

      await saveLog();

      console.log("Saved PDF response:", targetPath);
    } catch {
      // ignore unreadable responses
    }
  });
}

async function clickPossibleLoadMoreButtons(page) {
  for (let i = 0; i < 12; i++) {
    const button = page
      .getByRole("button", {
        name: /mehr|weitere|anzeigen|laden|ältere|aeltere|mehr anzeigen|weitere anzeigen/i,
      })
      .first();

    try {
      if ((await button.count()) === 0) break;
      if (!(await button.isVisible())) break;

      console.log("Clicking possible load-more button...");
      await button.click();
      await page.waitForTimeout(1800);
    } catch {
      break;
    }
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let previousHeight = 0;
      let sameHeightCounter = 0;

      const timer = window.setInterval(() => {
        window.scrollBy(0, 900);

        const currentHeight = document.body.scrollHeight;

        if (currentHeight === previousHeight) {
          sameHeightCounter += 1;
        } else {
          sameHeightCounter = 0;
        }

        previousHeight = currentHeight;

        if (sameHeightCounter >= 5) {
          window.clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}

async function collectPurchaseDetailLinks(page) {
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));

    return anchors
      .map((a) => ({
        href: a.getAttribute("href"),
        text: (a.textContent || "").replace(/\s+/g, " ").trim(),
      }))
      .filter((item) => item.href);
  });

  const normalized = [];

  for (const link of links) {
    const url = absoluteUrl(link.href);
    if (!url) continue;

    const lower = url.toLowerCase();

    const looksLikePurchaseDetail =
      lower.includes("/purchases/") ||
      lower.includes("/purchase/") ||
      lower.includes("purchaseid") ||
      lower.includes("receipt") ||
      lower.includes("ebon");

    const isNotOnlyListPage =
      url.replace(/\/$/, "") !== DM_PURCHASES_URL.replace(/\/$/, "");

    if (looksLikePurchaseDetail && isNotOnlyListPage) {
      normalized.push({
        url,
        text: link.text,
      });
    }
  }

  const uniqueByUrl = new Map();

  for (const item of normalized) {
    uniqueByUrl.set(item.url, item);
  }

  return Array.from(uniqueByUrl.values());
}

async function tryClickReceiptDownload(page) {
  const downloadNameRegex =
    /bon|kassenbon|rechnung|beleg|pdf|download|herunterladen|ebon|e-bon/i;

  const candidates = [
    page.getByRole("link", { name: downloadNameRegex }).first(),
    page.getByRole("button", { name: downloadNameRegex }).first(),
    page.locator("a[href*='.pdf']").first(),
    page.locator("a[href*='receipt']").first(),
    page.locator("a[href*='bon']").first(),
    page.locator("a[href*='invoice']").first(),
    page.locator("a[href*='download']").first(),
  ];

  for (const locator of candidates) {
    try {
      if ((await locator.count()) === 0) continue;
      if (!(await locator.isVisible())) continue;

      console.log("Clicking possible receipt download button/link...");

      const beforeCount = downloadLog.length;

      await locator.click();
      await page.waitForTimeout(3000);

      const afterCount = downloadLog.length;

      if (afterCount > beforeCount) {
        return true;
      }

      // Sometimes clicking opens a new PDF tab or triggers a response handler.
      return true;
    } catch {
      continue;
    }
  }

  return false;
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

  browser.on("page", async (newPage) => {
    await attachDownloadHandlers(newPage);
  });

  const page = await browser.newPage();
  await attachDownloadHandlers(page);

  console.log("");
  console.log("Opening dm purchases page:");
  console.log(DM_PURCHASES_URL);
  console.log("");

  await page.goto(DM_PURCHASES_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("If needed, log in manually in the opened browser.");
  console.log("Then make sure you are on the purchases / Meine Einkäufe page.");
  console.log("");

  const rl = readline.createInterface({ input, output });
  await rl.question("Press ENTER when the purchases list is visible...");
  rl.close();

  console.log("");
  console.log("Trying to load all visible purchases...");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await clickPossibleLoadMoreButtons(page);
  await autoScroll(page);
  await page.waitForTimeout(2000);

  console.log("");
  console.log("Collecting purchase detail links...");
  const detailLinks = await collectPurchaseDetailLinks(page);

  await fs.writeFile(LINKS_OUT, JSON.stringify(detailLinks, null, 2), "utf-8");

  console.log(`Found ${detailLinks.length} possible purchase detail link(s).`);
  console.log(`Saved link list to: ${LINKS_OUT}`);
  console.log("");

  if (detailLinks.length === 0) {
    console.log("No purchase detail links were found automatically.");
    console.log("This can happen if dm renders purchases as buttons instead of links.");
    console.log("");
    console.log("In that case, use the previous manual download-catcher script for now:");
    console.log("node scripts/catch-dm-receipt-downloads.mjs");
    console.log("");
    await browser.close();
    return;
  }

  for (let i = 0; i < detailLinks.length; i++) {
    const item = detailLinks[i];

    console.log("");
    console.log(`Processing ${i + 1}/${detailLinks.length}`);
    console.log(item.url);

    try {
      const detailPage = await browser.newPage();
      await attachDownloadHandlers(detailPage);

      await detailPage.goto(item.url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await detailPage.waitForLoadState("networkidle").catch(() => undefined);
      await detailPage.waitForTimeout(1500);

      const clicked = await tryClickReceiptDownload(detailPage);

      downloadLog.push({
        type: "detail-page-processed",
        url: item.url,
        clickedDownloadCandidate: clicked,
        text: item.text,
        time: new Date().toISOString(),
      });

      await saveLog();

      await detailPage.waitForTimeout(1000);
      await detailPage.close();

      // Be polite. Do not hammer the site.
      await page.waitForTimeout(1200);
    } catch (error) {
      console.error("Could not process detail page:", item.url);
      console.error(error.message);

      downloadLog.push({
        type: "error",
        url: item.url,
        error: error.message,
        time: new Date().toISOString(),
      });

      await saveLog();
    }
  }

  console.log("");
  console.log("Finished.");
  console.log("Receipts should be saved in:");
  console.log(OUT_DIR);
  console.log("");
  console.log("Log file:");
  console.log(LOG_OUT);
  console.log("");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});