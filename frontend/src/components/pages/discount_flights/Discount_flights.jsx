
import "./Discount_flights.css";
import "./Discount_flights-mobile.css";

function DiscountFlights() {
  return (
    <main className="discount-flights-page">
      <section className="discount-flights-hero">
        <div className="discount-flights-hero-content">
          <p className="discount-flights-eyebrow">
            <span aria-hidden="true">✈</span>
            TRAVEL FOR LESS
          </p>

          <h1>Flight Deals</h1>

          <p className="discount-flights-subtitle">
            Discover your next adventure with flight deals
            worth taking off for.
          </p>
        </div>
      </section>

      <section
        className="discount-flights-empty"
        aria-labelledby="discount-flights-empty-title"
      >
        <div
          className="discount-flights-price-field"
          aria-hidden="true"
        >
          <span className="deal-float deal-float-1">−35%</span>
          <span className="deal-float deal-float-2">−20%</span>
          <span className="deal-float deal-float-3">−48%</span>
          <span className="deal-float deal-float-4">−15%</span>

          <div className="deal-price-card deal-price-card-1">
            <span className="deal-route">NYC → LAX</span>
            <span className="deal-old-price">$420</span>
            <span className="deal-new-price">$273</span>
            <span className="deal-price-arrow">↓</span>
          </div>

          <div className="deal-price-card deal-price-card-2">
            <span className="deal-route">NYC → MIA</span>
            <span className="deal-old-price">$310</span>
            <span className="deal-new-price">$199</span>
            <span className="deal-price-arrow">↓</span>
          </div>

          <div className="deal-price-card deal-price-card-3">
            <span className="deal-route">LAX → SFO</span>
            <span className="deal-old-price">$180</span>
            <span className="deal-new-price">$99</span>
            <span className="deal-price-arrow">↓</span>
          </div>

          <span className="deal-orbit deal-orbit-1" />
          <span className="deal-orbit deal-orbit-2" />
        </div>

        <p className="discount-flights-demo-label">
          Sample prices for design preview
        </p>

        <h2 id="discount-flights-empty-title">
          Great trips start here.
        </h2>

        <p>
          We're getting ready to find deals for your next destination.
          Check back soon for your next getaway.
        </p>

        <span className="discount-flights-note">
          <span aria-hidden="true">✦</span>
          New adventures are on the horizon
        </span>
      </section>
    </main>
  );
}

export default DiscountFlights;
