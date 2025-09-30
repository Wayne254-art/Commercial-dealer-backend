import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationLink = `${process.env.DASHBOARD_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Wayne_Auto_Sales" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Confirm your email - Wayne_Auto_Sales",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #1F2937; text-align: center;">Welcome to Wayne_Auto_Sales!</h2>
        <p style="color: #374151; font-size: 16px;">
          Hi there,
        </p>
        <p style="color: #374151; font-size: 16px;">
          Thank you for signing up as a seller on Wayne_Auto_Sales. To continue, please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #F30E0E; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Verify My Email
          </a>
        </div>
        <p style="color: #6B7280; font-size: 14px;">
          If the button above doesn’t work, you can also copy and paste the link below into your browser:
        </p>
        <p style="color: #4B5563; font-size: 14px; word-break: break-all;">
          <a href="${verificationLink}" style="color: #005C45;">${verificationLink}</a>
        </p>
        <hr style="margin: 30px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          This verification link is valid for 24 hours. If you did not sign up for Wayne_Auto_Sales, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};
