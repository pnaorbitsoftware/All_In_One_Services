export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://servicehub.aparaitech.org").replace(/\/$/, "");

export const targetKeywords = [
  "Best Home Services",
  "Home Service Provider",
  "Electrician Near Me",
  "Plumber Near Me",
  "AC Repair Near Me",
  "Home Cleaning Services",
  "Local Service Marketplace",
  "Service Booking Platform",
  "ServiceHub India",
];

export const serviceSeoPages = [
  {
    slug: "electrician-near-me",
    name: "Electrician",
    title: "Electrician Near Me | Verified Home Electricians | ServiceHub India",
    description: "Book verified electricians near you for wiring, fan installation, switchboard repair, inverter setup, MCB checks, and urgent electrical faults.",
    keywords: ["Electrician Near Me", "home electrician", "electrical repair service", "ServiceHub India"],
  },
  {
    slug: "plumber-near-me",
    name: "Plumber",
    title: "Plumber Near Me | Leak Repair and Bathroom Fitting | ServiceHub",
    description: "Find trusted plumbers near you for leak repair, pipe replacement, bathroom fittings, drain cleaning, and emergency plumbing support.",
    keywords: ["Plumber Near Me", "plumbing repair", "bathroom fitting", "local plumber"],
  },
  {
    slug: "carpenter-near-me",
    name: "Carpenter",
    title: "Carpenter Near Me | Furniture and Door Repair | ServiceHub",
    description: "Hire skilled carpenters for furniture assembly, door repair, modular fittings, wardrobe work, polishing, and home woodwork jobs.",
    keywords: ["carpenter near me", "furniture repair", "door repair", "home carpenter"],
  },
  {
    slug: "ac-repair-near-me",
    name: "AC Repair",
    title: "AC Repair Near Me | AC Service, Gas Refill and Installation",
    description: "Book AC repair technicians for servicing, gas refill, cooling issues, compressor checks, installation, and seasonal maintenance.",
    keywords: ["AC Repair Near Me", "AC service", "AC gas refill", "air conditioner repair"],
  },
  {
    slug: "home-cleaning-services",
    name: "Cleaning",
    title: "Home Cleaning Services | Deep Cleaning Near You | ServiceHub",
    description: "Schedule home cleaning services for deep cleaning, bathroom cleaning, kitchen degreasing, sofa shampooing, and move-in cleaning.",
    keywords: ["Home Cleaning Services", "deep cleaning", "sofa cleaning", "house cleaning"],
  },
  {
    slug: "painting-services",
    name: "Painting",
    title: "Home Painting Services | Interior and Exterior Painters | ServiceHub",
    description: "Connect with painters for interior painting, exterior repainting, wall textures, waterproof coating, and home makeover work.",
    keywords: ["painting services", "home painter", "interior painting", "exterior painting"],
  },
  {
    slug: "appliance-repair",
    name: "Appliance Repair",
    title: "Appliance Repair Near Me | Fridge, TV and Washing Machine Repair",
    description: "Find appliance repair technicians for refrigerators, washing machines, TVs, cooling faults, display issues, motors, and installation support.",
    keywords: ["appliance repair", "refrigerator repair", "washing machine repair", "TV repair"],
  },
];

export const citySeoPages = ["Pune", "Mumbai", "Nashik", "Baramati"].map((city) => ({
  slug: city.toLowerCase(),
  city,
  title: `Best Home Services in ${city} | ServiceHub India`,
  description: `Book verified electricians, plumbers, AC repair technicians, cleaners, painters, and carpenters in ${city} with ServiceHub India.`,
}));

export const faqItems = [
  {
    question: "Which is the best home services platform in India?",
    answer: "ServiceHub India helps customers compare local service providers, book verified professionals, and track home service requests from one platform.",
  },
  {
    question: "Can I book an electrician near me on ServiceHub?",
    answer: "Yes. Search for Electrician Near Me, compare ratings and pricing, choose a time, and send your booking request to a verified provider.",
  },
  {
    question: "Does ServiceHub offer plumber and AC repair near me?",
    answer: "ServiceHub supports plumber near me, AC repair near me, appliance repair, cleaning, painting, and carpentry searches for Indian homes.",
  },
  {
    question: "Are ServiceHub providers verified?",
    answer: "Provider profiles can be reviewed and approved by admins before appearing to customers, improving trust and service quality.",
  },
];

export const getCanonicalUrl = (path = "/") => `${SITE_URL}${path === "/" ? "" : path}`;

export const buildBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: getCanonicalUrl(item.path),
  })),
});

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ServiceHub India",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  email: "info.aparaitech@gmail.com",
  telephone: "+91 9158852129",
  sameAs: [SITE_URL],
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#localbusiness`,
  name: "ServiceHub India",
  image: `${SITE_URL}/favicon.svg`,
  url: SITE_URL,
  telephone: "+91 9158852129",
  email: "info.aparaitech@gmail.com",
  priceRange: "Rs. 249 - Rs. 4999",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Baramati",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
  areaServed: citySeoPages.map(({ city }) => city),
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "21:00",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "1849",
  },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export const serviceSchema = serviceSeoPages.map((service) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: `${service.name} services`,
  serviceType: service.name,
  provider: {
    "@type": "Organization",
    name: "ServiceHub India",
    url: SITE_URL,
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  url: getCanonicalUrl(`/services/${service.slug}`),
  description: service.description,
}));

export const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "Review",
  itemReviewed: {
    "@type": "LocalBusiness",
    name: "ServiceHub India",
  },
  reviewRating: {
    "@type": "Rating",
    ratingValue: "5",
    bestRating: "5",
  },
  author: {
    "@type": "Person",
    name: "Verified ServiceHub customer",
  },
  reviewBody: "Fast booking flow, clear provider details, and reliable local home service support.",
};
