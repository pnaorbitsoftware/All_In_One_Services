import "./ServiceCard.css";
import { MapPin, Phone, Star } from "lucide-react";

export default function ServiceCard({ service }) {

  const Icon = service.icon;

  return (
    <div className="service-card">

      <div className="service-top">

        <div className="service-icon">
          <Icon size={30} />
        </div>

        <div>
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
          <span>{service.rating}</span>
        </div>

      </div>

      <button>
        View Details
      </button>

    </div>
  );
}