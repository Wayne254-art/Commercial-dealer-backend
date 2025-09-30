import nodemailer from 'nodemailer'

export const send_OTP_email = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const emailBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; border-radius: 10px; width: 88%; max-width: 480px; margin: auto; text-align: center; border: 1px solid #ddd;">
                <h2 style="color: #4A90E2; margin-bottom: 10px;">Password Reset Request</h2>
                <p style="color: #333; font-size: 16px;">We received a request to reset your password.</p>
                <p style="font-size: 18px; font-weight: bold; color: #F30E0E; margin: 10px 0;">Your OTP Code:</p>
                <div style="font-size: 24px; font-weight: bold; color: #ffffff; background-color: #F30E0E; padding: 10px; display: inline-block; border-radius: 5px;">
                    ${otp}
                </div>
                <p style="color: #555; font-size: 14px; margin-top: 20px;">This OTP expires in <strong style="color: #F30E0E;">10 minutes</strong>. If you didn’t request this, you can safely ignore this email.</p>
                <p style="color: #777; font-size: 12px; margin-top: 20px;">Stay safe,<br><strong>Wayne_Auto_Sales Team</strong></p>
            </div>
        `;

        const mailOptions = {
            from: `"Wayne_Auto_Sales" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your One-Time Password (OTP) for Reset",
            text: `We received a request to reset your password. Your OTP is: ${otp}. It expires in 10 minutes.`,
            html: emailBody,
        };

        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
};
