import "./ServiceModal.css";
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  Clock,
  IndianRupee,
  MapPin,
  Star,
  X,
} from "lucide-react";

// Placeholder image string जर image नसेल किंवा लोड झाली नाही तर
const SERVICE_PLACEHOLDER =
  "https://via.placeholder.com/600x400?text=Service+Image";

const reviewSamples = [
  "Clean work and on-time arrival.",
  "Polite provider, fair pricing.",
  "Quick response and neat finishing.",
];

export default function ServiceModal({
  service,
  onBook,
  onClose,
  canBook = true,
}) {
  // Escape key ने modal बंद करण्यासाठी
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // Modal ओपन असताना बॅकग्राउंड स्क्रोल बंद करण्यासाठी
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!service) return null;

  const Icon = service.icon || BriefcaseBusiness;
  const features = service.features?.length
    ? service.features
    : [service.category, "On-site visit", "Work inspection"];

  return (
    <motion.div
      className="service-modal-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <motion.div
        className="service-modal"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 26, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* इथे अट काढली आहे, आता image नसेल तरी placeholder दिसेल */}
        <div className="modal-cover">
          <img
            src={service.image || SERVICE_PLACEHOLDER}
            alt={service.name || "Service Cover"}
            onError={(e) => {
              e.currentTarget.src = SERVICE_PLACEHOLDER;
            }}
          />
        </div>

        <div className="modal-header">
          <div className="modal-icon">
            <Icon size={32} />
          </div>
          <div>
            <h2>{service.name}</h2>
            <p>
              {service.category}
              {service.location ? ` | ${service.location}` : ""}
            </p>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-stats">
            <div className="modal-stat">
              <Star size={18} />
              <span>Rating</span>
              <strong>
                {service.rating || 0} ({service.reviews || 0})
              </strong>
            </div>
            <div className="modal-stat">
              <Clock size={18} />
              <span>Response</span>
              <strong>{service.responseTime || "~1 hr"}</strong>
            </div>
            <div className="modal-stat">
              <IndianRupee size={18} />
              <span>Pricing</span>
              <strong>{service.price || "Price not set"}</strong>
            </div>
          </div>

          {service.location && (
            <div className="modal-location">
              <MapPin size={16} />
              <span>{service.location}</span>
            </div>
          )}

          <div className="modal-section">
            <h3>About this service</h3>
            <p>{service.about || service.description}</p>
          </div>

          <div className="modal-section">
            <h3>What's included</h3>
            <div className="feature-list">
              {features.map((feature, index) => (
                <span key={`${feature}-${index}`}>
                  <Check size={13} />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="modal-section compact-reviews">
            <div>
              <h3>Reviews</h3>
              <span>
                <Star size={13} /> {service.rating || 0} from{" "}
                {service.reviews || 0} customers
              </span>
            </div>
            <div className="review-chip-list">
              {reviewSamples.map((review, index) => (
                <span key={`review-${index}`}>{review}</span>
              ))}
            </div>
          </div>
        </div>

        {canBook && (
          <div className="modal-actions">
            <button className="modal-action" onClick={() => onBook?.(service)}>
              <CalendarCheck size={17} />
              Book now
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
