import { Link, useParams } from "react-router-dom";
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
    <main className="min-h-screen bg-[#fbfaf6] px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
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
      <article className="mx-auto max-w-5xl">
        <Link to="/" className="font-black text-teal-700">ServiceHub India</Link>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">{service.name} Near Me</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{service.description}</p>
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {["Verified providers", "Transparent booking", "Local support"].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">{item}</h2>
              <p className="mt-3 leading-7 text-slate-600">{serviceDescriptions[service.name]}</p>
            </div>
          ))}
        </section>
        <section className="mt-12">
          <h2 className="text-3xl font-black">Book {service.name.toLowerCase()} services in Indian cities</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            ServiceHub helps customers searching for Best Home Services, Home Service Provider, and Local Service Marketplace options compare nearby providers before booking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {citySeoPages.map((city) => (
              <Link key={city.slug} to={`/locations/${city.slug}`} className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-black text-teal-800">
                {service.name} in {city.city}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}

export function LocationPage() {
  const { citySlug } = useParams();
  const city = citySeoPages.find((item) => item.slug === citySlug) || citySeoPages[0];

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
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
      <article className="mx-auto max-w-5xl">
        <Link to="/" className="font-black text-teal-700">ServiceHub India</Link>
        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Best Home Services in {city.city}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{city.description}</p>
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceSeoPages.map((service) => (
            <Link key={service.slug} to={`/services/${service.slug}`} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
              <h2 className="text-xl font-black">{service.name} in {city.city}</h2>
              <p className="mt-3 leading-7 text-slate-600">{service.description}</p>
            </Link>
          ))}
        </section>
      </article>
    </main>
  );
}

export function PolicyPage({ type }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy | ServiceHub India" : "Terms and Conditions | ServiceHub India";
  const path = isPrivacy ? "/privacy-policy" : "/terms-and-conditions";

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
      <SEO title={title} description={`${isPrivacy ? "Privacy policy" : "Terms and conditions"} for ServiceHub India customers, providers, bookings, support messages, and marketplace usage.`} path={path} />
      <article className="mx-auto max-w-4xl">
        <Link to="/" className="font-black text-teal-700">Back to ServiceHub</Link>
        <h1 className="mt-5 text-4xl font-black">{isPrivacy ? "Privacy Policy" : "Terms and Conditions"}</h1>
        <p className="mt-5 leading-8 text-slate-600">
          ServiceHub India collects account, booking, contact, payment-status, and provider profile information only to operate the local service marketplace, improve support, and maintain trust between customers and providers.
        </p>
        <h2 className="mt-10 text-2xl font-black">{isPrivacy ? "Data use and protection" : "Marketplace usage"}</h2>
        <p className="mt-4 leading-8 text-slate-600">
          Customers should provide accurate service addresses and contact details. Providers are responsible for truthful profiles, reliable service delivery, and compliance with applicable Indian laws. ServiceHub may review bookings, messages, and provider records for support, safety, fraud prevention, and platform quality.
        </p>
        <h2 className="mt-10 text-2xl font-black">Contact</h2>
        <p className="mt-4 leading-8 text-slate-600">For privacy, legal, or support questions, contact info.aparaitech@gmail.com or call +91 9158852129.</p>
      </article>
    </main>
  );
}

export function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
      <SEO
        title="Contact ServiceHub India | Home Service Booking Support"
        description="Contact ServiceHub India for home service bookings, provider onboarding, customer support, local service marketplace partnerships, and urgent help."
        path="/contact"
        schema={[organizationSchema, localBusinessSchema, faqSchema]}
      />
      <section className="mx-auto max-w-4xl">
        <Link to="/" className="font-black text-teal-700">Back to ServiceHub</Link>
        <h1 className="mt-5 text-4xl font-black">Contact ServiceHub India</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Get help with bookings, provider onboarding, customer support, and local service marketplace partnerships.</p>
        <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-6 text-lg shadow-sm">
          <p><strong>Email:</strong> info.aparaitech@gmail.com</p>
          <p><strong>Phone:</strong> +91 9158852129</p>
          <p><strong>Location:</strong> Baramati, Maharashtra, India</p>
          <p><strong>Hours:</strong> Monday to Sunday, 8:00 AM - 9:00 PM</p>
        </div>
      </section>
    </main>
  );
}
