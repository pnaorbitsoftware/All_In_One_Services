const ignoredWords = /\b(service|services|provider|providers|repair|repairs|work|works)\b/g;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanLabel = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(ignoredWords, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const compactLabel = (value = "") => cleanLabel(value).replace(/[^a-z0-9]/g, "");

const aliasGroups = [
  ["Painting & Water-proofing", "painting", "painting service", "waterproofing", "water proofing", "painting and waterproofing", "painter"],
  ["AC Repair", "ac", "ac repair", "air conditioner", "air conditioning", "cooling"],
  ["Washing Machine", "washing machine", "washing machine repair", "washer", "laundry machine"],
  ["Refrigerator", "refrigerator", "refrigerator repair", "fridge", "fridge repair"],
  ["Television", "television", "tv", "tv repair", "television repair"],
  ["Chimney", "chimney", "chimney repair", "chimney cleaning"],
  ["Microwave", "microwave", "microwave repair", "oven"],
  ["Stove", "stove", "gas stove", "stove repair"],
  ["Laptop", "laptop", "laptop repair", "computer repair"],
  ["RO/Water Purifier", "ro", "ro purifier", "water purifier", "water purifier service and repair"],
  ["Geyser", "geyser", "geyser service", "geyser service and repair", "water heater"],
  ["Air Cooler", "air cooler", "cooler", "cooler repair"],
  ["Electrician", "electrician", "electrical", "electric"],
  ["Plumber", "plumber", "plumbing"],
  ["Carpenter", "carpenter", "carpentry"],
  ["Festival Lights Installation", "festival lights", "festival lights installation", "lights installation"],
  ["Furniture Assembly", "furniture", "furniture assembly", "furniture repair"],
  ["IKEA Furniture Assembly", "ikea furniture", "ikea furniture assembly", "ikea assembly"],
  ["Tile Grouting", "tile grouting", "grouting", "tile repair"],
  ["Bathroom Cleaning", "bathroom cleaning", "bathroom clean"],
  ["Kitchen Cleaning", "kitchen cleaning", "kitchen clean"],
  ["Full Home Cleaning", "full home cleaning", "home cleaning", "deep cleaning", "cleaning"],
  ["Sofa Cleaning", "sofa cleaning", "couch cleaning"],
  ["Cockroach Control", "cockroach control", "cockroach", "cockroach pest control"],
  ["Termite Control", "termite control", "termite", "termite pest control"],
  ["Bed Bugs Control", "bed bugs control", "bed bug control", "bedbugs", "bed bugs"],
  ["Mosquito Control", "mosquito control", "mosquito", "mosquito pest control"],
];

export const finalServiceNames = aliasGroups.map(([name]) => name);
export const allowedServiceNames = new Set(finalServiceNames);

const categoryToServices = {
  "AC & Appliance Repair": [
    "AC Repair", "Washing Machine", "Refrigerator", "Television", "Chimney",
    "Microwave", "Stove", "Laptop", "RO/Water Purifier", "Geyser", "Air Cooler"
  ],
  "Electrician, Plumber & Carpenter": [
    "Electrician", "Plumber", "Carpenter", "Festival Lights Installation",
    "Furniture Assembly", "IKEA Furniture Assembly", "Tile Grouting"
  ],
  "Bathroom & Kitchen Cleaning": [
    "Bathroom Cleaning", "Kitchen Cleaning", "Full Home Cleaning", "Sofa Cleaning"
  ],
  "Pest Control": [
    "Cockroach Control", "Termite Control", "Bed Bugs Control", "Mosquito Control"
  ],
  "Painting & Water-proofing": [
    "Painting & Water-proofing"
  ]
};

export const normalizeServiceName = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const compact = compactLabel(raw);
  const group = aliasGroups.find((aliases) => aliases.map(compactLabel).some((alias) => alias === compact));
  return group ? group[0] : raw;
};

export const isAllowedServiceName = (value = "") => allowedServiceNames.has(normalizeServiceName(value));

export const getServiceAliases = (value = "") => {
  const normalized = normalizeServiceName(value);
  const raw = String(value).trim();
  const aliases = new Set([raw, normalized, cleanLabel(raw), cleanLabel(normalized)].filter(Boolean));
  const group = aliasGroups.find(([name]) => name === normalized);
  if (group) group.forEach((alias) => aliases.add(alias));

  // If the queried value is a category, expand it to include all of its sub-services and their aliases
  for (const [category, services] of Object.entries(categoryToServices)) {
    if (compactLabel(category) === compactLabel(raw) || compactLabel(category) === compactLabel(normalized)) {
      services.forEach((service) => {
        const serviceNorm = normalizeServiceName(service);
        aliases.add(service);
        aliases.add(serviceNorm);
        aliases.add(cleanLabel(service));
        aliases.add(cleanLabel(serviceNorm));
        const sGroup = aliasGroups.find(([name]) => name === serviceNorm);
        if (sGroup) sGroup.forEach((alias) => aliases.add(alias));
      });
    }
  }

  return [...aliases].filter(Boolean);
};

export const buildServiceRegexes = (value = "") =>
  getServiceAliases(value).map((alias) => new RegExp(`^${escapeRegex(alias)}$`, "i"));

export const categoryMatchesService = (category, service) => {
  const categoryKeys = new Set(getServiceAliases(category).map(compactLabel));
  return getServiceAliases(service).some((alias) => categoryKeys.has(compactLabel(alias)));
};

