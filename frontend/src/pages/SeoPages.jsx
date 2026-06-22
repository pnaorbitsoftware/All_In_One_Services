import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Sun, 
  Moon, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  CalendarCheck, 
  Home, 
  Send, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  User,
  Info
} from "lucide-react";
import SEO from "../seo/SEO";
import {
  buildBreadcrumbSchema,
  citySeoPages,
  faqSchema,
  localBusinessSchema,
  organizationSchema,
  serviceSeoPages,
  serviceSchema,
  targetKeywords,
} from "../seo/seoData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function SeoPageNavbar({ theme, setTheme }) {
  const isDark = theme === "dark";
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 pb-3">
      <nav className="mx-auto flex h-20 max-w-[96rem] items-center justify-between gap-3 rounded-[1.35rem] border border-white/70 bg-white/74 px-4 shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-white/45 backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/66 dark:ring-white/10 sm:px-5 lg:px-6">
        <Link to="/" className="group flex min-w-0 flex-none items-center gap-3 rounded-2xl pr-2 transition hover:bg-white/55 dark:hover:bg-white/5">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-xl shadow-blue-600/20 ring-1 ring-slate-200/80 transition-all duration-300 group-hover:-translate-y-0.5 dark:ring-white/15">
            <img src="/servicehub-icon.png" alt="ServiceHub symbol" className="h-full w-full rounded-xl object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block text-xl font-black tracking-tight text-slate-950 dark:text-white">ServiceHub</span>
            <span className="hidden text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 sm:block">Verified Local Services</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`grid h-11 w-11 place-items-center rounded-full border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              isDark
                ? "border-black bg-black text-white"
                : "border-slate-200 bg-white text-slate-950"
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
          >
            <Home size={16} />
            <span>Back to Home</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function SeoPageFooter() {
  return (
    <footer className="bg-[#151f28] px-4 py-12 text-white sm:px-6 lg:px-8 border-t border-white/10 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_1.05fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg shadow-black/20">
                <img src="/servicehub-icon.png" alt="ServiceHub symbol" className="h-full w-full rounded-xl object-contain" />
              </span>
              <h2 className="font-display text-4xl font-black tracking-[-0.035em]">ServiceHub</h2>
            </div>
            <p className="mt-4 max-w-md text-lg leading-8 text-slate-200">
              Trusted local professionals for home repairs, maintenance, installation, and emergency support.
            </p>
            <div className="mt-5 flex items-start gap-3 font-black leading-7">
              <ShieldCheck className="mt-1 h-5 w-5 flex-none text-amber-300" />
              <span>Verified providers with reliable client support</span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">Services</h3>
            <div className="mt-4 grid gap-2 text-lg text-slate-200">
              {["Plumber", "Electrician", "Carpenter", "Painter", "AC Repair", "Refrigerator Repair", "Washing Machine Repair", "TV Repair"].map((service) => (
                <Link key={service} to="/" className="w-fit text-left transition hover:text-amber-300">
                  {service}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">Contact</h3>
            <div className="mt-4 grid gap-4 text-lg text-slate-200">
              <span className="flex items-center gap-3"><Phone className="h-5 w-5 text-amber-300" /> +91 9158852129</span>
              <span className="flex items-center gap-3"><Mail className="h-5 w-5 text-amber-300" /> info.aparaitech@gmail.com</span>
              <span className="flex items-center gap-3"><MapPin className="h-5 w-5 text-amber-300" /> Baramati, Maharashtra</span>
              <span className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-amber-300" /> Mon - Sun, 8:00 AM - 9:00 PM</span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">For Clients</h3>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Book nearby service providers, compare ratings, and get help for urgent repair needs.
            </p>
            <div className="mt-3 border-l-4 border-amber-300 pl-4 text-lg leading-8 text-slate-200">
              <p className="font-black text-white">Need help?</p>
              <p>Call us for booking assistance or service issues.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-white/15 pt-6 text-base text-slate-200">
          <span>© 2026 ServiceHub. All Rights Reserved.</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/contact" className="transition hover:text-amber-300">Contact</Link>
            <Link to="/privacy-policy" className="transition hover:text-amber-300">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="transition hover:text-amber-300">Terms</Link>
            <span>Serving homes across Pune and nearby cities.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SeoPageLayout({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("servicehub_theme") || "light");

  useEffect(() => {
    localStorage.setItem("servicehub_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white transition-colors duration-500`}>
      <SeoPageNavbar theme={theme} setTheme={setTheme} />
      <div className="flex-1 pt-28 pb-16">
        {children}
      </div>
      <SeoPageFooter />
    </div>
  );
}

