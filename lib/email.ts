import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLinkEmail(email: string, url: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: 'Sign in to jjoist',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #a3e635; margin: 0;">jjoist</h1>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Sign in to your account</h2>
          
          <p style="color: #666; margin-bottom: 30px;">
            Click the button below to sign in to your jjoist account. This link will expire in 24 hours.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background-color: #a3e635; color: #18181b; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                      display: inline-block;">
              Sign In to jjoist
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