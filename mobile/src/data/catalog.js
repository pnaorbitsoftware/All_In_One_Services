import { getServiceImage } from "../constants/serviceImages";
import { finalServices, finalServiceNames, findService, getServiceVisual } from "./servicesData";

const finalServiceNameSet = new Set(finalServiceNames);

const serviceAliases = {
  "Painting Service": "Painting & Water-proofing",
  Painter: "Painting & Water-proofing",
  "Water Proofing": "Painting & Water-proofing",
  AC: "AC Repair",
  "AC Service": "AC Repair",
  "Air Conditioner": "AC Repair",
  "Washing Machine Repair": "Washing Machine",
  "Refrigerator Repair": "Refrigerator",
  Fridge: "Refrigerator",
  "TV Repair": "Television",
  TV: "Television",
  "Water Purifier": "RO/Water Purifier",
  "Water Purifier Service and Repair": "RO/Water Purifier",
  "RO Purifier": "RO/Water Purifier",
  "Cooler Repair": "Air Cooler",
  Cooler: "Air Cooler",
  "Geyser Service & Repair": "Geyser",
  Furniture: "Furniture Assembly",
  "Furniture Repair": "Furniture Assembly",
  "IKEA Assembly": "IKEA Furniture Assembly",
  "Bed Bug Control": "Bed Bugs Control",
  Bedbugs: "Bed Bugs Control",
};

Object.assign(serviceAliases, Object.fromEntries(finalServiceNames.map((name) => [name, name])));

export function normalizeServiceName(value = "") {
  const raw = String(value || "").trim();
  if (serviceAliases[raw]) return serviceAliases[raw];
  const lowered = raw.toLowerCase();
  const aliasMatch = Object.entries(serviceAliases).find(([alias]) => alias.toLowerCase() === lowered);
  if (aliasMatch) return aliasMatch[1];
  const match = finalServiceNames.find((name) => name.toLowerCase() === lowered);
  return match || raw;
}

export function isFinalServiceName(value = "") {
  return finalServiceNameSet.has(normalizeServiceName(value));
}

export function iconForCategory(category = "") {
  return getServiceVisual({ name: normalizeServiceName(category), category }).icon || "briefcase-check-outline";
}

export function imageForService(service = {}) {
  return getServiceImage(findService(normalizeServiceName(service.name || service.title || service.category)) || service);
}

export function normalizeProvider(provider) {
  const normalizedCategory = normalizeServiceName(provider.category || "");
  if (!normalizedCategory) return null;

  const profileImage = typeof provider.profileImage === "string" && provider.profileImage.trim()
    ? provider.profileImage.trim()
    : typeof provider.image === "string"
      ? provider.image.trim()
      : "";

  const approvalStatus = provider.approvalStatus || "approved";
  const availabilityStatus = provider.availabilityStatus || (provider.isActive === false ? "inactive" : "available");
  const isBookable =
    approvalStatus !== "pending" &&
    approvalStatus !== "rejected" &&
    provider.isActive !== false &&
    !["inactive", "absent"].includes(availabilityStatus);
  const service = findService(normalizedCategory);
  const serviceCategory = service?.category || (finalServiceNameSet.has(normalizedCategory) ? normalizedCategory : "Other services");

  return {
    id: provider._id || provider.providerCode || `${provider.name}-${normalizedCategory}`,
    providerId: provider._id || "",
    name: provider.name || "Service provider",
    category: normalizedCategory,
    serviceCategory,
    location: provider.location || "Nearby",
    rating: provider.rating || 0,
    reviews: provider.reviews || 0,
    responseTime: provider.responseTime || service?.estimatedTime || "~1 hr",
    price: provider.price || "Contact for price",
    phone: provider.phone || "",
    email: provider.email || "",
    isActive: provider.isActive !== false,
    approvalStatus,
    availabilityStatus,
    profileStatus: provider.profileStatus || (provider.isActive === false ? "inactive" : "active"),
    isBookable,
    unavailableMessage: isBookable ? "" : "Provider is currently unavailable.",
    description: provider.description || service?.description || `${provider.name || "This provider"} handles ${normalizedCategory} services.`,
    about: provider.about || provider.description || `${normalizedCategory} support for local homes.`,
    features: provider.features?.length ? provider.features : [normalizedCategory, "On-site visit", "Work inspection"],
    profileImage,
    image: profileImage || imageForService({ name: normalizedCategory, category: normalizedCategory }),
    icon: service ? iconForCategory(normalizedCategory) : "briefcase-plus-outline",
  };
}

export function buildMarketplace(providers = []) {
  const map = new Map();
  providers.forEach((provider) => {
    const normalized = normalizeProvider(provider);
    if (normalized) map.set(`${normalized.name}-${normalized.category}`, normalized);
  });

  return [...map.values()];
}
