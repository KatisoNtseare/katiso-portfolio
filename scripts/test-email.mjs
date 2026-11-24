import { Resend } from "resend";

const targetRecipient = process.argv[2]?.trim() || process.env.CONTACT_TO_EMAIL?.trim();
const apiKey = process.env.RESEND_API_KEY?.trim();
const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();

console.log("=======================================");
console.log("         EXPLICIT EMAIL TEST           ");
console.log("=======================================\n");

if (!apiKey) {
  console.error("Error: RESEND_API_KEY is not configured in .env.local.");
  process.exit(1);
}

if (!fromEmail) {
  console.error("Error: CONTACT_FROM_EMAIL is not configured in .env.local.");
  process.exit(1);
}

if (!targetRecipient) {
  console.error("Error: No recipient specified. Provide one: npm run email:test -- your-email@example.com");
  process.exit(1);
}

console.log(`Configured Sender:    ${fromEmail}`);
console.log(`Target Recipient:     ${targetRecipient}`);
console.log(`Timestamp:            ${new Date().toISOString()}`);
console.log("\nAttempting to send test email through Resend API...");

const resend = new Resend(apiKey);

try {
  const response = await resend.emails.send({
    from: fromEmail,
    to: [targetRecipient],
    subject: `[Portfolio Test] Resend Email Delivery Check - ${new Date().toLocaleTimeString()}`,
    text: [
      "Hello Katiso,",
      "",
      "This is an automated test message sent from your personal portfolio via the Resend SDK.",
      "If you are reading this email in your inbox, your email delivery pipeline is fully functional!",
      "",
      `Sender:    ${fromEmail}`,
      `Recipient: ${targetRecipient}`,
      `Timestamp: ${new Date().toISOString()}`,
      "",
      "Regards,",
      "Katiso Ntseare Portfolio System",
    ].join("\n"),
  });

  if (response.error) {
    console.error("\n❌ Resend Provider Error:");
    console.error(`   Status Code: ${response.error.statusCode}`);
    console.error(`   Error Name:  ${response.error.name}`);
    console.error(`   Message:     ${response.error.message}`);
    console.error("\nTroubleshooting:");
    if ((response.error.message || "").includes("not verified")) {
      console.error("-> The sender domain is not verified yet. Visit https://resend.com/domains to add DNS records.");
    } else if ((response.error.message || "").includes("testing emails")) {
      console.error("-> In test mode, Resend only allows sending to the email registered on your Resend account.");
    }
    process.exit(1);
  }

  if (!response.data || !response.data.id) {
    console.error("\n❌ Unexpected Result: No email ID returned by Resend.");
    process.exit(1);
  }

  console.log("\n✅ Email send request accepted by Resend!");
  console.log(`   Resend Email ID: ${response.data.id}`);
  console.log(`   Destination:     ${targetRecipient}`);
  console.log("\nNote: Please allow a few moments for DNS and mail delivery to reach your inbox.");
} catch (err) {
  console.error("\n❌ Client Exception:", err.message);
  process.exit(1);
}
