import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM || 'ThriftYatra <noreply@thirftyatra.com>';

export const sendMail = async (subject, receiver, body) => {
    try {
        console.log(`📧 Sending to: ${receiver}, Subject: ${subject}`);
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [receiver],
            subject: subject,
            html: body,
        });
        if (error) {
            console.error('❌ Resend error:', error.message);
            return { success: false, error: error.message };
        }
        console.log('✅ Email sent:', data?.id);
        return { success: true };
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        return { success: false };
    }
};