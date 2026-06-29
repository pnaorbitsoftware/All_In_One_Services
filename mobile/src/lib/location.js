import * as Location from "expo-location";

function formatAddress(address = {}) {
  return [
    address.name,
    address.street,
    address.district,
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function getCurrentReadableLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error("Location permission denied. Enable location permission and try again.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  let readableAddress = "";

  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    readableAddress = formatAddress(address);
  } catch {
    readableAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }

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
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 100,
    },
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        let readableAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        try {
          const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
          readableAddress = formatAddress(address) || readableAddress;
        } catch {
          // Coordinates still give admin useful tracking if reverse geocoding fails.
        }

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
