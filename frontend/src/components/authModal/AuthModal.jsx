import "./AuthModal.css";
import { useState } from "react";
import { Lock, Mail, User, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AuthModal({ mode, onClose, onModeChange, onAuthSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? form
            : {
                email: form.email,
                password: form.password,
              }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      localStorage.setItem("servicehub_token", data.token);
      localStorage.setItem("servicehub_user", JSON.stringify(data.user));
      onAuthSuccess?.(data.user);
      onClose();
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
        <p>
          {isRegister
            ? "Register to book services faster and manage your requests."
            : "Login to continue booking trusted home services."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Name
              <div className="auth-input">
                <User size={18} />
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your name"
                  required
                />
              </div>
            </label>
          )}

          <label>
            Email
            <div className="auth-input">
              <Mail size={18} />
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="auth-input">
              <Lock size={18} />
              <input
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="Minimum 6 characters"
                minLength="6"
                required
              />
            </div>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => onModeChange(isRegister ? "login" : "register")}
        >
          {isRegister ? "Already have an account? Login" : "New user? Register now"}
        </button>
      </div>
    </div>
  );
}
