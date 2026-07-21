import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { socketUrlFromApi } from "./trackingShared";

export default function useTrackingSocket({ apiUrl, bookingId, role, token, handlers = {} }) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!bookingId || !token) return undefined;

    const socket = io(socketUrlFromApi(apiUrl), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");
      socket.emit("join_room", { bookingId, role });
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (event) => setError(event.message || "Tracking socket could not connect."));
    socket.on("tracking:error", (event) => setError(event.message || "Tracking update failed."));
    socket.on("room_joined", (event) => handlersRef.current.onRoomJoined?.(event));
    socket.on("location:update", (event) => handlersRef.current.onLocationUpdate?.(event));
    socket.on("status:change", (event) => handlersRef.current.onStatusChange?.(event));
    socket.on("provider:arrived", (event) => handlersRef.current.onProviderArrived?.(event));
    socket.on("client:location", (event) => handlersRef.current.onClientLocation?.(event));
    socket.on("chat:history", (event) => handlersRef.current.onChatHistory?.(event));
    socket.on("chat:message", (event) => handlersRef.current.onChatMessage?.(event));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiUrl, bookingId, role, token]);

  const emitLocation = useCallback((payload) => {
    socketRef.current?.emit("location:update", payload);
  }, []);

  const emitChatMessage = useCallback((payload) => {
    socketRef.current?.emit("chat:message", payload);
  }, []);

  return { connected, error, emitLocation, emitChatMessage };
}
