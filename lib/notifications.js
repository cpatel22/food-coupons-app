import nodemailer from "nodemailer";
import bwipjs from "bwip-js";
import { APP_CONFIG } from "../config";

async function generateBarcodeBase64(text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128", // Barcode type
        text: text, // Text to encode
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: true, // Show human-readable text
        textxalign: "center", // Always good to set this
      },
      function (err, png) {
        if (err) {
          reject(err);
        } else {
          resolve(`cid:barcode_${text}`); // Use CID for inline image
        }
      },
    );
  });
}

// Helper to get raw buffer for attachments
async function generateBarcodeBuffer(text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128",
        text: text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: "center",
      },
      function (err, png) {
        if (err) reject(err);
        else resolve(png);
      },
    );
  });
}

function getCouponHtml(item) {
  return `
        <div style="font-family: 'Courier New', Courier, monospace; width: 300px; padding: 20px; border: 1px dashed #000; margin: 20px auto; background: #fff; color: #000;">
            <h2 style="text-align: center; margin-bottom: 5px; margin-top: 0;">My Restaurant</h2>
            <p style="text-align: center; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; margin: 0;">Food Coupon</p>
            <hr style="border: none; border-top: 1px dashed #000; margin: 15px 0;" />
            
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                <span style="float: left;">${item.name}</span>
                <span style="float: right;">$${item.price.toFixed(2)}</span>
                <div style="clear: both;"></div>
            </div>
            
            <div style="text-align: center; font-weight: bold; font-size: 24px; border: 2px solid #000; padding: 5px; margin: 15px auto; width: 100px;">
                Qty: ${item.qty}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <img src="cid:barcode_${item.code}" alt="Barcode" style="width: 200px;" />
            </div>
            
            <p style="text-align: center; font-style: italic; margin-top: 20px; font-size: 12px;">Enjoy your meal!</p>
        </div>
    `;
}

export async function sendNotifications({ email, phone, items, successUrl }) {
  console.log("sendNotifications triggered for:", {
    email,
    phone,
    itemsCount: items.length,
  });

  if (
    !APP_CONFIG.NOTIFICATIONS.EMAIL_ENABLED &&
    !APP_CONFIG.NOTIFICATIONS.SMS_ENABLED
  ) {
    console.log("Notifications are disabled in config.");
    return;
  }

  // 1. Send Email
  if (APP_CONFIG.NOTIFICATIONS.EMAIL_ENABLED && email) {
    try {
      console.log("Attempting to send email to:", email);
      // Check if SMTP details are provided
      if (!process.env.SMTP_HOST) {
        console.warn(
          "SMTP_HOST is not defined in .env.local. Skipping email notification.",
        );
      } else {
        console.log(
          "Using SMTP Host:",
          process.env.SMTP_HOST,
          "Port:",
          process.env.SMTP_PORT,
        );
        console.log("Success URL for notification:", successUrl);

        const port = parseInt(process.env.SMTP_PORT || "587");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: port,
          // Force secure false for 587 (STARTTLS), true for 465 (SSL/TLS)
          secure: port === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            // Do not fail on invalid certs (common for testing)
            rejectUnauthorized: false,
          },
        });

        // Verify connection configuration
        try {
          await transporter.verify();
          console.log("SMTP connection verified successfully");
        } catch (verifyError) {
          console.error("SMTP Verification failed:", verifyError);
          throw verifyError;
        }

        let couponsHtml = "";
        const attachments = [];

        for (const item of items) {
          couponsHtml += getCouponHtml(item);
          const buffer = await generateBarcodeBuffer(item.code);
          attachments.push({
            filename: `barcode_${item.code}.png`,
            content: buffer,
            cid: `barcode_${item.code}`,
          });
        }

        const mailOptions = {
          from:
            process.env.EMAIL_FROM || '"My Restaurant" <noreply@example.com>',
          to: email,
          subject: "Your Food Coupons - My Restaurant",
          html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                            <h1 style="color: #1a1a1a; text-align: center;">Thank you for your order!</h1>
                            <p style="font-size: 16px; line-height: 1.5; text-align: center;">
                                Your digital coupons are ready. You can access them anytime using the link below:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${successUrl}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View My Coupons</a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                            <p style="text-align: center; color: #666; font-size: 14px;">Or print them directly from this email:</p>
                            <div style="background: #f9f9f9; padding: 10px; border-radius: 12px;">
                                ${couponsHtml}
                            </div>
                        </div>
                    `,
          attachments: attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(
          `Email sent successfully to ${email}. Message ID: ${info.messageId}`,
        );
      }
    } catch (error) {
      console.error("CRITICAL Error sending email:", error);
    }
  }

  // 2. Send SMS
  if (APP_CONFIG.NOTIFICATIONS.SMS_ENABLED && phone) {
    try {
      console.log(
        `[SMS NOTIFICATION] To: ${phone} | Content: Your order is confirmed! View your coupons here: ${successUrl}`,
      );
      // Integration with Twilio/Nexmo would go here
    } catch (error) {
      console.error("Error sending SMS:", error);
    }
  }
}
