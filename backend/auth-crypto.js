const { randomBytes, scrypt, timingSafeEqual, createHmac, createHash } = require("node:crypto");
const { promisify } = require("node:util");
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  // Also run scrypt for unknown users to limit username enumeration by timing.
  const fallback = "scrypt:0123456789abcdef0123456789abcdef:" + "0".repeat(128);
  const parts = (typeof stored === "string" ? stored : fallback).split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hexHash] = parts;
  const actual = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hexHash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function makeOneTimeCode() {
  const { randomInt } = require("node:crypto");
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

function hashCode(challengeId, code) {
  return createHmac("sha256", process.env.AUTH_OTP_SECRET)
    .update(`${challengeId}:${code}`)
    .digest("hex");
}

function safeHashMatch(a, b) {
  const aa = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return aa.length === 32 && bb.length === 32 && timingSafeEqual(aa, bb);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

module.exports = {
  hashPassword,
  verifyPassword,
  makeOneTimeCode,
  hashCode,
  safeHashMatch,
  hashToken,
  randomBytes,
};