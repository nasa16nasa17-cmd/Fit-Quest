import { Resend } from 'resend';
import { admin, adminDb as db } from './firebase-admin';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  templateName: string;
}

/**
 * Sends an email using Resend and logs the result to Firestore.
 * Implements basic retry logic for resilience.
 */
export async function sendEmail(options: EmailOptions, retryCount = 0): Promise<{ success: boolean; id?: string; error?: any }> {
const { to, subject, html, templateName } = options;

  try {
    const data = await resend.emails.send({
      from: 'FITQUEST <notifications@fitquest.app>', // Replace with verified domain in production
      to,
      subject,
      html,
    });

    if (data.error) {
      throw data.error;
    }

    // Log success
    await db.collection('email_logs').add({
      recipient: Array.isArray(to) ? to.join(', ') : to,
      subject,
      template: templateName,
      status: 'sent',
      resendId: data.data?.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error(`Email sending failed (Attempt ${retryCount + 1}):`, error);

    // Retry logic (max 3 attempts)
    if (retryCount < 2) {
      return sendEmail(options, retryCount + 1);
    }

    // Log failure after all retries
    await db.collection('email_logs').add({
      recipient: Array.isArray(to) ? to.join(', ') : to,
      subject,
      template: templateName,
      status: 'failed',
      error: error.message || JSON.stringify(error),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: false, error };
  }
}
