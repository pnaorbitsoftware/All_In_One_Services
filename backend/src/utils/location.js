import mongoose from "mongoose";

export const toCoordinate = (value) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

export const isValidCoordinatePair = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

export const buildPointLocation = (
  { latitude, longitude, lat, lng, accuracy = null, address = "" },
  timestampField = "updatedAt"
) => {
  const parsedLatitude = toCoordinate(latitude ?? lat);
  const parsedLongitude = toCoordinate(longitude ?? lng);

  if (!isValidCoordinatePair(parsedLatitude, parsedLongitude)) return null;

  return {
    type: "Point",
    coordinates: [parsedLongitude, parsedLatitude],
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    accuracy: toCoordinate(accuracy),
    ...(address ? { address: address.trim() } : {}),
    [timestampField]: new Date(),
  };
};

export const locationToLatLng = (location) => {
  const coordinates = Array.isArray(location?.coordinates) ? location.coordinates : [];
  const latitude = toCoordinate(location?.latitude ?? coordinates[1]);
  const longitude = toCoordinate(location?.longitude ?? coordinates[0]);

  if (!isValidCoordinatePair(latitude, longitude)) return null;
  return { lat: latitude, lng: longitude };
};

export const publicLocation = (location) => {
  const point = locationToLatLng(location);
  if (!point) return null;

  return {
    type: "Point",
    coordinates: [point.lng, point.lat],
    latitude: point.lat,
    longitude: point.lng,
    accuracy: toCoordinate(location?.accuracy),
    address: location?.address || "",
    capturedAt: location?.capturedAt || null,
    updatedAt: location?.updatedAt || null,
  };
};

export const bookingLookup = (bookingId) => {
  if (mongoose.isValidObjectId(bookingId)) {
    return { $or: [{ _id: bookingId }, { bookingId }] };
  }

  return { bookingId };
};
