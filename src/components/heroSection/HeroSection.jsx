import "./HeroSection.css";
import { Search } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="hero">

      <h1>
        Find Trusted Local Services
      </h1>

      <p>
        Search plumbers, electricians, carpenters and more.
      </p>

      <div className="search-box">

        <Search className="search-icon" />

        <input
          type="text"
          placeholder="Search plumber, electrician..."
        />

        <button>
          Search
        </button>

      </div>

    </section>
  );
}