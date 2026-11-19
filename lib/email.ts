import { Resend } from 'resend'
import { SITE_EMAIL } from './site'

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
  // Resend reports a failed send in its return value instead of throwing
  const { error } = await getResend().emails.send({
    from: `Julian @ PawCraft <${SITE_EMAIL}>`,
    to,
    subject: `${dogName}'s 30-day training plan is ready 🐾`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1C1C1A;">
        <div style="background: #1A6B4A; padding: 32px 40px; border-radius: 12px 12px 0 0;">
          <p style="font-family: Georgia, serif; font-size: 22px; color: white; margin: 0; font-weight: 600;">
            PawCraft
          </p>
        </div>
        <div style="background: #F9F7F3; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid rgba(28,28,26,0.1);">
          <p style="font-size: 16px; color: #4A4A44; line-height: 1.6; margin-top: 0;">Hey,</p>
          <p style="font-size: 16px; color: #4A4A44; line-height: 1.6;">
            ${dogName}'s personalised 30-day training plan is ready. Every day has a short
            session with step-by-step exercises to tick off, and you can follow
            ${dogName}'s progress week by week.
          </p>
          <p style="font-size: 16px; color: #4A4A44; line-height: 1.6;">
            Start with Day 1 today — even 5 minutes makes a difference. From tomorrow
            you'll get one short email a day with that day's session; you can change
            the time or turn it off from the plan.
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
            — Julian @ PawCraft
          </p>
        </div>
      </div>
    `,
  })
  if (error) throw new Error(`plan email not sent: ${error.message}`)
}

interface PlanFailureAlertOptions {
  sessionId: string
  dogName: string | null
  customerEmail: string | null
  attempts: number
  error: string
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Internal alert, sent to our own mailbox (never to the customer): a paid plan
 * has failed every automatic retry and needs a person to look at it.
 */
export async function sendPlanFailureAlert({ sessionId, dogName, customerEmail, attempts, error }: PlanFailureAlertOptions): Promise<void> {
  const { error: sendError } = await getResend().emails.send({
    from: `PawCraft alerts <${SITE_EMAIL}>`,
    to: SITE_EMAIL,
    subject: `Action needed: a paid plan failed ${attempts} times`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1C1C1A;">
        <p>A paid plan could not be generated after ${attempts} attempts. Automatic retries have stopped.</p>
        <p>
          Dog: ${escapeHtml(dogName ?? 'unknown')}<br>
          Customer: ${escapeHtml(customerEmail ?? 'no email on file')}<br>
          Submission: ${escapeHtml(sessionId)}<br>
          Last error: ${escapeHtml(error)}
        </p>
        <p>To try again once the cause is fixed, set <code>plan_attempts</code> to 0 for this submission; the retry sweep picks it up within 5 minutes.</p>
      </div>
    `,
  })
  if (sendError) throw new Error(`failure alert not sent: ${sendError.message}`)
}
