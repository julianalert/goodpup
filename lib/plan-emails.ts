import type { PlanDay } from './plan-types'
import type { ReminderKind } from './plan-reminders'

// The emails that bring a customer back to their training space. Pure builders:
// they return { subject, html } and send nothing, so they can be previewed and tested.

export interface ReminderEmailInput {
  kind: ReminderKind
  dogName: string
  day: PlanDay
  /** Link to the training space */
  planUrl: string
  /** One-click "turn reminders off" link */
  offUrl: string
  /** Set on the first morning of a new week: the week that was just finished */
  weekJustCompleted?: number | null
}

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const minutesOf = (day: PlanDay) => day.exercises.reduce((total, e) => total + e.minutes, 0)

const P = 'font-size:16px;color:#4A4A44;line-height:1.6;margin:0 0 16px;'

function shell(body: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>PawCraft</title></head>
<body style="margin:0;padding:0;background:#F9F7F3;font-family:'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F9F7F3;">
  <tr><td align="center" style="padding:28px 16px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:520px;">
      <tr><td style="background:#1A6B4A;padding:20px 32px;border-radius:12px 12px 0 0;">
        <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:white;margin:0;font-weight:600;">PawCraft</p>
      </td></tr>
      <tr><td style="background:white;padding:32px 32px 28px;border-left:1px solid rgba(28,28,26,0.09);border-right:1px solid rgba(28,28,26,0.09);">
        ${body}
      </td></tr>
      <tr><td style="background:#F9F7F3;padding:18px 32px 20px;border:1px solid rgba(28,28,26,0.09);border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:12px;color:#8A8A82;margin:0;line-height:1.6;">${footer}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function button(label: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${esc(url)}" style="display:inline-block;background:#1A6B4A;color:white;text-decoration:none;padding:15px 34px;border-radius:99px;font-size:16px;font-weight:600;">${esc(label)}</a>
  </div>`
}

function exerciseList(day: PlanDay): string {
  const rows = day.exercises.map((e) => `
    <tr>
      <td style="padding:10px 14px;font-size:15px;color:#1C1C1A;border-bottom:1px solid rgba(28,28,26,0.07);">${esc(e.name)}</td>
      <td align="right" style="padding:10px 14px;font-size:14px;color:#8A8A82;white-space:nowrap;border-bottom:1px solid rgba(28,28,26,0.07);">${e.minutes} min</td>
    </tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F9F7F3;border-radius:10px;margin:0 0 4px;">${rows}</table>`
}

export function buildReminderEmail(input: ReminderEmailInput): { subject: string; previewText: string; html: string } {
  const { kind, day, planUrl, offUrl } = input
  const dog = input.dogName
  const total = minutesOf(day)
  const first = day.exercises[0]

  const footer = `You get one email a day at your reminder time while ${esc(dog)}'s program is running. `
    + `<a href="${esc(planUrl)}#profile" style="color:#8A8A82;text-decoration:underline;">Change the time</a> or `
    + `<a href="${esc(offUrl)}" style="color:#8A8A82;text-decoration:underline;">turn reminders off</a>.`

  if (kind === 'last') {
    return {
      subject: `Last reminder about ${dog}'s training`,
      previewText: `Day ${day.day} will be there whenever you are ready.`,
      html: shell(`
        <p style="${P}">Hi,</p>
        <p style="${P}">I've sent a few reminders and I don't want to nag, so this is the last one for now.</p>
        <p style="${P}">${esc(dog)}'s space stays open and nothing is lost. Day ${day.day}, <strong>${esc(day.title)}</strong>, is waiting whenever you are ready. If today is not that day, even the first exercise (${esc(first.name)}, ${first.minutes} minutes) counts.</p>
        ${button(`Open ${dog}'s space`, planUrl)}
        <p style="font-size:14px;color:#8A8A82;line-height:1.6;margin:20px 0 0;">Finish a day and the daily reminders start again on their own.</p>
      `, footer),
    }
  }

  if (kind === 'lapse') {
    return {
      subject: `${dog} is waiting on Day ${day.day} (5 minutes is enough)`,
      previewText: `Do only the first exercise today: ${first.name}.`,
      html: shell(`
        <p style="${P}">Hi,</p>
        <p style="${P}">It has been a few days since ${esc(dog)}'s last session. That happens to everyone, and nothing you built is gone.</p>
        <p style="${P}">The hard part is starting again, so make it small. Today, do only the first exercise of Day ${day.day}:</p>
        <p style="font-size:18px;color:#1C1C1A;line-height:1.4;margin:0 0 6px;font-weight:600;">${esc(first.name)} · ${first.minutes} minutes</p>
        <p style="${P}">${esc(first.why)}</p>
        ${button(`Pick up Day ${day.day}`, planUrl)}
      `, footer),
    }
  }

  const recap = input.weekJustCompleted
    ? `<div style="background:#E8F4EE;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
        <p style="font-size:15px;color:#1A6B4A;line-height:1.55;margin:0;"><strong>Week ${input.weekJustCompleted} is done.</strong> Before today's session, take 20 seconds to rate how ${esc(dog)} is doing now. That is how you will see the change.
        <a href="${esc(planUrl)}#progress" style="color:#1A6B4A;font-weight:600;">Rate this week</a></p>
      </div>`
    : ''

  return {
    subject: `Day ${day.day} for ${dog}: ${day.title} (${total} min)`,
    previewText: day.focus,
    html: shell(`
      ${recap}
      <p style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#1A6B4A;margin:0 0 6px;">Day ${day.day} of 30 · ${total} minutes</p>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#1C1C1A;line-height:1.3;margin:0 0 12px;font-weight:600;">${esc(day.title)}</p>
      <p style="${P}">${esc(day.focus)}</p>
      ${exerciseList(day)}
      ${button(`Start Day ${day.day}`, planUrl)}
    `, footer),
  }
}

/** Hidden preview line shown by mail clients next to the subject. */
export function withPreviewText(html: string, previewText: string): string {
  const snippet = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(previewText)}</div>`
  return html.replace(/<body([^>]*)>/, `<body$1>${snippet}`)
}
