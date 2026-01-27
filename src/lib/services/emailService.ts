import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "RESEND_API_KEY is not set. Password reset emails will not be sent."
  );
}

const resend =
  process.env.RESEND_API_KEY && process.env.NODE_ENV !== "test"
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "no-reply@example.com";

export async function sendPasswordResetOtpEmail(params: {
  to: string;
  name: string;
  otp: string;
}): Promise<void> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(
      "Resend client not configured. Skipping password reset email."
    );
    return;
  }

  const { to, name, otp } = params;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your No13teen password reset code",
    text: [
      `Hi ${name || "there"},`,
      "",
      "You requested to reset your password for your No13teen staff account.",
      `Your one-time password (OTP) is: ${otp}`,
      "",
      "This code will expire in 15 minutes.",
      "",
      "If you did not request this, you can safely ignore this email.",
      "",
      "— No13teen",
    ].join("\n"),
  });
}

