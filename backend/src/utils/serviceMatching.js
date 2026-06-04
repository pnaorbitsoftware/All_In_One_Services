const ignoredWords = /\b(service|services|provider|providers|repair|repairs|work|works)\b/g;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanLabel = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(ignoredWords, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const compactLabel = (value = "") => cleanLabel(value).replace(/[^a-z0-9]/g, "");

export const getServiceAliases = (value = "") => {
  const raw = String(value).trim();
  const cleaned = cleanLabel(raw);
  const compact = compactLabel(raw);
  const words = cleaned.split(" ").filter(Boolean);
  const aliases = new Set([raw, cleaned].filter(Boolean));

  if (compact.includes("plumb")) {
    aliases.add("plumber");
    aliases.add("plumbing");
  }

  if (compact.includes("electric")) {
    aliases.add("electrician");
    aliases.add("electrical");
    aliases.add("electric");
  }

  if (compact.includes("carpent")) {
    aliases.add("carpenter");
    aliases.add("carpentry");
  }

  if (compact.includes("paint")) {
    aliases.add("painter");
    aliases.add("painting");
  }

  if (compact.includes("clean")) {
    aliases.add("cleaner");
    aliases.add("cleaning");
  }

  if (words.includes("ac") || compact.includes("acrepair") || compact.includes("aircondition")) {
    aliases.add("ac");
    aliases.add("ac repair");
    aliases.add("air conditioner");
    aliases.add("air conditioning");
  }

  if (compact.includes("refrigerator") || compact.includes("fridge")) {
    aliases.add("refrigerator");
    aliases.add("refrigerator repair");
    aliases.add("fridge");
  }

  if (compact.includes("washingmachine") || compact.includes("washer")) {
    aliases.add("washing machine");
    aliases.add("washing machine repair");
    aliases.add("washer");
  }

  if (words.includes("tv") || compact.includes("tvrepair") || compact.includes("television")) {
    aliases.add("tv");
    aliases.add("tv repair");
    aliases.add("television");
  }

  return [...aliases];
};

export const buildServiceRegexes = (value = "") =>
  getServiceAliases(value).map((alias) => new RegExp(`^${escapeRegex(alias)}$`, "i"));

export const categoryMatchesService = (category, service) => {
  const categoryKeys = new Set(getServiceAliases(category).map(compactLabel));
  return getServiceAliases(service).some((alias) => categoryKeys.has(compactLabel(alias)));
};
