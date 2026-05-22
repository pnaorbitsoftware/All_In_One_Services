import "./ServiceModal.css";
import { CalendarCheck, Check, Clock, IndianRupee, Phone, Star, X } from "lucide-react";

const reviewSamples = [
  "Clean work and on-time arrival.",
  "Polite provider, fair pricing.",
  "Quick response and neat finishing.",
];

export default function ServiceModal({ service, onBook, onClose }) {
  if (!service) return null;

  const Icon = service.icon;

  return (
    <div className="service-modal-backdrop" onClick={onClose}>
      <div className="service-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <Icon size={32} />
          </div>
          <div>
            <h2>{service.name}</h2>
            <p>{service.category}</p>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-stats">
            <div className="modal-stat">
              <Star size={18} />
              <span>Rating</span>
              <strong>{service.rating} ({service.reviews})</strong>
            </div>
            <div className="modal-stat">
              <Clock size={18} />
              <span>Response</span>
              <strong>{service.responseTime}</strong>
            </div>
            <div className="modal-stat">
              <IndianRupee size={18} />
              <span>Pricing</span>
              <strong>{service.price}</strong>
            </div>
          </div>

          <div className="modal-section">
            <h3>About this service</h3>
            <p>{service.about || service.description}</p>
          </div>

          <div className="modal-section">
            <h3>What's included</h3>
            <div className="feature-list">
              {service.features?.map((feature) => (
                <span key={feature}>
                  <Check size={14} />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="modal-section compact-reviews">
            <div>
              <h3>Reviews</h3>
              <span><Star size={14} /> {service.rating} from {service.reviews} customers</span>
            </div>
            <div className="review-chip-list">
              {reviewSamples.map((review) => (
                <span key={review}>{review}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-action" onClick={() => onBook?.(service)}>
            <CalendarCheck size={18} />
            Book now
          </button>
          <a className="modal-call" href={`tel:${service.phone.replace(/\s/g, "")}`}>
            <Phone size={18} />
            Call us
          </a>
        </div>
      </div>
    </div>
  );
}
