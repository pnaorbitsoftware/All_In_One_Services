
import "./ServiceModal.css";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, CalendarCheck, Check, Clock, IndianRupee, MapPin, Star, X } from "lucide-react";
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";



export default function ServiceModal({
  service,
  onBook,
  onClose,
  canBook = true,
}) {
  const [providerReviews, setProviderReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);


  useEffect(() => {


  if (!service?.providerId) {
   
    return;
  }

  fetch(`${API_URL}/providers/${service.providerId}/reviews`)
    .then((res) => {
      console.log("API STATUS =>", res.status);
      return res.json();
    })
    .then((data) => {

      setProviderReviews(data.reviews || []);
    })
    .catch((err) => {
      console.log("FETCH ERROR =>", err);
      setProviderReviews([]);
    });
}, [service]);
  if (!service) return null;

  const Icon = service.icon || BriefcaseBusiness;
  const features = service.features?.length ? service.features : [service.category, "On-site visit", "Work inspection"];
const averageRating =
  providerReviews.length > 0
    ? (
        providerReviews.reduce(
          (sum, review) => sum + review.clientRating,
          0
        ) / providerReviews.length
      ).toFixed(1)
    : "0.0";

  const totalReviews =
  providerReviews.length || service.reviews || 0;
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
<strong>
  {totalReviews >= 3
    ? `${averageRating} (${totalReviews})`
    : "New Provider"}
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
    <h3>
      Reviews ({providerReviews.length})
    </h3>

<span>
  {totalReviews >= 3 ? (
    <>
      <Star size={13} />
{averageRating} from {totalReviews} customers
    </>
  ) : (
    "New Provider"
  )}
</span>
  </div>
             
<div className="review-chip-list">
  {providerReviews.length > 0 ? (
(showAllReviews
  ? providerReviews
  : providerReviews.slice(0, 3)
).map((review, index) => (
      <div key={index} className="review-card">
        <div className="review-user">
  👤 {review.userName || "Verified Customer"}
</div>

      <div style={{ color: "#f59e0b", fontSize: "14px" }}>
  {"★".repeat(review.clientRating)}
</div>

        <p>{review.clientReview}</p>

        <small>
          {review.reviewedAt
            ? new Date(review.reviewedAt).toLocaleDateString()
            : ""}
        </small>
      </div>
    ))
  ) : (
    <span>No reviews yet</span>
  )}
</div>
{providerReviews.length > 3 && (
  <button
    type="button"
    className="view-all-reviews-btn"
    onClick={() => setShowAllReviews(!showAllReviews)}
  >
    {showAllReviews
      ? "Show Less"
      : `View All ${providerReviews.length} Reviews`}
  </button>
)}
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

