import { Resend } from 'resend'

// Lazy initialisation — avoids build-time errors when RESEND_API_KEY is absent
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

interface SendPlanEmailOptions {
  to: string
  dogName: string
  planUrl: string
}

export async function sendPlanEmail({ to, dogName, planUrl }: SendPlanEmailOptions): Promise<void> {
  await getResend().emails.send({
    from: 'Alex @ PawPlan <hello@mypawcraft.com>',
    to,
    subject: `${dogName}'s 30-day training plan is ready 🐾`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1C1C1A;">
        <div style="background: #1A6B4A; padding: 32px 40px; border-radius: 12px 12px 0 0;">
          <p style="font-family: Georgia, serif; font-size: 22px; color: white; margin: 0; font-weight: 600;">
            PawPlan
          </p>
        </div>
        <div style="background: #F9F7F3; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid rgba(28,28,26,0.1);">
          <p style="font-size: 16px; color: #4A4A44; line-height: 1.6; margin-top: 0;">Hey,</p>
          <p style="font-size: 16px; color: #4A4A44; line-height: 1.6;">
            ${dogName}'s personalised 30-day training plan is ready. It includes a temperament
            diagnostic, a full day-by-day programme, breed-specific mistakes to avoid,
            and a weekly progress checklist.
          </p>
          <p style="font-size: 16px; color: #4A4A44; line-height: 1.6;">
            Start with Day 1 today — even 5 minutes makes a difference.
          </p>
          <div style="text-align: center; margin: 36px 0;">
            <a href="${planUrl}"
               style="display: inline-block; background: #1A6B4A; color: white; text-decoration: none;
                      padding: 16px 36px; border-radius: 99px; font-size: 16px; font-weight: 500;">
              View ${dogName}'s Plan →
            </a>
          </div>
          <p style="font-size: 13px; color: #7A7A72; line-height: 1.6; margin-bottom: 0;">
            You can return to this link any time — it won't expire.<br>
            Questions? Reply to this email and we'll help you out.<br><br>
            — Alex @ PawPlan
          </p>
        </div>
      </div>
    `,
  })
}
