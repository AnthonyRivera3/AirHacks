
import "./Discount_flights.css";
import "./Discount_flights-mobile.css";

function DiscountFlights() {
  return (
    <section className="discount-flights-page">
      <div className="discount-flights-heading">
        <p className="discount-flights-eyebrow">TRAVEL FOR LESS</p>
        <h1>Flight Deals</h1>
        <p>
          Discover your next adventure with flight deals worth taking off for.
        </p>
      </div>

      <div className="discount-flights-empty">
        <span className="discount-flights-plane" aria-hidden="true">
          ✈
        </span>
        <h2>Great trips start here.</h2>
        <p>
          We're getting ready to find deals for your next destination.
        </p>
      </div>
    </section>
  );
}

export default DiscountFlights;
