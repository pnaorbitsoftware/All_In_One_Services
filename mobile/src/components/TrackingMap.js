import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors, radius } from "../theme";

function hasCoordinates(location = {}) {
  return Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));
}

export default function TrackingMap({ providerLocation = {}, clientLocation = {} }) {
  const hasProvider = hasCoordinates(providerLocation);
  const hasClient = hasCoordinates(clientLocation);

  const html = useMemo(() => {
    const providerLat = Number(providerLocation.latitude || 0);
    const providerLng = Number(providerLocation.longitude || 0);
    const clientLat = Number(clientLocation.latitude || providerLat || 18.5204);
    const clientLng = Number(clientLocation.longitude || providerLng || 73.8567);

    const centerLat = hasProvider ? providerLat : clientLat;
    const centerLng = hasProvider ? providerLng : clientLng;

    return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html, body, #map { height:100%; margin:0; padding:0; }
.leaflet-control-attribution { font-size:10px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var points = [];

  ${hasClient ? `
    var client = L.marker([${clientLat}, ${clientLng}]).addTo(map).bindPopup('Client location');
    points.push([${clientLat}, ${clientLng}]);
  ` : ""}

  ${hasProvider ? `
    var provider = L.marker([${providerLat}, ${providerLng}]).addTo(map).bindPopup('Provider location');
    points.push([${providerLat}, ${providerLng}]);
  ` : ""}

  if (points.length === 2) {
    L.polyline(points, { color: '#0F766E', weight: 4, opacity: 0.8 }).addTo(map);
    map.fitBounds(points, { padding: [28, 28] });
  }
</script>
</body>
</html>`;
  }, [clientLocation, hasClient, hasProvider, providerLocation]);

  if (!hasProvider && !hasClient) return null;

  return (
    <View style={styles.mapShell}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  mapShell: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    height: 220,
    overflow: "hidden",
  },
});
