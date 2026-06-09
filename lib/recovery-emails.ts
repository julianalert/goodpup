/**
 * Abandoned-cart recovery email templates (4-email sequence).
 * Each function returns { subject, previewText, html } ready for Resend.
 *
 * Timing (controlled by the cron job):
 *   Email 1 — 30 min after email captured
 *   Email 2 — 24 h
 *   Email 3 — 72 h
 *   Email 4 — 120 h  (last ever)
 */

export interface RecoveryEmailData {
  sessionId: string
  dogName: string
  dogBreed: string
  dogAge: string | null
  problems: string[]
  dailyTime: number | null
  living: string | null
  email: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PROBLEM_LABELS: Record<string, string> = {
  leash_pulling:    'leash pulling',
  recall:           "won't come when called",
  jumping:          'jumping on people',
  barking:          'excessive barking',
  aggression:       'reactivity',
  separation:       'separation anxiety',
  destruction:      'chewing / destructive behaviour',
  basic_obedience:  'basic obedience',
  potty:            'potty training',
  biting:           'biting / mouthing',
  stealing:         'stealing food',
  fearful:          'fear & anxiety',
}

const AGE_LABELS: Record<string, string> = {
  puppy_under6: 'puppy',
  puppy_6to12:  'young pup',
  adolescent:   'adolescent',
  adult:        'adult',
  senior:       'senior',
}

const LIVING_LABELS: Record<string, string> = {
  apartment:       'an apartment',
  house_no_garden: 'a house without a garden',
  house_garden:    'a house with a garden',
  rural:           'a rural setting',
}

function problemText(problems: string[]): string {
  const labels = problems.slice(0, 3).map((p) => PROBLEM_LABELS[p] ?? p)
  if (labels.length === 0) return 'their challenges'
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels[0]}, ${labels[1]}, and ${labels[2]}`
}

function primaryProblem(problems: string[]): string {
  return problems.length > 0 ? (PROBLEM_LABELS[problems[0]] ?? 'the behaviour issue') : 'the behaviour issue'
}

function ageText(dogAge: string | null): string {
  return dogAge ? (AGE_LABELS[dogAge] ?? dogAge) : 'dog'
}

function livingText(living: string | null): string {
  return living ? (LIVING_LABELS[living] ?? living) : ''
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://mypawcraft.com'
}

function orderUrl(sessionId: string): string {
  return `${getAppUrl()}/order?session_id=${encodeURIComponent(sessionId)}`
}

function unsubscribeUrl(sessionId: string): string {
  return `${getAppUrl()}/api/unsubscribe?session_id=${encodeURIComponent(sessionId)}`
}

// ── Shared layout wrappers ─────────────────────────────────────────────────

function emailShell(dogName: string, sessionId: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>PawCraft</title>
</head>
<body style="margin:0;padding:0;background:#F9F7F3;font-family:'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F9F7F3;">
  <tr><td align="center" style="padding:28px 16px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:520px;">

      <!-- HEADER -->
      <tr><td style="background:#1A6B4A;padding:22px 32px;border-radius:12px 12px 0 0;">
        <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:white;margin:0;font-weight:600;letter-spacing:-0.3px;">PawCraft</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:white;padding:32px 32px 24px;border-left:1px solid rgba(28,28,26,0.09);border-right:1px solid rgba(28,28,26,0.09);">
        ${bodyHtml}
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#F9F7F3;padding:18px 32px 20px;border:1px solid rgba(28,28,26,0.09);border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:11px;color:#8A8A82;margin:0;line-height:1.6;">
          You're receiving this because you started building a plan for ${dogName} on PawCraft and left before completing your order.<br>
          Questions? Just reply — I read every one.<br>
          <a href="${unsubscribeUrl(sessionId)}" style="color:#8A8A82;text-decoration:underline;">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:24px 0 8px;">
    <tr><td style="border-radius:99px;background:#1A6B4A;">
      <a href="${url}" style="display:inline-block;padding:14px 28px;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:99px;font-family:'DM Sans',Arial,sans-serif;">${label}</a>
    </td></tr>
  </table>`
}

