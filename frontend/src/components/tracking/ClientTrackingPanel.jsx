import { Clock, LocateFixed, MapPin, MessageCircle, Pause, Phone, Play, Send, Share2, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import BookingChatBox from "./BookingChatBox";
import { geocodeWithGoogle, reverseGeocodeWithGoogle } from "./googleMaps";
import useTrackingSocket from "./useTrackingSocket";
import {
  formatEta,
  formatTrackingEventTime,
  getActiveStepIndex,
  getLatestTrackingEvent,
  normalizeTrackingStatus,
  requestBrowserLocation,
  trackingSteps,
} from "./trackingShared";

const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return { message: (await response.text()) || fallbackMessage };
};

const geocodeAddress = async (address) => {
  try {
    return await geocodeWithGoogle(address);
  } catch {
    return null;
  }
};

const notifyStatus = async (title, body) => {
  if (!("Notification" in window)) return;
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission === "granted") {
    new Notification(title, { body });
  }
};

const initialsFromName = (value = "Pro") =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";

const confirmGpsShare = (mode) => {
  const liveCopy = mode === "live" ? " Live sharing will keep updating your location until you stop it." : "";
  return window.confirm(`Allow ServiceHub to use your current GPS location and share it with the provider for this booking?${liveCopy}`);
};

const mergeChatMessages = (current, incoming = []) => {
  const nextMessages = Array.isArray(incoming) ? incoming : [incoming];
  const byId = new Map(current.map((message) => [message.id, message]));
  nextMessages.forEach((message) => {
    if (message?.id) byId.set(message.id, message);
  });
  return [...byId.values()].sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
};

