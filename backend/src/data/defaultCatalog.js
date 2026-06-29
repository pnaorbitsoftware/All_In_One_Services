const CATEGORY_PAINTING = "Painting & Water-proofing";
const CATEGORY_APPLIANCE = "AC & Appliance Repair";
const CATEGORY_REPAIR = "Electrician, Plumber & Carpenter";
const CATEGORY_CLEANING = "Bathroom & Kitchen Cleaning";
const CATEGORY_PEST = "Pest Control";

const serviceDefinitions = [
  ["painting-waterproofing", "Painting & Water-proofing", CATEGORY_PAINTING, "Paintbrush", "Wall painting and water-proofing support by verified professionals."],
  ["ac-repair", "AC Repair", CATEGORY_APPLIANCE, "Fan", "AC service and repair by trusted professionals."],
  ["washing-machine", "Washing Machine", CATEGORY_APPLIANCE, "WashingMachine", "Washing machine inspection, service, and repair."],
  ["refrigerator", "Refrigerator", CATEGORY_APPLIANCE, "Refrigerator", "Refrigerator cooling and maintenance support."],
  ["television", "Television", CATEGORY_APPLIANCE, "Tv", "Television diagnosis, setup, and repair support."],
  ["chimney", "Chimney", CATEGORY_APPLIANCE, "Fan", "Kitchen chimney cleaning, service, and repair."],
  ["microwave", "Microwave", CATEGORY_APPLIANCE, "Microwave", "Microwave inspection and repair service."],
  ["stove", "Stove", CATEGORY_APPLIANCE, "CookingPot", "Gas stove service, cleaning, and repair."],
  ["laptop", "Laptop", CATEGORY_APPLIANCE, "Laptop", "Laptop diagnosis and repair by trained technicians."],
  ["ro-water-purifier", "RO/Water Purifier", CATEGORY_APPLIANCE, "Droplets", "RO and water purifier service for clean drinking water."],
  ["geyser", "Geyser", CATEGORY_APPLIANCE, "Waves", "Geyser service, repair, and safety inspection."],
  ["air-cooler", "Air Cooler", CATEGORY_APPLIANCE, "Fan", "Air cooler repair, cleaning, and maintenance."],
  ["electrician", "Electrician", CATEGORY_REPAIR, "Zap", "Electrical repair and installation by verified electricians."],
  ["plumber", "Plumber", CATEGORY_REPAIR, "Wrench", "Plumbing repair, leakage fixes, and fitting support."],
  ["carpenter", "Carpenter", CATEGORY_REPAIR, "Hammer", "Door, woodwork, and fitting support by local carpenters."],
  ["festival-lights-installation", "Festival Lights Installation", CATEGORY_REPAIR, "Lightbulb", "Safe decorative light installation for homes and events."],
  ["furniture-assembly", "Furniture Assembly", CATEGORY_REPAIR, "Sofa", "Furniture assembly and fitting support."],
  ["ikea-furniture-assembly", "IKEA Furniture Assembly", CATEGORY_REPAIR, "PackageCheck", "Assembly support for modular and IKEA furniture."],
  ["tile-grouting", "Tile Grouting", CATEGORY_REPAIR, "Grid3X3", "Tile gap filling and grout repair support."],
  ["bathroom-cleaning", "Bathroom Cleaning", CATEGORY_CLEANING, "Bath", "Bathroom deep cleaning with trained professionals."],
  ["kitchen-cleaning", "Kitchen Cleaning", CATEGORY_CLEANING, "CookingPot", "Kitchen degreasing and deep cleaning service."],
  ["full-home-cleaning", "Full Home Cleaning", CATEGORY_CLEANING, "Home", "Complete home cleaning for a fresher space."],
  ["sofa-cleaning", "Sofa Cleaning", CATEGORY_CLEANING, "Sofa", "Sofa shampooing and fabric cleaning service."],
  ["cockroach-control", "Cockroach Control", CATEGORY_PEST, "Bug", "Cockroach treatment for kitchens and homes."],
  ["termite-control", "Termite Control", CATEGORY_PEST, "ShieldAlert", "Termite inspection and control treatment."],
  ["bed-bugs-control", "Bed Bugs Control", CATEGORY_PEST, "Bug", "Bed bug inspection and pest control treatment."],
  ["mosquito-control", "Mosquito Control", CATEGORY_PEST, "SprayCan", "Mosquito control treatment for indoor and outdoor spaces."],
];

