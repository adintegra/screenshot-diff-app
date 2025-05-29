import { Page } from 'playwright';
import { writeFile, readdir, unlink } from 'fs/promises';
import path from 'path';

export async function takeFullPageScreenshot(page: Page) {
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Get the full page height
  const fullHeight = await page.evaluate(() => {
    return Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.clientHeight
    );
  });

  // Set viewport to full page height
  await page.setViewportSize({
    width: 1280, // Standard width
    height: fullHeight
  });

  // Scroll to the bottom to ensure all lazy-loaded content is loaded
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // Wait a bit for any lazy-loaded content
  await page.waitForTimeout(1000);

  // Take the screenshot with fullPage option
  return await page.screenshot({
    fullPage: true,
    path: undefined // We'll handle the file writing separately
  });
}

export function generateFilename(url: string, prefix: string = 'screenshot'): string {
  const now = new Date();
  const dateStr = now.toISOString()
    .replace('T', '-')
    .replace(/:/g, '-')
    .split('.')[0];

  // Create a URL-friendly name by removing protocol and special characters
  const urlName = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();

  return `${prefix}-${dateStr}-${urlName}.png`;
}

export async function saveScreenshot(screenshotBuffer: Buffer, filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'public', filename);
  await writeFile(filePath, screenshotBuffer);
  return `/${filename}`;
}

export async function findMostRecentScreenshot(url: string): Promise<string | null> {
  const screenshotsDir = path.join(process.cwd(), 'public');
  const files = await readdir(screenshotsDir);

  // Create a URL-friendly version of the input URL for matching
  const urlPattern = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();

  // Filter for screenshots of this URL and sort by timestamp
  const urlScreenshots = files
    .filter(file => {
      const isScreenshot = file.startsWith('screenshot-') && file.endsWith('.png');
      const containsUrl = file.includes(urlPattern);
      console.log(`Checking file: ${file}`);
      console.log(`- Is screenshot: ${isScreenshot}`);
      console.log(`- Contains URL pattern: ${containsUrl}`);
      console.log(`- URL pattern: ${urlPattern}`);
      return isScreenshot && containsUrl;
    })
    .sort((a, b) => {
      // Extract timestamps from filenames
      const timestampA = a.split('-').slice(1, 6).join('-');
      const timestampB = b.split('-').slice(1, 6).join('-');
      return timestampB.localeCompare(timestampA); // Sort descending
    });

  console.log(`Found ${urlScreenshots.length} matching screenshots for ${url}`);
  if (urlScreenshots.length > 0) {
    console.log(`Most recent: ${urlScreenshots[0]}`);
  }

  return urlScreenshots.length > 0 ? urlScreenshots[0] : null;
}

export async function cleanupOldScreenshots(retentionDays: number = 7): Promise<void> {
  const screenshotsDir = path.join(process.cwd(), 'public');
  const files = await readdir(screenshotsDir);

  const now = new Date();
  const retentionDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));

  for (const file of files) {
    if (file.startsWith('screenshot-') && file.endsWith('.png')) {
      try {
        // Extract timestamp from filename (format: screenshot-YYYY-MM-DD-HH-mm-ss-url.png)
        const timestampStr = file.split('-').slice(1, 7).join('-');
        const fileDate = new Date(timestampStr.replace(/-/g, ':'));

        if (fileDate < retentionDate) {
          const filePath = path.join(screenshotsDir, file);
          await unlink(filePath);
          console.log(`Deleted old screenshot: ${file}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  }
}