/**
 * Email utility using Nodemailer
 */

const nodemailer = require('nodemailer');

const COMPANY_EMAIL = 'support@whatsnxt.in';
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'support@whatsnxt.in';

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send email using Nodemailer
 */
async function sendEmail({ to, subject, htmlBody, textBody }) {
    const mailOptions = {
        from: `"CuratedReels" <${FROM_EMAIL}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: htmlBody,
        text: textBody || htmlBody.replace(/<[^>]*>/g, ''),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent to:', to);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

/**
 * Send license key email to customer
 */
async function sendCustomerLicenseEmail({ email, name, licenseKey, tier, maxDeployments }) {
    const subject = '🎉 Your CuratedReels License Key';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .license-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .license-key { font-family: monospace; font-size: 18px; color: #667eea; font-weight: bold; letter-spacing: 1px; }
        .steps { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .steps h3 { color: #667eea; margin-top: 0; }
        .steps ol { padding-left: 20px; }
        .steps li { margin: 10px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to CuratedReels! 🚀</h1>
        </div>
        <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Thank you for purchasing CuratedReels <strong>${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong> license!</p>
            
            <div class="license-box">
                <p style="margin: 0 0 10px 0; color: #666;">Your License Key</p>
                <div class="license-key">${licenseKey}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Max Deployments: ${maxDeployments === 999 ? 'Unlimited' : maxDeployments}</p>
            </div>

            <div class="steps">
                <h3>📋 Deployment Steps</h3>
                <ol>
                    <li><strong>Install the CLI globally:</strong>
                        <br><code style="background: #333; color: #0f0; padding: 4px 8px; border-radius: 4px;">npm install -g curatedreels-deploy</code>
                    </li>
                    <li><strong>Run the deployment wizard:</strong>
                        <br><code style="background: #333; color: #0f0; padding: 4px 8px; border-radius: 4px;">curatedreels-deploy</code>
                    </li>
                    <li><strong>Enter your license key when prompted:</strong>
                        <br><code style="background: #333; color: #0f0; padding: 4px 8px; border-radius: 4px;">${licenseKey}</code>
                    </li>
                    <li><strong>Follow the interactive prompts</strong> to configure your database (MongoDB) and media storage (Cloudinary).</li>
                    <li><strong>The CLI will automatically deploy</strong> your CuratedReels instance.</li>
                </ol>
            </div>

            <p>Need help? Check our <a href="https://www.npmjs.com/package/curatedreels-deploy">documentation</a> or reply to this email.</p>
            
            <div class="footer">
                <p>© ${new Date().getFullYear()} WhatsNxt. All rights reserved.</p>
                <p>This is a lifetime license. Keep this email safe!</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({ to: email, subject, htmlBody });
}

/**
 * Send order notification to company
 */
async function sendCompanyOrderNotification({ email, name, licenseKey, tier, amount }) {
    const subject = `💰 New CuratedReels Order: ${tier.toUpperCase()} - ₹${(amount / 100).toLocaleString('en-IN')}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; width: 150px; color: #666; }
        .value { flex: 1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 New CuratedReels Order!</h2>
        </div>
        <div class="content">
            <div class="detail-row">
                <span class="label">Customer Name:</span>
                <span class="value">${name || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Customer Email:</span>
                <span class="value">${email}</span>
            </div>
            <div class="detail-row">
                <span class="label">Tier:</span>
                <span class="value">${tier.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">₹${(amount / 100).toLocaleString('en-IN')}</span>
            </div>
            <div class="detail-row">
                <span class="label">License Key:</span>
                <span class="value" style="font-family: monospace;">${licenseKey}</span>
            </div>
            <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({ to: COMPANY_EMAIL, subject, htmlBody });
}

module.exports = {
    sendEmail,
    sendCustomerLicenseEmail,
    sendCompanyOrderNotification,
    COMPANY_EMAIL,
};
