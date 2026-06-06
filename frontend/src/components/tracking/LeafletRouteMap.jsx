import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

import { haversineDistance, toLatLng } from "./trackingShared";

const defaultCenter = [20.5937, 78.9629];

const createPin = (label, className) =>
  L.divIcon({
    className: `tracking-pin ${className}`,
    html: `<span>${label}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const createPopupLabel = (title, detail = "") =>
  `<strong>${title}</strong>${detail ? `<br><span>${detail}</span>` : ""}`;

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

export default function LeafletRouteMap({ providerLocation, clientLocation, onRouteChange, showRoute = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const clientMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const lastRouteOriginRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(defaultCenter, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const provider = toLatLng(providerLocation);
    const client = toLatLng(clientLocation);
    const bounds = [];

    if (provider) {
      const point = [provider.lat, provider.lng];
      if (!providerMarkerRef.current) {
        providerMarkerRef.current = L.marker(point, {
          icon: createPin("P", "provider"),
          zIndexOffset: 20,
        }).addTo(map).bindPopup(createPopupLabel("Provider current location", providerLocation?.updatedAt ? new Date(providerLocation.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""));
      } else {
        providerMarkerRef.current.setLatLng(point);
        providerMarkerRef.current.setPopupContent(createPopupLabel("Provider current location", providerLocation?.updatedAt ? new Date(providerLocation.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""));
      }
      bounds.push(point);
    }

    if (client) {
      const point = [client.lat, client.lng];
      if (!clientMarkerRef.current) {
        clientMarkerRef.current = L.marker(point, {
          icon: createPin("C", "client"),
        }).addTo(map).bindPopup(createPopupLabel("Client live location", clientLocation?.address || ""));
      } else {
        clientMarkerRef.current.setLatLng(point);
        clientMarkerRef.current.setPopupContent(createPopupLabel("Client live location", clientLocation?.address || ""));
      }
      bounds.push(point);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [42, 42] });
    }
  }, [providerLocation, clientLocation]);

  useEffect(() => {
    const map = mapRef.current;
    const provider = toLatLng(providerLocation);
    const client = toLatLng(clientLocation);
    if (!map || !provider || !client || !showRoute) return undefined;

    const movedFromRouteOrigin = haversineDistance(lastRouteOriginRef.current, provider);
    if (lastRouteOriginRef.current && movedFromRouteOrigin < 100) return undefined;

    let stopped = false;
    const fetchRoute = async () => {
      setError("");
      const url = `https://router.project-osrm.org/route/v1/driving/${provider.lng},${provider.lat};${client.lng},${client.lat}?overview=full&geometries=geojson&steps=true`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Route unavailable.");
        const data = await response.json();
        const route = data?.routes?.[0];
        if (!route?.geometry) throw new Error("Route unavailable.");
        if (stopped) return;

        if (routeLayerRef.current) {
          routeLayerRef.current.removeFrom(map);
        }

        routeLayerRef.current = L.geoJSON(route.geometry, {
          style: {
            color: "#2563eb",
            opacity: 0.9,
            weight: 6,
          },
        }).addTo(map);
        lastRouteOriginRef.current = provider;

        const steps = (route.legs?.[0]?.steps || []).map((step, index) => ({
          id: `${index}-${step.name || step.maneuver?.type || "step"}`,
          instruction: stripHtml(step.maneuver?.instruction || step.name || step.maneuver?.type || "Continue"),
          distance: step.distance ? `${(step.distance / 1000).toFixed(step.distance > 1000 ? 1 : 2)} km` : "",
          duration: step.duration ? `${Math.max(1, Math.round(step.duration / 60))} min` : "",
        }));

        onRouteChange?.({
          distance: route.distance ? `${(route.distance / 1000).toFixed(1)} km` : "",
          duration: route.duration ? `${Math.max(1, Math.round(route.duration / 60))} min` : "",
          eta: route.duration ? Math.max(1, Math.round(route.duration / 60)) : null,
          steps,
        });
      } catch (routeError) {
        if (!stopped) setError(routeError.message);
      }
    };

    fetchRoute();
    return () => {
      stopped = true;
    };
  }, [providerLocation, clientLocation, onRouteChange, showRoute]);

  return (
    <div className="tracking-leaflet-shell">
      <div ref={containerRef} className="tracking-leaflet-map" />
      {error && <div className="tracking-map-error">{error}</div>}
    </div>
  );
}
