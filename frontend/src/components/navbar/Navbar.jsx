import "./Navbar.css";
import { Moon, Phone, ShieldCheck, Sun } from "lucide-react";

export default function Navbar({ user, theme, onThemeToggle, onRegisterClick, onLogout }) {
  return (
    <nav className="navbar">
      <a className="logo" href="#top" aria-label="ServiceHub home">
        <span className="logo-mark">S</span>
        <span>ServiceHub</span>
      </a>

      <div className="nav-links">
        <a href="#services">Services</a>
        <a href="#providers">Providers</a>
        {user && <a href="#dashboard">Bookings</a>}
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact</a>
      </div>

      <div className="nav-buttons">
        <button className="icon-toggle" type="button" onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <>
            <span className="user-chip">
              <ShieldCheck size={15} />
              {user.role === "admin" ? "Admin" : user.name}
            </span>
            <button className="login-btn" type="button" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <button className="register-btn" type="button" onClick={onRegisterClick}>Register</button>
          </>
        )}

        <a className="call-btn" href="tel:+919876543210">
          <Phone size={17} />
          Call
        </a>
      </div>
    </nav>
  );
}
