import { Image } from "react-native";

export function prefetchServiceImages(items = []) {
  const seen = new Set();

  items
    .map((item) => item?.image)
    .filter((uri) => typeof uri === "string" && uri.trim())
    .slice(0, 18)
    .forEach((uri) => {
      if (seen.has(uri)) return;
      seen.add(uri);
      Image.prefetch(uri).catch(() => null);
    });
}