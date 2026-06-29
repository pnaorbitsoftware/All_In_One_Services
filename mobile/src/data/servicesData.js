const CATEGORY_PAINTING = "Painting & Water-proofing";
const CATEGORY_APPLIANCE = "AC & Appliance Repair";
const CATEGORY_REPAIR = "Electrician, Plumber & Carpenter";
const CATEGORY_CLEANING = "Bathroom & Kitchen Cleaning";
const CATEGORY_PEST = "Pest Control";

const palette = {
  blue: { bg: "#E8F7FF", color: "#039BE5" },
  mint: { bg: "#E8FFF8", color: "#0F9F8A" },
  violet: { bg: "#F4E8FF", color: "#9B5DE5" },
  yellow: { bg: "#FFF8DE", color: "#D97706" },
  rose: { bg: "#FFECEF", color: "#E11D48" },
  slate: { bg: "#F1F5F9", color: "#475569" },
  green: { bg: "#EAFBEF", color: "#16A34A" },
  orange: { bg: "#FFF1E7", color: "#EA580C" },
};

function service(id, name, category, groupTitle, estimatedTime, description, icon, tone = "blue") {
  return {
    id,
    name,
    category,
    groupTitle,
    slug: id,
    estimatedTime,
    badge: estimatedTime,
    responseTime: estimatedTime,
    description,
    icon,
    ...palette[tone],
  };
}

export const finalServiceCategories = [
  {
    id: "painting-waterproofing",
    title: CATEGORY_PAINTING,
    services: [
      service("painting-waterproofing", "Painting & Water-proofing", CATEGORY_PAINTING, "", "60 mins", "Wall painting and water-proofing support by verified professionals.", "format-paint", "rose"),
    ],
  },
  {
    id: "ac-appliance-repair",
    title: CATEGORY_APPLIANCE,
    groups: [
      {
        title: "Large appliances",
        services: [
          service("ac-repair", "AC Repair", CATEGORY_APPLIANCE, "Large appliances", "49 mins", "AC service and repair by trusted professionals.", "fan", "blue"),
          service("washing-machine", "Washing Machine", CATEGORY_APPLIANCE, "Large appliances", "49 mins", "Washing machine inspection, service, and repair.", "washing-machine", "blue"),
          service("refrigerator", "Refrigerator", CATEGORY_APPLIANCE, "Large appliances", "55 mins", "Refrigerator cooling and maintenance support.", "fridge-outline", "mint"),
          service("television", "Television", CATEGORY_APPLIANCE, "Large appliances", "60 mins", "Television diagnosis, setup, and repair support.", "television", "slate"),
        ],
      },
      {
        title: "Other appliances",
        services: [
          service("chimney", "Chimney", CATEGORY_APPLIANCE, "Other appliances", "45 mins", "Kitchen chimney cleaning, service, and repair.", "fan", "slate"),
          service("microwave", "Microwave", CATEGORY_APPLIANCE, "Other appliances", "45 mins", "Microwave inspection and repair service.", "microwave", "orange"),
          service("stove", "Stove", CATEGORY_APPLIANCE, "Other appliances", "45 mins", "Gas stove service, cleaning, and repair.", "stove", "rose"),
          service("laptop", "Laptop", CATEGORY_APPLIANCE, "Other appliances", "60 mins", "Laptop diagnosis and repair by trained technicians.", "laptop", "slate"),
          service("ro-water-purifier", "RO/Water Purifier", CATEGORY_APPLIANCE, "Other appliances", "45 mins", "RO and water purifier service for clean drinking water.", "water-pump", "blue"),
          service("geyser", "Geyser", CATEGORY_APPLIANCE, "Other appliances", "55 mins", "Geyser service, repair, and safety inspection.", "water-boiler", "rose"),
          service("air-cooler", "Air Cooler", CATEGORY_APPLIANCE, "Other appliances", "50 mins", "Air cooler repair, cleaning, and maintenance.", "fan", "blue"),
        ],
      },
    ],
  },
  {
    id: "electrician-plumber-carpenter",
    title: CATEGORY_REPAIR,
    groups: [
      {
        title: "Home repairs",
        services: [
          service("electrician", "Electrician", CATEGORY_REPAIR, "Home repairs", "35 mins", "Electrical repair and installation by verified electricians.", "power-socket-eu", "yellow"),
          service("plumber", "Plumber", CATEGORY_REPAIR, "Home repairs", "35 mins", "Plumbing repair, leakage fixes, and fitting support.", "pipe-wrench", "blue"),
          service("carpenter", "Carpenter", CATEGORY_REPAIR, "Home repairs", "25 mins", "Door, woodwork, and fitting support by local carpenters.", "hammer", "orange"),
          service("festival-lights-installation", "Festival Lights Installation", CATEGORY_REPAIR, "Home repairs", "45 mins", "Safe decorative light installation for homes and events.", "string-lights", "yellow"),
        ],
      },
      {
        title: "Home installation",
        services: [
          service("furniture-assembly", "Furniture Assembly", CATEGORY_REPAIR, "Home installation", "60 mins", "Furniture assembly and fitting support.", "sofa-outline", "violet"),
          service("ikea-furniture-assembly", "IKEA Furniture Assembly", CATEGORY_REPAIR, "Home installation", "75 mins", "Assembly support for modular and IKEA furniture.", "dresser-outline", "violet"),
          service("tile-grouting", "Tile Grouting", CATEGORY_REPAIR, "Home installation", "45 mins", "Tile gap filling and grout repair support.", "grid", "slate"),
        ],
      },
    ],
  },
  {
    id: "bathroom-kitchen-cleaning",
    title: CATEGORY_CLEANING,
    groups: [
      {
        title: "Cleaning services",
        services: [
          service("bathroom-cleaning", "Bathroom Cleaning", CATEGORY_CLEANING, "Cleaning services", "46 mins", "Bathroom deep cleaning with trained professionals.", "toilet", "blue"),
          service("kitchen-cleaning", "Kitchen Cleaning", CATEGORY_CLEANING, "Cleaning services", "55 mins", "Kitchen degreasing and deep cleaning service.", "silverware-fork-knife", "orange"),
          service("full-home-cleaning", "Full Home Cleaning", CATEGORY_CLEANING, "Cleaning services", "2 hrs", "Complete home cleaning for a fresher space.", "home-heart", "green"),
          service("sofa-cleaning", "Sofa Cleaning", CATEGORY_CLEANING, "Cleaning services", "60 mins", "Sofa shampooing and fabric cleaning service.", "sofa-outline", "violet"),
        ],
      },
    ],
  },
  {
    id: "pest-control",
    title: CATEGORY_PEST,
    groups: [
      {
        title: "Pest services",
        services: [
          service("cockroach-control", "Cockroach Control", CATEGORY_PEST, "Pest services", "60 mins", "Cockroach treatment for kitchens and homes.", "bug-outline", "yellow"),
          service("termite-control", "Termite Control", CATEGORY_PEST, "Pest services", "75 mins", "Termite inspection and control treatment.", "home-alert-outline", "yellow"),
          service("bed-bugs-control", "Bed Bugs Control", CATEGORY_PEST, "Pest services", "75 mins", "Bed bug inspection and pest control treatment.", "bed-outline", "rose"),
          service("mosquito-control", "Mosquito Control", CATEGORY_PEST, "Pest services", "60 mins", "Mosquito control treatment for indoor and outdoor spaces.", "spray-bottle", "mint"),
        ],
      },
    ],
  },
];

