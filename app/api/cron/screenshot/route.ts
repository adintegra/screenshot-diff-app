import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { takeFullPageScreenshot, generateFilename, saveScreenshot, findMostRecentScreenshot, cleanupOldScreenshots } from '@/app/lib/screenshot';
import { createVisualDiff, generateDiffFilename } from '@/app/lib/diff';
import { sendChangeNotification } from '@/app/lib/email';

// This route is protected by Vercel Cron and should not be publicly accessible
export const dynamic = 'force-dynamic';
// Remove edge runtime as it's not compatible with Playwright
// export const runtime = 'edge';

// Get change threshold from environment variable, default to 10 if not set
const CHANGE_THRESHOLD = parseFloat(process.env.CHANGE_THRESHOLD || '10');
// Get retention days from environment variable, default to 7 if not set
const RETENTION_DAYS = parseInt(process.env.SCREENSHOT_RETENTION_DAYS || '7');

export async function GET(request: Request) {
  // Check for manual test secret key
  const url = new URL(request.url);
  const testKey = url.searchParams.get('testKey');
  const cronSecret = process.env.CRON_SECRET;

  // Allow access if it's a Vercel Cron request or has the correct test key
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const isManualTest = testKey === cronSecret;

  if (!isVercelCron && !isManualTest) {
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 401 }
    );
  }

  const browser = await chromium.launch();
  const results = [];

  try {
    // Clean up old screenshots first
    console.log(`Cleaning up screenshots older than ${RETENTION_DAYS} days...`);
    await cleanupOldScreenshots(RETENTION_DAYS);

    // Get URLs from environment variables
    const urls = process.env.SCREENSHOT_URLS?.split(',') || [];
    if (urls.length === 0) {
      return NextResponse.json({ error: 'No URLs configured' }, { status: 400 });
    }

    for (const url of urls) {
      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle' });

        // Take screenshot
        const screenshotBuffer = await takeFullPageScreenshot(page);
        const filename = generateFilename(url);
        const path = await saveScreenshot(screenshotBuffer, filename);

        console.log(`Saved new screenshot: ${filename}`);

        // Find previous screenshot
        const previousScreenshot = await findMostRecentScreenshot(url);
        console.log(`Previous screenshot found: ${previousScreenshot}`);

        if (previousScreenshot) {
          // Create diff
          const diffFilename = generateDiffFilename(previousScreenshot, filename);
          console.log(`Creating diff between ${previousScreenshot} and ${filename}`);

          const diffResult = await createVisualDiff(
            `public/${previousScreenshot}`,
            `public/${filename}`,
            diffFilename
          );

          // Check if change exceeds threshold
          if (diffResult.diffPercentage > CHANGE_THRESHOLD) {
            console.log(`Change threshold exceeded: ${diffResult.diffPercentage}% > ${CHANGE_THRESHOLD}%`);
            await sendChangeNotification(url, diffResult.diffPercentage, diffResult.path);
          } else {
            console.log(`Change within threshold: ${diffResult.diffPercentage}% <= ${CHANGE_THRESHOLD}%`);
          }

          results.push({
            url,
            screenshot: path,
            previousScreenshot,
            diff: diffResult,
            notificationSent: diffResult.diffPercentage > CHANGE_THRESHOLD
          });
        } else {
          console.log(`No previous screenshot found for ${url}`);
          results.push({
            url,
            screenshot: path,
            previousScreenshot: null,
            diff: null,
            notificationSent: false
          });
        }

        await page.close();
      } catch (error) {
        results.push({
          url,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
}