function dogPill(dogName: string, dogBreed: string, dogAge: string | null, problems: string[]): string {
  const parts = [
    '🐾',
    dogName,
    dogBreed,
    dogAge ? AGE_LABELS[dogAge] ?? dogAge : null,
    problems.length > 0 ? problems.slice(0, 2).map((p) => PROBLEM_LABELS[p] ?? p).join(' + ') : null,
  ].filter(Boolean).join(' · ')

  return `<p style="display:inline-block;background:#E8F4EE;border:1px solid rgba(26,107,74,0.15);border-radius:99px;padding:6px 14px;font-size:12px;font-weight:500;color:#1A6B4A;margin:10px 0 16px;">${parts}</p>`
}

function blockquote(quote: string, attribution: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin:18px 0;">
    <tr><td style="border-left:3px solid #1A6B4A;padding:14px 16px;background:#F9F7F3;border-radius:0 8px 8px 0;">
      <p style="font-size:13px;color:#4A4A44;font-style:italic;margin:0 0 8px;line-height:1.65;">"${quote}"</p>
      <p style="font-size:11px;color:#8A8A82;margin:0;font-weight:500;">${attribution}</p>
    </td></tr>
  </table>`
}

function bulletList(items: string[]): string {
  const rows = items.map(
    (item) => `<tr><td style="padding:4px 0;"><p style="margin:0;font-size:14px;color:#4A4A44;line-height:1.6;"><span style="color:#1A6B4A;margin-right:6px;">→</span>${item}</p></td></tr>`
  ).join('')
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin:14px 0;">${rows}</table>`
}

function p(text: string, styles = ''): string {
  return `<p style="font-size:14px;color:#4A4A44;line-height:1.75;margin:0 0 16px;${styles}">${text}</p>`
}

function sig(): string {
  return `<p style="font-size:14px;color:#4A4A44;line-height:1.75;margin:20px 0 0;">— Julian<br><span style="font-size:12px;color:#8A8A82;">Julian @ PawCraft</span></p>`
}

// ── Email 1 — 30 minutes — Warm personal ──────────────────────────────────

