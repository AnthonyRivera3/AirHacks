import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getLoggedInUser } from "./authApi";

// This controls page navigation. Real protection is the backend session check.
export default function RequireAuth({ children }) {
  const location = useLocation();
  const [state, setState] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();
    setState("checking");
    getLoggedInUser(controller.signal)
      .then(() => setState("allowed"))
      .catch((error) => {
        if (error.name !== "AbortError") setState("denied");
      });
    return () => controller.abort();
  }, [location.pathname]);

  if (state === "checking") {
    return <main role="status" style={{ padding: "5rem 1.5rem", textAlign: "center" }}>
      Checking your AirHacks session...
    </main>;
  }
  if (state === "denied") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
