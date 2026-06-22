import { CheckCircle2, MapPin, MessageCircle, Phone, Play, Route, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import BookingChatBox from "./BookingChatBox";
import { geocodeWithGoogle } from "./googleMaps";
import useTrackingSocket from "./useTrackingSocket";
import {
  formatTrackingEventTime,
  getActiveStepIndex,
  getLatestTrackingEvent,
  hasCoordinates,
  normalizeTrackingStatus,
  requestBrowserLocation,
  toLatLng,
  trackingSteps,
} from "./trackingShared";

const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return { message: (await response.text()) || fallbackMessage };
};

const geocodeAddress = async (address) => {
  if (!address?.trim()) return null;
  try {
    const point = await geocodeWithGoogle(address);
    return point ? { latitude: point.lat, longitude: point.lng, address } : null;
  } catch {
    return null;
  }
};

const coordinateQuery = (point) => `${point.lat},${point.lng}`;

const formatSlot = (dateValue, timeValue) => {
  const dateLabel = dateValue
    ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(dateValue))
    : "Date not set";
  if (!timeValue || !String(timeValue).includes(":")) return `${dateLabel}, ${timeValue || "time not set"}`;

  const [hourValue, minuteValue] = String(timeValue).split(":").map(Number);
  const timeLabel = `${hourValue % 12 || 12}:${String(minuteValue || 0).padStart(2, "0")} ${hourValue >= 12 ? "PM" : "AM"}`;
  return `${dateLabel}, ${timeLabel} slot`;
};

const mergeChatMessages = (current, incoming = []) => {
  const nextMessages = Array.isArray(incoming) ? incoming : [incoming];
  const byId = new Map(current.map((message) => [message.id, message]));
  nextMessages.forEach((message) => {
    if (message?.id) byId.set(message.id, message);
  });
  return [...byId.values()].sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
};