export function recoveryEmail1(d: RecoveryEmailData) {
  const subject = `${d.dogName}'s plan is waiting for you 🐾`
  const previewText = `You told us about ${d.dogName}. We built the plan. It just needs one thing…`

  const livingCtx = d.living ? `, the ${livingText(d.living)} you're working from` : ''
  const timeCtx = d.dailyTime ? `, the ${d.dailyTime} minutes you have each day` : ''

  const body = `
    ${p(`You took the time to tell us about ${d.dogName} — their breed, their age, ${problemText(d.problems)}${timeCtx}${livingCtx}.`)}
    ${p(`That's not what someone does when they've given up on their dog.`)}
    ${p(`So we went ahead and built ${d.dogName}'s plan. It's sitting on our server right now, ready to generate the moment you complete your order. A full 30-day, ${d.dogBreed}-specific programme — day by day, exercise by exercise — built around everything you told us.`)}
    ${dogPill(d.dogName, d.dogBreed, d.dogAge, d.problems)}
    ${p(`<strong style="color:#1C1C1A;">All that's left is $17.</strong> That's it. Less than a coffee-shop afternoon. Less than one hour with a trainer who doesn't know your dog's name.`)}
    ${p(`No subscription. Delivered to this inbox in under 60 seconds.`)}
    ${ctaButton(orderUrl(d.sessionId), `Get ${d.dogName}'s plan — $17 →`)}
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(28,28,26,0.08);">
      <tr><td><p style="font-size:12px;color:#8A8A82;font-style:italic;line-height:1.6;margin:0;"><strong style="color:#4A4A44;font-style:normal;">P.S.</strong> If something stopped you — a question, a doubt — just reply to this email. I read every reply personally.</p></td></tr>
    </table>
    ${sig()}
  `

  return { subject, previewText, html: emailShell(d.dogName, d.sessionId, body) }
}

// ── Email 2 — 24 hours — Education / root cause ────────────────────────────

export function recoveryEmail2(d: RecoveryEmailData) {
  const problem = primaryProblem(d.problems)
  const subject = `Why ${d.dogName} ${problem} — and what actually fixes it`
  const previewText = `Most owners treat the symptom. The plan we built for ${d.dogName} goes after the cause.`

  const ageLabel = d.dogAge ? ` ${ageText(d.dogAge)}` : ''

  const body = `
    ${p(`Here's something most dog training guides will never tell you:`)}
    ${p(`<strong style="color:#1C1C1A;">${problem.charAt(0).toUpperCase() + problem.slice(1)} in a${ageLabel} ${d.dogBreed} isn't just a training problem. It's a needs problem.</strong>`)}
    ${p(`Most guides give you techniques — "stop and wait for slack", "say leave it firmly", "redirect with a toy". These work for some dogs. But without understanding <em>why</em> ${d.dogName} specifically does what they do — their breed drive, their age, their environment — the techniques don't stick.`)}
    ${p(`${d.dogName}'s plan starts differently. Before any technique, it explains what's driving the behaviour. Once you understand that, the training makes sense. Things start working — and staying worked.`)}
    ${bulletList([
      `Why generic advice often makes ${problem} <em>worse</em> for ${d.dogBreed}s`,
      `The one routine change that drops reactivity faster than most outdoor sessions`,
      `Why your current approach may be accidentally reinforcing the behaviour you want to stop`,
    ])}
    ${p(`All of that is in ${d.dogName}'s plan. Breed-specific. Built for your situation. <strong style="color:#1C1C1A;">$17.</strong>`)}
    ${ctaButton(orderUrl(d.sessionId), `Get ${d.dogName}'s 30-day plan →`)}
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(28,28,26,0.08);">
      <tr><td>
        <p style="font-size:12px;color:#8A8A82;font-style:italic;line-height:1.6;margin:0 0 8px;"><strong style="color:#4A4A44;font-style:normal;">P.S.</strong> Still not sure? Here's what Jamie said after getting a plan for her French Bulldog Bruno:</p>
        ${blockquote(`My trainer quoted me $600 for a 6-session package. The PawCraft plan was more detailed than anything he gave me in session one.`, `— Jamie K. · Bruno · French Bulldog · 3 years`)}
      </td></tr>
    </table>
    ${sig()}
  `

  return { subject, previewText, html: emailShell(d.dogName, d.sessionId, body) }
}

// ── Email 3 — 72 hours — Social proof + guarantee ─────────────────────────

export function recoveryEmail3(d: RecoveryEmailData) {
  const subject = `"I've spent $400 on classes. This finally explained why."`
  const previewText = `A real story from someone with the same problem as ${d.dogName}. Here's what happened.`
  const problem = primaryProblem(d.problems)

  const body = `
    ${p(`Sarah had a 2-year-old Husky named Koda. ${problem.charAt(0).toUpperCase() + problem.slice(1)}, reactive — similar profile to ${d.dogName}.`)}
    ${p(`She'd spent $400 on group classes. Tried every YouTube technique. Still ended every walk exhausted and embarrassed.`)}
    ${blockquote(
      `I've spent $400 on group classes and nothing clicked. This plan finally explained WHY Koda does what he does. Within 2 weeks the ${problem} dropped by about 80%. The breed diagnostic section alone was worth the $17.`,
      `— Sarah L. · Koda · Husky · 2 years`
    )}
    ${p(`The difference wasn't effort. Sarah was already trying hard. The difference was having a plan built for <em>her dog's</em> specific drive level, age, and environment — not a recycled guide written for every dog on the planet.`)}
    ${p(`${d.dogName}'s plan is already built around their ${d.dogBreed} temperament, their specific triggers, and your situation. <strong style="color:#1C1C1A;">It's just waiting for you to unlock it.</strong>`)}
    ${p(`$17. 60 seconds to your inbox.`)}
    ${ctaButton(orderUrl(d.sessionId), `Unlock ${d.dogName}'s plan now →`)}
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(28,28,26,0.08);">
      <tr><td><p style="font-size:12px;color:#8A8A82;font-style:italic;line-height:1.6;margin:0;"><strong style="color:#4A4A44;font-style:normal;">P.S.</strong> Not happy with the plan? Reply within 30 days for a full refund. No forms, no questions.</p></td></tr>
    </table>
    ${sig()}
  `

  return { subject, previewText, html: emailShell(d.dogName, d.sessionId, body) }
}

// ── Email 4 — 120 hours — Last chance ─────────────────────────────────────

export function recoveryEmail4(d: RecoveryEmailData) {
  const subject = `Closing ${d.dogName}'s profile today`
  const previewText = `We hold completed profiles for 5 days. After today, you'd need to start the form again.`

  const body = `
    ${p(`Last one from me — I promise.`)}
    ${p(`We hold the profile data from completed surveys for 5 days. After today, ${d.dogName}'s profile is cleared from our system and you'd need to fill out the form again to get a plan.`)}
    ${p(`I just want to make sure you're not leaving without knowing exactly what you'd be getting:`)}
    ${bulletList([
      `A ${d.dogBreed}-specific temperament diagnostic — why ${d.dogName} behaves the way they do, explained clearly`,
      `30 days of training, mapped out day by day — no guessing what to do next`,
      d.dailyTime ? `Exercises designed for ${d.dailyTime}-minute sessions${d.living ? ` in ${livingText(d.living)}` : ''}` : `Exercises tailored to your daily schedule and living situation`,
      `The most common mistakes owners make with ${d.dogBreed}s that silently kill progress`,
      `Weekly checklists so you know exactly when you're ready to advance`,
    ])}
    ${p(`All of that for $17. With a 30-day money-back guarantee.`)}
    ${p(`If you've decided it's not for you — no problem at all. But if something stopped you that I can answer, just hit reply. I'm a real person and I'll respond within a few hours.`)}
    ${p(`Either way, I hope ${d.dogName}'s walks — and days — get easier soon. You clearly care about getting this right.`)}
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:99px;background:#1A6B4A;margin-right:10px;">
          <a href="${orderUrl(d.sessionId)}" style="display:inline-block;padding:14px 28px;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:99px;font-family:'DM Sans',Arial,sans-serif;">Get ${d.dogName}'s plan — $17</a>
        </td>
        <td style="padding-left:10px;">
          <a href="mailto:hello@mypawcraft.com" style="display:inline-block;padding:13px 22px;color:#1A6B4A;font-size:14px;font-weight:500;text-decoration:none;border-radius:99px;border:1.5px solid #1A6B4A;font-family:'DM Sans',Arial,sans-serif;">I have a question →</a>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(28,28,26,0.08);">
      <tr><td><p style="font-size:12px;color:#8A8A82;font-style:italic;line-height:1.6;margin:0;"><strong style="color:#4A4A44;font-style:normal;">After today,</strong> this is the last email you'll receive from us about ${d.dogName}'s plan. No more follow-ups.</p></td></tr>
    </table>
    ${sig()}
  `

  return { subject, previewText, html: emailShell(d.dogName, d.sessionId, body) }
}

// ── Sequence dispatcher ────────────────────────────────────────────────────

export type RecoveryEmailFn = (d: RecoveryEmailData) => { subject: string; previewText: string; html: string }

export const RECOVERY_EMAIL_SEQUENCE: RecoveryEmailFn[] = [
  recoveryEmail1,
  recoveryEmail2,
  recoveryEmail3,
  recoveryEmail4,
]

/** Delay in minutes before each email in the sequence should be sent */
export const RECOVERY_EMAIL_DELAYS_MINUTES = [30, 1440, 4320, 7200] // 30m, 24h, 72h, 120h
