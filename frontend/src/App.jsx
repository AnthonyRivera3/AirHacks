
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import { Navigate } from "react-router-dom";
import Login from "./components/login/Login";

import Navbar from "./components/navbar/Navbar";
import Home from "./components/home/Home";
import SearchFlights from "./components/pages/search_flights/Search_flights";
import DiscountFlights from "./components/pages/discount_flights/Discount_flights";

import "./App.css";



function RequireLogin({ children }) {
  const isLoggedIn =
    sessionStorage.getItem("airhacks-demo-login") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ScrollHandler() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash === "#about") {
      // Wait for the Home page to render before scrolling to About.
      requestAnimationFrame(() => {
        document.getElementById("about")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <>
      <ScrollHandler />

      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <RequireLogin>
                <Home />
              </RequireLogin>
            }
          />

          <Route
            path="/search-flights"
            element={
              <RequireLogin>
                <SearchFlights />
              </RequireLogin>
            }
          />

          <Route
            path="/deals"
            element={
              <RequireLogin>
                <DiscountFlights />
              </RequireLogin>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