export default function ProviderRoutePanel({ booking, updateProviderBookingStatus, setStatusMessage, apiUrl }) {
  const bookingRoomId = booking.bookingId || booking._id;
  const token = localStorage.getItem("servicehub_token");
  const [liveTracking, setLiveTracking] = useState(null);
  const [geocodedClientLocation, setGeocodedClientLocation] = useState(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [locatingProvider, setLocatingProvider] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);

  const providerLocation = liveTracking?.providerLocation || booking.providerLocation || null;
  const clientLocation = liveTracking?.clientLocation || booking.clientLocation || geocodedClientLocation || null;
  const clientAddress = liveTracking?.address || liveTracking?.clientAddress || liveTracking?.clientLocation?.address || booking.clientLocation?.address || booking.address || "";
  const clientName = liveTracking?.clientName || booking.name || "Client";
  const clientPhone = liveTracking?.clientPhone || booking.phone || "";
  const serviceType = liveTracking?.service || booking.service || "Service";
  const bookedSlot = formatSlot(booking.preferredDate, booking.preferredTime);
  const trackingStatus = liveTracking?.status || booking.status;
  const normalizedStatus = normalizeTrackingStatus(trackingStatus);
  const activeIndex = getActiveStepIndex(trackingStatus);
  const trackingEvents = liveTracking?.trackingEvents || booking.trackingEvents || [];
  const isClosed = ["completed", "cancelled"].includes(trackingStatus);
  const estimateStatus = liveTracking?.estimateStatus || booking.estimateStatus || "not_submitted";
  const paymentStatus = liveTracking?.paymentStatus || booking.paymentStatus || "unpaid";
  const hasSubmittedFinalEstimate = estimateStatus === "submitted" || estimateStatus === "accepted" || Boolean(liveTracking?.finalEstimateAmount || booking.finalEstimateAmount);
  const canCompleteAfterPayment = paymentStatus === "paid";
  const canMarkArrived = !isClosed && ["en_route", "arrived", "job_started"].includes(normalizedStatus);
  const canStartJob = !isClosed && ["arrived", "job_started"].includes(normalizedStatus) && hasSubmittedFinalEstimate;
  const canFinishJob = !isClosed && normalizedStatus === "job_started" && canCompleteAfterPayment;

  const stopLiveSharing = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLiveSharing(false);
  }, []);

  const handlers = useMemo(
    () => ({
      onRoomJoined: (event) => setLiveTracking((current) => ({ ...(current || {}), ...event })),
      onStatusChange: (event) => {
        setLiveTracking((current) => ({ ...(current || {}), ...event }));
        if (["arrived", "job_started", "completed", "cancelled"].includes(event.status)) stopLiveSharing();
      },
      onLocationUpdate: (event) => {
        setLiveTracking((current) => ({
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
      },
      onClientLocation: (event) => {
        setLiveTracking((current) => ({
          ...(current || {}),
          clientLocation: event.clientLocation || current?.clientLocation,
          address: event.address || event.clientLocation?.address || current?.address,
        }));
      },
      onProviderArrived: () => {
        setLiveTracking((current) => ({ ...(current || {}), status: "arrived" }));
        stopLiveSharing();
      },
      onChatHistory: (event) => {
        setChatMessages((current) => mergeChatMessages(current, event.messages || []));
      },
      onChatMessage: (event) => {
        setChatMessages((current) => mergeChatMessages(current, event));
        if (event.senderRole === "client") setChatOpen(true);
      },
    }),
    [stopLiveSharing]
  );

  const { connected, emitLocation, emitChatMessage } = useTrackingSocket({
    apiUrl,
    bookingId: bookingRoomId,
    role: "provider",
    token,
    handlers,
  });

  useEffect(() => {
    let stopped = false;
    const loadProviderTracking = async () => {
      try {
        const response = await fetch(`${apiUrl}/providers/bookings/${bookingRoomId}/tracking`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiResponse(response, "Provider tracking could not be loaded.");
        if (!response.ok) throw new Error(data.message || "Provider tracking could not be loaded.");
        if (!stopped) setLiveTracking(data);
      } catch {
        // The dashboard snapshot still gives the provider enough context if this request is unavailable.
      }
    };

    loadProviderTracking();
    return () => {
      stopped = true;
    };
  }, [apiUrl, bookingRoomId, token]);

  useEffect(() => {
    let stopped = false;
    if (hasCoordinates(clientLocation) || !clientAddress) return undefined;

    geocodeAddress(clientAddress).then((location) => {
      if (!stopped && location) setGeocodedClientLocation(location);
    });

    return () => {
      stopped = true;
    };
  }, [clientAddress, clientLocation]);

  useEffect(() => () => stopLiveSharing(), [stopLiveSharing]);

  const updateJourneyStep = useCallback(
    async (status) => {
      const updatedBooking = await updateProviderBookingStatus(booking._id, status);
      if (!updatedBooking) return false;

      setLiveTracking((current) => ({
        ...(current || {}),
        status: updatedBooking.status || status,
        eta: updatedBooking.eta ?? current?.eta ?? null,
        providerLocation: updatedBooking.providerLocation || current?.providerLocation || booking.providerLocation,
        clientLocation: updatedBooking.clientLocation || current?.clientLocation || booking.clientLocation,
        address: updatedBooking.address || current?.address || booking.address,
        trackingEvents: updatedBooking.trackingEvents || current?.trackingEvents || booking.trackingEvents || [],
        updatedAt: updatedBooking.updatedAt || current?.updatedAt,
      }));

      if (["arrived", "job_started", "completed", "cancelled"].includes(status)) stopLiveSharing();
      return true;
    },
    [booking, stopLiveSharing, updateProviderBookingStatus]
  );

  const syncProviderLocation = useCallback(
    async (payload) => {
      try {
        const response = await fetch(`${apiUrl}/providers/bookings/${bookingRoomId}/location`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await parseApiResponse(response, "Provider location could not be updated.");
        if (!response.ok) throw new Error(data.message || "Provider location could not be updated.");
        return data.booking || null;
      } catch (updateError) {
        setStatusMessage(updateError.message);
        return null;
      }
    },
    [apiUrl, bookingRoomId, setStatusMessage, token]
  );

  const sendPosition = useCallback(
    (coords, { force = false, persist = false } = {}) => {
      const speedKmh = Number.isFinite(coords.speed) ? coords.speed * 3.6 : 0;
      const minDelay = 5000;
      const currentTime = Date.now();

      if (!force && currentTime - lastSentAtRef.current < minDelay) return null;
      lastSentAtRef.current = currentTime;

      const payload = {
        bookingId: bookingRoomId,
        lat: coords.latitude,
        lng: coords.longitude,
        heading: Number.isFinite(coords.heading) ? coords.heading : 0,
        speed: Number.isFinite(speedKmh) ? speedKmh : 0,
        accuracy: coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      emitLocation(payload);
      setLiveTracking((current) => ({
        ...(current || {}),
        providerLocation: {
          type: "Point",
          coordinates: [payload.lng, payload.lat],
          latitude: payload.lat,
          longitude: payload.lng,
          accuracy: payload.accuracy,
          updatedAt: payload.timestamp,
        },
      }));

      if (persist) {
        syncProviderLocation(payload).then((updatedBooking) => {
          if (!updatedBooking) return;
          setLiveTracking((current) => ({
            ...(current || {}),
            providerLocation: updatedBooking.providerLocation || current?.providerLocation,
            clientLocation: updatedBooking.clientLocation || current?.clientLocation,
            address: updatedBooking.address || current?.address,
          }));
        });
      }

      return payload;
    },
    [bookingRoomId, emitLocation, syncProviderLocation]
  );

  const refreshProviderRoute = async () => {
    if (!hasCoordinates(clientLocation) && !clientAddress.trim()) {
      setStatusMessage("Client must share current GPS or address before route can be drawn.");
      return null;
    }

    setLocatingProvider(true);
    try {
      const coords = await requestBrowserLocation();
      const payload = sendPosition(coords, { force: true, persist: true });
      setStatusMessage("Provider GPS updated. Google route is recalculating.");
      return payload
        ? {
            lat: payload.lat,
            lng: payload.lng,
          }
        : null;
    } catch (routeError) {
      setStatusMessage(routeError.message);
      return null;
    } finally {
      setLocatingProvider(false);
    }
  };

  const startLiveSharing = async () => {
    if (["arrived", "job_started", "completed"].includes(normalizedStatus)) {
      setStatusMessage("Live GPS stops after arrival for this job.");
      stopLiveSharing();
      return;
    }

    const statusUpdated = normalizedStatus === "en_route" ? true : await updateJourneyStep("en_route");
    if (!statusUpdated || isClosed) return;

    if (!navigator.geolocation) {
      setStatusMessage("Location is not supported on this device.");
      return;
    }

    if (watchIdRef.current !== null) {
      setLiveSharing(true);
      return;
    }

    setLiveSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => sendPosition(position.coords),
      () => {
        setLiveSharing(false);
        setStatusMessage("GPS permission was denied or unavailable.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const markArrived = async () => {
    const updated = await updateJourneyStep("arrived");
    if (updated) stopLiveSharing();
  };

  const markJobStarted = async () => {
    if (normalizedStatus !== "arrived") {
      setStatusMessage("Mark arrived before starting the job.");
      return;
    }
    if (!hasSubmittedFinalEstimate) {
      setStatusMessage("Send the final estimate before starting the job.");
      return;
    }
    const updated = await updateJourneyStep("job_started");
    if (updated) stopLiveSharing();
  };

  const markCompleted = async () => {
    if (normalizedStatus !== "job_started") {
      setStatusMessage("Start the job before marking the work completed.");
      return;
    }
    if (!canCompleteAfterPayment) {
      setStatusMessage("Before completing the work, the client must pay the money.");
      return;
    }
    await updateJourneyStep("completed");
  };

  const callClient = () => {
    if (!clientPhone) {
      setStatusMessage("Client phone number is not available for this booking.");
      return;
    }
    window.location.href = `tel:${clientPhone}`;
  };

  const messageClient = () => {
    setChatOpen(true);
  };

  const sendChatMessage = (text) => {
    if (!connected) {
      setStatusMessage("Chat is still connecting. Try again in a moment.");
      return;
    }

    emitChatMessage({
      bookingId: bookingRoomId,
      role: "provider",
      text,
    });
  };

  const openClientDirections = async () => {
    let currentOrigin = toLatLng(providerLocation);
    if (!toLatLng(providerLocation)) {
      currentOrigin = await refreshProviderRoute();
    }

    const destination = toLatLng(clientLocation);

    if (!destination && !clientAddress.trim()) {
      setStatusMessage("Client must share current GPS or address before directions can open.");
      return;
    }

    const params = new URLSearchParams({
      api: "1",
      travelmode: "driving",
      destination: destination ? coordinateQuery(destination) : clientAddress.trim(),
    });

    if (currentOrigin) {
      params.set("origin", coordinateQuery(currentOrigin));
    }

    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="servicetrack-panel provider">
      <div className="servicetrack-panel-header">
        <span className="servicetrack-panel-dot provider-dot" />
        <span className="servicetrack-panel-label">Provider App</span>
        <span className="servicetrack-live-status"><span />{connected ? "Live tracking" : "Connecting"}</span>
      </div>

      <div className="servicetrack-card-body">
        <div className="servicetrack-client-card">
          <div className="servicetrack-client-name-row">
            <div className="servicetrack-client-title">
              <span className="servicetrack-client-icon"><UserRound size={18} /></span>
              <strong>{clientName}</strong>
            </div>
            <span className="servicetrack-confirmed-badge">{String(normalizedStatus).replace(/_/g, " ")}</span>
          </div>
          <p>{serviceType} &middot; {bookedSlot}</p>
          <div className="servicetrack-address-row">
            <MapPin size={17} />
            <span>{clientAddress || "Waiting for client address"}</span>
          </div>
        </div>

        <div>
          <p className="servicetrack-section-title">Update job status</p>
          <div className="servicetrack-status-grid">
            <button type="button" onClick={startLiveSharing} disabled={isClosed || liveSharing || ["arrived", "job_started", "completed"].includes(normalizedStatus)} data-active={normalizedStatus === "en_route"}>
              <Play size={17} />
              On my way
            </button>
            <button type="button" onClick={markArrived} disabled={!canMarkArrived || normalizedStatus !== "en_route"} data-active={normalizedStatus === "arrived"}>
              <MapPin size={17} />
              I've arrived
            </button>
            <button type="button" onClick={markJobStarted} disabled={!canStartJob} data-active={normalizedStatus === "job_started"} title={!hasSubmittedFinalEstimate ? "Send final estimate before starting the job." : "Start job"}>
              <Route size={17} />
              Job started
            </button>
            <button type="button" onClick={markCompleted} disabled={!canFinishJob} data-active={normalizedStatus === "completed"} title={!canCompleteAfterPayment ? "Before completing the work, the client must pay the money." : "Mark work completed"}>
              <CheckCircle2 size={17} />
              Work completed
            </button>
          </div>
          {normalizedStatus === "arrived" && !hasSubmittedFinalEstimate && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 dark:bg-amber-300/10 dark:text-amber-100">
              Send the final estimate before starting the job.
            </p>
          )}
          {normalizedStatus === "job_started" && !canCompleteAfterPayment && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 dark:bg-amber-300/10 dark:text-amber-100">
              Before completing the work, the client must pay the money.
            </p>
          )}
        </div>

        <div className="servicetrack-comms-row">
          <button type="button" onClick={callClient}><Phone size={17} /> Call client</button>
          <button type="button" onClick={messageClient}><MessageCircle size={17} /> Message</button>
          <button type="button" onClick={openClientDirections} disabled={locatingProvider}>
            <Route size={17} /> {locatingProvider ? "Locating..." : "Directions"}
          </button>
        </div>

        <div>
          <p className="servicetrack-section-title">Job progress</p>
          <div className="servicetrack-progress-list compact">
            {trackingSteps.map((step, index) => {
              const event = getLatestTrackingEvent(trackingEvents, step);
              return (
                <div key={step.id} className={`servicetrack-progress-item ${index < activeIndex ? "done" : ""} ${step.id === normalizedStatus ? "active" : ""}`}>
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
        title={clientName}
        subtitle={`${serviceType} booking chat`}
        bookingId={bookingRoomId}
        role="provider"
        connected={connected}
        messages={chatMessages}
        onClose={() => setChatOpen(false)}
        onSend={sendChatMessage}
      />
    </section>
  );
}
