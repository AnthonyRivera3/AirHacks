
import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./components/login/Login";
import RequireAuth from "./components/login/RequireAuth";

import Navbar from "./components/navbar/Navbar";
import Home from "./components/home/Home";
import SearchFlights from "./components/pages/search_flights/Search_flights";
import DiscountFlights from "./components/pages/discount_flights/Discount_flights";
import About from "./components/pages/about/About";
import "./App.css";

/* =========================================
   AIRHACKS — SCROLL HANDLER
========================================= */

function ScrollHandler() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash === "#about") {
      requestAnimationFrame(() => {
        document.getElementById("about")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [pathname, hash]);

  return null;
}

/* =========================================
   AIRHACKS — MAIN APPLICATION
========================================= */

function App() {
  const location = useLocation();

  // Hide the navbar on the login page.
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <ScrollHandler />

      {/* Show navbar only outside login */}
      {!isLoginPage && <Navbar />}

      <main className="app-main">
        <Routes>

          {/* Public login page */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Protected homepage */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />

          <Route
            path="/about"
            element={
              <RequireAuth>
                <About />
              </RequireAuth>
            }
          />

          {/* Protected flight search */}
          <Route
            path="/search-flights"
            element={
              <RequireAuth>
                <SearchFlights />
              </RequireAuth>
            }
          />

          {/* Protected flight deals */}
          <Route
            path="/deals"
            element={
              <RequireAuth>
                <DiscountFlights />
              </RequireAuth>
            }
          />

          {/* Redirect unknown routes to homepage */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </main>
    </>
  );
}

export default App;
