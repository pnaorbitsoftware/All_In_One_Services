export const serviceImages = {
  acRepair: require("../assets/images/services/ac-repair.jpg"),
  washingMachine: require("../assets/images/services/washing-machine.jpg"),
  refrigeratorRepair: require("../assets/images/services/refrigerator-repair.jpg"),
  laptopRepair: require("../assets/images/services/laptop-repair.jpg"),
  waterPurifier: require("../assets/images/services/water-purifier.jpg"),
  coolerRepair: require("../assets/images/services/cooler-repair.jpg"),
  electrician: require("../assets/images/services/electrician.jpg"),
  plumber: require("../assets/images/services/plumber.jpg"),
  carPainter: require("../assets/images/services/car-painter.jpg"),
  furniture: require("../assets/images/services/furniture.jpg"),
  bathroomCleaning: require("../assets/images/services/bathroom-cleaning.jpg"),
  kitchenCleaning: require("../assets/images/services/kitchen-cleaning.jpg"),
  fullHomeCleaning: require("../assets/images/services/full-home-cleaning.jpg"),
  sofaCleaning: require("../assets/images/services/sofa-cleaning.jpg"),
  bedBugsControl: require("../assets/images/services/bed-bugs-control.jpg"),
  placeholder: require("../assets/images/services/service-placeholder.jpg"),
};

const imageBySlug = {
  "painting-waterproofing": serviceImages.carPainter,
  "ac-repair": serviceImages.acRepair,
  "washing-machine": serviceImages.washingMachine,
  refrigerator: serviceImages.refrigeratorRepair,
  "refrigerator-repair": serviceImages.refrigeratorRepair,
  television: serviceImages.placeholder,
  chimney: serviceImages.placeholder,
  microwave: serviceImages.placeholder,
  stove: serviceImages.placeholder,
  laptop: serviceImages.laptopRepair,
  "laptop-repair": serviceImages.laptopRepair,
  "ro-water-purifier": serviceImages.waterPurifier,
  geyser: serviceImages.placeholder,
  "air-cooler": serviceImages.coolerRepair,
  "cooler-repair": serviceImages.coolerRepair,
  electrician: serviceImages.electrician,
  plumber: serviceImages.plumber,
  carpenter: serviceImages.furniture,
  "festival-lights-installation": serviceImages.placeholder,
  "furniture-assembly": serviceImages.furniture,
  furniture: serviceImages.furniture,
  "ikea-furniture-assembly": serviceImages.furniture,
  "tile-grouting": serviceImages.placeholder,
  "bathroom-cleaning": serviceImages.bathroomCleaning,
  "kitchen-cleaning": serviceImages.kitchenCleaning,
  "full-home-cleaning": serviceImages.fullHomeCleaning,
  "sofa-cleaning": serviceImages.sofaCleaning,
  "cockroach-control": serviceImages.placeholder,
  "termite-control": serviceImages.placeholder,
  "bed-bugs-control": serviceImages.bedBugsControl,
  "mosquito-control": serviceImages.placeholder,
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/ro\/?water/g, "ro-water")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function getServiceImage(service = {}) {
  if (typeof service.image === "number") return service.image;
  const slug = service.slug || slugify(service.name || service.title || service.category);
  return imageBySlug[slug] || serviceImages.placeholder;
}
