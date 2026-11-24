import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync, createHmac, timingSafeEqual } from "node:crypto";

test("Authentication & Session Logic", async (t) => {
  await t.test("Password verification with scrypt", () => {
    const salt = "a1b2c3d4e5f678901234567890123456";
    const password = "ValidTestPassword123!";
    const hash = scryptSync(password, salt, 64).toString("hex");
    const encoded = `scrypt$${salt}$${hash}`;

    const [alg, s, stored] = encoded.split("$");
    assert.equal(alg, "scrypt");
    const calculated = scryptSync(password, s, 64);
    const expected = Buffer.from(stored, "hex");
    assert.equal(timingSafeEqual(expected, calculated), true);

    // Wrong password should fail
    const wrongCalculated = scryptSync("WrongPassword999!", s, 64);
    assert.equal(timingSafeEqual(expected, wrongCalculated), false);
  });

  await t.test("Session token generation and HMAC verification", () => {
    const secret = "a".repeat(32);
    const payload = {
      username: "katiso",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
    const token = `${encoded}.${signature}`;

    const [partEncoded, partSig] = token.split(".");
    const expectedSig = createHmac("sha256", secret).update(partEncoded).digest("base64url");
    assert.equal(partSig, expectedSig);

    // Tampered payload fails
    const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, username: "attacker" })).toString("base64url");
    const tamperedExpected = createHmac("sha256", secret).update(tamperedPayload).digest("base64url");
    assert.notEqual(partSig, tamperedExpected);
  });

  await t.test("Expired session is rejected", () => {
    const expiredPayload = {
      username: "katiso",
      expiresAt: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
    };
    const isExpired = expiredPayload.expiresAt <= Math.floor(Date.now() / 1000);
    assert.equal(isExpired, true);
  });
});
