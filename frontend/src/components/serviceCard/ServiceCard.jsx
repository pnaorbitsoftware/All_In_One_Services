import "./ServiceCard.css";
import { CalendarCheck, Clock, Info, MapPin, Phone, Star } from "lucide-react";

export default function ServiceCard({ service, onBook, onViewDetails }) {

  const Icon = service.icon;

  return (
    <div className="service-card">

      <div className="service-top">

        <div className="service-icon">
          <Icon size={30} />
        </div>

        <div className="service-title">
          <h2>{service.name}</h2>
          <p>{service.category}</p>
        </div>

      </div>

      <div className="service-details">

        <div>
          <MapPin size={18} />
          <span>{service.location}</span>
        </div>

        <div>
          <Phone size={18} />
          <span>{service.phone}</span>
        </div>

        <div>
          <Star size={18} />
          <span>{service.rating} ({service.reviews} reviews)</span>
        </div>

        <div>
          <Clock size={18} />
          <span>{service.responseTime}</span>
        </div>

      </div>

      <div className="service-actions">
        <button
          className="details-btn"
          type="button"
          onClick={() => onViewDetails?.(service)}
        >
          <Info size={17} />
          About & details
        </button>

        <button
          className="book-btn"
          type="button"
          onClick={() => onBook?.(service)}
        >
          <CalendarCheck size={17} />
          Book
        </button>
      </div>

    </div>
  );
}
