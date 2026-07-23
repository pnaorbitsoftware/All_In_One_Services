import { Linking, Platform } from "react-native";
import { showConfirm } from "./confirm";

export async function openDirections({ latitude, longitude, originLatitude, originLongitude, address }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

  if (!hasCoords) {
    const cleanAddress = String(address || "").trim();
    if (cleanAddress) {
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
      try {
        await Linking.openURL(searchUrl);
        return;
      } catch (err) {
        showConfirm("Maps Launch Error", `Failed to open maps: ${err.message || err}`);
        return;
      }
    }
    showConfirm("Location Unavailable", "Destination coordinates or address are unavailable.");
    return;
  }

  const originParam = Number.isFinite(Number(originLatitude)) && Number.isFinite(Number(originLongitude))
    ? `&origin=${originLatitude},${originLongitude}`
    : "";

  const webUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${lat},${lng}&travelmode=driving`;

  if (Platform.OS === "android") {
    const androidIntent = `google.navigation:q=${lat},${lng}&mode=d`;
    try {
      const canOpen = await Linking.canOpenURL(androidIntent);
      if (canOpen) {
        await Linking.openURL(androidIntent);
        return;
      }
    } catch {
      // Fallback to Web URL
    }
  } else if (Platform.OS === "ios") {
    const iosGoogleMaps = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    const iosAppleMaps = `https://maps.apple.com/?daddr=${lat},${lng}`;
    try {
      const canOpenGoogle = await Linking.canOpenURL(iosGoogleMaps);
      if (canOpenGoogle) {
        await Linking.openURL(iosGoogleMaps);
        return;
      }
    } catch {
      // Ignore
    }
    try {
      const canOpenApple = await Linking.canOpenURL(iosAppleMaps);
      if (canOpenApple) {
        await Linking.openURL(iosAppleMaps);
        return;
      }
    } catch {
      // Fallback to Web URL
    }
  }

  try {
    await Linking.openURL(webUrl);
  } catch (err) {
    showConfirm("Maps Launch Error", `Failed to open maps: ${err.message || err}`);
  }
}

export async function openMapSearch({ latitude, longitude, address }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

  const url = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : address?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
    : "";

  if (!url) {
    showConfirm("Location Unavailable", "Coordinates or address are unavailable.");
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (err) {
    showConfirm("Maps Launch Error", `Failed to open maps: ${err.message || err}`);
  }
}