export const finalCategoryTitles = [
  CATEGORY_PAINTING,
  CATEGORY_APPLIANCE,
  CATEGORY_REPAIR,
  CATEGORY_CLEANING,
  CATEGORY_PEST,
];

export const finalServiceTitles = serviceDefinitions.map(([, title]) => title);

export const defaultCategories = [
  {
    categoryCode: "painting-waterproofing",
    title: CATEGORY_PAINTING,
    description: "Painting and water-proofing services for walls and homes.",
    iconName: "Paintbrush",
    displayOrder: 1,
    isActive: true,
  },
  {
    categoryCode: "ac-appliance-repair",
    title: CATEGORY_APPLIANCE,
    description: "AC, appliances, laptop, purifier, geyser, and cooler repair services.",
    iconName: "Wrench",
    displayOrder: 2,
    isActive: true,
  },
  {
    categoryCode: "electrician-plumber-carpenter",
    title: CATEGORY_REPAIR,
    description: "Electrical, plumbing, carpentry, furniture, and home installation services.",
    iconName: "Hammer",
    displayOrder: 3,
    isActive: true,
  },
  {
    categoryCode: "bathroom-kitchen-cleaning",
    title: CATEGORY_CLEANING,
    description: "Bathroom, kitchen, full-home, and sofa cleaning services.",
    iconName: "Sparkles",
    displayOrder: 4,
    isActive: true,
  },
  {
    categoryCode: "pest-control",
    title: CATEGORY_PEST,
    description: "Cockroach, termite, bed bugs, and mosquito control services.",
    iconName: "Bug",
    displayOrder: 5,
    isActive: true,
  },
];

export const defaultServices = serviceDefinitions.map(
  ([serviceCode, title, category, iconName, description]) => ({
    serviceCode,
    title,
    category,
    iconName,
    description,
    isActive: true,
  }),
);

export const defaultSiteContents = [
  {
    sectionKey: "hero",
    title: "ServiceHub",
    subtitle: "Book trusted local service providers near you.",
    body: "Search appliance repair, home repairs, cleaning, pest control, and painting services in one place.",
    items: [
      { label: "Active services", value: `${defaultServices.length}+` },
      { label: "Secure booking", value: "OTP" },
      { label: "Support", value: "Live" },
    ],
  },
  {
    sectionKey: "services",
    title: "Home Services",
    subtitle: "Browse available service categories and book approved providers after admin verification.",
  },
  {
    sectionKey: "booking",
    title: "Book a Service",
    subtitle: "Choose a service, share contact details, and select the preferred time period.",
    body: "Every booking stores user details, date, time, service duration, address, payment status, and tracking status.",
  },
  {
    sectionKey: "about",
    title: "About Us",
    body: "ServiceHub connects homeowners with approved local providers for appliance repair, home repairs, cleaning, pest control, and painting services.",
    items: [
      { label: "Provider approval", value: "Admin" },
      { label: "Payments", value: "Tracked" },
      { label: "Bookings", value: "Synced" },
    ],
  },
  {
    sectionKey: "contact",
    title: "Contact Details",
    subtitle: "Need help booking a service or want to ask a question?",
    items: [
      { label: "Phone", value: "+91 9158852129" },
      { label: "Email", value: "info.aparaitech@gmail.com" },
      { label: "Address", value: "Baramati, Maharashtra, India" },
      { label: "Hours", value: "Mon - Sun, 8:00 AM - 9:00 PM" },
    ],
  },
  {
    sectionKey: "footer",
    title: "ServiceHub",
    subtitle: "Book nearby service providers, compare ratings, and manage service requests.",
    items: [
      { label: "Support email", value: "info.aparaitech@gmail.com" },
      { label: "Support phone", value: "+91 9158852129" },
    ],
  },
];
