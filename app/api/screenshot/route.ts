import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { takeFullPageScreenshot, generateFilename, saveScreenshot } from '@/app/lib/screenshot';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a reasonable timeout for page load
    page.setDefaultTimeout(30000);

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take the full page screenshot
    const screenshotBuffer = await takeFullPageScreenshot(page);
    await browser.close();

    const filename = generateFilename(url);
    const path = await saveScreenshot(screenshotBuffer, filename);

    return NextResponse.json({ path });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}