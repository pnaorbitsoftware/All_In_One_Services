import { useEffect, useMemo, useRef, useState } from "react";

import { loadGoogleMaps } from "./googleMaps";
import { toLatLng } from "./trackingShared";

const indiaCenter = { lat: 20.5937, lng: 78.9629 };

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#2a2f35" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b8bac7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1f" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3a3a47" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#323840" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1f2329" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a414a" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#20252c" }] },
];

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const formatDistance = (meters = 0) => {
  const value = Number(meters);
  if (!Number.isFinite(value)) return "";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  return `${Math.round(value)} m`;
};

const formatDuration = (seconds = 0) => {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "";
  const minutes = Math.max(1, Math.round(value / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
};

const createOsrmInstruction = (step = {}) => {
  const road = step.name ? ` on ${step.name}` : "";
  const type = step.maneuver?.type || "continue";
  const modifier = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : "";

  if (type === "depart") return `Start${road}`;
  if (type === "arrive") return "Arrive at client location";
  if (type === "turn") return `Turn${modifier}${road}`.trim();
  if (type === "roundabout") return `Enter roundabout${road}`;
  if (type === "merge") return `Merge${modifier}${road}`.trim();
  return `Continue${road}`;
};

const escapeSvgText = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const makeMarkerIcon = (maps, label, color) => {
  const text = escapeSvgText(String(label || "").slice(0, 18));
  const width = Math.max(72, Math.min(124, 48 + text.length * 7));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="48" viewBox="0 0 ${width} 48">
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity=".22"/>
      </filter>
      <g filter="url(#shadow)">
        <rect x="5" y="6" width="${width - 10}" height="30" rx="15" fill="${color}"/>
        <circle cx="24" cy="21" r="7" fill="#ffffff" fill-opacity=".95"/>
        <text x="39" y="25" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="800" fill="#ffffff">${text}</text>
        <path d="M20 36 L28 36 L24 44 Z" fill="${color}"/>
      </g>
    </svg>
  `.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(width, 48),
    anchor: new maps.Point(24, 44),
  };
};

const makeMarker = (maps, map, point, label, color) =>
  new maps.Marker({
    position: point,
    map,
    title: label,
    icon: makeMarkerIcon(maps, label, color),
  });

const drawStyledPolyline = ({ maps, map, path, color, dashed }) =>
  new maps.Polyline({
    path,
    map,
    strokeColor: color,
    strokeOpacity: dashed ? 0 : 0.92,
    strokeWeight: 6,
    icons: dashed
      ? [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeOpacity: 1,
              strokeColor: color,
              scale: 4,
            },
            offset: "0",
            repeat: "18px",
          },
        ]
      : undefined,
  });

export default function GoogleRouteMap({
  providerLocation,
  clientLocation,
  onRouteChange,
  showRoute = true,
  variant = "provider",
  providerLabel = "You",
  clientLabel = "Client",
}) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const clientMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const fallbackPolylineRef = useRef(null);
  const styledPolylineRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [error, setError] = useState("");

  const providerPoint = useMemo(() => toLatLng(providerLocation), [providerLocation]);
  const clientPoint = useMemo(() => toLatLng(clientLocation), [clientLocation]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return undefined;

    let stopped = false;
    loadGoogleMaps()
      .then((maps) => {
        if (stopped || !mapNodeRef.current) return;

        mapRef.current = new maps.Map(mapNodeRef.current, {
          center: indiaCenter,
          zoom: 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: darkMapStyles,
        });
        setMapsReady(true);
      })
      .catch((loadError) => setError(loadError.message));

    return () => {
      stopped = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapsReady || !map || !window.google?.maps) return;

    const maps = window.google.maps;
    const bounds = new maps.LatLngBounds();
    let pointCount = 0;

    if (providerPoint) {
      if (!providerMarkerRef.current) {
        providerMarkerRef.current = makeMarker(maps, map, providerPoint, providerLabel, variant === "client" ? "#ff5638" : "#2563eb");
      } else {
        providerMarkerRef.current.setPosition(providerPoint);
        providerMarkerRef.current.setTitle(providerLabel);
      }
      bounds.extend(providerPoint);
      pointCount += 1;
    }

    if (clientPoint) {
      if (!clientMarkerRef.current) {
        clientMarkerRef.current = makeMarker(maps, map, clientPoint, clientLabel, variant === "client" ? "#111827" : "#0f172a");
      } else {
        clientMarkerRef.current.setPosition(clientPoint);
        clientMarkerRef.current.setTitle(clientLabel);
      }
      bounds.extend(clientPoint);
      pointCount += 1;
    }

    if (pointCount === 1) {
      map.setCenter(providerPoint || clientPoint);
      map.setZoom(15);
    } else if (pointCount > 1) {
      map.fitBounds(bounds, 72);
    }
  }, [mapsReady, providerPoint, clientPoint, providerLabel, clientLabel, variant]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapsReady || !map || !window.google?.maps) return undefined;

    if (!providerPoint || !clientPoint || !showRoute) {
      directionsRendererRef.current?.setMap(null);
      fallbackPolylineRef.current?.setMap(null);
      styledPolylineRef.current?.setMap(null);
      onRouteChange?.(null);
      return undefined;
    }

    const maps = window.google.maps;
    const directionsService = new maps.DirectionsService();
    let stopped = false;
    const routeColor = variant === "client" ? "#ff5638" : "#2563eb";
    const dashedRoute = variant === "client";

    const drawOsrmFallbackRoute = async (googleStatus) => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${providerPoint.lng},${providerPoint.lat};${clientPoint.lng},${clientPoint.lat}?overview=full&geometries=geojson&steps=true`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("OSRM request failed.");

        const data = await response.json();
        const route = data.routes?.[0];
        const coordinates = route?.geometry?.coordinates || [];
        if (!route || !coordinates.length) throw new Error("No fallback route found.");
        if (stopped) return;

        directionsRendererRef.current?.setMap(null);
        fallbackPolylineRef.current?.setMap(null);
        styledPolylineRef.current?.setMap(null);

        const path = coordinates.map(([lng, lat]) => ({ lat, lng }));
        fallbackPolylineRef.current = drawStyledPolyline({
          maps,
          map,
          path,
          color: dashedRoute ? routeColor : "#0284c7",
          dashed: dashedRoute,
        });

        const bounds = new maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, 72);

        const steps = (route.legs?.[0]?.steps || []).map((step, index) => ({
          id: `osrm-${index}-${Math.round(step.distance || 0)}`,
          instruction: createOsrmInstruction(step),
          distance: formatDistance(step.distance),
          duration: formatDuration(step.duration),
        }));

        onRouteChange?.({
          distance: formatDistance(route.distance),
          duration: formatDuration(route.duration),
          eta: Number.isFinite(Number(route.duration)) ? Math.max(1, Math.round(route.duration / 60)) : null,
          steps,
        });
        setError(`Google Directions returned ${googleStatus}. Showing fallback road route.`);
      } catch {
        if (!stopped) {
          onRouteChange?.(null);
          setError(`Route could not be drawn. Google Directions returned ${googleStatus}, and fallback routing was unavailable.`);
        }
      }
    };

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: "#2563eb",
          strokeOpacity: 0.92,
          strokeWeight: 6,
        },
      });
    } else {
      directionsRendererRef.current.setMap(map);
    }

    directionsService.route(
      {
        origin: providerPoint,
        destination: clientPoint,
        travelMode: maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, status) => {
        if (stopped) return;

        if (status !== "OK" || !result?.routes?.length) {
          drawOsrmFallbackRoute(status);
          return;
        }

        setError("");
        fallbackPolylineRef.current?.setMap(null);
        styledPolylineRef.current?.setMap(null);
        if (dashedRoute) {
          directionsRendererRef.current.setMap(null);
          styledPolylineRef.current = drawStyledPolyline({
            maps,
            map,
            path: result.routes[0]?.overview_path || [],
            color: routeColor,
            dashed: true,
          });
          const bounds = new maps.LatLngBounds();
          (result.routes[0]?.overview_path || []).forEach((point) => bounds.extend(point));
          if (!bounds.isEmpty()) map.fitBounds(bounds, 72);
        } else {
          directionsRendererRef.current.setMap(map);
          directionsRendererRef.current.setDirections(result);
        }

        const leg = result.routes[0]?.legs?.[0];
        const durationSeconds = leg?.duration_in_traffic?.value ?? leg?.duration?.value ?? null;
        const steps = (leg?.steps || []).map((step, index) => ({
          id: `${index}-${step.distance?.text || "step"}`,
          instruction: stripHtml(step.instructions || "Continue"),
          distance: step.distance?.text || "",
          duration: step.duration?.text || "",
        }));

        onRouteChange?.({
          distance: leg?.distance?.text || "",
          duration: leg?.duration_in_traffic?.text || leg?.duration?.text || "",
          eta: durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : null,
          steps,
        });
      }
    );

    return () => {
      stopped = true;
    };
  }, [mapsReady, providerPoint, clientPoint, onRouteChange, showRoute, variant]);

  return (
    <div className={`tracking-google-route-shell ${variant}`}>
      <div ref={mapNodeRef} className="tracking-google-route-map" />
      {error && <div className="tracking-map-error">{error}</div>}
    </div>
  );
}
