import * as Location from "expo-location";

async function reverseGeocodeCoords(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          "User-Agent": "ServiceHubMobile/1.0",
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data?.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // Ignore and fallback
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function getCurrentReadableLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error("Location permission denied. Enable location permission and try again.");
  }

  let position = null;
  try {
    position = await Location.getLastKnownPositionAsync({
      maxAge: 60000,
    });
  } catch (err) {
    // Ignore and fallback
  }

  if (!position) {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000,
    });
  }

  const { latitude, longitude } = position.coords;
  const readableAddress = await reverseGeocodeCoords(latitude, longitude);

  return {
    latitude,
    longitude,
    address: readableAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    timestamp: new Date().toISOString(),
  };
}

export async function watchProviderLocation(onLocation, onError) {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error("Location permission denied. Tracking starts only after provider consent.");
  }

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
    },
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const readableAddress = await reverseGeocodeCoords(latitude, longitude);

        onLocation({
          latitude,
          longitude,
          address: readableAddress,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        onError?.(error);
      }
    }
  );
}

