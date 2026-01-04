import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendWorkflowSMS(
  config: { to: string[]; message?: string },
  variables?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate Twilio credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables.'
      };
    }

    // Replace variables in message using {{variable}} syntax
    let message = config.message || '';

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    // Validate recipients
    if (!config.to || config.to.length === 0) {
      return { success: false, error: 'No recipients specified' };
    }

    // Validate phone numbers (E.164 format recommended)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const invalidNumbers = config.to.filter(num => !phoneRegex.test(num.trim()));

    if (invalidNumbers.length > 0) {
      return {
        success: false,
        error: `Invalid phone number format: ${invalidNumbers.join(', ')}. Use E.164 format (e.g., +12345678900)`
      };
    }

    // Send SMS to all recipients
    const results = await Promise.allSettled(
      config.to.map(async (recipient) => {
        return twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: recipient.trim(),
        });
      })
    );

    // Check if any messages failed
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      const errorMessages = failures
        .map(f => (f as PromiseRejectedResult).reason?.message || 'Unknown error')
        .join('; ');

      if (failures.length === results.length) {
        // All failed
        return { success: false, error: `Failed to send SMS: ${errorMessages}` };
      } else {
        // Partial success
        return {
          success: true,
          error: `Some messages failed: ${errorMessages}`
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending workflow SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';
    return { success: false, error: errorMessage };
  }
}
