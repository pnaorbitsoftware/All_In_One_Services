import React, { useMemo, useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors, radius } from "../theme";

function hasCoordinates(location = {}) {
  const lat = Number(location?.latitude);
  const lng = Number(location?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

function TrackingMap({ providerLocation = {}, clientLocation = {}, onMetricsUpdate }) {
  const hasProvider = hasCoordinates(providerLocation);
  const hasClient = hasCoordinates(clientLocation);

  const providerLat = Number(providerLocation.latitude || 0);
  const providerLng = Number(providerLocation.longitude || 0);
  const clientLat = Number(clientLocation.latitude || 0);
  const clientLng = Number(clientLocation.longitude || 0);

  const webViewRef = useRef(null);

  const html = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html, body, #map { height:100%; margin:0; padding:0; }
.leaflet-control-attribution { font-size:10px; }
.info-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: bold;
  color: #1E293B;
  border: 1px solid #E2E8F0;
  display: none;
}
</style>
</head>
<body>
<div id="map"></div>
<div id="info-overlay" class="info-overlay">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
    <span style="color: #0F766E;">📍</span>
    <span>Distance: <span id="distance-val" style="color: #0F766E; font-weight: 800;">-</span></span>
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="color: #0F766E;">⏱️</span>
    <span>ETA: <span id="duration-val" style="color: #0F766E; font-weight: 800;">-</span></span>
  </div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false }).setView([18.5204, 73.8567], 13);
  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  }).addTo(map);

  var clientMarker = null;
  var providerMarker = null;
  var routeLayer = null;

  function isVal(n) {
    return Number.isFinite(Number(n)) && Number(n) !== 0;
  }

  window.updateLocations = function(providerLat, providerLng, clientLat, clientLng) {
    var points = [];

    if (isVal(clientLat) && isVal(clientLng)) {
      var clientLatLng = [clientLat, clientLng];
      points.push(clientLatLng);
      if (!clientMarker) {
        clientMarker = L.marker(clientLatLng).addTo(map).bindPopup('Client location');
      } else {
        clientMarker.setLatLng(clientLatLng);
      }
    } else if (clientMarker) {
      map.removeLayer(clientMarker);
      clientMarker = null;
    }

    if (isVal(providerLat) && isVal(providerLng)) {
      var providerLatLng = [providerLat, providerLng];
      points.push(providerLatLng);
      if (!providerMarker) {
        providerMarker = L.marker(providerLatLng).addTo(map).bindPopup('Provider location');
      } else {
        providerMarker.setLatLng(providerLatLng);
      }
    } else if (providerMarker) {
      map.removeLayer(providerMarker);
      providerMarker = null;
    }

    if (points.length === 2) {
      fetch('https://router.project-osrm.org/route/v1/driving/' + providerLng + ',' + providerLat + ';' + clientLng + ',' + clientLat + '?overview=full&geometries=geojson')
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data.routes && data.routes.length > 0) {
            var route = data.routes[0];
            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.geoJSON(route.geometry, {
              style: { color: '#0F766E', weight: 5, opacity: 0.85 }
            }).addTo(map);
            map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
            
            var distanceKm = (route.distance / 1000).toFixed(1);
            var durationMins = Math.ceil(route.duration / 60);
            
            document.getElementById('info-overlay').style.display = 'block';
            document.getElementById('distance-val').innerText = distanceKm + ' km';
            document.getElementById('duration-val').innerText = durationMins + ' mins';

            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'metrics',
                distance: distanceKm + ' km',
                duration: durationMins + ' mins'
              }));
            } catch(e) {}
          } else {
            drawStraightLine();
          }
        })
        .catch(function(err) {
          drawStraightLine();
        });
    } else if (points.length === 1) {
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }
      document.getElementById('info-overlay').style.display = 'none';
      map.setView(points[0], 15);
    }

    function drawStraightLine() {
      if (routeLayer) map.removeLayer(routeLayer);
      routeLayer = L.polyline(points, { color: '#0F766E', weight: 4, opacity: 0.8 }).addTo(map);
      map.fitBounds(points, { padding: [28, 28] });
    }
  };
</script>
</body>
</html>`;
  }, []);

  useEffect(() => {
    const js = `if (window.updateLocations) { window.updateLocations(${providerLat}, ${providerLng}, ${clientLat}, ${clientLng}); }`;
    webViewRef.current?.injectJavaScript(js);
  }, [providerLat, providerLng, clientLat, clientLng]);

  if (!hasProvider && !hasClient) return null;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "metrics" && onMetricsUpdate) {
        onMetricsUpdate(data);
      }
    } catch (err) {
      // Ignore
    }
  };

  const handleLoadEnd = () => {
    const js = `if (window.updateLocations) { window.updateLocations(${providerLat}, ${providerLng}, ${clientLat}, ${clientLng}); }`;
    webViewRef.current?.injectJavaScript(js);
  };

  return (
    <View style={styles.mapShell}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
      />
    </View>
  );
}

export default React.memo(TrackingMap);

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
