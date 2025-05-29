import { NextResponse } from 'next/server';
import { sendChangeNotification } from '@/app/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check for manual test secret key
    const url = new URL(request.url);
    const testKey = url.searchParams.get('testKey');
    const cronSecret = process.env.CRON_SECRET;

    if (testKey !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Test data
    const testUrl = 'https://example.com';
    const testDiffPercentage = 15.5;
    const testDiffPath = '/diff-test.png';

    console.log('Sending test email notification...');
    await sendChangeNotification(testUrl, testDiffPercentage, testDiffPath);
    console.log('Test email sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        to: process.env.NOTIFICATION_EMAIL,
        from: process.env.SMTP_FROM,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        details: {
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER ? 'configured' : 'missing',
          smtpPass: process.env.SMTP_PASS ? 'configured' : 'missing',
          smtpFrom: process.env.SMTP_FROM,
          notificationEmail: process.env.NOTIFICATION_EMAIL
        }
      },
      { status: 500 }
    );
  }
}