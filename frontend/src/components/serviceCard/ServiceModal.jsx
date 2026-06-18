import "./ServiceModal.css";
import { motion } from "framer-motion";
import { BriefcaseBusiness, CalendarCheck, Check, Clock, IndianRupee, MapPin, Star, X } from "lucide-react";

const reviewSamples = [
  "Clean work and on-time arrival.",
  "Polite provider, fair pricing.",
  "Quick response and neat finishing.",
];

export default function ServiceModal({ service, onBook, onClose, canBook = true }) {
  if (!service) return null;

  const Icon = service.icon || BriefcaseBusiness;
  const features = service.features?.length ? service.features : [service.category, "On-site visit", "Work inspection"];

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
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="modal-content">
          {service.image && (
            <div className="modal-cover">
              <img src={service.image} alt={`${service.name} ${service.category} provider`} />
            </div>
          )}

          <div className="modal-header">
            <div className="modal-icon">
              <Icon size={32} />
            </div>
            <div>
              <h2>{service.name}</h2>
              <p>{service.category}{service.location ? ` | ${service.location}` : ""}</p>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-stats">
              <div className="modal-stat">
                <Star size={18} />
                <span>Rating</span>
                <strong>{service.rating || 0} ({service.reviews || 0})</strong>
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
                {features.map((feature) => (
                  <span key={feature}>
                    <Check size={13} />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-section compact-reviews">
              <div>
                <h3>Reviews</h3>
                <span><Star size={13} /> {service.rating || 0} from {service.reviews || 0} customers</span>
              </div>
              <div className="review-chip-list">
                {reviewSamples.map((review) => (
                  <span key={review}>{review}</span>
                ))}
              </div>
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