const serviceDescriptions = {
  Electrician: "Book electricians for wiring, fan and light fitting, switchboard repair, inverter setup, safety inspections, and urgent electrical fault checks.",
  Plumber: "Find plumbers for leak detection, pipe repair, drain cleaning, bathroom fittings, tap replacement, and emergency plumbing calls.",
  Carpenter: "Hire carpenters for doors, wardrobes, furniture assembly, modular fittings, repairs, polishing, and small custom woodwork.",
  "AC Repair": "Schedule AC technicians for servicing, deep cleaning, gas refill, compressor checks, installation, cooling issues, and annual maintenance.",
  Cleaning: "Book home cleaning services for bathrooms, kitchens, sofas, move-in cleaning, apartment deep cleaning, and regular housekeeping support.",
  Painting: "Connect with painters for interior walls, exterior repainting, waterproofing, texture finishes, wood paint, and home renovation projects.",
  "Appliance Repair": "Find appliance repair experts for refrigerators, washing machines, TVs, motors, cooling issues, display faults, and installation support.",
};

export function ServicePage() {
  const { slug } = useParams();
  const service = serviceSeoPages.find((item) => item.slug === slug) || serviceSeoPages[0];

  return (
    <SeoPageLayout>
      <SEO
        title={service.title}
        description={service.description}
        keywords={[...service.keywords, ...targetKeywords]}
        path={`/services/${service.slug}`}
        schema={[
          organizationSchema,
          localBusinessSchema,
          serviceSchema.find((item) => item.serviceType === service.name),
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/#services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
        ]}
      />
      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-teal-700 dark:text-teal-400">
          <ArrowLeft size={16} />
          <span>Back to ServiceHub</span>
        </Link>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl dark:text-white">{service.name} Near Me</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{service.description}</p>
        
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {["Verified providers", "Transparent booking", "Local support"].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">{item}</h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{serviceDescriptions[service.name]}</p>
            </div>
          ))}
        </section>
        
        <section className="mt-12">
          <h2 className="text-3xl font-black text-slate-950 dark:text-white font-display">Book {service.name.toLowerCase()} services in Indian cities</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">
            ServiceHub helps customers searching for Best Home Services, Home Service Provider, and Local Service Marketplace options compare nearby providers before booking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {citySeoPages.map((city) => (
              <Link key={city.slug} to={`/locations/${city.slug}`} className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-black text-teal-800 transition hover:bg-teal-100 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20">
                {service.name} in {city.city}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </SeoPageLayout>
  );
}

export function LocationPage() {
  const { citySlug } = useParams();
  const city = citySeoPages.find((item) => item.slug === citySlug) || citySeoPages[0];

  return (
    <SeoPageLayout>
      <SEO
        title={city.title}
        description={city.description}
        keywords={[`home services in ${city.city}`, `electrician in ${city.city}`, `plumber in ${city.city}`, ...targetKeywords]}
        path={`/locations/${city.slug}`}
        schema={[
          organizationSchema,
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Locations", path: "/#locations" },
            { name: city.city, path: `/locations/${city.slug}` },
          ]),
        ]}
      />
      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-teal-700 dark:text-teal-400">
          <ArrowLeft size={16} />
          <span>Back to ServiceHub</span>
        </Link>
        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl dark:text-white font-display">Best Home Services in {city.city}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{city.description}</p>
        
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceSeoPages.map((service) => (
            <Link key={service.slug} to={`/services/${service.slug}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800/80">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">{service.name} in {city.city}</h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{service.description}</p>
            </Link>
          ))}
        </section>
      </article>
    </SeoPageLayout>
  );
}

export function ContactPage() {
  const token = localStorage.getItem("servicehub_token");
  const user = (() => {
    try {
      const savedUser = localStorage.getItem("servicehub_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    subject: "",
    message: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to submit a message directly to support.");
      return;
    }
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError("Name, email, and message are required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: `Subject: ${formData.subject || "General Inquiry"}\n\nClient Phone: ${formData.phone}\n\nMessage: ${formData.message}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setSuccess("Your message was sent successfully! We will get back to you soon.");
      setFormData(prev => ({
        ...prev,
        subject: "",
        message: ""
      }));
    } catch (err) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SeoPageLayout>
      <SEO
        title="Contact Us | ServiceHub"
        description="We are here to help with home service bookings, provider onboarding, customer support, and payment-related queries."
        path="/contact"
        schema={[organizationSchema, localBusinessSchema, faqSchema]}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-teal-700 dark:text-teal-400 mb-6">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black sm:text-5xl dark:text-white font-display tracking-tight">Contact ServiceHub</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We're here to help with bookings, providers, payments and support.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-6 font-display">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Email Us</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">support@servicehub.aparaitech.org</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Call Us</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">+91 91588 52129</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Location</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Maharashtra, India</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400">
                    <CalendarCheck size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Operating Hours</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Mon - Sun, 8:00 AM - 9:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-2 font-display">Send a Message</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Have a question? Fill in the form and our support team will respond quickly.</p>

              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 flex items-start gap-3">
                  <AlertTriangle className="shrink-0 text-rose-600 dark:text-rose-400" size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200 flex items-start gap-3">
                  <CheckCircle className="shrink-0 text-teal-600 dark:text-teal-400" size={18} />
                  <span>{success}</span>
                </div>
              )}

              {!token && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 flex items-start gap-3">
                  <Info className="shrink-0 text-amber-600 dark:text-amber-400" size={18} />
                  <span>
                    <strong>Authentication Required:</strong> Please <Link to="/" className="underline font-bold text-teal-700 dark:text-teal-400">log in or sign up</Link> on the Home Page to submit this contact form.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <User size={14} /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!token || submitting}
                      value={formData.fullName}
                      onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500 disabled:opacity-50"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Mail size={14} /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!token || submitting}
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500 disabled:opacity-50"
                      placeholder="e.g. rahul@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input
                      type="tel"
                      disabled={!token || submitting}
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500 disabled:opacity-50"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Subject
                    </label>
                    <input
                      type="text"
                      disabled={!token || submitting}
                      value={formData.subject}
                      onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500 disabled:opacity-50"
                      placeholder="e.g. Booking Assistance"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Message
                  </label>
                  <textarea
                    required
                    disabled={!token || submitting}
                    value={formData.message}
                    onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500 disabled:opacity-50"
                    placeholder="Enter details of your request..."
                    rows={5}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!token || submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-teal-500 dark:hover:bg-teal-600 dark:text-slate-950 dark:font-black"
                >
                  {submitting ? "Sending..." : "Send Message"}
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SeoPageLayout>
  );
}

