export const quickServices = [
  {
    id: "quick-appliance",
    name: "Appliance Repair & Service",
    category: "AC & Appliance Repair",
    badge: "49 mins",
    icon: "washing-machine",
  },
  {
    id: "quick-furniture",
    name: "Furniture Assembly",
    category: "Electrician, Plumber & Carpenter",
    icon: "sofa-outline",
  },
  {
    id: "quick-bathroom-kitchen",
    name: "Bathroom & Kitchen Cleaning",
    category: "Bathroom & Kitchen Cleaning",
    badge: "46 mins",
    icon: "toilet",
  },
  {
    id: "quick-cleaning",
    name: "Cleaning",
    category: "Bathroom & Kitchen Cleaning",
    icon: "broom",
  },
  {
    id: "quick-water-purifier",
    name: "Water Purifier",
    category: "AC & Appliance Repair",
    icon: "water",
  },
  {
    id: "quick-smart-locks",
    name: "Smart Locks",
    category: "Electrician, Plumber & Carpenter",
    icon: "lock-outline",
  },
];

export const serviceVisuals = {
  "Appliance Repair & Service": { icon: "washing-machine", color: "#2563eb", bg: "#e8f1ff" },
  "Furniture Assembly": { icon: "sofa-outline", color: "#a855f7", bg: "#f3e8ff" },
  "Bathroom & Kitchen Cleaning": { icon: "toilet", color: "#0891b2", bg: "#e6faff" },
  Cleaning: { icon: "broom", color: "#16a34a", bg: "#eaf8ef" },
  "Water Purifier": { icon: "water", color: "#0ea5e9", bg: "#e0f6ff" },
  "Smart Locks": { icon: "lock-outline", color: "#7c3aed", bg: "#eee7ff" },
  "Kitchen Cleaning": { icon: "silverware-fork-knife", color: "#f97316", bg: "#fff1e8" },
  "Painting Service": { icon: "format-paint", color: "#db2777", bg: "#fde7f3" },
  "Intense Cleaning Bathroom": { icon: "toilet", color: "#0891b2", bg: "#e6faff" },
  "Foam-jet AC Service": { icon: "air-conditioner", color: "#0284c7", bg: "#e0f2fe" },
  "Automatic Top Load Machine Check-up": { icon: "washing-machine", color: "#2563eb", bg: "#e8f1ff" },
  "Furnished Apartment Home Deep Clean": { icon: "home-outline", color: "#16a34a", bg: "#eaf8ef" },
  "Washing Machine Repair": { icon: "washing-machine", color: "#2563eb", bg: "#e8f1ff" },
  "Water Purifier Service and Repair": { icon: "water-pump", color: "#0ea5e9", bg: "#e0f6ff" },
  "Geyser Service & Repair": { icon: "water-boiler", color: "#dc2626", bg: "#feecec" },
  "Laptop Repair": { icon: "laptop", color: "#475569", bg: "#eef2f7" },
  "Full Home / By Room Cleaning": { icon: "home-outline", color: "#16a34a", bg: "#eaf8ef" },
  "Cockroach Control": { icon: "bug-outline", color: "#854d0e", bg: "#fff7d6" },
  "Bathroom Cleaning": { icon: "toilet", color: "#0891b2", bg: "#e6faff" },
  Electrician: { icon: "power-socket-eu", color: "#f59e0b", bg: "#fff5db" },
  Plumber: { icon: "pipe-wrench", color: "#2563eb", bg: "#e8f1ff" },
  Carpenter: { icon: "hammer", color: "#92400e", bg: "#fef0da" },
  "Double Door Wardrobe Assembly": { icon: "wardrobe-outline", color: "#7c3aed", bg: "#eee7ff" },
  "Painting & Water-proofing": { icon: "format-paint", color: "#db2777", bg: "#fde7f3" },
  AC: { icon: "air-conditioner", color: "#0284c7", bg: "#e0f2fe" },
  "Washing Machine": { icon: "washing-machine", color: "#2563eb", bg: "#e8f1ff" },
  Refrigerator: { icon: "fridge-outline", color: "#0f766e", bg: "#def7f1" },
  Television: { icon: "television-classic", color: "#334155", bg: "#eef2f7" },
  Chimney: { icon: "fan", color: "#64748b", bg: "#f1f5f9" },
  Microwave: { icon: "microwave", color: "#f97316", bg: "#fff1e8" },
  Stove: { icon: "stove", color: "#dc2626", bg: "#feecec" },
  "RO/Water Purifier": { icon: "water-pump", color: "#0ea5e9", bg: "#e0f6ff" },
  Geyser: { icon: "water-boiler", color: "#dc2626", bg: "#feecec" },
  "Air Cooler": { icon: "fan", color: "#06b6d4", bg: "#e6faff" },
  "Festival Lights Installation": { icon: "string-lights", color: "#ca8a04", bg: "#fff7d6" },
  "IKEA Furniture Assembly": { icon: "dresser-outline", color: "#a855f7", bg: "#f3e8ff" },
  "Tile Grouting": { icon: "grid", color: "#64748b", bg: "#f1f5f9" },
  "Full Home Cleaning": { icon: "home-outline", color: "#16a34a", bg: "#eaf8ef" },
  "Sofa Cleaning": { icon: "sofa-outline", color: "#a855f7", bg: "#f3e8ff" },
  "Termite Control": { icon: "home-alert-outline", color: "#854d0e", bg: "#fff7d6" },
  "Bed Bugs Control": { icon: "bed-outline", color: "#be123c", bg: "#ffe4e6" },
  "Mosquito Control": { icon: "spray", color: "#0f766e", bg: "#def7f1" },
};

