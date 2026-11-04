// Keep all authentication calls on the backend. No password or OTP in localStorage.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001").replace(/\/$/, "");

async function request(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach the AirHacks server. Check your connection.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Something went wrong. Please try again.");
  }
  return payload;
}

export const startLogin = (username, password) =>
  request("/api/auth/start", { method: "POST", body: { username, password } });
export const verifyLoginCode = (challengeId, code) =>
  request("/api/auth/verify", { method: "POST", body: { challengeId, code } });
export const getLoggedInUser = (signal) =>
  request("/api/auth/me", { signal });
export const signOut = () =>
  request("/api/auth/logout", { method: "POST" });