export default function ClientTrackingPanel({ booking, token, setStatusMessage, apiUrl }) {
  const bookingRoomId = booking.bookingId || booking._id;
  const [tracking, setTracking] = useState(null);
  const [etaReceivedAt, setEtaReceivedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [providerArea, setProviderArea] = useState("");
  const [arrived, setArrived] = useState(false);
  const [locationMode, setLocationMode] = useState("prompt");
  const [address, setAddress] = useState(booking.address || "");
  const [submittingLocation, setSubmittingLocation] = useState(false);
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const lastReverseGeocodeRef = useRef({ at: 0, address: "" });

  const status = tracking?.status || booking.status;
  const normalizedStatus = normalizeTrackingStatus(status);
  const visibleStatuses = ["pending", "accepted", "confirmed", "assigned", "on_the_way", "en_route", "arrived", "job_started", "completed"];
  const isVisible = visibleStatuses.includes(status);
  const canShareDestination = !["completed", "cancelled"].includes(status);
  const activeIndex = getActiveStepIndex(status);
  const trackingEvents = tracking?.trackingEvents || booking.trackingEvents || [];
  const eta = tracking?.eta ?? booking.eta ?? null;
  const clientLocation = tracking?.clientLocation || booking.clientLocation || null;
  const clientAddress = tracking?.address || tracking?.clientAddress || clientLocation?.address || address || booking.address || "";
  const provider = tracking?.provider || booking.assignedProvider || booking.requestedProvider || {};
  const providerName = tracking?.providerName || booking.assignedProviderName || booking.requestedProviderName || provider.name || "Professional assigned soon";
  const providerPhone = provider.phone || booking.assignedProvider?.phone || booking.requestedProvider?.phone || "";
 const providerRating =
  provider.reviews > 0
    ? Number(provider.rating).toFixed(1)
    : "New Provider";
  const providerBookingsCount = provider.totalBookings || provider.bookingsCount || provider.reviews || 0;
  const remainingEta = Number.isFinite(Number(eta))
    ? Math.max(0, Number(eta) - Math.floor(((now || etaReceivedAt) - etaReceivedAt) / 60000))
    : null;
  const etaLabel = status === "pending"
    ? "Share GPS"
    : formatEta(remainingEta);
  const statusLabel = String(normalizedStatus).replace(/_/g, " ");

  const handlers = useMemo(
    () => ({
      onRoomJoined: (event) => {
        setTracking((current) => ({ ...(current || {}), ...event }));
        const nextAddress = event.address || event.clientAddress || event.clientLocation?.address || "";
        if (nextAddress) setAddress(nextAddress);
        setEtaReceivedAt(Date.now());
      },
      onLocationUpdate: (event) => {
        setTracking((current) => ({
          ...(current || {}),
          eta: event.eta ?? current?.eta ?? null,
          providerLocation: event.providerLocation || (
            Number.isFinite(Number(event.lat)) && Number.isFinite(Number(event.lng))
              ? {
                  type: "Point",
                  coordinates: [Number(event.lng), Number(event.lat)],
                  latitude: Number(event.lat),
                  longitude: Number(event.lng),
                  updatedAt: event.timestamp,
                }
              : current?.providerLocation || null
          ),
        }));
        setProviderArea(event.providerArea || "Provider location updated");
        setEtaReceivedAt(Date.now());
      },
      onClientLocation: (event) => {
        setTracking((current) => ({
          ...(current || {}),
          clientLocation: event.clientLocation || current?.clientLocation || null,
          address: event.address || current?.address,
        }));
        if (event.address) setAddress(event.address);
      },
      onStatusChange: (event) => {
        setTracking((current) => ({ ...(current || {}), ...event }));
        setEtaReceivedAt(Date.now());
        notifyStatus("Booking status updated", `Your provider is now ${event.trackingStatus || event.status}.`);
      },
      onProviderArrived: () => {
        setArrived(true);
        notifyStatus("Provider arrived", "Your provider has reached the destination.");
      },
      onChatHistory: (event) => {
        setChatMessages((current) => mergeChatMessages(current, event.messages || []));
      },
      onChatMessage: (event) => {
        setChatMessages((current) => mergeChatMessages(current, event));
        if (event.senderRole === "provider") setChatOpen(true);
      },
    }),
    []
  );

  const { connected, error, emitChatMessage } = useTrackingSocket({
    apiUrl,
    bookingId: bookingRoomId,
    role: "client",
    token,
    handlers,
  });

  useEffect(() => {
    if (!isVisible || !token) return undefined;

    let stopped = false;
    const loadTracking = async () => {
      try {
        const response = await fetch(`${apiUrl}/bookings/${bookingRoomId}/tracking`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiResponse(response, "Tracking could not be loaded.");
        if (!response.ok) throw new Error(data.message || "Tracking could not be loaded.");
        if (!stopped) {
          setTracking(data);
          setEtaReceivedAt(Date.now());
        }
      } catch (event) {
        if (!stopped) setStatusMessage(event.message);
      }
    };

    loadTracking();
    return () => {
      stopped = true;
    };
  }, [apiUrl, bookingRoomId, isVisible, setStatusMessage, token]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  }, []);

  const getAddressForGpsPoint = useCallback(async ({ lat, lng }) => {
    const nowMs = Date.now();
    const cachedAddress = lastReverseGeocodeRef.current.address;

    if (cachedAddress && nowMs - lastReverseGeocodeRef.current.at < 60000) {
      return cachedAddress;
    }

    try {
      const gpsAddress = await reverseGeocodeWithGoogle({ lat, lng });
      if (gpsAddress) {
        lastReverseGeocodeRef.current = { at: nowMs, address: gpsAddress };
        setAddress(gpsAddress);
        return gpsAddress;
      }
    } catch {
      // Manual address still gives the provider a readable destination when reverse lookup is unavailable.
    }

    return address.trim() || clientAddress.trim();
  }, [address, clientAddress]);

  const postClientLocation = useCallback(async ({ lat, lng, accuracy = null, nextAddress = clientAddress }) => {
    const locationAddress = nextAddress?.trim?.() ? nextAddress.trim() : "";
    const response = await fetch(`${apiUrl}/location/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bookingId: bookingRoomId,
        lat,
        lng,
        accuracy,
        address: locationAddress,
      }),
    });
    const data = await parseApiResponse(response, "Client location could not be shared.");
    if (!response.ok) throw new Error(data.message || "Client location could not be shared.");
    setTracking((current) => ({
      ...(current || {}),
      clientLocation: data.clientLocation || current?.clientLocation,
      address: data.address || data.booking?.address || locationAddress || current?.address,
    }));
    if (data.address || data.booking?.address || data.clientLocation?.address) {
      setAddress(data.address || data.booking?.address || data.clientLocation.address);
    }
    setStatusMessage(data.clientLocation ? "Destination shared with the provider." : "Address shared. Provider can open Google directions by address.");
  }, [apiUrl, bookingRoomId, clientAddress, setStatusMessage, token]);

  const sendLiveClientPosition = useCallback(async (coords) => {
    const speedKmh = Number.isFinite(coords.speed) ? coords.speed * 3.6 : 0;
    const minDelay = speedKmh > 2 ? 5000 : 30000;
    const currentTime = Date.now();

    if (currentTime - lastSentAtRef.current < minDelay) return;
    lastSentAtRef.current = currentTime;

    try {
      const nextAddress = await getAddressForGpsPoint({ lat: coords.latitude, lng: coords.longitude });
      await postClientLocation({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        nextAddress,
      });
    } catch (shareError) {
      setLiveLocationSharing(false);
      setStatusMessage(shareError.message);
    }
  }, [getAddressForGpsPoint, postClientLocation, setStatusMessage]);

  const shareGpsLocation = async () => {
    if (!confirmGpsShare("current")) {
      setStatusMessage("GPS sharing was cancelled. You can still share the typed address.");
      return;
    }

    setSubmittingLocation(true);
    try {
      const coords = await requestBrowserLocation();
      const nextAddress = await getAddressForGpsPoint({ lat: coords.latitude, lng: coords.longitude });
      await postClientLocation({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        nextAddress,
      });
      setLocationMode("gps");
    } catch (event) {
      setLocationMode("address");
      setStatusMessage(event.message);
    } finally {
      setSubmittingLocation(false);
    }
  };

  const startLiveLocationSharing = async () => {
    if (!navigator.geolocation) {
      setStatusMessage("Location is not supported on this device.");
      return;
    }

    if (watchIdRef.current !== null) {
      setLiveLocationSharing(true);
      return;
    }

    if (!confirmGpsShare("live")) {
      setStatusMessage("Live GPS sharing was cancelled.");
      return;
    }

    setLiveLocationSharing(true);
    setLocationMode("gps");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => sendLiveClientPosition(position.coords),
      () => {
        setLiveLocationSharing(false);
        setStatusMessage("GPS permission was denied or unavailable.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopLiveLocationSharing = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLiveLocationSharing(false);
  };

  const submitAddress = async (event) => {
    event.preventDefault();
    setSubmittingLocation(true);
    try {
      const point = await geocodeAddress(address);
      await postClientLocation({ ...(point || {}), nextAddress: address });
      setLocationMode("address");
    } catch (submitError) {
      setStatusMessage(submitError.message);
    } finally {
      setSubmittingLocation(false);
    }
  };

  const callProvider = () => {
    if (!providerPhone) {
      setStatusMessage("Provider phone is available after acceptance.");
      return;
    }
    window.location.href = `tel:${providerPhone}`;
  };

  const openChat = () => {
    setChatOpen(true);
  };

  const sendChatMessage = (text) => {
    if (!connected) {
      setStatusMessage("Chat is still connecting. Try again in a moment.");
      return;
    }

    emitChatMessage({
      bookingId: bookingRoomId,
      role: "client",
      text,
    });
  };

  if (!isVisible) return null;

  return (
    <section className="servicetrack-panel client">
      <div className="servicetrack-card-body">
        <div className="servicetrack-provider-row">
          <div className="servicetrack-avatar">{initialsFromName(providerName)}</div>
          <div>
            <h3 className="servicetrack-name">{providerName}</h3>
            <p className="servicetrack-meta"><Star size={14} /> {providerRating} &middot; {providerBookingsCount} bookings</p>
          </div>
          <span className="servicetrack-chip">{booking.service}</span>
        </div>

        <div className="servicetrack-divider" />

        <div className="servicetrack-stats-row">
          <div className="servicetrack-stat-card">
            <MapPin size={19} />
            <span>Status</span>
            <strong>{statusLabel}</strong>
          </div>
          <div className="servicetrack-stat-card">
            <Clock size={19} />
            <span>Arrives in</span>
            <strong>{etaLabel}</strong>
          </div>
        </div>

        <div className="servicetrack-action-row">
          <button type="button" onClick={callProvider}><Phone size={17} /> Call</button>
          <button type="button" onClick={openChat}><MessageCircle size={17} /> Chat</button>
          <button type="button" onClick={shareGpsLocation} disabled={submittingLocation || !canShareDestination}><Share2 size={17} /> Share</button>
        </div>

        <div className="servicetrack-location-card">
          <LocateFixed size={18} />
          <div>
            <strong>Share location</strong>
            <span>{liveLocationSharing ? "Live location sharing is on" : locationMode === "gps" ? "GPS sent to provider" : locationMode === "address" ? "Address sent to provider" : "Share GPS or address for navigation"}</span>
          </div>
          <button type="button" onClick={liveLocationSharing ? stopLiveLocationSharing : startLiveLocationSharing} disabled={!canShareDestination}>
            {liveLocationSharing ? <Pause size={16} /> : <Play size={16} />}
            {liveLocationSharing ? "Stop live" : "Share live"}
          </button>
        </div>

        <form className="servicetrack-address-form" onSubmit={submitAddress}>
          <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter service address or live GPS address" required disabled={!canShareDestination} />
          <button type="submit" disabled={submittingLocation || !canShareDestination}>
            <Send size={16} />
            Share
          </button>
        </form>

        <div className="servicetrack-destination">
          <MapPin size={16} />
          <span>{clientAddress || providerArea || error || "No client destination shared yet"}</span>
        </div>

        {arrived && <div className="servicetrack-arrived-banner">Provider has arrived at the destination.</div>}

        <div className="servicetrack-divider" />

        <div>
          <p className="servicetrack-section-title">Job progress</p>
          <div className="servicetrack-progress-list">
            {trackingSteps.map((step, index) => {
              const event = getLatestTrackingEvent(trackingEvents, step);
              const isFirstPendingStep = status === "pending" && index === 0;
              return (
                <div key={step.id} className={`servicetrack-progress-item ${index < activeIndex ? "done" : ""} ${step.id === normalizedStatus || isFirstPendingStep ? "active" : ""}`}>
                  <span className="servicetrack-progress-dot" />
                  <div className="servicetrack-progress-text">
                    <strong>{step.label}</strong>
                    <small>{event?.updatedAt ? `Updated ${formatTrackingEventTime(event.updatedAt)}` : step.copy}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BookingChatBox
        open={chatOpen}
        title={providerName}
        subtitle={`${booking.service} booking chat`}
        bookingId={bookingRoomId}
        role="client"
        connected={connected}
        messages={chatMessages}
        onClose={() => setChatOpen(false)}
        onSend={sendChatMessage}
      />
    </section>
  );
}
