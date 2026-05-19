import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-section">
          <h2>ServiceHub</h2>

          <p>
            Trusted home services for plumbing, electrical,
            carpentry, painting, cleaning and more.
          </p>
        </div>

        {/* SERVICES */}
        <div className="footer-section">
          <h3>Services</h3>

          <ul>
            <li>Plumber</li>
            <li>Electrician</li>
            <li>Carpenter</li>
            <li>Painter</li>
            <li>AC Repair</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer-section">
          <h3>Contact</h3>

          <p>+91 9876543210</p>
          <p>support@servicehub.com</p>
          <p>Pune, Maharashtra</p>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>© 2026 ServiceHub. All Rights Reserved.</p>
      </div>

    </footer>
  );
}