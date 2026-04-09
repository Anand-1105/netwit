import { Resend } from 'resend';

// Lazy init — created per-call so dotenv has already run
const getClient = () => new Resend(process.env.RESEND_API_KEY);
const FROM = () => process.env.RESEND_FROM || 'onboarding@resend.dev';

export const sendEmail = async (to, subject, html) => {
  const { error } = await getClient().emails.send({
    from: 'MeetApp <' + FROM() + '>',
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
};

export const otpHtml = (otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#0f0f0f;margin:0;padding:40px 20px;font-family:system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:1px solid #2a2a2a;">
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="background:#f59e0b;border-radius:6px;width:24px;height:24px;display:inline-block;text-align:center;line-height:24px;font-size:12px;">📅</span>
        <span style="color:#fff;font-weight:700;font-size:15px;letter-spacing:-0.3px;">MeetApp</span>
      </span>
    </div>
    <div style="padding:32px;">
      <p style="color:#999;font-size:13px;margin:0 0 8px;">Password reset</p>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 24px;letter-spacing:-0.5px;">Your OTP code</h1>
      <div style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#f59e0b;font-family:monospace;">${otp}</span>
      </div>
      <p style="color:#666;font-size:13px;line-height:1.6;margin:0;">
        This code expires in <strong style="color:#999;">1 hour</strong>. If you didn't request a password reset, ignore this email.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #2a2a2a;">
      <p style="color:#444;font-size:11px;margin:0;">India CIO Summit · Conference Room Booking</p>
    </div>
  </div>
</body>
</html>`;

export const welcomeHtml = (username) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#0f0f0f;margin:0;padding:40px 20px;font-family:system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:1px solid #2a2a2a;">
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="background:#f59e0b;border-radius:6px;width:24px;height:24px;display:inline-block;text-align:center;line-height:24px;font-size:12px;">📅</span>
        <span style="color:#fff;font-weight:700;font-size:15px;letter-spacing:-0.3px;">MeetApp</span>
      </span>
    </div>
    <div style="padding:32px;">
      <p style="color:#999;font-size:13px;margin:0 0 8px;">Welcome aboard</p>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 16px;letter-spacing:-0.5px;">Hi ${username} 👋</h1>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Your MeetApp account has been created. You can now sign in and start managing conference room bookings for your event.
      </p>
      <a href="${process.env.CLIENT_URL}/login"
        style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Sign in to MeetApp →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #2a2a2a;">
      <p style="color:#444;font-size:11px;margin:0;">India CIO Summit · Conference Room Booking</p>
    </div>
  </div>
</body>
</html>`;


