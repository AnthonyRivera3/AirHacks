
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/navbar/Navbar";
import Home from "./components/home/Home";
import SearchFlights from "./components/pages/search_flights/Search_flights";
import DiscountFlights from "./components/pages/discount_flights/Discount_flights";

import "./App.css";

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
          <Route path="/" element={<Home />} />
          <Route path="/search-flights" element={<SearchFlights />} />
          <Route path="/deals" element={<DiscountFlights />} />

          {/* Unknown URLs return to the homepage. */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
