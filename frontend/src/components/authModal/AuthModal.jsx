import "./AuthModal.css";
import "./AuthModalProfessional.css";
import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle,
  Eye,
  EyeOff,
  FileText,
  IndianRupee,
  Lock,
  Mail,
  MapPin,
  Phone,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_API_URLS = [
  ...new Set([
    API_URL,
    ...(import.meta.env.DEV
      ? ["http://localhost:5000/api", "http://localhost:5001/api"]
      : []),
  ]),
];
const providerCategories = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "AC Repair",
  "Cleaning",
  "Refrigerator Repair",
  "Washing Machine Repair",
  "TV Repair",
];
const providerLocations = [
  "Pune City",
  "Pimpri-Chinchwad",
  "Haveli",
  "Mulshi",
  "Maval",
  "Velhe",
  "Bhor",
  "Purandar",
  "Baramati",
  "Daund",
  "Indapur",
  "Khed",
  "Shirur",
  "Ambegaon",
  "Junnar",
];

const authTranslations = {
  en: {
    resetPassword: "Reset Password",
    becomeProvider: "Become a Provider",
    createClientAccount: "Client Registration",
    providerLogin: "Provider Login",
    clientLogin: "Client Login",
    resetCopy:
      "Use your registered email address or mobile number to create a new password.",
    providerRegisterCopy:
      "Create your provider profile. Admin approval is required before your profile appears on the website.",
    registerCopy: "Register to book services faster and manage your requests.",
    loginCopy: "Login to continue booking trusted home services.",
    providerWorkspace: "Provider workspace",
    clientAccess: "Client access",
    providerAccessCopy:
      "Add your service details and join after OTP verification.",
    clientAccessCopy: "Login with your registered email and password.",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    login: "Login",
    forgotPassword: "Forgot password?",
    newUserRegister: "New user? Register now",
    newProviderRegister: "New provider? Register now",
    alreadyAccount: "Already have an account? Login",
    alreadyProvider: "Already a provider? Login",
    backToLogin: "Back to login",
  },
  hi: {
    resetPassword: "पासवर्ड रीसेट करें",
    becomeProvider: "प्रदाता बनें",
    createClientAccount: "क्लाइंट रजिस्ट्रेशन",
    providerLogin: "प्रदाता लॉगिन",
    clientLogin: "क्लाइंट लॉगिन",
    resetCopy:
      "नया पासवर्ड बनाने के लिए अपना रजिस्टर्ड ईमेल या मोबाइल नंबर इस्तेमाल करें.",
    providerRegisterCopy:
      "अपनी प्रदाता प्रोफाइल बनाएं. वेबसाइट पर दिखने से पहले एडमिन मंजूरी जरूरी है.",
    registerCopy:
      "सेवाएं जल्दी बुक करने और अनुरोध संभालने के लिए रजिस्टर करें.",
    loginCopy: "विश्वसनीय होम सेवाएं बुक करने के लिए लॉगिन करें.",
    providerWorkspace: "प्रदाता कार्यक्षेत्र",
    clientAccess: "क्लाइंट एक्सेस",
    providerAccessCopy: "OTP सत्यापन के बाद अपनी सेवा जानकारी जोड़ें.",
    clientAccessCopy: "अपने रजिस्टर्ड ईमेल और पासवर्ड से लॉगिन करें.",
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड पुष्टि करें",
    login: "लॉगिन",
    forgotPassword: "पासवर्ड भूल गए?",
    newUserRegister: "नए यूजर? रजिस्टर करें",
    newProviderRegister: "नए प्रदाता? रजिस्टर करें",
    alreadyAccount: "पहले से खाता है? लॉगिन करें",
    alreadyProvider: "पहले से प्रदाता हैं? लॉगिन करें",
    backToLogin: "लॉगिन पर वापस",
  },
  mr: {
    resetPassword: "पासवर्ड रीसेट करा",
    becomeProvider: "प्रदाता बना",
    createClientAccount: "क्लायंट रजिस्ट्रेशन",
    providerLogin: "प्रदाता लॉगिन",
    clientLogin: "क्लायंट लॉगिन",
    resetCopy: "नवीन पासवर्डसाठी तुमचा नोंदणीकृत ईमेल किंवा मोबाइल नंबर वापरा.",
    providerRegisterCopy:
      "तुमची प्रदाता प्रोफाइल तयार करा. वेबसाइटवर दिसण्यापूर्वी अॅडमिन मंजुरी आवश्यक आहे.",
    registerCopy:
      "सेवा जलद बुक करण्यासाठी आणि विनंत्या व्यवस्थापित करण्यासाठी नोंदणी करा.",
    loginCopy: "विश्वसनीय होम सेवा बुक करण्यासाठी लॉगिन करा.",
    providerWorkspace: "प्रदाता कार्यक्षेत्र",
    clientAccess: "क्लायंट प्रवेश",
    providerAccessCopy: "OTP पडताळणीनंतर तुमची सेवा माहिती जोडा.",
    clientAccessCopy: "नोंदणीकृत ईमेल आणि पासवर्डने लॉगिन करा.",
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड पुष्टी करा",
    login: "लॉगिन",
    forgotPassword: "पासवर्ड विसरलात?",
    newUserRegister: "नवीन यूजर? नोंदणी करा",
    newProviderRegister: "नवीन प्रदाता? नोंदणी करा",
    alreadyAccount: "आधीच खाते आहे? लॉगिन करा",
    alreadyProvider: "आधीच प्रदाता आहात? लॉगिन करा",
    backToLogin: "लॉगिनवर परत",
  },
};

