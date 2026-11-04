// Usage: node scripts/add-user.js chosen_username friend@example.com
// Prompts twice for a password without printing it to the terminal.
require("dotenv").config({ path: require("node:path").resolve(__dirname, "..", ".env") });
const { db } = require("../auth-db");
const { hashPassword } = require("../auth-crypto");

function hiddenPrompt(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("Run this in an interactive terminal to enter the password securely."));
      return;
    }
    process.stdout.write(prompt);
    let input = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    function cleanup() {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    }
    function onData(ch) {
      if (ch === "\r" || ch === "\n") {
        cleanup();
        resolve(input);
      } else if (ch === "\u0003") {
        cleanup();
        reject(new Error("Canceled."));
      } else if (ch === "\u007f" || ch === "\b") {
        input = input.slice(0, -1);
      } else if (ch.length === 1 && ch >= " ") {
        input += ch;
      }
    }
    process.stdin.on("data", onData);
  });
}

async function main() {
  const username = (process.argv[2] || "").trim();
  const email = (process.argv[3] || "").trim().toLowerCase();
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: node scripts/add-user.js username person@example.com");
  }
  const password = await hiddenPrompt("New password (12+ characters, hidden): ");
  if (password.length < 12 || password.length > 256) {
    throw new Error("Password must be 12–256 characters.");
  }
  const confirm = await hiddenPrompt("Confirm password (hidden): ");
  if (password !== confirm) throw new Error("Passwords did not match.");

  const passwordHash = await hashPassword(password);
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    throw new Error("Username already exists. Choose another username.");
  }
  db.prepare(`INSERT INTO users (username, email, password_hash, active, created_at)
              VALUES (?, ?, ?, 1, ?)`)
    .run(username, email, passwordHash, Date.now());
  console.log(`Added invite-only account: ${username} (${email})`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });