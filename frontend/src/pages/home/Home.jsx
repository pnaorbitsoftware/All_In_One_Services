import "./Home.css";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronDown,
  Clock,
  Hammer,
  IndianRupee,
  MapPin,
  MessageCircle,
  Paintbrush,
  PlugZap,
  Search,
  Sparkles,
  Star,
  Tv,
  Wrench,
  X,
} from "lucide-react";

import Navbar from "../../components/navbar/Navbar";
import AuthModal from "../../components/authModal/AuthModal";
import ServiceModal from "../../components/serviceCard/ServiceModal";
import Footer from "../../components/footer/Footer";
import { services } from "../../data/Services";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categoryHighlights = [
  {
    title: "Electrician",
    icon: PlugZap,
    note: "Wiring, fixtures, safety checks",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Plumber",
    icon: Wrench,
    note: "Leaks, fittings, emergency repairs",
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "AC Repair",
    icon: Sparkles,
    note: "Cleaning, gas refill, installation",
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Cleaning",
    icon: Sparkles,
    note: "Deep home and sofa cleaning",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Painter",
    icon: Paintbrush,
    note: "Interior, exterior, waterproofing",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Carpenter",
    icon: Hammer,
    note: "Furniture, doors, modular fittings",
    image: "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "TV Repair",
    icon: Tv,
    note: "Display, sound, wall mounting",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Appliance Repair",
    icon: BriefcaseBusiness,
    note: "Fridge, TV, washing machine",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&q=80",
  },
];


const faqs = [
  ["How do bookings work?", "Choose a service, submit your preferred date and time, and ServiceHub stores the request for confirmation."],
  ["Do I need an account?", "Yes. Login or register before booking so your dashboard can show all requests securely."],
  ["Can providers manage jobs?", "Provider dashboard APIs already exist in the backend and the UI includes profile/job-management surfaces."],
  ["Is there an admin panel?", "Admins can sign in and access live admin stats from the backend dashboard endpoint."],
];

const durationOptions = ["30 minutes", "1 hour", "2 hours", "3 hours", "Half day", "Full day"];

export default function Home() {
  const [theme, setTheme] = useState(() => localStorage.getItem("servicehub_theme") || "light");
  const [selectedService, setSelectedService] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [bookings, setBookings] = useState([]);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("servicehub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    service: "",
    address: "",
    date: "",
    time: "10:00",
    duration: "1 hour",
  });
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const token = localStorage.getItem("servicehub_token");

  useEffect(() => {
    localStorage.setItem("servicehub_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user || !token) { return; }

    fetch(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : { bookings: [] }))
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]));
  }, [user, token]);

  const allCategories = useMemo(() => ["All", ...new Set(services.map((service) => service.category))], []);

  const filteredServices = services.filter((service) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesCategory = selectedCategory === "All" || service.category === selectedCategory;
    const matchesSearch =
      !search ||
      [service.name, service.category, service.location, service.description, service.price]
        .join(" ")
        .toLowerCase()
        .includes(search);

    return matchesCategory && matchesSearch;
  });

  const visibleServices = showAllProviders ? filteredServices : filteredServices.slice(0, 4);
  const hasMoreProviders = filteredServices.length > 4;

  const dashboardStats = [
    { label: "Active services", value: services.length, icon: BriefcaseBusiness },
    { label: "My bookings", value: bookings.length, icon: CalendarCheck },
    { label: "Avg rating", value: "4.8", icon: Star },
  ];

  const handleLogout = () => {
    localStorage.removeItem("servicehub_token");
    localStorage.removeItem("servicehub_user");
    setUser(null);
    setBookings([]);
    setStatusMessage("You have been logged out.");
  };

  const handleBookService = (service) => {
    setBookingForm((prev) => ({ ...prev, service: service.category || service.name }));
    setSelectedService(null);
    setIsBookingOpen(true);
  };

  const handleBookingChange = (field) => (event) => {
    setBookingForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");

    if (!token) {
      setAuthMode("login");
      setStatusMessage("Please login before booking a service.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking failed.");
      }

      setBookings((prev) => [data.booking, ...prev]);
      setStatusMessage("Booking saved successfully. Track it from your dashboard.");
      setBookingForm({ name: "", phone: "", service: "", address: "", date: "", time: "10:00", duration: "1 hour" });
      setIsBookingOpen(false);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Message could not be sent.");
      }

      setStatusMessage("Message sent successfully. Our team will contact you soon.");
      setContactForm({ name: "", email: "", message: "" });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  return (
    <div id="top" className="marketplace" data-theme={theme}>
      <Navbar
        user={user}
        theme={theme}
        onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        onRegisterClick={() => setAuthMode("register")}
        onLogout={handleLogout}
      />

      <main>
        <section className="hero-shell">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={17} /> India&apos;s all-in-one services marketplace</div>
            <h1>Book trusted pros for home, lifestyle, and digital work.</h1>
            <p>
              Compare verified providers, see transparent prices, book instantly, and track every
              request from one clean dashboard.
            </p>

            <div className="hero-search" role="search">
              <Search size={22} />
              <input
                type="text"
                placeholder="Search electrician, plumber, AC repair, cleaning..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setShowAllProviders(false);
                }}
              />
              <button type="button" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>
                Search
              </button>
            </div>

            <div className="hero-actions">
              <a className="primary-action" href="#services">Find a provider <ArrowRight size={18} /></a>
              <a className="secondary-action" href="#services">Explore services</a>
            </div>
          </div>

          <div className="hero-panel" aria-label="Marketplace performance preview">
            <div className="panel-header">
              <span>Live marketplace</span>
              <strong>4.8 rating</strong>
            </div>
            <div className="metric-grid">
              <div><strong>18k+</strong><span>jobs delivered</span></div>
              <div><strong>2 min</strong><span>average booking</span></div>
              <div><strong>24/7</strong><span>support desk</span></div>
              <div><strong>98%</strong><span>verified pros</span></div>
            </div>
            <div className="floating-card">
              <BadgeCheck size={21} />
              <div>
                <strong>AC Repair confirmed</strong>
                <span>Provider arriving at 4:30 PM</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-band">
          <div className="section-heading">
            <span>Popular services</span>
            <h2>Everything customers expect in one platform.</h2>
          </div>
          <div className="category-showcase">
            {categoryHighlights.map(({ title, icon: Icon, note, image }) => (
              <button
                className="category-tile"
                type="button"
                key={title}
                onClick={() => {
                  setSelectedCategory(services.some((service) => service.category === title) ? title : "All");
                  setSearchTerm(title);
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="category-image">
                  <img src={image} alt={`${title} service`} loading="lazy" />
                </div>
                <div className="category-copy">
                  <Icon size={23} />
                  <strong>{title}</strong>
                  <span>{note}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="services" className="services-layout">
          <aside className="filter-panel">
            <span>Browse</span>
            <h2>Find the right expert</h2>
            <div className="filter-list">
              {allCategories.map((category) => (
                <button
                  key={category}
                  className={selectedCategory === category ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowAllProviders(false);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </aside>

          <div className="service-results">
            <div className="results-topline">
              <div>
                <span>{filteredServices.length} available</span>
                <h2 id="providers">Top service providers</h2>
              </div>
              <div className="sort-chip"><Clock size={16} /> Fast response first</div>
            </div>

            <div className="service-grid">
              {visibleServices.map((service) => {
                const Icon = service.icon;
                return (
                  <article className="pro-card" key={service.id}>
                    <div className="pro-card-top">
                      <div className="pro-icon"><Icon size={28} /></div>
                      <div>
                        <h3>{service.name}</h3>
                        <span>{service.category}</span>
                      </div>
                    </div>
                    <p>{service.description}</p>
                    <div className="pro-meta">
                      <span><MapPin size={15} /> {service.location}</span>
                      <span><Star size={15} /> {service.rating} ({service.reviews})</span>
                      <span><IndianRupee size={15} /> {service.price}</span>
                    </div>
                    <div className="pro-actions">
                      <button type="button" onClick={() => setSelectedService(service)}>View profile</button>
                      <button type="button" onClick={() => handleBookService(service)}>Book now</button>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMoreProviders && (
              <button
                className="see-more-providers"
                type="button"
                onClick={() => setShowAllProviders((current) => !current)}
              >
                {showAllProviders ? "Show less providers" : "See more providers"}
              </button>
            )}
          </div>
        </section>


        {user && (
          <section id="dashboard" className="booking-dashboard-grid dashboard-only">
            <section className="dashboard-panel">
              <span>Booking dashboard</span>
              <h2>Track your bookings</h2>
              <div className="dashboard-stats">
                {dashboardStats.map(({ label, value, icon: Icon }) => (
                  <div key={label}><Icon size={18} /><strong>{value}</strong><span>{label}</span></div>
                ))}
              </div>
              <div className="booking-list">
                {(bookings.length ? bookings : [{ service: "No bookings yet", status: "pending", preferredTime: "Start by booking a service" }]).slice(0, 4).map((booking, index) => (
                  <div className="booking-row" key={booking._id || index}>
                    <div><strong>{booking.service}</strong><span>{booking.preferredTime || booking.status}</span></div>
                    <em>{booking.status}</em>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}



        <section id="faq" className="section-band faq-section">
          <div className="section-heading">
            <span>FAQ</span>
            <h2>Answers before customers book.</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}<ChevronDown size={18} /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="contact-copy">
            <span>Contact page</span>
            <h2>Talk to ServiceHub support</h2>
            <p>For urgent services, provider onboarding, partnerships, or booking support.</p>
            <div className="contact-points">
              <span><MessageCircle size={17} /> support@servicehub.com</span>
              <span><MapPin size={17} /> Pune, Maharashtra, India</span>
              <span><Clock size={17} /> 8:00 AM - 9:00 PM</span>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <label>Name<input value={contactForm.name} onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Your name" required /></label>
            <label>Email<input type="email" value={contactForm.email} onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@example.com" required /></label>
            <label>Message<textarea value={contactForm.message} onChange={(event) => setContactForm((prev) => ({ ...prev, message: event.target.value }))} placeholder="How can we help?" rows="5" required /></label>
            <button className="submit-button" type="submit">Send message</button>
          </form>
        </section>

        {statusMessage && <div className="toast-status">{statusMessage}</div>}
      </main>


      {isBookingOpen && (
        <div className="booking-modal-backdrop" onClick={() => setIsBookingOpen(false)}>
          <form className="booking-panel booking-modal" onSubmit={handleBookingSubmit} onClick={(event) => event.stopPropagation()}>
            <button className="booking-close" type="button" onClick={() => setIsBookingOpen(false)} aria-label="Close booking form">
              <X size={18} />
            </button>
            <span>Service booking</span>
            <h2>Schedule your next job</h2>
            <div className="form-grid">
              <label>Name<input value={bookingForm.name} onChange={handleBookingChange("name")} placeholder="Your name" required /></label>
              <label>Phone<input value={bookingForm.phone} onChange={handleBookingChange("phone")} placeholder="Mobile number" required /></label>
              <label>Service<select value={bookingForm.service} onChange={handleBookingChange("service")} required><option value="">Choose service</option>{allCategories.filter((category) => category !== "All").map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Date<input type="date" value={bookingForm.date} onChange={handleBookingChange("date")} required /></label>
              <label>Time<input type="time" value={bookingForm.time} onChange={handleBookingChange("time")} required /></label>
              <label>Duration<select value={bookingForm.duration} onChange={handleBookingChange("duration")}>{durationOptions.map((duration) => <option key={duration}>{duration}</option>)}</select></label>
              <label className="full-field">Address<textarea value={bookingForm.address} onChange={handleBookingChange("address")} placeholder="Service address" rows="4" required /></label>
            </div>
            <button className="submit-button" type="submit">Confirm booking <CalendarCheck size={18} /></button>
          </form>
        </div>
      )}

      {selectedService && <ServiceModal service={selectedService} onBook={handleBookService} onClose={() => setSelectedService(null)} />}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={setAuthMode} onAuthSuccess={setUser} />}

      <Footer />
    </div>
  );
}
