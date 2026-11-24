import { Resend } from "resend";

function isValidEmail(email) {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
}

function parseSender(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const angleMatch = trimmed.match(/^(?:["']?([^"']+)["']?\s+)?<([^>]+)>$/);
  if (angleMatch) {
    const email = angleMatch[2].trim();
    return isValidEmail(email) ? { name: angleMatch[1]?.trim(), email } : null;
  }
  return isValidEmail(trimmed) ? { email: trimmed } : null;
}

console.log("=======================================");
console.log("       RESEND EMAIL CONFIG CHECK       ");
console.log("=======================================\n");

const apiKey = process.env.RESEND_API_KEY?.trim();
const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();

let hasErrors = false;

// 1. API Key Check
if (!apiKey) {
  console.log("❌ RESEND_API_KEY: Missing in environment.");
  hasErrors = true;
} else if (!apiKey.startsWith("re_")) {
  console.log("❌ RESEND_API_KEY: Invalid format (must begin with 're_').");
  hasErrors = true;
} else {
  console.log(`✅ RESEND_API_KEY: Present (starts with 're_', ${apiKey.length} characters)`);
}

// 2. Recipient Address Check
if (!toEmail) {
  console.log("❌ CONTACT_TO_EMAIL: Missing in environment.");
  hasErrors = true;
} else if (!isValidEmail(toEmail)) {
  console.log(`❌ CONTACT_TO_EMAIL: Invalid email address ('${toEmail}')`);
  hasErrors = true;
} else {
  console.log(`✅ CONTACT_TO_EMAIL: ${toEmail}`);
}

// 3. Sender Address Check
if (!fromEmail) {
  console.log("❌ CONTACT_FROM_EMAIL: Missing in environment.");
  hasErrors = true;
} else {
  const parsed = parseSender(fromEmail);
  if (!parsed) {
    console.log(`❌ CONTACT_FROM_EMAIL: Invalid format ('${fromEmail}'). Use 'email@domain' or 'Name <email@domain>'.`);
    hasErrors = true;
  } else {
    const domain = parsed.email.split("@")[1];
    console.log(`✅ CONTACT_FROM_EMAIL: ${fromEmail}`);
    console.log(`   Sender address: ${parsed.email}`);
    console.log(`   Sending domain: ${domain}`);
    if (parsed.name) {
      console.log(`   Display name:   ${parsed.name}`);
    }
  }
}

if (hasErrors) {
  console.log("\n❌ Configuration check failed. Please resolve the errors above in your .env.local file.");
  process.exit(1);
}

// 4. Test Resend API Key Access
console.log("\nConnecting to Resend API...");
const resend = new Resend(apiKey);

try {
  const result = await resend.apiKeys.list();
  if (result.error) {
    if (result.error.statusCode === 401 && result.error.name === "restricted_api_key") {
      console.log("✅ API Key Permission: Valid (Restricted to email sending - Recommended for production).");
    } else {
      console.log(`❌ API Key Check Failed: [${result.error.statusCode}] ${result.error.message}`);
      process.exit(1);
    }
  } else {
    console.log("✅ API Key Permission: Valid (Full access key).");
  }
} catch (err) {
  console.log(`❌ Network / API Error: ${err.message}`);
  process.exit(1);
}

// 5. Test Sender Verification Status
console.log("\nTesting sender domain verification...");
try {
  const parsed = parseSender(fromEmail);
  const domain = parsed.email.split("@")[1];

  const testSendCheck = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    subject: "Resend Configuration Diagnostic Ping",
    text: "Diagnostic check from npm run email:check",
  });

  if (testSendCheck.error) {
    const error = testSendCheck.error;
    if (error.statusCode === 403 && (error.message || "").includes("not verified")) {
      console.log(`⚠️  DOMAIN STATUS: '${domain}' is NOT YET VERIFIED in Resend.`);
      console.log(`   Resend error: ${error.message}`);
      console.log(`   Action required:`);
      console.log(`   1. Open https://resend.com/domains`);
      console.log(`   2. Add domain: '${domain}'`);
      console.log(`   3. Add the required DNS records (DKIM, SPF, MX) to your DNS host for '${domain}'.`);
      console.log(`   ℹ️ Note: Using '${domain}' (subdomain) will NOT affect your root domain Zoho Mail setup.`);
    } else if (error.statusCode === 403 && (error.message || "").includes("testing emails")) {
      console.log(`⚠️  TESTING MODE RESTRICTION:`);
      console.log(`   Resend testing sender only allows delivering to the email registered on your Resend account.`);
      console.log(`   Resend message: ${error.message}`);
    } else {
      console.log(`⚠️  Provider response: [${error.statusCode} ${error.name}] ${error.message}`);
    }
  } else if (testSendCheck.data && testSendCheck.data.id) {
    console.log(`🎉 DOMAIN VERIFIED & SEND SUCCESSFUL!`);
    console.log(`   Resend Email ID: ${testSendCheck.data.id}`);
    console.log(`   A test email was successfully created and dispatched to ${toEmail}.`);
  }
} catch (err) {
  console.log(`⚠️  Diagnostic send error: ${err.message}`);
}

console.log("\n=======================================");
console.log("             CHECK FINISHED            ");
console.log("=======================================");
