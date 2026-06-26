import nodemailer from "nodemailer";
import { config, requireEnv } from "../config.js";

function getTransport() {
  requireEnv("smtpUser");
  requireEnv("smtpPass");
  requireEnv("smtpFromEmail");

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

function fromAddress() {
  return config.smtpFromName
    ? `${config.smtpFromName} <${config.smtpFromEmail}>`
    : config.smtpFromEmail;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendVerificationEmail(email: string, fullName: string, token: string) {
  const verifyUrl = `${config.publicAppUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const safeName = escapeHtml(fullName);
  const safeVerifyUrl = escapeHtml(verifyUrl);

  await getTransport().sendMail({
    from: fromAddress(),
    to: email,
    subject: "Verify your Collectibles account",
    text: [
      `Hi ${fullName},`,
      "",
      "Verify your Collectibles account by opening this link:",
      verifyUrl,
      "",
      "This link expires in 24 hours.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
        <h1 style="font-size: 22px;">Verify your Collectibles account</h1>
        <p>Hi ${safeName},</p>
        <p>Tap the button below to verify your email address and activate your account.</p>
        <p><a href="${safeVerifyUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;">Verify email</a></p>
        <p style="font-size: 13px; color: #666;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${config.publicAppUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const safeResetUrl = escapeHtml(resetUrl);

  await getTransport().sendMail({
    from: fromAddress(),
    to: email,
    subject: "Reset your Collectibles password",
    text: [
      "Reset your Collectibles password by opening this link:",
      resetUrl,
      "",
      "This link expires in 1 hour. If you did not request it, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
        <h1 style="font-size: 22px;">Reset your password</h1>
        <p>Tap the button below to choose a new Collectibles password.</p>
        <p><a href="${safeResetUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;">Reset password</a></p>
        <p style="font-size: 13px; color: #666;">This link expires in 1 hour. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });
}
