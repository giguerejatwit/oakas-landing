// Workflow audit: emails the visitor their result and BCCs the team.
// Sends over SMTP (Microsoft 365 by default). If AUDIT_SMTP_USER/PASS are not
// set in Vercel, it returns { emailed:false } and the page tells the visitor a
// founder will follow up, so nothing is ever silently dropped.
const nodemailer = require("nodemailer");

const MAX_BODY = 20 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clip = (s, n) => String(s || "").slice(0, n);

function render({ name, company, result }) {
  const r = result || {};
  const findings = Array.isArray(r.findings) ? r.findings.slice(0, 6).map((f) => clip(f, 120)) : [];
  const answers = r.answers && typeof r.answers === "object" ? r.answers : {};
  const first = clip(name, 80).split(" ")[0] || "there";
  const text = [
    `Hi ${first},`,
    ``,
    `Here is your workflow audit result from oakas.ai.`,
    ``,
    `Result: ${clip(r.band, 60)} (${Number(r.score) || 0} out of 15)`,
    ``,
    clip(r.summary, 600),
    ``,
    clip(r.example, 400),
    ``,
    findings.length ? `What stood out:\n${findings.map((f) => `  - ${f}`).join("\n")}` : `No red flags stood out in your answers.`,
    ``,
    `If any of that landed, the next step is a free 30-minute discovery call with one of the founders who builds every system: https://oakas.ai/book`,
    ``,
    `We won't add you to anything else. Reply to this email if you have a question.`,
    ``,
    `Jake, Hunter, and Eric`,
    `OAKAS`,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#F7F8F5;font-family:Helvetica,Arial,sans-serif;color:#161D19;line-height:1.6">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <p style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#0E6B44;font-weight:700;margin:0 0 16px">Your Workflow Audit</p>
  <p>Hi ${esc(first)},</p>
  <p>Here is your workflow audit result from oakas.ai.</p>
  <p style="font-size:28px;font-family:Georgia,serif;margin:20px 0 4px">${Number(r.score) || 0} <span style="font-size:14px;color:#55625A;font-family:Helvetica,Arial,sans-serif">out of 15</span></p>
  <p style="margin:0 0 18px"><span style="display:inline-block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0E6B44;border:1px solid #0E6B44;padding:4px 9px;border-radius:2px;font-weight:700">${esc(clip(r.band, 60))}</span></p>
  <p>${esc(clip(r.summary, 600))}</p>
  <p style="color:#55625A">${esc(clip(r.example, 400))}</p>
  ${findings.length ? `<p style="font-weight:700;margin-top:22px;border-top:1px solid #161D19;padding-top:14px">What stood out</p><ul style="padding-left:18px;margin:0">${findings.map((f) => `<li style="margin:6px 0">${esc(f)}</li>`).join("")}</ul>` : `<p style="border-top:1px solid #161D19;padding-top:14px">No red flags stood out in your answers.</p>`}
  <p style="margin-top:26px"><a href="https://oakas.ai/book" style="display:inline-block;background:#0E6B44;color:#F7F8F5;text-decoration:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:12px 20px;border-radius:2px">Book a 30-Minute Discovery Call &rarr;</a></p>
  <p style="font-size:13px;color:#55625A">Free, with one of the founders who builds every system. We won't add you to anything else. Reply to this email if you have a question.</p>
  <p style="margin-top:26px">Jake, Hunter, and Eric<br/>OAKAS</p>
</div></body></html>`;
  const internal = [
    `New workflow audit${company ? ` from ${clip(company, 100)}` : ""}`,
    `Name: ${clip(name, 80)}`,
    `Company: ${clip(company, 100) || "(not given)"}`,
    `Result: ${clip(r.band, 60)} (${Number(r.score) || 0}/15)`,
    `Industry: ${clip(r.industry, 40)}   Team size: ${clip(r.employees, 20)}`,
    `Answers: ${Object.keys(answers).slice(0, 7).map((k) => `${clip(k, 4)}=${clip(answers[k], 40)}`).join("; ")}`,
    `Findings: ${findings.join(" | ") || "none"}`,
  ].join("\n");
  return { text, html, internal };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (JSON.stringify(body).length > MAX_BODY) return res.status(413).json({ error: "Too large" });
  const email = String(body.email || "").trim();
  const name = String(body.name || "").trim();
  if (!EMAIL_RE.test(email) || email.length > 200 || !name) return res.status(400).json({ error: "Name and a valid email are required" });

  const user = process.env.AUDIT_SMTP_USER, pass = process.env.AUDIT_SMTP_PASS;
  if (!user || !pass) {
    console.warn("audit: AUDIT_SMTP_USER/PASS not set; lead logged to sheet only", { email, name });
    return res.status(200).json({ emailed: false });
  }
  const from = process.env.AUDIT_FROM || user;
  const team = process.env.AUDIT_TEAM_INBOX || "support@oakas.ai";
  const { text, html, internal } = render({ name, company: body.company, result: body.result });

  const transport = nodemailer.createTransport({
    host: process.env.AUDIT_SMTP_HOST || "smtp.office365.com",
    port: Number(process.env.AUDIT_SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
    tls: { ciphers: "TLSv1.2" },
  });
  try {
    await transport.sendMail({ from: `OAKAS <${from}>`, to: email, replyTo: team, subject: "Your workflow audit result", text, html });
    transport.sendMail({ from: `OAKAS Site <${from}>`, to: team, replyTo: email, subject: `Audit lead: ${name}${body.company ? ` (${clip(body.company, 60)})` : ""}`, text: internal })
      .catch((e) => console.error("audit: team copy failed", e.message));
    return res.status(200).json({ emailed: true });
  } catch (e) {
    console.error("audit: send failed", e.message);
    return res.status(200).json({ emailed: false });
  }
};