export function getServiceVisual(service = {}) {
  const visual = serviceVisuals[service.name] || serviceVisuals[service.category] || {};
  return {
    icon: service.icon || visual.icon || "wrench",
    color: service.color || visual.color || "#111827",
    bg: service.bg || visual.bg || "#f3f4f6",
  };
}

export const promoBanners = [
  {
    id: "promo-ac",
    eyebrow: "2X COOLING",
    title: "Deep clean, zero hassle",
    subtitle: "Foam jet AC service",
    serviceName: "Foam-jet AC Service",
    category: "AC & Appliance Repair",
    action: "Book now",
    icon: "air-conditioner",
    accent: "#0ea5e9",
  },
  {
    id: "promo-repairs",
    title: "Home repairs at affordable prices",
    subtitle: "Electrician, plumber, carpenter",
    serviceName: "Electrician",
    category: "Electrician, Plumber & Carpenter",
    action: "Book now",
    icon: "tools",
    accent: "#16a34a",
  },
  {
    id: "promo-ro",
    title: "Native RO Water Purifiers",
    subtitle: "Clean water for every home",
    serviceName: "Water Purifier",
    category: "AC & Appliance Repair",
    action: "Buy now",
    icon: "water-pump",
    accent: "#7c3aed",
  },
  {
    id: "promo-cleaning",
    eyebrow: "WEEKEND CLEAN",
    title: "Fresh rooms, cleaner home",
    subtitle: "Bathroom and kitchen cleaning",
    serviceName: "Bathroom & Kitchen Cleaning",
    category: "Bathroom & Kitchen Cleaning",
    action: "Book now",
    icon: "broom",
    accent: "#16a34a",
  },
  {
    id: "promo-smart-locks",
    eyebrow: "SECURE HOME",
    title: "Upgrade your door safety",
    subtitle: "Smart lock installation",
    serviceName: "Smart Locks",
    category: "Electrician, Plumber & Carpenter",
    action: "Book now",
    icon: "lock-outline",
    accent: "#7c3aed",
  },
];