export const serviceCategories = finalServiceCategories.map((category) => ({
  ...category,
  groups: category.groups || [{ title: "", services: category.services }],
  services: category.services || category.groups.flatMap((group) => group.services),
}));

export const finalServices = serviceCategories.flatMap((category) => category.services);
export const finalServiceNames = finalServices.map((item) => item.name);
export const allowedServiceNames = new Set(finalServiceNames);

export const quickServices = [
  findService("AC Repair"),
  findService("Washing Machine"),
  findService("Refrigerator"),
  findService("Electrician"),
  findService("Plumber"),
  findService("Bathroom Cleaning"),
].filter(Boolean);

export const noteworthyServices = [
  findService("Kitchen Cleaning"),
  findService("Full Home Cleaning"),
  findService("Sofa Cleaning"),
].filter(Boolean);

export const mostBookedServices = [
  findService("AC Repair"),
  findService("Washing Machine"),
  findService("Electrician"),
  findService("Bathroom Cleaning"),
].filter(Boolean);

export const homepageSections = [];

export const promoBanners = [
  banner("promo-electrician", "HOME REPAIRS", "Electrician", "Trusted repairs nearby", "Book now", "Electrician", CATEGORY_REPAIR, "#D97706"),
  banner("promo-ac", "AC SERVICE", "AC Repair", "Fast cooling checks", "Book now", "AC Repair", CATEGORY_APPLIANCE, "#0EA5E9"),
  banner("promo-cleaning", "FRESH HOME", "Bathroom Cleaning", "Deep cleaning made simple", "Book now", "Bathroom Cleaning", CATEGORY_CLEANING, "#0F766E"),
];

export const allHomeServices = finalServices;

export function findService(name) {
  return finalServices.find((serviceItem) => serviceItem.name === name);
}

export function getServiceVisual(item = {}) {
  const serviceItem = findService(item.name) || findService(item.category) || item;
  return {
    icon: serviceItem.icon || "briefcase-check-outline",
    color: serviceItem.color || "#0f766e",
    bg: serviceItem.bg || "#eef2f7",
  };
}

function banner(id, eyebrow, title, subtitle, action, serviceName, category, accent) {
  const linkedService = findService(serviceName) || finalServices[0];
  return {
    id,
    eyebrow,
    title,
    subtitle,
    action,
    serviceName,
    category,
    accent,
    icon: linkedService.icon || "briefcase-check-outline",
    bg: linkedService.bg,
  };
}
