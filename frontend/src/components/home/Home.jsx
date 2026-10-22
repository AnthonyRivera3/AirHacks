
import "./Home.css";
import "./Home-mobile.css";

function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-eyebrow">YOUR JOURNEY STARTS HERE</p>

          <h1>
            The world is waiting.
            <br />
            <span>Let's get you there.</span>
          </h1>

          <p className="home-description">
            Discover destinations, compare flights, and find your next
            adventure with AirHacks.
          </p>

          <a href="/search-flights" className="home-cta">
            Explore Flights <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="home-intro">
        <p className="home-eyebrow">TRAVEL YOUR WAY</p>
        <h2>Every great trip starts with a destination.</h2>
        <p>
          Whether you're planning a weekend getaway or the trip of a lifetime,
          AirHacks helps you get started.
        </p>
      </section>

      <section id="about" className="home-about">
        <p className="home-eyebrow">ABOUT AIRHACKS</p>
        <h2>Better flight searches. Bigger adventures.</h2>
        <p>
          AirHacks brings flight discovery and deal hunting together, helping
          travelers explore their options and plan their next journey.
        </p>
      </section>
    </div>
  );
}

export default Home;
