import { Resend } from 'resend'
import { ResultAsync } from 'neverthrow';
import { AppError, integrationError } from './errors';

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLinkEmail(email: string, url: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: 'Sign in to ZeitFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #a3e635; margin: 0;">ZeitFlow</h1>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Sign in to your account</h2>
          
          <p style="color: #666; margin-bottom: 30px;">
            Click the button below to sign in to your ZeitFlow account. This link will expire in 24 hours.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background-color: #a3e635; color: #18181b; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                      display: inline-block;">
              Sign In to ZeitFlow
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn't request this sign-in link, you can safely ignore this email.
          </p>
          
          <p style="color: #999; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${url}" style="color: #a3e635; word-break: break-all;">${url}</a>
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending magic link email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending magic link email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendWorkflowEmail(
  config: { to: string[]; subject?: string; message?: string; from?: string },
  variables?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Replace variables in template using {{variable}} syntax
    let subject = config.subject || 'Workflow Notification';
    let message = config.message || '';
    
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    const { error } = await resend.emails.send({
      from: config.from || process.env.RESEND_FROM_EMAIL!,
      to: config.to,
      subject,
      text: message, // Plain text only
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending workflow email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Type-safe workflow email using neverthrow ResultAsync.
 * Returns void on success, or an AppError on failure.
 */
export const sendWorkflowEmailSafe = (
  config: { to: string[]; subject?: string; message?: string; from?: string },
  variables?: Record<string, string>
): ResultAsync<void, AppError> => {
  return ResultAsync.fromPromise(
    (async () => {
      const result = await sendWorkflowEmail(config, variables);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
    })(),
    (error) =>
      integrationError(
        'email',
        error instanceof Error ? error.message : 'Email send failed',
        { recipients: config.to.length }
      )
  );
};