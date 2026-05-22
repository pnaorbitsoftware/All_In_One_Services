import "./Footer.css";

import { Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

const services = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "AC Repair",
  "Refrigerator Repair",
  "Washing Machine Repair",
  "TV Repair",
];

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-section footer-brand">
          <h2>ServiceHub</h2>

          <p>
            Trusted local professionals for home repairs,
            maintenance, installation, and emergency support.
          </p>

          <div className="footer-trust">
            <ShieldCheck size={20} />
            <span>Verified providers with reliable client support</span>
          </div>
        </div>

        <div className="footer-section">
          <h3>Services</h3>

          <ul className="footer-service-list">
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>

          <ul className="footer-contact-list">
            <li>
              <Phone size={18} />
              <span>+91 9876543210</span>
            </li>

            <li>
              <Mail size={18} />
              <span>support@servicehub.com</span>
            </li>

            <li>
              <MapPin size={18} />
              <span>Pune, Maharashtra</span>
            </li>

            <li>
              <Clock size={18} />
              <span>Mon - Sun, 8:00 AM - 9:00 PM</span>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>For Clients</h3>

          <p>
            Book nearby service providers, compare ratings,
            and get help for urgent repair needs.
          </p>

          <div className="footer-support">
            <strong>Need help?</strong>
            <span>Call us for booking assistance or service issues.</span>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 ServiceHub. All Rights Reserved.</p>
        <p>Serving homes across Pune and nearby cities.</p>
      </div>

    </footer>
  );
}
