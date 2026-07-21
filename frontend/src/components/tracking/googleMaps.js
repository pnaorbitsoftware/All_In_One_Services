const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

let googleMapsPromise;

export const hasGoogleMapsKey = () => Boolean(GOOGLE_MAPS_API_KEY);

export const loadGoogleMaps = () => {
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("Google Maps API key is missing."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("servicehub-google-maps");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "servicehub-google-maps";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps could not load."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const geocodeWithGoogle = async (address) => {
  if (!address?.trim()) return null;

  const maps = await loadGoogleMaps();
  return new Promise((resolve) => {
    new maps.Geocoder().geocode({ address: address.trim() }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }

      const location = results[0].geometry.location;
      resolve({
        lat: location.lat(),
        lng: location.lng(),
      });
    });
  });
};

export const reverseGeocodeWithGoogle = async ({ lat, lng }) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";

  const maps = await loadGoogleMaps();
  return new Promise((resolve) => {
    new maps.Geocoder().geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.formatted_address) {
        resolve("");
        return;
      }

      resolve(results[0].formatted_address);
    });
  });
};