const otpChannelLabel = (channel) => {
  if (channel === "whatsapp") return "WhatsApp number";
  if (channel === "sms") return "mobile number";
  return "email";
};

const notRegisteredMessage = (role) =>
  role === "provider"
    ? "Provider is not registered. Please register first."
    : "User is not registered. Please register first.";

const authFetch = async (path, options) => {
  let lastError;

  for (const apiUrl of AUTH_API_URLS) {
    try {
      return await fetch(`${apiUrl}${path}`, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const readJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

function ProviderUploadField({
  label,
  hint,
  accept,
  value,
  fileName,
  onChange,
  onRemove,
  required = false,
  document = false,
}) {
  return (
    <div className="provider-upload-field">
      <span className="provider-upload-label">
        {label}{required && <em>Required</em>}
      </span>
      <label className={`provider-upload-tile ${value ? "has-file" : ""}`}>
        <input type="file" accept={accept} onChange={onChange} required={required && !value} />
        {value && !document ? (
          <img src={value} alt="Selected upload preview" />
        ) : (
          <span className="provider-upload-icon">
            {value ? <FileText size={22} /> : <UploadCloud size={22} />}
          </span>
        )}
        <span className="provider-upload-copy">
          <strong>{value ? fileName : "Choose file"}</strong>
          <small>{value ? "Ready to upload" : hint}</small>
        </span>
        {value && <CheckCircle className="provider-upload-check" size={18} />}
      </label>
      {value && (
        <button type="button" className="provider-upload-remove" onClick={onRemove}>
          <Trash2 size={14} /> Remove
        </button>
      )}
    </div>
  );
}

export default function AuthModal({
  mode,
  initialRole = "user",
  lockedRole = false,
  language = "en",
  onClose,
  onModeChange,
  onAuthSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: initialRole,
    providerName: "",
    category: "",
    customCategory: "",
    location: "",
    preferredWorkLocation: "",
    workImage: "",
    workImageName: "",
    aadhaarNumber: "",
    aadhaarFrontUrl: "",
    aadhaarBackUrl: "",
    aadhaarDocumentName: "",
    aadhaarBackDocumentName: "",
    price: "",
    responseTime: "",
    otpChannel: "email",
    resetOtpChannel: "email",
    registrationOtp: "",
    resetIdentifier: "",
    resetOtp: "",
    resetPassword: "",
    resetConfirmPassword: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState("identifier");
  const [resetToken, setResetToken] = useState("");
  const [registrationOtpRequired, setRegistrationOtpRequired] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const modalRef = useRef(null);

  const isRegister = mode === "register";
  const isLogin = mode === "login" && !isResetMode;
  const isPasswordReset = mode === "login" && isResetMode;
  const isProviderRegister = isRegister && form.role === "provider";
  const roleOptions = lockedRole ? [initialRole] : ["user"];
  const t = (key) =>
    authTranslations[language]?.[key] || authTranslations.en[key] || key;
  const authTitle = isPasswordReset
    ? t("resetPassword")
    : isProviderRegister
      ? t("becomeProvider")
      : isRegister
        ? t("createClientAccount")
        : form.role === "provider"
          ? t("providerLogin")
          : t("clientLogin");
  const authCopy = isPasswordReset
    ? t("resetCopy")
    : isProviderRegister
      ? t("providerRegisterCopy")
      : isRegister
        ? t("registerCopy")
        : t("loginCopy");
  const modeLabel = isPasswordReset
    ? "Secure reset"
    : isRegister
      ? "Create account"
      : "Welcome back";
  const modalClassName = [
    "auth-modal",
    isProviderRegister ? "auth-modal-wide" : "",
    isRegister ? "auth-modal-register" : "auth-modal-login",
  ]
    .filter(Boolean)
    .join(" ");
  const lockedRoleTitle = isRegister
    ? form.role === "provider"
      ? "Provider registration"
      : "Client registration"
    : form.role === "provider"
      ? t("providerWorkspace")
      : t("clientAccess");
  const lockedRoleCopy = isRegister
    ? form.role === "provider"
      ? "Create your provider profile and verify it with email OTP."
      : "Create your client account and verify it with email OTP."
    : form.role === "provider"
      ? t("providerAccessCopy")
      : t("clientAccessCopy");

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "category" && value !== "Other"
        ? { customCategory: "" }
        : {}),
    }));
  };

  const resizeWorkImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 900;
          const scale = Math.min(
            maxSize / image.width,
            maxSize / image.height,
            1,
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(Math.round(image.width * scale), 1);
          canvas.height = Math.max(Math.round(image.height * scale), 1);
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Your browser could not prepare the work photo."));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        };
        image.onerror = () =>
          reject(new Error("Selected work photo could not be loaded."));
        image.src = reader.result;
      };
      reader.onerror = () =>
        reject(new Error("Selected work photo could not be read."));
      reader.readAsDataURL(file);
    });

  const handleWorkImageChange = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, workImage: "", workImageName: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a PNG, JPG, JPEG, or WEBP work photo.");
      event.target.value = "";
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Work photo must be under 4MB.");
      event.target.value = "";
      return;
    }

    try {
      const workImage = await resizeWorkImage(file);
      setError("");
      setForm((prev) => ({ ...prev, workImage, workImageName: file.name }));
    } catch (imageError) {
      setError(imageError.message || "Work photo could not be prepared.");
      event.target.value = "";
    }
  };

  const readDocumentAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("Selected Aadhaar document could not be read."));
      reader.readAsDataURL(file);
    });

  const handleAadhaarDocumentChange = (field) => {
    return async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.target.files?.[0];
      const nameField = field === "aadhaarBackUrl"
        ? "aadhaarBackDocumentName"
        : "aadhaarDocumentName";
      if (!file) {
        setForm((prev) => ({ ...prev, [field]: "", [nameField]: "" }));
        return;
      }

      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("Upload Aadhaar as PNG, JPG, WEBP, or PDF.");
        event.target.value = "";
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Aadhaar document must be under 2MB.");
        event.target.value = "";
        return;
      }

      try {
        const aadhaarUrl = file.type === "application/pdf"
          ? await readDocumentAsDataUrl(file)
          : await resizeWorkImage(file);
        setError("");
        setForm((prev) => ({
          ...prev,
          [field]: aadhaarUrl,
          [nameField]: file.name,
        }));
      } catch (documentError) {
        setError(documentError.message || "Aadhaar document could not be prepared.");
        event.target.value = "";
      }
    };
  };

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleRequestClose = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onClose?.();
  };

  const handleBackdropClose = (event) => {
    // Native macOS file pickers can replay the Open-button mouse event on the
    // page underneath. Keep long provider forms open so selected files persist.
    if (isProviderRegister) return;
    if (event.target === event.currentTarget) {
      handleRequestClose(event);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
    if (modalRef.current) modalRef.current.scrollTop = 0;
  }, [mode, isResetMode, resetStep, registrationOtpRequired]);

  const handleGenerateOtp = async () => {
    setError("");
    setSuccessMessage("");

    if (!form.resetIdentifier.trim()) {
      setError("Enter your registered email address or mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch("/auth/forgot-password/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.resetIdentifier,
          role: form.role,
          otpChannel: form.resetOtpChannel,
        }),
      });
      const data = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "OTP generation failed.");
      }

      setResetStep("otp");
      setSuccessMessage(
        `OTP sent to registered ${otpChannelLabel(form.resetOtpChannel)}. Use it within 5 minutes.`,
      );
    } catch (otpError) {
      setError(
        otpError.message === "Failed to fetch"
          ? "Backend is not reachable. Start the backend server and try again."
          : otpError.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccessMessage("");

    if (!/^\d{6}$/.test(form.resetOtp.trim())) {
      setError("Enter the valid 6-digit OTP.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch("/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.resetIdentifier,
          otp: form.resetOtp,
          role: form.role,
        }),
      });
      const data = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setResetToken(data.resetToken || "");
      setResetStep("password");
      setSuccessMessage(data.message || "OTP verified successfully.");
    } catch (otpError) {
      setError(
        otpError.message === "Failed to fetch"
          ? "Backend is not reachable. Start the backend server and try again."
          : otpError.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (isPasswordReset) {
        if (form.resetPassword !== form.resetConfirmPassword) {
          throw new Error("New password and confirm password must match.");
        }

        const response = await authFetch("/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: form.resetIdentifier,
            password: form.resetPassword,
            resetToken,
            role: form.role,
          }),
        });
        const data = await readJsonSafely(response);

        if (!response.ok) {
          throw new Error(data.message || "Password reset failed.");
        }

        setSuccessMessage(
          data.message || "Password updated successfully. Please login.",
        );
        setForm((prev) => ({
          ...prev,
          password: "",
          resetIdentifier: "",
          resetOtp: "",
          resetPassword: "",
          resetConfirmPassword: "",
        }));
        setResetStep("identifier");
        setResetToken("");
        setIsResetMode(false);
        return;
      }

      if (isRegister && form.password !== form.confirmPassword) {
        throw new Error("Password and confirm password must match.");
      }

      if (isProviderRegister) {
        const aadhaarDigits = form.aadhaarNumber.replace(/\D/g, "");
        if (aadhaarDigits.length !== 12) {
          throw new Error("Enter a valid 12-digit Aadhaar number.");
        }
        if (!form.aadhaarFrontUrl) {
          throw new Error("Upload Aadhaar front image or PDF before registration.");
        }
      }

      const loginPayload = isRegister
        ? {
            ...form,
            otpChannel: form.otpChannel,
            otp: registrationOtpRequired ? form.registrationOtp : "",
          }
        : {
            email: form.email,
            password: form.password,
            role: form.role,
          };

      let detectedAdminAccount = false;

      if (isLogin) {
        const statusResponse = await authFetch("/auth/registration-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            role: form.role,
          }),
        });
        const statusData = await readJsonSafely(statusResponse);

        if (statusResponse.ok && !statusData.registered) {
          throw new Error(
            statusData.message || notRegisteredMessage(form.role),
          );
        }

        detectedAdminAccount = statusData.actualRole === "admin";
      }

      let response = await authFetch(`/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      });

      let data = await readJsonSafely(response);

      if (
        mode === "login" &&
        form.role === "user" &&
        !response.ok &&
        data.message?.toLowerCase().includes("admin")
      ) {
        response = await authFetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            role: "admin",
          }),
        });
        data = await readJsonSafely(response);
      }

      if (
        mode === "login" &&
        form.role === "user" &&
        detectedAdminAccount &&
        !response.ok
      ) {
        response = await authFetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            role: "admin",
          }),
        });
        data = await readJsonSafely(response);
      }

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (isRegister && data.requiresOtp) {
        const selectedOtpChannel = data.otpChannel || form.otpChannel;
        setRegistrationOtpRequired(true);
        setSuccessMessage(
          `OTP sent to registered ${otpChannelLabel(selectedOtpChannel)}. Use it within 5 minutes.`,
        );
        return;
      }

      if (data.token) {
        localStorage.setItem("servicehub_token", data.token);
      }

      if (data.user) {
        localStorage.setItem("servicehub_user", JSON.stringify(data.user));
      }

      onAuthSuccess?.(data.user);
      onClose?.();
    } catch (authError) {
      setError(
        authError.message === "Failed to fetch"
          ? "Backend is not reachable. Start the backend server and try again."
          : authError.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-backdrop" onMouseDown={handleBackdropClose}>
      <div
        key={`${mode}-${isResetMode ? resetStep : "auth"}`}
        ref={modalRef}
        data-auth-mode={mode}
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="auth-close"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={handleRequestClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="auth-hero">
          <div className="auth-brand" aria-label="ServiceHub">
            <span className="auth-brand-mark" aria-hidden="true">
              S
            </span>
            <span>
              Service<span>Hub</span>
            </span>
          </div>
          <div className="auth-hero-icon">
            <BadgeIcon role={form.role} />
          </div>
          <span className="auth-eyebrow">{modeLabel}</span>
          <h2 id="auth-modal-title">{authTitle}</h2>
          <p>{authCopy}</p>
          <div className="auth-trust-row" aria-label="ServiceHub trust signals">
            <span>Verified services</span>
            <span>OTP secure</span>
            <span>Fast booking</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {lockedRole || roleOptions.length === 1 ? (
            <div className="auth-role-locked">
              <BadgeIcon role={form.role} />
              <div>
                <strong>{lockedRoleTitle}</strong>
                <span>{lockedRoleCopy}</span>
              </div>
            </div>
          ) : (
            <div className="auth-role-tabs" aria-label="Account type">
              {roleOptions.map((role) => (
                <button
                  className={form.role === role ? "active" : ""}
                  key={role}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role }))}
                >
                  {role === "user"
                    ? "Client"
                    : role === "provider"
                      ? "Provider"
                      : "Admin"}
                </button>
              ))}
            </div>
          )}

          {isPasswordReset && (
            <>
              <label>
                Email or mobile number
                <div className="auth-input">
                  <Mail size={18} />
                  <input
                    type="text"
                    value={form.resetIdentifier}
                    onChange={handleChange("resetIdentifier")}
                    placeholder="Registered email or mobile number"
                    required
                    disabled={resetStep !== "identifier"}
                  />
                </div>
              </label>

              {resetStep === "identifier" && (
                <OtpChannelPicker
                  value={form.resetOtpChannel}
                  onChange={handleChange("resetOtpChannel")}
                />
              )}

              {resetStep === "identifier" && (
                <button
                  className="auth-secondary-action"
                  type="button"
                  onClick={handleGenerateOtp}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Generating OTP..." : "Generate OTP"}
                </button>
              )}

              {resetStep !== "identifier" && (
                <label>
                  OTP
                  <div className="auth-input auth-otp-input">
                    <Lock size={18} />
                    <input
                      type="text"
                      value={form.resetOtp}
                      onChange={handleChange("resetOtp")}
                      placeholder="Enter 6-digit OTP"
                      inputMode="numeric"
                      maxLength="6"
                      required
                      disabled={resetStep === "password"}
                    />
                  </div>
                </label>
              )}

              {resetStep === "otp" && (
                <button
                  className="auth-secondary-action"
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Verifying OTP..." : "Verify OTP"}
                </button>
              )}

              {resetStep === "password" && (
                <>
                  <label>
                    New password
                    <div className="auth-input">
                      <Lock size={18} />
                      <input
                        type={
                          visiblePasswords.resetPassword ? "text" : "password"
                        }
                        value={form.resetPassword}
                        onChange={handleChange("resetPassword")}
                        placeholder="Minimum 6 characters"
                        minLength="6"
                        required
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() =>
                          togglePasswordVisibility("resetPassword")
                        }
                        aria-label={
                          visiblePasswords.resetPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {visiblePasswords.resetPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </label>

                  <label>
                    Confirm new password
                    <div className="auth-input">
                      <Lock size={18} />
                      <input
                        type={
                          visiblePasswords.resetConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={form.resetConfirmPassword}
                        onChange={handleChange("resetConfirmPassword")}
                        placeholder="Re-enter new password"
                        minLength="6"
                        required
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() =>
                          togglePasswordVisibility("resetConfirmPassword")
                        }
                        aria-label={
                          visiblePasswords.resetConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {visiblePasswords.resetConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </label>
                </>
              )}
            </>
          )}

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

          {isRegister && (
            <label>
              Phone
              <div className="auth-input">
                <Phone size={18} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="Mobile number"
                  required={isRegister}
                />
              </div>
            </label>
          )}

          {isRegister && form.role === "user" && (
            <label>
              Address
              <div className="auth-input">
                <MapPin size={18} />
                <textarea
                  value={form.address}
                  onChange={handleChange("address")}
                  placeholder="Your registered service address"
                  rows="3"
                  required
                />
              </div>
            </label>
          )}

          {isProviderRegister && (
            <div className="provider-form-section">
              <div className="provider-section-heading">
                <BriefcaseBusiness size={20} />
                <div>
                  <strong>Add your service</strong>
                </div>
              </div>

              <label>
                Business name
                <div className="auth-input">
                  <BriefcaseBusiness size={18} />
                  <input
                    type="text"
                    value={form.providerName}
                    onChange={handleChange("providerName")}
                    placeholder="Your service profile name"
                    required
                  />
                </div>
              </label>

              <label>
                Service category
                <div className="auth-input">
                  <BriefcaseBusiness size={18} />
                  <select
                    value={form.category}
                    onChange={handleChange("category")}
                    required
                  >
                    <option value="">Choose service category</option>
                    {providerCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <p className="auth-field-helper">
                  Can't find your service? Select 'Other' and enter your service
                  category.
                </p>
              </label>

              {form.category === "Other" && (
                <label>
                  Enter Your Service Category
                  <div className="auth-input">
                    <BriefcaseBusiness size={18} />
                    <input
                      type="text"
                      value={form.customCategory}
                      onChange={handleChange("customCategory")}
                      placeholder="Enter your service category"
                      required
                    />
                  </div>
                </label>
              )}

              <label>
                Location
                <div className="auth-input">
                  <MapPin size={18} />
                  <select
                    value={form.location}
                    onChange={handleChange("location")}
                    required
                  >
                    <option value="">Choose location</option>
                    {providerLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label>
                Service charges
                <div className="auth-input">
                  <IndianRupee size={18} />
                  <input
                    type="text"
                    value={form.price}
                    onChange={handleChange("price")}
                    placeholder="Example: From Rs. 299"
                    required
                  />
                </div>
              </label>

              <label>
                Preferred work location
                <div className="auth-input">
                  <MapPin size={18} />
                  <input
                    type="text"
                    value={form.preferredWorkLocation}
                    onChange={handleChange("preferredWorkLocation")}
                    placeholder="Example: MIDC, Market Yard, Kasba"
                    required
                  />
                </div>
              </label>

              <ProviderUploadField
                label="Work photo"
                hint="PNG, JPG or WEBP up to 4MB"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                value={form.workImage}
                fileName={form.workImageName}
                onChange={handleWorkImageChange}
                onRemove={() => setForm((prev) => ({ ...prev, workImage: "", workImageName: "" }))}
              />

              <label>
                Aadhaar number
                <div className="auth-input">
                  <Lock size={18} />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="14"
                    value={form.aadhaarNumber}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
                      const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                      setForm((prev) => ({ ...prev, aadhaarNumber: formatted }));
                    }}
                    placeholder="XXXX XXXX 1234"
                    required
                  />
                </div>
                <p className="auth-field-helper">
                  Only the last four digits are shown to admin after upload.
                </p>
              </label>

              <ProviderUploadField
                label="Aadhaar front or PDF"
                hint="Image or PDF up to 4MB"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                value={form.aadhaarFrontUrl}
                fileName={form.aadhaarDocumentName}
                onChange={handleAadhaarDocumentChange("aadhaarFrontUrl")}
                onRemove={() => setForm((prev) => ({ ...prev, aadhaarFrontUrl: "", aadhaarDocumentName: "" }))}
                required
                document={form.aadhaarDocumentName?.toLowerCase().endsWith(".pdf")}
              />

              <ProviderUploadField
                label="Aadhaar back"
                hint="Optional with a complete Aadhaar PDF"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                value={form.aadhaarBackUrl}
                fileName={form.aadhaarBackDocumentName}
                onChange={handleAadhaarDocumentChange("aadhaarBackUrl")}
                onRemove={() => setForm((prev) => ({ ...prev, aadhaarBackUrl: "", aadhaarBackDocumentName: "" }))}
              />
            </div>
          )}

          {!isPasswordReset && (
            <label>
              {t("email")}
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
              {isLogin && (
                <p className="auth-field-helper">
                  Use your registered email address to log in.
                </p>
              )}
            </label>
          )}

          {!isPasswordReset && (
            <label>
              {t("password")}
              <div className="auth-input">
                <Lock size={18} />
                <input
                  type={visiblePasswords.password ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Minimum 6 characters"
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => togglePasswordVisibility("password")}
                  aria-label={
                    visiblePasswords.password
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {visiblePasswords.password ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
          )}

          {isRegister && (
            <label>
              {t("confirmPassword")}
              <div className="auth-input">
                <Lock size={18} />
                <input
                  type={visiblePasswords.confirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder="Re-enter password"
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  aria-label={
                    visiblePasswords.confirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {visiblePasswords.confirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
          )}

          {isRegister && registrationOtpRequired && (
            <label>
              Registration OTP
              <div className="auth-input auth-otp-input">
                <Lock size={18} />
                <input
                  type="text"
                  value={form.registrationOtp}
                  onChange={handleChange("registrationOtp")}
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  maxLength="6"
                  required
                />
              </div>
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}
          {successMessage && (
            <div className="auth-success">{successMessage}</div>
          )}
          {(registrationOtpRequired ||
            (isPasswordReset && resetStep === "otp")) && (
            <div className="auth-security-note">
              <Lock size={16} />
              <span>Your information is safe with us.</span>
            </div>
          )}
          {(!isPasswordReset || resetStep === "password") && (
            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait..."
                : isPasswordReset
                  ? "Update password"
                  : isRegister && registrationOtpRequired
                    ? "Verify OTP and register"
                    : isRegister
                      ? "Generate registered OTP on email"
                      : t("login")}
            </button>
          )}
        </form>

        <div className="auth-footer-actions">
          {isLogin && (
            <button
              className="auth-switch auth-switch-left"
              type="button"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setIsResetMode(true);
                setResetStep("identifier");
                setResetToken("");
                setForm((prev) => ({
                  ...prev,
                  role: lockedRole
                    ? initialRole
                    : prev.role === "admin"
                      ? "user"
                      : prev.role,
                }));
              }}
            >
              {t("forgotPassword")}
            </button>
          )}

          <button
            className="auth-switch auth-switch-right"
            type="button"
            onClick={() => {
              setError("");
              setSuccessMessage("");
              setRegistrationOtpRequired(false);
              if (isPasswordReset) {
                setIsResetMode(false);
                setResetStep("identifier");
                setResetToken("");
                setForm((prev) => ({
                  ...prev,
                  resetIdentifier: "",
                  resetOtp: "",
                  resetPassword: "",
                  resetConfirmPassword: "",
                }));
                return;
              }
              onModeChange?.(isRegister ? "login" : "register");
            }}
          >
            {isPasswordReset
              ? t("backToLogin")
              : isRegister
                ? form.role === "provider"
                  ? t("alreadyProvider")
                  : t("alreadyAccount")
                : form.role === "provider"
                  ? t("newProviderRegister")
                  : t("newUserRegister")}
          </button>
        </div>
        <div className="auth-security-footer">
          <Lock size={13} /> Your data is encrypted and secure.
        </div>
      </div>
    </div>
  );
}

function BadgeIcon({ role }) {
  return role === "provider" ? (
    <BriefcaseBusiness size={20} />
  ) : (
    <User size={20} />
  );
}

function OtpChannelPicker({ value, onChange }) {
  return (
    <label>
      Send OTP by
      <div className="otp-channel-options">
        <label
          className={`otp-channel-option ${value === "email" ? "active" : ""}`}
        >
          <input
            type="radio"
            name="otpChannel"
            value="email"
            checked={value === "email"}
            onChange={onChange}
          />
          <Mail size={18} />
          Email
        </label>
      </div>
    </label>
  );
}
