export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8A2BE2, #6A1B9A); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-weight: 300; letter-spacing: 1px;">Verify Your Email</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
    <p style="color: #444; font-size: 16px;">Hello,</p>
    <p style="color: #444; font-size: 16px;">Thank you for signing up! Your verification code is:</p>
    <div style="text-align: center; margin: 35px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8A2BE2; background-color: #F5F0FF; padding: 15px 30px; border-radius: 6px; border: 2px dashed #D9C2FF;">{verificationCode}</span>
    </div>
    <p style="color: #444; font-size: 16px;">Enter this code on the verification page to complete your registration.</p>
    <p style="color: #666; font-size: 14px; margin-top: 25px;">This code will expire in 15 minutes for security reasons.</p>
    <p style="color: #666; font-size: 14px;">If you didn't create an account with us, please ignore this email.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
      <p style="color: #444; margin: 0;">Best regards,<br><span style="color: #8A2BE2; font-weight: 500;">India CIO Summit 2k25</span></p>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const OTP_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP for Password Reset</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8A2BE2, #6A1B9A); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-weight: 300; letter-spacing: 1px;">Password Reset OTP</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
    <p style="color: #444; font-size: 16px;">Hello,</p>
    <p style="color: #444; font-size: 16px;">We received a request to reset your password for your Meeting Booking account. Use the OTP below to proceed:</p>
    <div style="text-align: center; margin: 35px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8A2BE2; background-color: #F5F0FF; padding: 15px 30px; border-radius: 6px; border: 2px dashed #D9C2FF;">{otp}</span>
    </div>
    <p style="color: #444; font-size: 16px;">Enter this OTP in the password reset form. This code will expire in 1 hour for security reasons.</p>
    <p style="color: #666; font-size: 14px; margin-top: 25px;">If you did not request a password reset, you can safely ignore this email.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
      <p style="color: #444; margin: 0;">Best regards,<br><span style="color: #8A2BE2; font-weight: 500;">Meeting Booking Team</span></p>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8A2BE2, #6A1B9A); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-weight: 300; letter-spacing: 1px;">Password Reset Successful</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
    <p style="color: #444; font-size: 16px;">Hello,</p>
    <p style="color: #444; font-size: 16px;">We're writing to confirm that your password has been successfully reset.</p>
    <div style="text-align: center; margin: 35px 0;">
      <div style="background-color: #8A2BE2; color: white; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; display: inline-block; font-size: 30px; box-shadow: 0 3px 6px rgba(138,43,226,0.2);">
        ✓
      </div>
    </div>
    <div style="background-color: #F5F0FF; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <p style="color: #444; font-size: 16px; margin-top: 0;">For security reasons, we recommend that you:</p>
      <ul style="color: #666; padding-left: 20px;">
        <li style="margin: 10px 0;">Use a strong, unique password</li>
        <li style="margin: 10px 0;">Enable two-factor authentication if available</li>
        <li style="margin: 10px 0;">Avoid using the same password across multiple sites</li>
      </ul>
    </div>
    <p style="color: #666; font-size: 14px;">If you did not initiate this password reset, please contact our support team immediately.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
      <p style="color: #444; margin: 0;">Best regards,<br><span style="color: #8A2BE2; font-weight: 500;">India CIO Summit 2k25</span></p>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8A2BE2, #6A1B9A); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-weight: 300; letter-spacing: 1px;">Reset Your Password</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
    <p style="color: #444; font-size: 16px;">Hello,</p>
    <p style="color: #444; font-size: 16px;">We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p style="color: #444; font-size: 16px;">To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 35px 0;">
      <a href="{resetURL}" style="background: linear-gradient(135deg, #8A2BE2, #6A1B9A); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 3px 6px rgba(138,43,226,0.2);">Reset Password</a>
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 25px;">This link will expire in 1 hour for security reasons.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
      <p style="color: #444; margin: 0;">Best regards,<br><span style="color: #8A2BE2; font-weight: 500;">India CIO Summit 2k25</span></p>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;