export function PolicyPage({ type }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy | ServiceHub" : "Terms & Conditions | ServiceHub";
  const path = isPrivacy ? "/privacy-policy" : "/terms-and-conditions";
  const description = isPrivacy 
    ? "Read the ServiceHub privacy policy to understand how we collect, use, and protect your personal data." 
    : "Review the ServiceHub Terms and Conditions governing your use of our local service marketplace.";

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <SeoPageLayout>
      <SEO title={title} description={description} path={path} />
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-teal-700 dark:text-teal-400 mb-6">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400 mb-4">
            <FileText size={28} />
            <span className="text-sm font-black uppercase tracking-[0.14em]">ServiceHub Legal</span>
          </div>

          <h1 className="text-4xl font-black text-slate-950 dark:text-white mb-6 font-display">
            {isPrivacy ? "Privacy Policy" : "Terms & Conditions"}
          </h1>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-300 leading-8">
            {isPrivacy ? (
              // Privacy Policy Content
              <>
                <p className="text-lg text-slate-700 dark:text-slate-200 font-semibold border-l-4 border-teal-500 pl-4">
                  ServiceHub India collects account, booking, contact, payment-status, and provider profile information only to operate the local service marketplace, improve support, and maintain trust between customers and providers.
                </p>

                <hr className="border-slate-100 dark:border-white/15" />

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">1. Information We Collect</h2>
                  <p>We collect various types of information to ensure optimal operations and user safety on the ServiceHub local marketplace.</p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Information</h3>
                  <p>When you register on ServiceHub, we collect your name, email address, phone number, role, and credentials. This information is required to establish your profile and handle user authentication.</p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Booking Information</h3>
                  <p>For bookings, we collect detailed address info, problem descriptions, requested dates, times, and direct coordinates. This allows providers to reach your site and understand the scope of the request.</p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Provider Information</h3>
                  <p>If you register as a provider, we collect business names, category profiles, price estimates, response times, certifications, profile pictures, and bank details for payout distributions.</p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Information</h3>
                  <p>We track transaction IDs, order statuses, and disbursement details securely via Razorpay integrations. Card details are processed directly by our payment processor and are not stored on our servers.</p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cookies & Analytics</h3>
                  <p>We use local cookies and system indicators to remember your session token, user language, and theme preferences. Analytics services assist us in tracking performance and site reliability.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">2. How We Use Information</h2>
                  <p>ServiceHub processes the collected data for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Facilitating local service connections, bookings, and messaging.</li>
                    <li>Processing secure payments, refunds, and payouts.</li>
                    <li>Providing real-time tracking, chat notifications, and booking alerts.</li>
                    <li>Detecting, preventing, and combating fraudulent activities.</li>
                    <li>Sending critical account, scheduling, and billing updates.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">3. Data Protection & Security</h2>
                  <p>We deploy robust security safeguards, including database encryption, HTTPS routing, and tokenized JWT authentication headers, to guard against unauthorized access, loss, or manipulation of user data.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">4. Third Party Services</h2>
                  <p>We share limited operational information with verified partners (e.g., Razorpay, Brevo SMTP mailers, Twilio alerts) to fulfill billing, email dispatch, and SMS confirmations. We do not sell or trade user data to marketing aggregators.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">5. User Rights & Data Deletion</h2>
                  <p>Users have the right to request updates, profile exports, or permanent deletion of their account databases. For deletion or correction requests, please contact our privacy compliance team.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">6. Legal Contact Information</h2>
                  <p>For privacy queries, regulatory questions, or compliance concerns, contact:</p>
                  <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 space-y-1">
                    <p><strong>Compliance Email:</strong> support@servicehub.aparaitech.org</p>
                    <p><strong>Primary Address:</strong> Baramati, Maharashtra, India</p>
                  </div>
                </section>
              </>
            ) : (
              // Terms & Conditions Content
              <>
                <p className="text-lg text-slate-700 dark:text-slate-200 font-semibold border-l-4 border-teal-500 pl-4">
                  Welcome to ServiceHub India. These Terms & Conditions govern your access to and usage of the ServiceHub platform, services, and local marketplace applications.
                </p>

                <hr className="border-slate-100 dark:border-white/15" />

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">1. Introduction</h2>
                  <p>By registering, logging in, or using ServiceHub, you explicitly agree to follow these Terms and Conditions. If you do not accept these rules, please discontinue use of the platform.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">2. User Responsibilities</h2>
                  <p>Customers must provide accurate booking details (address, description, date, time) and ensure safe access to work locations. Sharing fraudulent reviews, spam booking requests, or harassing providers is strictly prohibited.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">3. Service Booking Rules</h2>
                  <p>A booking represents a direct service contract between the client and the provider. ServiceHub facilitates scheduling, chat, tracking, and payments, but is not a party to the physical labor performed.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">4. Provider Responsibilities</h2>
                  <p>Providers must maintain accurate listings, response times, pricing, and profile details. Providers must deliver services with professional standards and maintain valid credentials in compliance with applicable local laws.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">5. Payments & Refunds</h2>
                  <p>All bookings utilize our secure online gateway. Booking deposits and payouts are handled securely. Refund claims must be submitted to client support within 48 hours of service completion and are reviewed on a case-by-case basis.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">6. Cancellation Policy</h2>
                  <p>Clients and providers can cancel bookings subject to platform rules. Repeated cancellations or cancellation after a provider has travelled to the location may result in cancellation penalties or temporary account suspension.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">7. Account Suspension</h2>
                  <p>ServiceHub reserves the right to suspend or terminate any client or provider account for platform abuse, safety violations, payment defaults, or non-compliance with these terms.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">8. Limitation of Liability</h2>
                  <p>ServiceHub is not liable for direct, indirect, incidental, or consequential damages resulting from service quality issues, provider behavior, scheduling delays, or network downtime.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">9. Intellectual Property</h2>
                  <p>All logos, codebases, layout designs, copy, and icons are the exclusive intellectual property of ServiceHub and its parent entities.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">10. Privacy</h2>
                  <p>Use of our platform is also governed by our Privacy Policy, which is incorporated into these terms by reference.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">11. Governing Law</h2>
                  <p>These terms and conditions are governed by and construed in accordance with the laws of India, and any disputes will be subject to the exclusive jurisdiction of the courts of Pune, Maharashtra.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white font-display">12. Contact Information</h2>
                  <p>For questions or support regarding these terms, contact:</p>
                  <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 space-y-1">
                    <p><strong>Support Email:</strong> support@servicehub.aparaitech.org</p>
                    <p><strong>Primary Address:</strong> Baramati, Maharashtra, India</p>
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 dark:border-white/15 text-sm text-slate-400 font-semibold text-right">
            Last Updated: {currentDate}
          </div>
        </div>
      </article>
    </SeoPageLayout>
  );
}
