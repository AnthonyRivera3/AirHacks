
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getLoggedInUser } from "./authApi";

export default function RequireAuth({ children }) {
  const location = useLocation();

  const [auth, setAuth] = useState({
    status: "checking",
    path: location.pathname,
    message: "",
  });

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setAuth({
      status: "checking",
      path: location.pathname,
      message: "",
    });

    async function checkSession() {
      try {
        await getLoggedInUser(controller.signal);

        if (!active) return;

        setAuth({
          status: "allowed",
          path: location.pathname,
          message: "",
        });
      } catch (error) {
        if (!active || error.name === "AbortError") {
          return;
        }

        if (error.status === 401) {
          setAuth({
            status: "denied",
            path: location.pathname,
            message: "",
          });
        } else {
          setAuth({
            status: "error",
            path: location.pathname,
            message:
              "We couldn't connect to AirHacks to verify your session. Check your internet connection and try again.",
          });
        }
      }
    }

    checkSession();

    return () => {
      active = false;
      controller.abort();
    };
  }, [location.pathname, retryCount]);

  const status =
    auth.path === location.pathname
      ? auth.status
      : "checking";

  if (status === "checking") {
    return (
      <main
        role="status"
        aria-live="polite"
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "36px",
          }}
          aria-hidden="true"
        >
          ✈
        </span>

        <h2>Checking your AirHacks session...</h2>

        <p>Please wait while we verify your login.</p>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (status === "error") {
    return (
      <main
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          background: "#f5f9fd",
        }}
      >
        <section
          role="alert"
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "36px 28px",
            borderRadius: "18px",
            border: "1px solid #dce6ef",
            background: "#ffffff",
            boxShadow:
              "0 12px 35px rgba(16,43,70,0.08)",
            textAlign: "center",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: "42px",
              marginBottom: "14px",
            }}
          >
            📡
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "1.65rem",
              color: "#102b46",
            }}
          >
            Connection lost
          </h1>

          <p
            style={{
              color: "#64768a",
              lineHeight: 1.7,
              marginBottom: "24px",
            }}
          >
            {auth.message}
          </p>

          <button
            type="button"
            onClick={() => {
              setAuth({
                status: "checking",
                path: location.pathname,
                message: "",
              });

              setRetryCount((count) => count + 1);
            }}
            style={{
              minHeight: "48px",
              padding: "12px 26px",
              border: "none",
              borderRadius: "10px",
              background: "#1478c9",
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ↻ Retry Connection
          </button>
        </section>
      </main>
    );
  }

  return children;
}
