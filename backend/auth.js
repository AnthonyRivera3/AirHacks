// Username + password, followed by an emailed one-time code.
// No self-service registration: users are created only by scripts/add-user.js.
const express = require("express");
const nodemailer = require("nodemailer");
const { db } = require("./auth-db");
const {
  verifyPassword,
  makeOneTimeCode,
  hashCode,
  safeHashMatch,
  hashToken,
  randomBytes,
} = require("./auth-crypto");

if (!process.env.AUTH_OTP_SECRET || process.env.AUTH_OTP_SECRET.length < 32) {
  throw new Error("Set AUTH_OTP_SECRET in backend/.env (32+ random characters).");
}

const router = express.Router();
const CODE_LIFETIME_MS = 10 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const SESSION_COOKIE = "airhacks_session";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const secureCookies = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: secureCookies,
  path: "/",
};

// Blocks browser-initiated cross-origin writes from an unapproved website.
// Keep frontend and backend on the same site when deploying.
function requireFrontendOrigin(req, res, next) {
  const origin = req.get("origin");
  if (origin && origin !== FRONTEND_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  next();
}

function trimAttempts(now) {
  db.prepare("DELETE FROM login_attempts WHERE created_at < ?")
    .run(now - LOGIN_WINDOW_MS);
}

function overLimit(key, limit, now) {
  const row = db.prepare(
    "SELECT COUNT(*) AS count FROM login_attempts WHERE attempt_key = ? AND created_at >= ?"
  ).get(key, now - LOGIN_WINDOW_MS);
  return row.count >= limit;
}

function logAttempt(key, now) {
  db.prepare("INSERT INTO login_attempts (attempt_key, created_at) VALUES (?, ?)")
    .run(key, now);
}

function maskedAddress(email) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "your saved email address";
  return `${local.slice(0, 1)}${"*".repeat(Math.min(Math.max(local.length - 1, 2), 5))}@${domain}`;
}

let mailer;
function smtpTransport() {
  if (mailer) return mailer;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (![SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM].every(Boolean)) {
    throw new Error("Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env");
  }
  const port = Number(process.env.SMTP_PORT || 587);
  mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return mailer;
}

async function emailCode(to, code) {
  await smtpTransport().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Your AirHacks sign-in code",
    text: `Your AirHacks verification code is: ${code}\n\n` +
      "This code expires in 10 minutes. If you didn't try to sign in, ignore this email.",
  });
}

// POST /api/auth/start — verify password, email a short-lived code.
router.post("/start", requireFrontendOrigin, async (req, res) => {
  const username = typeof req.body?.username === "string"
    ? req.body.username.trim().slice(0, 80) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username) || password.length < 1 || password.length > 256) {
    return res.status(400).json({ error: "Enter your username and password." });
  }

  const now = Date.now();
  trimAttempts(now);
  const ipKey = `ip:${req.ip}`;
  const userKey = `user:${username.toLowerCase()}`;
  if (overLimit(ipKey, 30, now) || overLimit(userKey, 8, now)) {
    return res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
  }
  logAttempt(ipKey, now);
  logAttempt(userKey, now);

  const user = db.prepare("SELECT * FROM users WHERE username = ? AND active = 1")
    .get(username);
  let passwordOk = false;
  try {
    passwordOk = await verifyPassword(password, user?.password_hash);
  } catch (error) {
    console.error("Password verification failed:", error.message);
    return res.status(500).json({ error: "Unable to sign in right now." });
  }
  if (!user || !passwordOk) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const previous = db.prepare(
    "SELECT created_at FROM login_challenges WHERE user_id = ?"
  ).get(user.id);
  if (previous && previous.created_at > now - 60 * 1000) {
    return res.status(429).json({ error: "A code was recently sent. Check your email or try again in one minute." });
  }

  const challengeId = randomBytes(24).toString("base64url");
  const code = makeOneTimeCode();
  // HMAC uses a server-only secret, preventing offline guessing from a database dump.
  const codeHash = hashCode(challengeId, code);

  db.transaction(() => {
    db.prepare("DELETE FROM login_challenges WHERE user_id = ?").run(user.id);
    db.prepare(`INSERT INTO login_challenges
      (id, user_id, code_hash, expires_at, created_at, attempts)
      VALUES (?, ?, ?, ?, ?, 0)`)
      .run(challengeId, user.id, codeHash, now + CODE_LIFETIME_MS, now);
  })();

  try {
    await emailCode(user.email, code);
  } catch (error) {
    db.prepare("DELETE FROM login_challenges WHERE id = ?").run(challengeId);
    console.error("AirHacks SMTP delivery error:", error.message);
    return res.status(503).json({ error: "We couldn't send your verification email. Please try again later." });
  }

  return res.json({
    challengeId,
    maskedEmail: maskedAddress(user.email),
    expiresInSeconds: 600,
  });
});