export const secondaryPromoBanners = [
  {
    id: "secondary-plumber",
    eyebrow: "FAST REPAIR",
    title: "Leak fixed without stress",
    subtitle: "Plumber visit and pipe repair",
    serviceName: "Plumber",
    category: "Electrician, Plumber & Carpenter",
    action: "Book now",
    icon: "pipe-wrench",
    accent: "#2563eb",
  },
  {
    id: "secondary-electrician",
    eyebrow: "SAFETY FIRST",
    title: "Switches, fans, wiring",
    subtitle: "Electrician at your doorstep",
    serviceName: "Electrician",
    category: "Electrician, Plumber & Carpenter",
    action: "Book now",
    icon: "power-socket-eu",
    accent: "#f59e0b",
  },
  {
    id: "secondary-carpenter",
    eyebrow: "HOME SETUP",
    title: "Furniture fitted neatly",
    subtitle: "Carpenter and assembly service",
    serviceName: "Carpenter",
    category: "Electrician, Plumber & Carpenter",
    action: "Book now",
    icon: "hammer",
    accent: "#92400e",
  },
  {
    id: "secondary-painting",
    eyebrow: "NEW LOOK",
    title: "Walls refreshed beautifully",
    subtitle: "Painting and waterproofing",
    serviceName: "Painting Service",
    category: "Painting & Water-proofing",
    action: "Book now",
    icon: "format-paint",
    accent: "#db2777",
  },
  {
    id: "secondary-pest",
    eyebrow: "PROTECTION",
    title: "Keep pests away",
    subtitle: "Cockroach and termite control",
    serviceName: "Cockroach Control",
    category: "Pest Control",
    action: "Book now",
    icon: "bug-outline",
    accent: "#854d0e",
  },
];

export const noteworthyServices = [
  { id: "note-kitchen", name: "Kitchen Cleaning", category: "Bathroom & Kitchen Cleaning", icon: "silverware-fork-knife" },
  { id: "note-water", name: "Water Purifier", category: "AC & Appliance Repair", icon: "water" },
  { id: "note-locks", name: "Smart Locks", category: "Electrician, Plumber & Carpenter", icon: "lock-outline" },
  { id: "note-paint", name: "Painting Service", category: "Painting & Water-proofing", icon: "format-paint" },
];

export const mostBookedServices = [
  {
    id: "most-bathroom",
    name: "Intense Cleaning Bathroom",
    category: "Bathroom & Kitchen Cleaning",
    icon: "toilet",
    rating: "4.82",
    price: "Starts at Rs. 499",
  },
  {
    id: "most-ac",
    name: "Foam-jet AC Service",
    category: "AC & Appliance Repair",
    icon: "air-conditioner",
    rating: "4.78",
    price: "Starts at Rs. 599",
  },
  {
    id: "most-washer",
    name: "Automatic Top Load Machine Check-up",
    category: "AC & Appliance Repair",
    icon: "washing-machine",
    rating: "4.74",
    price: "Starts at Rs. 299",
  },
  {
    id: "most-home-clean",
    name: "Furnished Apartment Home Deep Clean",
    category: "Bathroom & Kitchen Cleaning",
    icon: "home-outline",
    rating: "4.86",
    price: "Starts at Rs. 1,499",
  },
];

export const homepageSections = [
  {
    id: "appliance-repair",
    title: "Appliance repair & service",
    seeAll: true,
    services: [
      { id: "appliance-washer", name: "Washing Machine Repair", category: "AC & Appliance Repair", icon: "washing-machine", badge: "49 mins" },
      { id: "appliance-ro", name: "Water Purifier Service and Repair", category: "AC & Appliance Repair", icon: "water-pump" },
      { id: "appliance-geyser", name: "Geyser Service & Repair", category: "AC & Appliance Repair", icon: "water-boiler" },
      { id: "appliance-laptop", name: "Laptop Repair", category: "AC & Appliance Repair", icon: "laptop" },
    ],
  },
  {
    id: "cleaning-pest",
    title: "Cleaning & pest control",
    seeAll: true,
    services: [
      { id: "clean-home", name: "Full Home / By Room Cleaning", category: "Bathroom & Kitchen Cleaning", icon: "home-outline" },
      { id: "clean-cockroach", name: "Cockroach Control", category: "Pest Control", icon: "bug-outline" },
      { id: "clean-bathroom", name: "Bathroom Cleaning", category: "Bathroom & Kitchen Cleaning", icon: "toilet", badge: "46 mins" },
      { id: "clean-kitchen", name: "Kitchen Cleaning", category: "Bathroom & Kitchen Cleaning", icon: "silverware-fork-knife" },
    ],
  },
  {
    id: "epc",
    title: "Electrician, Plumber, Carpenter",
    seeAll: true,
    services: [
      { id: "epc-electrician", name: "Electrician", category: "Electrician, Plumber & Carpenter", icon: "power-socket-eu" },
      { id: "epc-plumber", name: "Plumber", category: "Electrician, Plumber & Carpenter", icon: "pipe-wrench" },
      { id: "epc-carpenter", name: "Carpenter", category: "Electrician, Plumber & Carpenter", icon: "hammer", badge: "25 mins" },
      { id: "epc-wardrobe", name: "Double Door Wardrobe Assembly", category: "Electrician, Plumber & Carpenter", icon: "wardrobe-outline" },
    ],
  },
];

