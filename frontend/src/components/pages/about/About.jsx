
import { Link } from "react-router-dom";
import "./About.css";
import "./About-mobile.css";

// Founder photo stored in frontend/public/images/
const FOUNDER_IMAGE = "/images/founder.PNG";

export default function About() {
  return (
    <main className="ah-about-page">
      <div className="ah-about-glow" aria-hidden="true" />

      {/* =========================================
          FOUNDER INTRODUCTION
      ========================================= */}

      <section
        className="ah-about-intro"
        aria-labelledby="ah-about-heading"
      >
        {/* LEFT SIDE — FOUNDER STORY */}

        <div className="ah-about-copy">
          <span className="ah-about-eyebrow">
            <span
              className="ah-about-eyebrow-line"
              aria-hidden="true"
            />
            THE STORY BEHIND AIRHACKS
          </span>

          <h1 id="ah-about-heading">
            Travel should feel <em>possible.</em>
            <span>Not overpriced.</span>
          </h1>

          <p className="ah-about-lead">
            I started AirHacks with one goal: make it easier
            for people to find flights without feeling like
            the system is working against them.
          </p>

          <blockquote className="ah-about-quote">
            <span
              className="ah-about-quote-mark"
              aria-hidden="true"
            >
              “
            </span>

            <p>
              I built AirHacks to help people spend less
              getting there — and more on the memories
              they make.
            </p>

            <footer>— Founder, Mr. Rivera</footer>
          </blockquote>

          <div className="ah-about-actions">
            <Link
              className="ah-about-primary"
              to="/search-flights"
            >
              Find your next flight
              <span aria-hidden="true">↗</span>
            </Link>

            <a
              className="ah-about-secondary"
              href="#our-mission"
            >
              Explore the mission
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        {/* RIGHT SIDE — FOUNDER PHOTO */}

        <div className="ah-about-visual">
          <div className="ah-about-photo-frame">
            <img
              src={FOUNDER_IMAGE}
              alt="Founder of AirHacks"
              className="ah-about-founder-photo"
              onError={(event) => {
                event.currentTarget.style.display = "none";

                const placeholder =
                  event.currentTarget.nextElementSibling;

                if (placeholder) {
                  placeholder.hidden = false;
                }
              }}
            />

            {/* Visible only if the photo cannot load */}
            <div
              className="ah-about-photo-placeholder"
              hidden
            >
              <span
                className="ah-about-placeholder-icon"
                aria-hidden="true"
              >
                ✈
              </span>

              <strong>Your photo goes here</strong>

              <span>
                frontend/public/images/founder.PNG
              </span>
            </div>

            <div className="ah-about-photo-caption">
              <span className="ah-about-caption-dot" />
              THE PERSON BEHIND THE MISSION
            </div>
          </div>

          <div
            className="ah-about-orbit"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* =========================================
          AIRHACKS MISSION
      ========================================= */}

      <section
        className="ah-about-mission"
        id="our-mission"
        aria-labelledby="ah-about-mission-heading"
      >
        <div className="ah-about-mission-header">
          <span className="ah-about-section-label">
            OUR MISSION
          </span>

          <h2 id="ah-about-mission-heading">
            More transparency.
            <span> More takeoffs.</span>
          </h2>

          <p>
            Finding a flight shouldn't mean sorting through
            confusing prices or wondering whether there's
            a better option somewhere else.

            AirHacks brings flight options together so
            travelers can compare more confidently and
            decide what works for them.
          </p>
        </div>

        <div className="ah-about-values">
          <article className="ah-about-value">
            <span className="ah-about-value-number">
              01
            </span>

            <h3>Challenge the pricing game</h3>

            <p>
              Give travelers a clearer view of available
              fares instead of letting opaque pricing
              experiences make the decision for them.
            </p>
          </article>

          <article className="ah-about-value">
            <span className="ah-about-value-number">
              02
            </span>

            <h3>Put choice back in your hands</h3>

            <p>
              Compare routes, travel times, airlines,
              and booking options in one place — then
              choose what's right for you.
            </p>
          </article>

          <article className="ah-about-value">
            <span className="ah-about-value-number">
              03
            </span>

            <h3>Make room for adventure</h3>

            <p>
              When travel is more accessible, there
              are more chances to discover new places
              and make lasting memories.
            </p>
          </article>
        </div>
      </section>

      {/* =========================================
          FINAL CALL TO ACTION
      ========================================= */}

      <section
        className="ah-about-outro"
        aria-label="Explore AirHacks"
      >
        <p>Less guesswork. More world.</p>

        <Link to="/deals">
          Discover flight deals
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
