
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password || password.length < 12) {
  console.error(
    'Usage: npm run admin:hash -- "A-strong-password-at-least-12-chars"'
  );
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

const encodedHash = ["scrypt", salt, hash].join("$");

// Escape dollar signs for Next.js environment files.
const envSafeHash = encodedHash.replaceAll("$", "\\$");

console.log(`ADMIN_PASSWORD_HASH=${envSafeHash}`);
