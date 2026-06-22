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

const SERVICE_PLACEHOLDER = "/service-placeholder.jpg";

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
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEsc);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!service) return null;

  const Icon = service.icon || BriefcaseBusiness;

  const features =
    Array.isArray(service.features) && service.features.length > 0
      ? service.features
      : [
          service.category || "Service category",
          "On-site visit",
          "Work inspection",
        ];

  const rating = service.rating ?? 0;
  const reviews = service.reviews ?? 0;
  const responseTime = service.responseTime || "~1 hr";
  const price = service.price || "Price not set";
  const title = service.name || "Service";
  const category = service.category || "Service";
  const description =
    service.about || service.description || "No description available.";

  return (
    <motion.div
      className="service-modal-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="service-modal"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="modal-cover">
          <img
            src={service.image || SERVICE_PLACEHOLDER}
            alt={title}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = SERVICE_PLACEHOLDER;
            }}
          />
        </div>

        <div className="modal-header">
          <div className="modal-icon">
            <Icon size={32} />
          </div>

          <div>
            <h2>{title}</h2>
            <p>
              {category}
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
                {rating} ({reviews})
              </strong>
            </div>

            <div className="modal-stat">
              <Clock size={18} />
              <span>Response</span>
              <strong>{responseTime}</strong>
            </div>

            <div className="modal-stat">
              <IndianRupee size={18} />
              <span>Pricing</span>
              <strong>{price}</strong>
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
            <p>{description}</p>
          </div>

          <div className="modal-section">
            <h3>What's included</h3>

            <div className="feature-list">
              {features.map((feature, index) => (
                <span key={`${String(feature)}-${index}`}>
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
                <Star size={13} /> {rating} from {reviews} customers
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
            <button
              type="button"
              className="modal-action"
              onClick={() => onBook?.(service)}
            >
              <CalendarCheck size={17} />
              Book now
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
