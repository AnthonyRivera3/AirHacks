
/* =========================================
   AIRHACKS — AUTHENTICATION API
   Username + Password + Email Verification
========================================= */

// Keep all authentication calls on the backend.
// Never store passwords or verification codes in localStorage.

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

/* =========================================
   SHARED API REQUEST FUNCTION
========================================= */

async function request(
  path,
  { method = "GET", body, signal } = {}
) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,

      // Include the authenticated session cookie.
      // Required for Vercel frontend -> Render backend.
      credentials: "include",

      headers: body
        ? {
            "Content-Type": "application/json",
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          },

      body: body !== undefined
        ? JSON.stringify(body)
        : undefined,

      signal,
    });
  } catch (error) {
    // Ignore intentionally canceled requests.
    if (error.name === "AbortError") {
      throw error;
    }

    // A network failure is NOT an invalid login.
    const networkError = new Error(
      "Cannot reach the AirHacks server. Check your internet connection and try again."
    );

    networkError.status = 0;
    throw networkError;
  }

  // Read the backend response.
  const payload = await response
    .json()
    .catch(() => ({}));

  /* =========================================
     HANDLE HTTP ERRORS
  ========================================= */

  if (!response.ok) {
    const error = new Error(
      payload.error ||
        "Something went wrong. Please try again."
    );

    // Preserve the HTTP status code.
    // RequireAuth uses this to distinguish
    // unauthorized sessions from connection failures.
    error.status = response.status;

    throw error;
  }

  return payload;
}

/* =========================================
   STEP 1 — USERNAME + PASSWORD
========================================= */

export const startLogin = (username, password) =>
  request("/api/auth/start", {
    method: "POST",
    body: {
      username,
      password,
    },
  });

/* =========================================
   STEP 2 — EMAIL VERIFICATION CODE
========================================= */

export const verifyLoginCode = (challengeId, code) =>
  request("/api/auth/verify", {
    method: "POST",
    body: {
      challengeId,
      code,
    },
  });

/* =========================================
   CHECK CURRENT LOGIN SESSION
========================================= */

export const getLoggedInUser = (signal) =>
  request("/api/auth/me", {
    method: "GET",
    signal,
  });

/* =========================================
   LOG OUT USER
========================================= */

export const signOut = () =>
  request("/api/auth/logout", {
    method: "POST",
  });
