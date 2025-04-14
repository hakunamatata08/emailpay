import nodemailer from 'nodemailer';
import { Transaction, Recipient } from '@/types/transaction';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.APPLICATION_EMAIL, // Use environment variable or default
    pass: process.env.APPLICATION_EMAIL_PASSWORD, // Use environment variable or Google app password
  },
});

// Format the email body with transaction details
const formatEmailBody = (transaction: Transaction): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  const formattedAmount = formatter.format(parseFloat(transaction.amount));

  // Status badge color based on transaction status
  let statusColor = '#4F46E5'; // Default purple for pending
  let statusBgColor = 'rgba(79, 70, 229, 0.1)';

  if (transaction.status === 'completed') {
    statusColor = '#10B981'; // Green for completed
    statusBgColor = 'rgba(16, 185, 129, 0.1)';
  } else if (transaction.status === 'failed') {
    statusColor = '#EF4444'; // Red for failed
    statusBgColor = 'rgba(239, 68, 68, 0.1)';
  }
  // Create Sepolia Explorer URL for transaction hash if it exists
  const sepoliaExplorerUrl = transaction.txHash
    ? `https://sepolia.etherscan.io/tx/${transaction.txHash}`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EmailPay Transaction</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f5f7fa;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 20px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Header with Gradient -->
              <tr>
                <td>
                  <div style="background: linear-gradient(135deg, #8a2be2, #ff1493, #4169e1); text-align: center; padding: 40px 20px;">
                    <h1 style="color: white; margin: 0; font-weight: 700; font-size: 32px;">EmailPay</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 18px; font-weight: 300;">Transaction Details</p>
                  </div>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 30px;">
                  <p style="font-size: 16px; line-height: 1.5; color: #4b5563; margin-top: 0;">You've received cryptocurrency via EmailPay:</p>

                  <!-- Transaction Amount -->
                  <div style="text-align: center; padding: 25px 0; margin: 20px 0; border: 1px solid #f3f4f6; border-radius: 12px; background-color: #fafafa;">
                    <div style="font-size: 42px; font-weight: 700; color: #374151; margin-bottom: 10px;">${formattedAmount} ${transaction.tokenType.toUpperCase()}</div>
                    <div style="font-size: 16px; color: #6b7280;">on ${transaction.network}</div>
                  </div>

                  <!-- Transaction Details Table -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: separate; border-spacing: 0 10px;">
                    <tr>
                      <td width="30%" style="font-size: 15px; font-weight: 600; color: #6b7280; padding: 8px 0;">Status:</td>
                      <td width="70%" style="padding: 8px 0;">
                        <span style="display: inline-block; padding: 6px 12px; font-size: 14px; font-weight: 500; border-radius: 9999px; background-color: ${statusBgColor}; color: ${statusColor}; text-transform: capitalize;">${transaction.status}</span>
                      </td>
                    </tr>
                    ${transaction.txHash ? `
                    <tr>
                      <td width="30%" style="font-size: 15px; font-weight: 600; color: #6b7280; padding: 8px 0;">Transaction Hash:</td>
                      <td width="70%" style="font-size: 15px; padding: 8px 0; word-break: break-all; color: #4b5563;">
                        <code style="font-family: monospace; background-color: #f3f4f6; padding: 4px 6px; border-radius: 4px;">${transaction.txHash}</code>
                        <a href="${sepoliaExplorerUrl}" target="_blank" style="display: inline-block; margin-left: 8px; color: #4F46E5; text-decoration: none; font-size: 14px;">View on Sepolia Explorer</a>
                      </td>
                    </tr>
                    ` : ''}
                  </table>

                  <!-- Message Section -->
                  ${transaction.message ? `
                  <div style="margin-top: 25px; border-top: 1px solid #f3f4f6; padding-top: 25px;">
                    <p style="font-size: 15px; font-weight: 600; color: #6b7280; margin-top: 0; margin-bottom: 10px;">Message:</p>
                    <div style="padding: 15px; background-color: #f9fafb; border-radius: 8px; font-size: 15px; line-height: 1.5; color: #4b5563;">${transaction.message || 'No message provided.'}</div>
                  </div>
                  ` : ''}

                  <!-- Helpful Note -->
                  <div style="margin-top: 30px; padding: 20px; background-color: rgba(79, 70, 229, 0.05); border-radius: 8px; border-left: 4px solid #8a2be2;">
                    <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                      <strong style="color: #8a2be2;">Congratulations!</strong> Your digital assets have been transferred securely and are ready to use.
                    </p>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                      <strong style="color: #8a2be2;">Important:</strong> To access your cryptocurrency, you must log in to EmailPay using this email address.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #f3f4f6;">
                  <p style="font-size: 13px; color: #6b7280; margin: 0; text-align: center;">This is an automated email from EmailPay. Please do not reply to this email.</p>
                </td>
              </tr>

              <!-- App Promotion -->
              <tr>
                <td style="padding: 25px 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
                  <p style="font-size: 14px; font-weight: 500; color: #4b5563; margin: 0 0 15px;">Send cryptocurrency to anyone with just an email</p>
                  <a href="https://emailpay.app" style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #8a2be2, #4169e1); color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Try EmailPay Today</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Send notification email for a new transaction
export const sendTransactionEmail = async (transaction: Transaction): Promise<boolean> => {
  try {
    // Prepare recipients lists
    const to = transaction.toRecipients.map((r: Recipient) => r.email).join(',');
    const cc = transaction.ccRecipients?.map((r: Recipient) => r.email).join(',') || undefined;
    const bcc = transaction.bccRecipients?.map((r: Recipient) => r.email).join(',') || undefined;

    if (!to) {
      console.error('No recipients found for transaction email');
      return false;
    }

    // Use environment variables or default values
    const senderEmail = process.env.EMAIL_USER || 'emailpay.pvt.limited@gmail.com';

    // Send email
    const info = await transporter.sendMail({
      from: `"EmailPay" <${senderEmail}>`,
      to,
      cc,
      bcc,
      subject: transaction.subject || 'New Transaction from EmailPay',
      html: formatEmailBody(transaction),
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending transaction email:', error);
    return false;
  }
};
