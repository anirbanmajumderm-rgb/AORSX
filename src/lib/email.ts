import * as nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { logger } from "./app-logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) {
    logger.debug("Email", "Reusing existing SMTP transporter");
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const displayUser = user ? user.substring(0, 3) + "****" : "not set";

  if (!host || !user || !pass) {
    logger.warn("Email", `SMTP not configured (host=${host}, user=${displayUser}). Emails will NOT be sent.`);
    return null;
  }

  logger.info("Email", `Creating SMTP transporter: ${host}:${port} user=${displayUser}`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    debug: process.env.NODE_ENV === "development",
    logger: process.env.NODE_ENV === "development",
  });

  transporter.verify().then((ok) => {
    if (ok) {
      logger.info("Email", "SMTP CONNECTED — transporter verified successfully");
    }
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Email", `SMTP CONNECTION FAILED: ${msg}`, { error: msg });
  });

  return transporter;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "noreply@localhost";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) {
    await prisma.emailLog.create({
      data: {
        to: params.to,
        subject: params.subject,
        status: "failed",
        error: "SMTP not configured — email not sent",
      },
    });
    logger.error("Email", `EMAIL FAILED (no SMTP): ${params.subject} -> ${params.to}`);
    return { success: false, error: "SMTP not configured" };
  }

  const sendStart = Date.now();

  try {
    logger.info("Email", `SENDING EMAIL: ${params.subject} -> ${params.to}`);
    await t.sendMail({
      from: getFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ""),
    });

    const elapsed = Date.now() - sendStart;

    await prisma.emailLog.create({
      data: {
        to: params.to,
        subject: params.subject,
        status: "sent",
        sentAt: new Date(),
      },
    });

    logger.info("Email", `EMAIL SENT SUCCESSFULLY: ${params.subject} -> ${params.to} (${elapsed}ms)`);
    return { success: true };
  } catch (err) {
    const elapsed = Date.now() - sendStart;
    const error = err instanceof Error ? err.message : String(err);

    await prisma.emailLog.create({
      data: {
        to: params.to,
        subject: params.subject,
        status: "failed",
        error,
      },
    });

    logger.error("Email", `EMAIL FAILED: ${params.subject} -> ${params.to} (${elapsed}ms)`, { error });
    return { success: false, error };
  }
}

export async function renderTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<{ subject: string; html: string } | null> {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { name: templateName } });
    if (!template) {
      logger.warn("Email", `Template not found: ${templateName}`);
      return null;
    }

    let subject = template.subject;
    let body = template.body;

    const escKey = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const [key, value] of Object.entries(variables)) {
      const re = new RegExp(`\\{\\{${escKey(key)}\\}\\}`, "g");
      subject = subject.replace(re, () => value);
      body = body.replace(re, () => value);
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
    return { subject, html };
  } catch (err) {
    logger.error("Email", `Failed to render template: ${templateName}`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function sendTemplateEmail(params: {
  to: string;
  template: string;
  variables: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  const rendered = await renderTemplate(params.template, params.variables);
  if (!rendered) {
    return { success: false, error: `Template "${params.template}" not found` };
  }

  return sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
  });
}

export async function sendContactNotification(params: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const admins = await prisma.admin.findMany({ select: { email: true } });
  const adminEmails = admins.map((a: { email: string }) => a.email).filter(Boolean);

  for (const to of adminEmails) {
    await sendTemplateEmail({
      to,
      template: "contact-notification",
      variables: {
        name: params.name,
        email: params.email,
        message: params.message,
      },
    });
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to: params.to,
    template: "password-reset",
    variables: {
      name: params.name,
      resetUrl: params.resetUrl,
    },
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  loginUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to: params.to,
    template: "welcome",
    variables: {
      name: params.name,
      loginUrl: params.loginUrl,
    },
  });
}

export async function sendOTPEmail(params: {
  to: string;
  otp: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;background:linear-gradient(135deg,#f97316,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">AORNX Admin</h1>
              <p style="margin:0 0 32px;color:#666;font-size:14px;">Your verification code</p>
              <div style="background:#000;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 12px;color:#888;font-size:13px;">Enter this code to complete your login:</p>
                <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:8px;color:#fff;font-family:monospace;">${params.otp}</p>
              </div>
              <p style="margin:0;color:#555;font-size:12px;">This code expires in 5 minutes. Do not share it with anyone.</p>
              <p style="margin:16px 0 0;color:#444;font-size:11px;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: params.to,
    subject: "Your verification code",
    html,
  });
}