// POST /api/auth/verify — verify code, issue HttpOnly session cookie.
router.post("/verify", requireFrontendOrigin, (req, res) => {
  const challengeId = typeof req.body?.challengeId === "string"
    ? req.body.challengeId : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!/^[a-zA-Z0-9_-]{32}$/.test(challengeId) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Enter a valid six-digit code." });
  }

  const now = Date.now();
  const challenge = db.prepare(`
    SELECT c.*, u.username, u.active, u.id AS account_id
    FROM login_challenges c JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `).get(challengeId);

  if (!challenge || challenge.expires_at < now || challenge.attempts >= 5 || !challenge.active) {
    if (challenge) db.prepare("DELETE FROM login_challenges WHERE id = ?").run(challengeId);
    return res.status(401).json({ error: "Code expired or invalid. Start sign-in again." });
  }

  const matches = safeHashMatch(hashCode(challengeId, code), challenge.code_hash);
  if (!matches) {
    db.prepare("UPDATE login_challenges SET attempts = attempts + 1 WHERE id = ?")
      .run(challengeId);
    if (challenge.attempts + 1 >= 5) {
      db.prepare("DELETE FROM login_challenges WHERE id = ?").run(challengeId);
    }
    return res.status(401).json({ error: "Incorrect code. Check your email and try again." });
  }

  const token = randomBytes(32).toString("base64url");
  db.transaction(() => {
    db.prepare("DELETE FROM login_challenges WHERE user_id = ?").run(challenge.user_id);
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
    db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)`)
      .run(hashToken(token), challenge.user_id, now + SESSION_LIFETIME_MS, now);
  })();

  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_LIFETIME_MS });
  return res.json({ authenticated: true, username: challenge.username });
});

function sessionFromRequest(req) {
  const cookies = (req.headers.cookie || "").split(";");
  let token = "";
  for (const entry of cookies) {
    const index = entry.indexOf("=");
    if (index < 0) continue;
    if (entry.slice(0, index).trim() === SESSION_COOKIE) {
      token = entry.slice(index + 1).trim();
      break;
    }
  }
  if (!/^[a-zA-Z0-9_-]{43}$/.test(token)) return null;
  return db.prepare(`
    SELECT s.user_id, u.username FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1
  `).get(hashToken(token), Date.now()) || null;
}

function requireAuth(req, res, next) {
  const session = sessionFromRequest(req);
  if (!session) return res.status(401).json({ error: "Please sign in." });
  req.authUser = session;
  next();
}

router.get("/me", (req, res) => {
  const session = sessionFromRequest(req);
  if (!session) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, username: session.username });
});

router.post("/logout", requireFrontendOrigin, (req, res) => {
  const cookies = (req.headers.cookie || "").split(";");
  for (const entry of cookies) {
    const [name, ...rest] = entry.trim().split("=");
    if (name === SESSION_COOKIE && rest.length) {
      const token = rest.join("=");
      if (/^[a-zA-Z0-9_-]{43}$/.test(token)) {
        db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
      }
    }
  }
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  return res.json({ authenticated: false });
});

module.exports = { authRouter: router, requireAuth };