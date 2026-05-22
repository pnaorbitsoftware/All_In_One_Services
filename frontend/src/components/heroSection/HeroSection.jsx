import "./HeroSection.css";
import { Search } from "lucide-react";

export default function HeroSection({
  searchTerm,
  onSearchChange,
}) {
  return (
    <section className="hero">

      <h1>
        Find Trusted Local Services Near You
      </h1>

      <p>
        Book professional plumbers, electricians,
        carpenters, cleaners and more with
        trusted ratings and fast service.
      </p>

      <div className="search-box">

        <Search className="search-icon" />

        <input
          type="text"
          placeholder="Search plumber, electrician..."
          value={searchTerm}
          onChange={(event) =>
            onSearchChange?.(event.target.value)
          }
        />

        <button
          type="button"
          onClick={() =>
            document
              .getElementById("services")
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
        >
          Search
        </button>

      </div>

    </section>
  );
}