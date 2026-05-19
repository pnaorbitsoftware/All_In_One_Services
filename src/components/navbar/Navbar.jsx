// Navbar.jsx

import "./Navbar.css";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Fan,
} from "lucide-react";

const Navbar = () => {
  return (
    <nav className="navbar">

      {/* LOGO */}
      <div className="logo">
        <span>Service</span>Hub
      </div>

      {/* NAV LINKS */}
      <ul className="nav-links">

        <li>
          <Wrench size={18} />
          Plumber
        </li>

        <li>
          <Zap size={18} />
          Electrician
        </li>

        <li>
          <Hammer size={18} />
          Carpenter
        </li>

        <li>
          <Paintbrush size={18} />
          Painter
        </li>

        <li>
          <Fan size={18} />
          AC Repair
        </li>

      </ul>

      {/* BUTTONS */}
      <div className="nav-buttons">

        <button className="login-btn">
          Login
        </button>

        <button className="register-btn">
          Register
        </button>

      </div>

    </nav>
  );
};

export default Navbar;
