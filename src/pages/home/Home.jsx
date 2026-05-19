import "./Home.css";

import Navbar from "../../components/navbar/Navbar";
import HeroSection from "../../components/heroSection/HeroSection";
import CategoryCard from "../../components/categoryCard/CategoryCard";
import ServiceCard from "../../components/serviceCard/ServiceCard";
import Footer from "../../components/footer/Footer";


import { Wrench, Zap, Hammer } from "lucide-react";
import { services } from "../../data/Services";

export default function Home() {
  return (
    <div>

      <Navbar />

      <HeroSection />

      {/* Categories */}
      <section className="categories">

        <h1>
          Popular Categories
        </h1>

        <div className="category-grid">

          <CategoryCard
            icon={<Wrench size={50} />}
            title="Plumber"
            description="Expert plumbing services."
          />

          <CategoryCard
            icon={<Zap size={50} />}
            title="Electrician"
            description="Professional electrical services."
          />

          <CategoryCard
            icon={<Hammer size={50} />}
            title="Carpenter"
            description="Furniture and woodwork specialists."
          />

        </div>

      </section>

      {/* Services */}
      <section className="services-section">

        <h1>
          Top Service Providers
        </h1>

        <div className="services-grid">

          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}

        </div>

      </section>

      <Footer />

    </div>
  );
}