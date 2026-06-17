import nodemailer from 'nodemailer';

const SENDER_NAME = 'AI Freight Audit';
const SENDER_EMAIL = 'mikeabrsh21@gmail.com';

function getTransport() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SENDER_EMAIL, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.log('GMAIL_APP_PASSWORD not configured — email not sent.');
    return false;
  }
  try {
    await transport.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error('Gmail send failed:', err);
    return false;
  }
}
