import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export async function sendChangeNotification(
  url: string,
  diffPercentage: number,
  diffImagePath: string
): Promise<void> {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  if (!config.host || !config.auth.user || !config.auth.pass) {
    throw new Error('SMTP configuration is incomplete');
  }

  const transporter = nodemailer.createTransport(config);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const diffImageUrl = `${baseUrl}${diffImagePath}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || config.auth.user,
    to: process.env.NOTIFICATION_EMAIL || '',
    subject: `Screenshot Change Alert: ${url}`,
    html: `
      <h2>Screenshot Change Alert</h2>
      <p>A significant change (${diffPercentage.toFixed(2)}%) was detected in the screenshot for:</p>
      <p><strong>${url}</strong></p>
      <p>View the diff image: <a href="${diffImageUrl}">${diffImageUrl}</a></p>
    `,
  });
}