import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const formatChatTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export default function BookingChatBox({
  open,
  title,
  subtitle,
  bookingId,
  role,
  connected,
  messages,
  onClose,
  onSend,
}) {
  const [speechVoice, setSpeechVoice] = useState(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const lastSpokenMessageIdRef = useRef(null);

  // Handler for Help & Support button
  const handleHelpSupport = () => {
    // Placeholder: you can implement actual help logic later
    alert("Help & Support clicked");
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Load female voice
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v => /female/i.test(v.name)) || voices[1] || null;
      setSpeechVoice(female);
    };
    loadVoices();
    if (typeof window !== "undefined") {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Toggle speech enable
  const toggleSpeech = () => setSpeechEnabled(prev => !prev);

  // Speak incoming messages from bot
  useEffect(() => {
    if (!open || !speechVoice || !speechEnabled) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    if (lastMessage.senderRole === role) return;
    if (lastSpokenMessageIdRef.current === lastMessage.id) return;
    const utter = new SpeechSynthesisUtterance(lastMessage.text);
    utter.voice = speechVoice;
    window.speechSynthesis.speak(utter);
    lastSpokenMessageIdRef.current = lastMessage.id;
  }, [messages, role, open, speechVoice, speechEnabled]);

  const submitMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="booking-chat-box"
          initial={{ opacity: 0, x: 34, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 34, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="booking-chat-header">
            <div className="booking-chat-icon">
              <MessageCircle size={18} />
              <button type="button" className="help-button" onClick={handleHelpSupport}>Help &amp; Support</button>
            </div>
            <div>
              <h3>{title}</h3>
              <p>{subtitle || bookingId}</p>
            </div>
          <button type="button" onClick={toggleSpeech} aria-label={speechEnabled ? "Mute voice" : "Unmute voice"} className="voice-toggle">
            {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
            <button type="button" onClick={onClose} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div className="booking-chat-status" data-live={connected ? "true" : "false"}>
            <span />
            {connected ? "Direct booking chat is live" : "Connecting chat"}
          </div>

          <div ref={listRef} className="booking-chat-messages">
            {messages.length ? messages.map((message) => {
              const own = message.senderRole === role;
              return (
                <div key={message.id || `${message.createdAt}-${message.text}`} className={`booking-chat-message ${own ? "own" : ""}`}>
                  <div>
                    <b>{own ? `You (${role})` : `${message.senderName || (message.senderRole === "provider" ? "Provider" : "Client")} (${message.senderRole})`}</b>
                    <p>{message.text}</p>
                    <small>{formatChatTime(message.createdAt)}</small>
                  </div>
                </div>
              );
            }) : (
              <div className="booking-chat-empty">
                Start the conversation for booking {bookingId}.
              </div>
            )}
          </div>

          <form className="booking-chat-compose" onSubmit={submitMessage}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message"
              maxLength={1000}
            />
            <button type="submit" disabled={!draft.trim() || !connected} aria-label="Send message">
              <Send size={17} />
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
