import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">

      <h1 className="logo">ServiceHub</h1>

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
}