export const serviceCategories = [
  {
    title: "Painting & Water-proofing",
    groups: [
      {
        title: "",
        services: [
          { name: "Painting & Water-proofing", icon: "format-paint" },
        ],
      },
    ],
  },
  {
    title: "AC & Appliance Repair",
    groups: [
      {
        title: "Large appliances",
        services: [
          { name: "AC", icon: "air-conditioner" },
          { name: "Washing Machine", icon: "washing-machine", badge: "49 mins" },
          { name: "Refrigerator", icon: "fridge-outline" },
          { name: "Television", icon: "television-classic" },
        ],
      },
      {
        title: "Other appliances",
        services: [
          { name: "Chimney", icon: "fan" },
          { name: "Microwave", icon: "microwave" },
          { name: "Stove", icon: "stove", badge: "45 mins" },
          { name: "Laptop", icon: "laptop" },
          { name: "RO/Water Purifier", icon: "water-pump" },
          { name: "Geyser", icon: "water-boiler" },
          { name: "Air Cooler", icon: "fan" },
        ],
      },
    ],
  },
  {
    title: "Electrician, Plumber & Carpenter",
    groups: [
      {
        title: "Home repairs",
        services: [
          { name: "Electrician", icon: "power-socket-eu" },
          { name: "Plumber", icon: "pipe-wrench" },
          { name: "Carpenter", icon: "hammer", badge: "25 mins" },
          { name: "Festival Lights Installation", icon: "string-lights" },
        ],
      },
      {
        title: "Home installation",
        services: [
          { name: "Furniture Assembly", icon: "sofa-outline" },
          { name: "Geyser Service & Repair", icon: "water-boiler" },
          { name: "IKEA Furniture Assembly", icon: "dresser-outline" },
          { name: "Tile Grouting", icon: "grid" },
        ],
      },
    ],
  },
  {
    title: "Bathroom & Kitchen Cleaning",
    groups: [
      {
        title: "Cleaning services",
        services: [
          { name: "Bathroom Cleaning", icon: "toilet" },
          { name: "Kitchen Cleaning", icon: "silverware-fork-knife" },
          { name: "Full Home Cleaning", icon: "home-outline" },
          { name: "Sofa Cleaning", icon: "sofa-outline" },
        ],
      },
    ],
  },
  {
    title: "Pest Control",
    groups: [
      {
        title: "Pest services",
        services: [
          { name: "Cockroach Control", icon: "bug-outline" },
          { name: "Termite Control", icon: "home-alert-outline" },
          { name: "Bed Bugs Control", icon: "bed-outline" },
          { name: "Mosquito Control", icon: "spray" },
        ],
      },
    ],
  },
];

export const allHomeServices = [
  ...quickServices,
  ...noteworthyServices,
  ...mostBookedServices,
  ...homepageSections.flatMap((section) => section.services),
  ...serviceCategories.flatMap((category) =>
    category.groups.flatMap((group) =>
      group.services.map((service) => ({
        id: `${category.title}-${group.title}-${service.name}`,
        category: category.title,
        ...service,
      }))
    )
  ),
];
