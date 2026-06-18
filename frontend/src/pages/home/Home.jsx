import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Camera,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  CreditCard,
  Heart,
  Headset,
  House,
  IndianRupee,
  Languages,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trash2,
  UploadCloud,
  UserRoundCheck,
  Volume2,
  VolumeX,
  Wallet,
  X,
  XCircle,
  Phone,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  acceptEstimate,
  createRazorpayOrder,
  getAdminLedger,
  getProviderEarnings,
  loadRazorpayScript,
  rejectEstimate,
  sendProviderPayout,
  submitProviderEstimate,
  verifyRazorpayPayment,
  withdrawProviderEarnings,
} from "../../api/payments";
import AuthModal from "../../components/authModal/AuthModal";
import EstimateStatusBadge from "../../components/payments/EstimateStatusBadge";
import PaymentStatusBadge from "../../components/payments/PaymentStatusBadge";
import PaymentSummaryCard from "../../components/payments/PaymentSummaryCard";
import ProviderEstimateModal from "../../components/payments/ProviderEstimateModal";
import RejectEstimateModal from "../../components/payments/RejectEstimateModal";
import ServiceModal from "../../components/serviceCard/ServiceModal";
import "../../components/tracking/Tracking.css";
import ProviderRoutePanel from "../../components/tracking/ProviderRoutePanel";
import {
  formatTrackingEventTime,
  getActiveStepIndex,
  getLatestTrackingEvent,
  normalizeTrackingStatus,
  trackingSteps,
} from "../../components/tracking/trackingShared";
import useProviderAlerts from "../../components/tracking/useProviderAlerts";
import { services } from "../../data/Services";
import SEO from "../../seo/SEO";
import {
  buildBreadcrumbSchema,
  faqItems,
  faqSchema,
  localBusinessSchema,
  organizationSchema,
  reviewSchema,
  serviceSchema,
  targetKeywords,
} from "../../seo/seoData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_API_URLS = [...new Set([API_URL, "http://localhost:5000/api", "http://localhost:5001/api"])];
const SERVICEHUB_ICON = "/servicehub-icon.png";
const HERO_BACKGROUND_IMAGE = "/hero-background.jpg";

const supportedLanguages = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिंदी", short: "HI" },
  { code: "mr", label: "मराठी", short: "MR" },
];

const translations = {
  en: {
    verifiedLocalServices: "Verified local services",
    home: "Home",
    services: "Services",
    providers: "Providers",
    dashboard: "Dashboard",
    clientDashboard: "Client Dashboard",
    providerDashboard: "Provider Dashboard",
    admin: "Admin",
    contactUs: "Contact Us",
    login: "Login",
    logout: "Logout",
    provider: "Provider",
    becomeProvider: "Become a Provider",
    signedIn: "Signed in",
    light: "Light",
    dark: "Dark",
    language: "Language",
    browseServices: "Browse services",
    providerDashboardButton: "Provider dashboard",
    bookAnotherService: "Book another service",
    workspace: "ServiceHub workspace",
    clientBookingDashboard: "Client Booking Dashboard",
    clientDashboardTitle: "Client Dashboard",
    clientDashboardSubtitle: "Track bookings, saved providers, service progress, and reviews.",
    providerClientSubtitle: "Book services for your own need from the same provider account.",
  },
  hi: {
    verifiedLocalServices: "सत्यापित स्थानीय सेवाएं",
    home: "होम",
    services: "सेवाएं",
    providers: "प्रदाता",
    dashboard: "डैशबोर्ड",
    clientDashboard: "क्लाइंट डैशबोर्ड",
    providerDashboard: "प्रदाता डैशबोर्ड",
    admin: "एडमिन",
    contactUs: "संपर्क करें",
    login: "लॉगिन",
    logout: "लॉगआउट",
    provider: "प्रदाता",
    becomeProvider: "प्रदाता बनें",
    signedIn: "साइन इन",
    light: "लाइट",
    dark: "डार्क",
    language: "भाषा",
    browseServices: "सेवाएं देखें",
    providerDashboardButton: "प्रदाता डैशबोर्ड",
    bookAnotherService: "दूसरी सेवा बुक करें",
    workspace: "ServiceHub कार्यक्षेत्र",
    clientBookingDashboard: "क्लाइंट बुकिंग डैशबोर्ड",
    clientDashboardTitle: "क्लाइंट डैशबोर्ड",
    clientDashboardSubtitle: "बुकिंग, सेव किए गए प्रदाता, सेवा प्रगति और समीक्षा ट्रैक करें.",
    providerClientSubtitle: "इसी प्रदाता खाते से अपनी जरूरत के लिए सेवाएं बुक करें.",
  },
  mr: {
    verifiedLocalServices: "सत्यापित स्थानिक सेवा",
    home: "होम",
    services: "सेवा",
    providers: "प्रदाता",
    dashboard: "डॅशबोर्ड",
    clientDashboard: "क्लायंट डॅशबोर्ड",
    providerDashboard: "प्रदाता डॅशबोर्ड",
    admin: "अॅडमिन",
    contactUs: "संपर्क करा",
    login: "लॉगिन",
    logout: "लॉगआउट",
    provider: "प्रदाता",
    becomeProvider: "प्रदाता बना",
    signedIn: "साइन इन",
    light: "लाइट",
    dark: "डार्क",
    language: "भाषा",
    browseServices: "सेवा पहा",
    providerDashboardButton: "प्रदाता डॅशबोर्ड",
    bookAnotherService: "दुसरी सेवा बुक करा",
    workspace: "ServiceHub कार्यक्षेत्र",
    clientBookingDashboard: "क्लायंट बुकिंग डॅशबोर्ड",
    clientDashboardTitle: "क्लायंट डॅशबोर्ड",
    clientDashboardSubtitle: "बुकिंग, सेव्ह केलेले प्रदाता, सेवा प्रगती आणि पुनरावलोकने ट्रॅक करा.",
    providerClientSubtitle: "त्याच प्रदाता खात्यातून स्वतःसाठी सेवा बुक करा.",
  },
};

const getSavedLanguage = () => {
  const savedLanguage = localStorage.getItem("servicehub_language") || "en";
  return supportedLanguages.some((language) => language.code === savedLanguage) ? savedLanguage : "en";
};

const pageTextTranslations = {
  hi: {
    "Home services, booked clearly": "होम सेवाएं, साफ तरीके से बुक करें",
    "Compare providers, check pricing, choose a time, and track the request from one clean ServiceHub workspace.": "प्रदाताओं की तुलना करें, कीमत देखें, समय चुनें और एक ही ServiceHub कार्यक्षेत्र से अनुरोध ट्रैक करें.",
    "Search services, providers, or city": "सेवा, प्रदाता या शहर खोजें",
    "Search": "खोजें",
    "Book Now": "अभी बुक करें",
    "View Details": "विवरण देखें",
    "Providers": "प्रदाता",
    "Providers category": "प्रदाता श्रेणी",
    "See more providers": "और प्रदाता देखें",
    "Show less providers": "कम प्रदाता दिखाएं",
    "Popular services": "लोकप्रिय सेवाएं",
    "Booking history": "बुकिंग इतिहास",
    "Pending bookings": "लंबित बुकिंग",
    "Active bookings": "सक्रिय बुकिंग",
    "Completed services": "पूर्ण सेवाएं",
    "Cancelled services": "रद्द सेवाएं",
    "Completed Services": "पूर्ण सेवाएं",
    "Cancelled Services": "रद्द सेवाएं",
    "Completed service details": "पूर्ण सेवा विवरण",
    "Cancelled service details": "रद्द सेवा विवरण",
    "My bookings": "मेरी बुकिंग",
    "Saved providers": "सेव प्रदाता",
    "Pending reviews": "लंबित समीक्षा",
    "Pending": "लंबित",
    "Active": "सक्रिय",
    "Completed": "पूर्ण",
    "Cancelled": "रद्द",
    "Browse services": "सेवाएं देखें",
    "Provider dashboard": "प्रदाता डैशबोर्ड",
    "Book another service": "दूसरी सेवा बुक करें",
    "Provider": "प्रदाता",
    "Date": "तारीख",
    "Service": "सेवा",
    "Money": "राशि",
    "Address": "पता",
    "Problem": "समस्या",
    "Payment & Estimate": "भुगतान और अनुमान",
    "Provider Starting Price": "प्रदाता शुरुआती कीमत",
    "Final Estimate": "अंतिम अनुमान",
    "Payment Status": "भुगतान स्थिति",
    "Registered on platform": "प्लेटफॉर्म पर रजिस्टर्ड",
    "Rate this service": "इस सेवा को रेट करें",
    "Your review": "आपकी समीक्षा",
    "Submit review": "समीक्षा जमा करें",
    "Update review": "समीक्षा अपडेट करें",
    "Write a short review for this provider...": "इस प्रदाता के लिए छोटी समीक्षा लिखें...",
    "Client Dashboard": "क्लाइंट डैशबोर्ड",
    "Provider Dashboard": "प्रदाता डैशबोर्ड",
    "Admin Panel": "एडमिन पैनल",
    "Refresh dashboard": "डैशबोर्ड रीफ्रेश करें",
    "New client requests": "नए क्लाइंट अनुरोध",
    "Confirmed service jobs": "पुष्ट सेवा कार्य",
    "Client history": "क्लाइंट इतिहास",
    "Open all history": "पूरा इतिहास खोलें",
    "Book as client": "क्लाइंट के रूप में बुक करें",
    "Logout": "लॉगआउट",
    "Login": "लॉगिन",
    "Become a Provider": "प्रदाता बनें",
    "Contact Us": "संपर्क करें",
    "FAQ": "सामान्य प्रश्न",
    "Services": "सेवाएं",
    "Support": "सहायता",
    "Company": "कंपनी",
    "About": "हमारे बारे में",
    "Careers": "करियर",
  },
  mr: {
    "Home services, booked clearly": "होम सेवा, सोप्या पद्धतीने बुक करा",
    "Compare providers, check pricing, choose a time, and track the request from one clean ServiceHub workspace.": "प्रदाते तुलना करा, किंमत तपासा, वेळ निवडा आणि एकाच ServiceHub कार्यक्षेत्रातून विनंती ट्रॅक करा.",
    "Search services, providers, or city": "सेवा, प्रदाता किंवा शहर शोधा",
    "Search": "शोधा",
    "Book Now": "आता बुक करा",
    "View Details": "तपशील पहा",
    "Providers": "प्रदाता",
    "Providers category": "प्रदाता श्रेणी",
    "See more providers": "अधिक प्रदाते पहा",
    "Show less providers": "कमी प्रदाते दाखवा",
    "Popular services": "लोकप्रिय सेवा",
    "Booking history": "बुकिंग इतिहास",
    "Pending bookings": "प्रलंबित बुकिंग",
    "Active bookings": "सक्रिय बुकिंग",
    "Completed services": "पूर्ण सेवा",
    "Cancelled services": "रद्द सेवा",
    "Completed Services": "पूर्ण सेवा",
    "Cancelled Services": "रद्द सेवा",
    "Completed service details": "पूर्ण सेवा तपशील",
    "Cancelled service details": "रद्द सेवा तपशील",
    "My bookings": "माझ्या बुकिंग",
    "Saved providers": "सेव्ह प्रदाते",
    "Pending reviews": "प्रलंबित पुनरावलोकने",
    "Pending": "प्रलंबित",
    "Active": "सक्रिय",
    "Completed": "पूर्ण",
    "Cancelled": "रद्द",
    "Browse services": "सेवा पहा",
    "Provider dashboard": "प्रदाता डॅशबोर्ड",
    "Book another service": "दुसरी सेवा बुक करा",
    "Provider": "प्रदाता",
    "Date": "तारीख",
    "Service": "सेवा",
    "Money": "रक्कम",
    "Address": "पत्ता",
    "Problem": "समस्या",
    "Payment & Estimate": "पेमेंट आणि अंदाज",
    "Provider Starting Price": "प्रदाता सुरू किंमत",
    "Final Estimate": "अंतिम अंदाज",
    "Payment Status": "पेमेंट स्थिती",
    "Registered on platform": "प्लॅटफॉर्मवर नोंदणीकृत",
    "Rate this service": "या सेवेला रेट करा",
    "Your review": "तुमचे पुनरावलोकन",
    "Submit review": "पुनरावलोकन सबमिट करा",
    "Update review": "पुनरावलोकन अपडेट करा",
    "Write a short review for this provider...": "या प्रदात्यासाठी छोटा अभिप्राय लिहा...",
    "Client Dashboard": "क्लायंट डॅशबोर्ड",
    "Provider Dashboard": "प्रदाता डॅशबोर्ड",
    "Admin Panel": "अॅडमिन पॅनेल",
    "Refresh dashboard": "डॅशबोर्ड रीफ्रेश करा",
    "New client requests": "नवीन क्लायंट विनंत्या",
    "Confirmed service jobs": "पुष्टी झालेली सेवा कामे",
    "Client history": "क्लायंट इतिहास",
    "Open all history": "पूर्ण इतिहास उघडा",
    "Book as client": "क्लायंट म्हणून बुक करा",
    "Logout": "लॉगआउट",
    "Login": "लॉगिन",
    "Become a Provider": "प्रदाता बना",
    "Contact Us": "संपर्क करा",
    "FAQ": "प्रश्नोत्तरे",
    "Services": "सेवा",
    "Support": "सहाय्य",
    "Company": "कंपनी",
    "About": "आमच्याबद्दल",
    "Careers": "करिअर",
  },
};

const originalTextNodes = new WeakMap();

const reversePageTextTranslations = Object.fromEntries(
  Object.entries(pageTextTranslations).map(([language, dictionary]) => [
    language,
    Object.fromEntries(Object.entries(dictionary).map(([source, target]) => [target, source])),
  ])
);

const restoreEnglishText = (text = "") => {
  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  let restored = text.trim();

  Object.values(reversePageTextTranslations).forEach((dictionary) => {
    restored = Object.entries(dictionary)
      .sort(([left], [right]) => right.length - left.length)
      .reduce((current, [translated, source]) => current.replaceAll(translated, source), restored);
  });

  const mixedTextFixes = {
    "होम": "Home",
    "सेवा": "services",
    "सोप्या पद्धतीने बुक करा": "booked clearly",
    "होम Service, सोप्या पद्धतीने बुक करा": "Home services, booked clearly",
    "होम services, सोप्या पद्धतीने बुक करा": "Home services, booked clearly",
    "होम सेवा, सोप्या पद्धतीने बुक करा": "Home services, booked clearly",
    "Home Service, booked clearly": "Home services, booked clearly",
  };

  restored = Object.entries(mixedTextFixes)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((current, [translated, source]) => current.replaceAll(translated, source), restored);

  return `${leading}${restored}${trailing}`;
};

const translatePageText = (text, language) => {
  if (language === "en") return text;
  const dictionary = pageTextTranslations[language] || {};
  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  const trimmed = text.trim();

  if (!trimmed || /^[\d\s.,:|₹$()-]+$/.test(trimmed) || /@/.test(trimmed)) return text;
  if (dictionary[trimmed]) return `${leading}${dictionary[trimmed]}${trailing}`;

  const translated = Object.entries(dictionary)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((current, [source, target]) => current.replaceAll(source, target), trimmed);

  return `${leading}${translated}${trailing}`;
};

const applyPageLanguage = (language) => {
  if (typeof document === "undefined") return;
  const ignoredTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || ignoredTags.has(parent.tagName) || parent.closest("[data-no-translate]")) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, restoreEnglishText(node.nodeValue));
    const original = restoreEnglishText(originalTextNodes.get(node));
    node.nodeValue = language === "en" ? original : translatePageText(original, language);
  });
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const categoryImages = {
  Plumber: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=520&q=80",
  Electrician: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=520&q=80",
  Carpenter: "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=520&q=80",
  Painter: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=520&q=80",
  Cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=520&q=80",
  "AC Repair": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Wall_mount_air_conditioner.jpg/960px-Wall_mount_air_conditioner.jpg",
  "TV Repair": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=520&q=80",
  "Refrigerator Repair": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=520&q=80",
  "Washing Machine Repair": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=520&q=80",
};

const heroStages = [
  { title: "Electrician", note: "Wiring and urgent safety checks", image: categoryImages.Electrician },
  { title: "Plumber", note: "Leak repairs and bathroom fittings", image: categoryImages.Plumber },
  { title: "AC Repair", note: "Cooling service and installation", image: categoryImages["AC Repair"] },
  { title: "Cleaning", note: "Deep home and sofa cleaning", image: categoryImages.Cleaning },
  { title: "Painter", note: "Interior and exterior painting", image: categoryImages.Painter },
  { title: "Carpenter", note: "Furniture and door repairs", image: categoryImages.Carpenter },
  { title: "TV Repair", note: "Display and wall mounting help", image: categoryImages["TV Repair"] },
  { title: "Appliance Repair", note: "Fridge and washing machine support", image: categoryImages["Refrigerator Repair"] },
];

const getTodayInputDate = () => new Date().toLocaleDateString("en-CA");

const serviceSearchCardMap = {
  "Refrigerator Repair": "Appliance Repair",
  "Washing Machine Repair": "Appliance Repair",
};

const getPopularServiceTitle = (category) => serviceSearchCardMap[category] || category;

const getServiceSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return { message: (await response.text()) || fallbackMessage };
};

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem("servicehub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem("servicehub_user");
    localStorage.removeItem("servicehub_token");
    return null;
  }
};

const contactReplyStorageKey = "servicehub_contact_replies";

const getSavedContactReplies = () => {
  try {
    return JSON.parse(localStorage.getItem(contactReplyStorageKey) || "{}");
  } catch {
    localStorage.removeItem(contactReplyStorageKey);
    return {};
  }
};

const saveContactReply = (messageId, reply) => {
  const replies = getSavedContactReplies();
  replies[messageId] = {
    adminReply: reply,
    repliedAt: new Date().toISOString(),
    status: "replied",
  };
  localStorage.setItem(contactReplyStorageKey, JSON.stringify(replies));
};

const mergeContactMessagesWithReplies = (messages = []) => {
  const replies = getSavedContactReplies();
  return messages.map((message) => replies[message._id] ? { ...message, ...replies[message._id] } : message);
};

const getWhatsAppNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const sortContactMessages = (messages = []) =>
  [...messages].sort((a, b) => {
    const aReplied = a.status === "replied" || a.adminReply;
    const bReplied = b.status === "replied" || b.adminReply;

    if (aReplied !== bReplied) return aReplied ? 1 : -1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

const normalizeProvider = (provider) => ({
  id: provider._id || provider.providerCode || `${provider.name}-${provider.category}`,
  providerId: provider._id || "",
  name: provider.name,
  category: provider.category,
  location: provider.location,
  rating: provider.rating || 0,
  reviews: provider.reviews || 0,
  responseTime: provider.responseTime || "~1 hr",
  price: provider.price || "Contact for price",
  phone: provider.phone || "",
  email: provider.email || "",
  description: provider.description || `${provider.name} provides ${provider.category} services in ${provider.location}.`,
  about: provider.about || provider.description,
  features: provider.features?.length ? provider.features : [provider.category],
  image: provider.profileImage || categoryImages[provider.category] || categoryImages.Cleaning,
  isActive: provider.isActive !== undefined ? provider.isActive : true,
  approvalStatus: provider.approvalStatus || "approved",
});

const normalizeProviderDashboard = (data) => ({
  provider: data.provider || null,
  bookings: Array.isArray(data.bookings) ? data.bookings : [],
  availableRequests: Array.isArray(data.availableRequests) ? data.availableRequests : [],
  dashboardLocked: Boolean(data.dashboardLocked),
  message: data.message || "",
});

const formatBookingDate = (value) => {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

const formatBookingTime = (value) => {
  if (!value || !value.includes(":")) return value || "Time not set";
  const [hourValue, minuteValue] = value.split(":").map(Number);
  return `${hourValue % 12 || 12}:${String(minuteValue || 0).padStart(2, "0")} ${hourValue >= 12 ? "PM" : "AM"}`;
};

const clientCancelWindowMs = 10 * 60 * 1000;

const getClientCancelState = (booking, now = Date.now()) => {
  if (["completed", "cancelled"].includes(booking.status)) {
    return { canCancel: false, label: "Cancel unavailable" };
  }

  if (!booking.acceptedAt) {
    return { canCancel: true, label: "Cancel booking" };
  }

  const acceptedAt = new Date(booking.acceptedAt).getTime();
  const remainingMs = clientCancelWindowMs - (now - acceptedAt);

  if (remainingMs <= 0) {
    return { canCancel: false, label: "Cancel time expired" };
  }

  const remainingMinutes = Math.ceil(remainingMs / 60000);
  return { canCancel: true, label: `Cancel booking (${remainingMinutes}m left)` };
};

const formatRoleLabel = (role) => {
  if (role === "admin") return "Admin";
  if (role === "provider") return "Provider";
  return "Client";
};

const formatPrice = (value) =>
  Number.isFinite(Number(value)) ? `Rs. ${Number(value).toLocaleString("en-IN")}` : "Price not set";

const formatMoney = (value) =>
  Number.isFinite(Number(value)) ? `Rs. ${Number(value).toLocaleString("en-IN")}` : "Rs. 0";

const formatEstimateTimestamp = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatServiceChargeLabel = (price = "") => {
  const amount = String(price).replace(/^from\s+/i, "").trim();
  return amount ? `Service charge ${amount}` : "Service charge not set";
};

const parseMoneyValue = (value = "") => {
  const amount = String(value).replace(/,/g, "").match(/\d+(\.\d+)?/)?.[0];
  return Number.isFinite(Number(amount)) ? Number(amount) : 0;
};

const INITIAL_DASHBOARD_TIME = Date.now();
const INITIAL_CHAT_TIME_LABEL = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date());

const parseDurationValue = (value = "1 hour") => {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("half")) return { amount: "4", unit: "hours" };
  if (normalized.includes("full")) return { amount: "8", unit: "hours" };
  const amount = normalized.match(/\d+/)?.[0] || "1";
  const unit = normalized.includes("min") ? "min" : normalized.includes("day") ? "days" : "hours";
  return { amount, unit };
};

const buildDurationValue = (amount, unit) => {
  const cleanAmount = String(amount || "").replace(/\D/g, "").slice(0, 2) || "1";
  if (unit === "min") return `${cleanAmount} min`;
  if (unit === "days") return `${cleanAmount} ${cleanAmount === "1" ? "day" : "days"}`;
  return `${cleanAmount} ${cleanAmount === "1" ? "hour" : "hours"}`;
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const blankProviderAccountForm = {
  name: "",
  category: "",
  location: "",
  phone: "",
  email: "",
  price: "",
  responseTime: "",
  description: "",
  about: "",
  features: "",
  bankDetails: {
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  },
};

const providerToAccountForm = (provider = {}) => ({
  name: provider.name || "",
  category: provider.category || "",
  location: provider.location || "",
  phone: provider.phone || "",
  email: provider.email || "",
  price: provider.price || "",
  responseTime: provider.responseTime || "",
  description: provider.description || "",
  about: provider.about || "",
  features: Array.isArray(provider.features) ? provider.features.join(", ") : provider.features || "",
  bankDetails: {
    accountHolder: provider.bankDetails?.accountHolder || "",
    bankName: provider.bankDetails?.bankName || "",
    accountNumber: provider.bankDetails?.accountNumber || "",
    ifscCode: provider.bankDetails?.ifscCode || "",
  },
});

export default function Home() {
  const [theme, setTheme] = useState(() => localStorage.getItem("servicehub_theme") || "light");
  const [language, setLanguage] = useState(getSavedLanguage);
  const [user, setUser] = useState(getSavedUser);
  const [authMode, setAuthMode] = useState(null);
  const [authRole, setAuthRole] = useState("user");
  const [authLocked, setAuthLocked] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [catalogProviders, setCatalogProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providerData, setProviderData] = useState(null);
  const [providerEarnings, setProviderEarnings] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [adminPaymentData, setAdminPaymentData] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [payingBookingId, setPayingBookingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeView, setActiveView] = useState("home");
  const [activeSection, setActiveSection] = useState("top");
  const [navScrolled, setNavScrolled] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [profileImageOpen, setProfileImageOpen] = useState(false);
  const [providerAccountOpen, setProviderAccountOpen] = useState(false);
  const [providerAccountEditOpen, setProviderAccountEditOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [providerVisibleCount, setProviderVisibleCount] = useState(4);
  const [providerClientMode, setProviderClientMode] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState({});
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    service: "",
    address: "",
    problemDescription: "",
    date: "",
    time: "10:00",
    duration: "1 hour",
    providerId: "",
  });
  const [providerAccountForm, setProviderAccountForm] = useState(blankProviderAccountForm);
  const accountMenuRef = useRef(null);
  const loginMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  const token = localStorage.getItem("servicehub_token");
  const isDark = theme === "dark";
  const t = useCallback((key) => translations[language]?.[key] || translations.en[key] || key, [language]);

  const closeSessionUi = useCallback(({ closeAuth = true } = {}) => {
    setAccountMenuOpen(false);
    setLoginMenuOpen(false);
    setMoreMenuOpen(false);
    setMobileNavOpen(false);
    if (closeAuth) {
      setAuthMode(null);
      setAuthLocked(false);
    }
    setBookingOpen(false);
    setProfileImageOpen(false);
    setProviderAccountOpen(false);
    setProviderAccountEditOpen(false);
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => setStatusMessage(""), 4200);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const syncAuthSession = () => {
      const savedToken = localStorage.getItem("servicehub_token");
      const savedUser = getSavedUser();

      if (savedToken && savedUser) {
        setUser((current) => (current?._id === savedUser._id && current?.role === savedUser.role ? current : savedUser));
        return;
      }

      if (savedToken && !savedUser) return;

      localStorage.removeItem("servicehub_token");
      localStorage.removeItem("servicehub_user");
      setUser(null);
      setBookings([]);
      setProviderData(null);
      setProviderEarnings(null);
      setAdminData(null);
      setAdminPaymentData(null);
      setProviderClientMode(false);
      closeSessionUi({ closeAuth: false });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) syncAuthSession();
    };

    syncAuthSession();
    window.addEventListener("storage", syncAuthSession);
    window.addEventListener("focus", syncAuthSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", syncAuthSession);
      window.removeEventListener("focus", syncAuthSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [closeSessionUi]);

  useEffect(() => {
    const closeMoreMenu = (event) => {
      if (moreMenuRef.current?.contains(event.target) || loginMenuRef.current?.contains(event.target) || accountMenuRef.current?.contains(event.target)) return;
      setAccountMenuOpen(false);
      setLoginMenuOpen(false);
      setMoreMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMoreMenu);
    return () => document.removeEventListener("mousedown", closeMoreMenu);
  }, []);

  const openClientAuth = (mode = "login", locked = mode !== "login") => {
    setAuthRole("user");
    setAuthLocked(locked);
    setAuthMode(mode);
  };

  const openProviderAuth = (mode = "register") => {
    if (user?.role === "user") {
      setAuthMode(null);
      setMobileNavOpen(false);
      setStatusMessage("Please logout from your client account before becoming a provider.");
      return;
    }

    setAuthRole("provider");
    setAuthLocked(true);
    setAuthMode(mode);
  };

  useEffect(() => {
    localStorage.setItem("servicehub_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("servicehub_language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const firstTimer = window.setTimeout(() => applyPageLanguage(language), 0);
    const secondTimer = window.setTimeout(() => applyPageLanguage(language), 80);
    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [language, activeView, mobileNavOpen, authMode, bookings, providerData, adminData]);

  useEffect(() => {
    const timer = window.setTimeout(() => document.querySelector("#top")?.scrollIntoView({ block: "start" }), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refreshCatalogProviders = useCallback(async () => {
    fetch(`${API_URL}/catalog`)
      .then((response) => (response.ok ? response.json() : { providers: [] }))
      .then((data) => setCatalogProviders((data.providers || []).map(normalizeProvider)))
      .catch(() => setCatalogProviders([]));
  }, []);

  useEffect(() => {
    refreshCatalogProviders();
  }, [refreshCatalogProviders]);

  const refreshClientBookings = useCallback(async () => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;

    try {
      const response = await fetch(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${currentToken}` } });
      const data = response.ok ? await response.json() : { bookings: [] };
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    if (!user || !token || !["user", "provider"].includes(user.role)) return undefined;

    let stopped = false;
    const loadClientBookings = async () => {
      try {
        const response = await fetch(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } });
        const data = response.ok ? await response.json() : { bookings: [] };
        if (!stopped) setBookings(data.bookings || []);
      } catch {
        if (!stopped) setBookings([]);
      }
    };

    loadClientBookings();
    const intervalId = window.setInterval(loadClientBookings, activeView === "client" ? 5000 : 15000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [activeView, user, token]);

  const marketplaceServices = useMemo(() => {
    const fallback = services.map((service) => ({
      ...service,
      providerId: "",
      image: categoryImages[service.category] || categoryImages.Cleaning,
    }));
    const map = new Map(fallback.map((service) => [`${service.name}-${service.category}`, service]));
    catalogProviders
      .filter((provider) => provider.isActive && provider.approvalStatus === "approved")
      .forEach((provider) => map.set(`${provider.name}-${provider.category}`, provider));
    return [...map.values()];
  }, [catalogProviders]);

  const categories = useMemo(() => ["All", ...new Set(marketplaceServices.map((service) => service.category))], [marketplaceServices]);

  const filteredServices = marketplaceServices.filter((service) => {
    const haystack = [service.name, service.category, service.location, service.description, service.price].join(" ").toLowerCase();
    return (selectedCategory === "All" || service.category === selectedCategory) && haystack.includes(searchTerm.toLowerCase());
  });

  const providerProfile = providerData?.provider;
  const providerRequests = providerData?.availableRequests || [];
  const providerBookings = providerData?.bookings || [];
  const providerDashboardNavLabel = activeView === "client" && user?.role === "provider" ? t("clientDashboard") : t("providerDashboard");
  const mainNavItems = [
    { id: "top", label: t("home"), icon: House },
    { id: "services", label: t("services"), icon: BriefcaseBusiness },
    { id: "providers", label: t("providers"), icon: MapPin },
    { id: "contact", label: t("contactUs"), icon: MessageCircle },
  ];
  const isNavActive = (id) => activeView === "home" ? activeSection === id : id === "top" && user?.role === "provider" && activeView === "provider";

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 12);
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      setNavProgress(scrollableHeight > 0 ? Math.min((window.scrollY / scrollableHeight) * 100, 100) : 0);
      const sections = ["top", "services", "providers", "contact"];
      const current = sections.findLast((id) => {
        const element = document.getElementById(id);
        return element && element.getBoundingClientRect().top <= 140;
      });
      if (current) setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigateHome = (hash = "") => {
    setActiveView("home");
    setMobileNavOpen(false);
    window.setTimeout(() => {
      if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleHomeNav = () => {
    if (user?.role === "provider" && !providerClientMode) {
      loadProviderDashboard();
      return;
    }

    navigateHome("#top");
  };

  const goMainHome = () => {
    navigateHome("#top");
  };

  const loadProviderDashboard = async () => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;
    try {
      setProviderClientMode(false);
      const response = await fetch(`${API_URL}/providers/dashboard`, { headers: { Authorization: `Bearer ${currentToken}` } });
      const data = await parseApiResponse(response, "Provider dashboard could not be loaded.");
      if (!response.ok) throw new Error(data.message || "Provider dashboard could not be loaded.");
      const nextProviderDashboard = normalizeProviderDashboard(data);
      setProviderData(nextProviderDashboard);
      if (!nextProviderDashboard.dashboardLocked && nextProviderDashboard.provider?.approvalStatus === "approved") {
        getProviderEarnings()
          .then(setProviderEarnings)
          .catch(() => setProviderEarnings(null));
      } else {
        setProviderEarnings(null);
      }
      setActiveView("provider");
    } catch (error) {
      try {
        const profileResponse = await fetch(`${API_URL}/providers/profile`, { headers: { Authorization: `Bearer ${currentToken}` } });
        const profileData = await parseApiResponse(profileResponse, "Provider profile could not be loaded.");
        if (profileResponse.ok && profileData.provider?.approvalStatus !== "approved") {
          setProviderData({
            provider: profileData.provider,
            bookings: [],
            availableRequests: [],
            dashboardLocked: true,
            message: profileData.provider.approvalStatus === "rejected"
              ? "Provider profile was not approved by admin."
              : "Provider profile is waiting for admin approval.",
          });
          setProviderEarnings(null);
        }
      } catch {
        setProviderData((current) => ({
          ...normalizeProviderDashboard(current || {}),
          dashboardLocked: true,
          message: "Provider profile is waiting for admin approval.",
        }));
        setProviderEarnings(null);
      }
      setStatusMessage(error.message);
      setActiveView("provider");
    }
  };

  const openProviderClientDashboard = () => {
    setProviderClientMode(true);
    setActiveView("client");
    setMobileNavOpen(false);
  };

  const browseServicesAsClient = () => {
    if (user?.role === "provider") setProviderClientMode(true);
    navigateHome("#services");
  };

  useEffect(() => {
    const isWaitingForApproval =
      activeView === "provider" &&
      user?.role === "provider" &&
      providerProfile?.approvalStatus &&
      providerProfile.approvalStatus !== "approved";

    if (!isWaitingForApproval) return undefined;

    const intervalId = window.setInterval(loadProviderDashboard, 10000);
    return () => window.clearInterval(intervalId);
  }, [activeView, providerProfile?.approvalStatus, user?.role, token]);

  const openProviderAccount = async () => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;
    try {
      const response = await fetch(`${API_URL}/providers/profile`, { headers: { Authorization: `Bearer ${currentToken}` } });
      const data = await parseApiResponse(response, "Provider profile could not be loaded.");
      if (!response.ok) throw new Error(data.message || "Provider profile could not be loaded.");
      setProviderAccountForm(providerToAccountForm(data.provider));
      setProviderData((current) => ({ ...normalizeProviderDashboard(current || {}), provider: data.provider }));
      setProviderAccountOpen(true);
      setProviderAccountEditOpen(false);
      setMobileNavOpen(false);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const submitProviderAccount = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/providers/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(providerAccountForm),
      });
      const data = await parseApiResponse(response, "Provider profile could not be updated.");
      if (!response.ok) throw new Error(data.message || "Provider profile could not be updated.");

      setProviderData((current) => ({ ...normalizeProviderDashboard(current || {}), provider: data.provider }));
      setCatalogProviders((current) => current.map((provider) => (provider.providerId === data.provider._id || provider.id === data.provider._id ? normalizeProvider(data.provider) : provider)));
      const updatedUser = { ...user, name: data.provider.name, email: data.provider.email, phone: data.provider.phone };
      setUser(updatedUser);
      localStorage.setItem("servicehub_user", JSON.stringify(updatedUser));
      setProviderAccountForm(providerToAccountForm(data.provider));
      setProviderAccountOpen(false);
      setProviderAccountEditOpen(false);
      setActiveView("home");
      window.setTimeout(() => document.querySelector("#top")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      setStatusMessage("Provider profile updated successfully.");
      refreshCatalogProviders();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const loadAdminDashboard = async () => {
    try {
      const currentToken = localStorage.getItem("servicehub_token");
      if (!currentToken) throw new Error("Please log in as admin to open the admin panel.");
      const authHeaders = { Authorization: `Bearer ${currentToken}` };
      const [response, paymentData] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, { headers: authHeaders }),
        getAdminLedger().catch(() => null),
      ]);
      const data = await parseApiResponse(response, "Admin dashboard could not be loaded.");
      if (!response.ok) throw new Error(data.message || "Admin dashboard could not be loaded.");

      setAdminData({
        ...data,
        contactMessages: mergeContactMessagesWithReplies(data.contactMessages || []),
      });
      setAdminPaymentData(paymentData);
      setActiveView("admin");
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const refreshAdminContactMessages = async ({ silent = false } = {}) => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;

    try {
      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await parseApiResponse(response, "Admin dashboard could not be loaded.");
      if (!response.ok) throw new Error(data.message || "Admin dashboard could not be loaded.");

      setAdminData((current) => {
        const nextData = {
          ...data,
          contactMessages: mergeContactMessagesWithReplies(data.contactMessages || []),
        };
        return current ? { ...current, ...nextData } : nextData;
      });
      if (!silent) setStatusMessage("Client messages refreshed.");
    } catch (error) {
      if (!silent) setStatusMessage(error.message);
    }
  };

  useEffect(() => {
    if (activeView !== "admin") return undefined;

    const initialRefresh = window.setTimeout(() => refreshAdminContactMessages({ silent: true }), 0);
    const timer = window.setInterval(() => refreshAdminContactMessages({ silent: true }), 10000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [activeView]);

  const refreshAfterAction = ({ client = false, provider = false, admin = false } = {}) => {
    if (client) refreshClientBookings();
    if (provider) loadProviderDashboard();
    if (admin) loadAdminDashboard();

    window.setTimeout(() => {
      if (client) refreshClientBookings();
      if (provider) loadProviderDashboard();
      if (admin) loadAdminDashboard();
    }, 900);
  };

  const handleLogout = () => {
    const roleLabel = formatRoleLabel(user?.role);
    localStorage.removeItem("servicehub_token");
    localStorage.removeItem("servicehub_user");
    closeSessionUi();
    setUser(null);
    setBookings([]);
    setProviderData(null);
    setProviderEarnings(null);
    setAdminData(null);
    setAdminPaymentData(null);
    setProviderClientMode(false);
    setActiveView("home");
    setStatusMessage(`${roleLabel} logged out successfully.`);
  };

  const speakLizaIntro = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("I am Liza, your ServiceHub chatbot.");
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleChat = () => {
    setChatOpen((current) => {
      if (current) {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        return false;
      }

      speakLizaIntro();
      return true;
    });
  };

  const openBooking = (service) => {
    if (user?.role === "admin") {
      setSelectedService(null);
      setBookingOpen(false);
      setStatusMessage("Admin accounts cannot book services. Please use a client account.");
      return;
    }

    const isOwnProviderProfile =
      user?.role === "provider" &&
      service.providerId &&
      providerProfile?._id &&
      String(service.providerId) === String(providerProfile._id);

    if (isOwnProviderProfile) {
      setSelectedService(null);
      setBookingOpen(false);
      setStatusMessage("You cannot book your own provider service. Please choose another provider.");
      return;
    }

    if (user?.role === "provider" && !providerClientMode) {
      setProviderClientMode(true);
    }

    setSelectedService(null);
    setBookingForm((current) => ({
      ...current,
      name: current.name || user?.name || "",
      phone: current.phone || user?.phone || "",
      service: service.category || service.name,
      providerId: service.providerId || "",
    }));
    setBookingOpen(true);
  };

  const updateProfileImage = async (profileImage) => {
    try {
      const currentToken = localStorage.getItem("servicehub_token");
      if (!currentToken) throw new Error("Please log in to update your profile image.");

      const response = await fetch(`${API_URL}/auth/profile-image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ profileImage }),
      });
      const data = await parseApiResponse(response, "Profile image could not be updated.");
      if (!response.ok) throw new Error(data.message || "Profile image could not be updated.");

      const updatedUser = data.user || { ...user, profileImage };
      setUser(updatedUser);
      localStorage.setItem("servicehub_user", JSON.stringify(updatedUser));
      setProviderData((current) => {
        if (!current?.provider) return current;
        return {
          ...current,
          provider: {
            ...current.provider,
            profileImage,
          },
        };
      });
      setProfileImageOpen(false);
      setStatusMessage(data.message || "Profile image updated successfully.");
      refreshCatalogProviders();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const openProfileMenu = () => {
    if (user?.role === "provider") {
      openProviderAccount();
      return;
    }
    setProfileImageOpen(true);
  };

  const updateUserProfile = async (profile) => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) throw new Error("Please log in to update your profile.");

    let response;
    let data;
    let lastNetworkError;
    const profilePaths = ["/auth/profile", "/auth/me"];
    for (const apiUrl of AUTH_API_URLS) {
      for (const path of profilePaths) {
        try {
          response = await fetch(`${apiUrl}${path}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
            body: JSON.stringify(profile),
          });
          data = await parseApiResponse(response, "Profile could not be updated.");
        } catch (error) {
          lastNetworkError = error;
          response = undefined;
          data = undefined;
          continue;
        }
        if (response && (response.ok || (response.status !== 404 && data.message !== "API route not found."))) break;
      }
      if (response && (response.ok || (response.status !== 404 && data.message !== "API route not found."))) break;
    }
    if (!response) {
      throw new Error(lastNetworkError?.message === "Failed to fetch" ? "Backend is not reachable. Start or restart the backend server and try again." : lastNetworkError?.message || "Profile could not be updated.");
    }
    if (!response.ok) throw new Error(data.message || "Profile could not be updated.");

    const updatedUser = data.user || { ...user, ...profile };
    setUser(updatedUser);
    localStorage.setItem("servicehub_user", JSON.stringify(updatedUser));
    setBookingForm((current) => ({
      ...current,
      name: current.name || updatedUser.name || "",
      phone: current.phone || updatedUser.phone || "",
    }));
    setStatusMessage(data.message || "Profile updated successfully.");
    refreshAfterAction({ client: true });
    return updatedUser;
  };

  const openPopularService = (serviceTitle) => {
    const categoryMap = {
      "Appliance Repair": "Refrigerator Repair",
    };
    const category = categoryMap[serviceTitle] || serviceTitle;
    setSelectedCategory(category);
    setProviderVisibleCount(4);
    window.setTimeout(() => document.querySelector("#providers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const searchServices = () => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      setSelectedCategory("All");
      document.querySelector("#services")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const exactCategory = categories.find((category) => category !== "All" && category.toLowerCase() === query);
    const matchedService = marketplaceServices.find((service) => {
      const searchableText = [service.name, service.category, service.location, service.description, service.price]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(query);
    });

    const nextCategory = exactCategory || matchedService?.category;

    if (!nextCategory) {
      setSelectedCategory("All");
      setStatusMessage("No matching service found. Try plumber, electrician, cleaning, or AC repair.");
      document.querySelector("#services")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSelectedCategory(nextCategory);
    setProviderVisibleCount(4);
    window.setTimeout(() => {
      const serviceCard = document.querySelector(`[data-popular-service="${getServiceSlug(getPopularServiceTitle(nextCategory))}"]`);
      (serviceCard || document.querySelector("#services"))?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (user?.role === "provider" && !providerClientMode) {
      setBookingOpen(false);
      setStatusMessage("Open Client Booking Dashboard first to book a service from your provider account.");
      return;
    }

    if (!token) {
      openClientAuth("login");
      setStatusMessage("Please login before booking a service.");
      return;
    }

    if (bookingForm.date && bookingForm.date < getTodayInputDate()) {
      setStatusMessage("Please choose today's date or a future date.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(bookingForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Booking failed.");
      setBookings((current) => [data.booking, ...current]);
      setBookingForm({ name: "", phone: "", service: "", address: "", problemDescription: "", date: "", time: "10:00", duration: "1 hour", providerId: "", clientLatitude: "", clientLongitude: "", clientLocationAccuracy: "" });
      setBookingOpen(false);
      setSelectedService(null);
      setActiveView("client");
      setStatusMessage("Booking saved. Your service address has been shared with the provider.");
      refreshAfterAction({ client: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const acceptProviderRequest = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/providers/bookings/${bookingId}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseApiResponse(response, "Booking request could not be accepted.");
      if (!response.ok) throw new Error(data.message || "Booking request could not be accepted.");
      setProviderData((current) => ({
        ...normalizeProviderDashboard(current || {}),
        availableRequests: (current?.availableRequests || []).filter((booking) => booking._id !== bookingId),
        bookings: [data.booking, ...(current?.bookings || [])],
      }));
      setStatusMessage("Request accepted. The client has been notified.");
      refreshAfterAction({ provider: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const updateProviderBookingStatus = async (bookingId, status, cancellationReason = "") => {
    try {
      const response = await fetch(`${API_URL}/providers/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, cancellationReason }),
      });
      const data = await parseApiResponse(response, "Booking status could not be updated.");
      if (!response.ok) throw new Error(data.message || "Booking status could not be updated.");
      setProviderData((current) => ({
        ...normalizeProviderDashboard(current || {}),
        bookings: (current?.bookings || []).map((booking) => (booking._id === bookingId ? data.booking : booking)),
      }));
      setStatusMessage(status === "completed" ? "Booking marked work completed." : `Booking marked ${status}.`);
      refreshAfterAction({ provider: true });
      return data.booking;
    } catch (error) {
      setStatusMessage(error.message);
      return false;
    }
  };

  const toggleProviderAvailability = async (newStatus) => {
    try {
      const response = await fetch(`${API_URL}/providers/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      const data = await parseApiResponse(response, "Could not update availability status.");
      if (!response.ok) throw new Error(data.message || "Could not update availability status.");

      setProviderData((current) => {
        if (!current) return current;
        return {
          ...current,
          provider: {
            ...current.provider,
            isActive: data.provider.isActive
          }
        };
      });

      setCatalogProviders((current) =>
        current.map((provider) =>
          provider.providerId === data.provider._id || provider.id === data.provider._id
            ? { ...provider, isActive: data.provider.isActive }
            : provider
        )
      );

      setStatusMessage(`Availability updated: You are now ${data.provider.isActive ? "Available" : "Unavailable"} for work.`);
      refreshAfterAction({ provider: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const updateClientBooking = (updatedBooking) => {
    setBookings((current) => current.map((booking) => (
      booking._id === updatedBooking._id
        ? {
          ...booking,
          ...updatedBooking,
          assignedProvider: updatedBooking.assignedProvider || booking.assignedProvider,
          requestedProvider: updatedBooking.requestedProvider || booking.requestedProvider,
        }
        : booking
    )));
  };

  const updateProviderBooking = (updatedBooking) => {
    setProviderData((current) => ({
      ...normalizeProviderDashboard(current || {}),
      bookings: (current?.bookings || []).map((booking) => (booking._id === updatedBooking._id ? updatedBooking : booking)),
    }));
  };

  const handleSubmitProviderEstimate = async (bookingId, finalEstimateAmount) => {
    const data = await submitProviderEstimate(bookingId, finalEstimateAmount);
    updateProviderBooking(data.booking);
    setStatusMessage("Estimate sent. Waiting for client response.");
    refreshAfterAction({ provider: true });
    return data.booking;
  };

  const handleAcceptEstimate = async (bookingId) => {
    try {
      const data = await acceptEstimate(bookingId);
      updateClientBooking(data.booking);
      setStatusMessage("Estimate accepted. Please complete payment.");
      refreshAfterAction({ client: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleRejectEstimate = async (bookingId, rejectionReason) => {
    const data = await rejectEstimate(bookingId, rejectionReason);
    updateClientBooking(data.booking);
    setStatusMessage("Estimate rejected. Rs. 200 penalty applied.");
    refreshAfterAction({ client: true });
    return data.booking;
  };

  const handlePayNow = async (booking) => {
    if (payingBookingId) return;

    setPayingBookingId(booking._id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay checkout could not be loaded. Please check your connection.");
      }

      const orderResponse = await createRazorpayOrder(booking._id);
      if (orderResponse.booking) updateClientBooking(orderResponse.booking);
      refreshAfterAction({ client: true });

      const options = {
        key: orderResponse.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.order.amount,
        currency: "INR",
        name: "ServiceHub",
        description: `Payment for ${booking.service}`,
        order_id: orderResponse.order.id,
        handler: async function handleRazorpaySuccess(response) {
          try {
            const verifyResponse = await verifyRazorpayPayment(response, booking._id);
            updateClientBooking(verifyResponse.booking);
            setStatusMessage("Payment verified successfully.");
            refreshAfterAction({ client: true });
          } catch (error) {
            setStatusMessage(error.message);
          } finally {
            setPayingBookingId("");
          }
        },
        prefill: {
          name: booking.userName || "",
          email: booking.userEmail || "",
          contact: booking.phone || "",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: false,
          paylater: false,
        },
        theme: {
          color: "#0f766e",
        },
        modal: {
          ondismiss: () => setPayingBookingId(""),
        },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.on("payment.failed", (response) => {
        setPayingBookingId("");
        setStatusMessage(response.error?.description || "Payment failed. Please try again.");
      });
      razorpayCheckout.open();
    } catch (error) {
      setPayingBookingId("");
      setStatusMessage(error.message);
    }
  };

  const updateProviderApproval = async (providerId, approvalStatus) => {
    try {
      const response = await fetch(`${API_URL}/admin/providers/${providerId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approvalStatus }),
      });
      const data = await parseApiResponse(response, "Provider approval failed.");
      if (!response.ok) throw new Error(data.message || "Provider approval failed.");
      setAdminData((current) => ({
        ...current,
        providers: current.providers.map((provider) => (provider._id === providerId ? data.provider : provider)),
      }));
      setStatusMessage(`Provider ${approvalStatus}.`);
      refreshCatalogProviders();
      refreshAfterAction({ admin: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const updateBookingRequest = async (bookingId, payload) => {
    try {
      const response = await fetch(`${API_URL}/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await parseApiResponse(response, "Booking update failed.");
      if (!response.ok) throw new Error(data.message || "Booking update failed.");
      setAdminData((current) => ({
        ...current,
        bookings: current.bookings.map((booking) => (booking._id === bookingId ? data.booking : booking)),
      }));
      setStatusMessage("Booking updated.");
      refreshAfterAction({ admin: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const cancelClientBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseApiResponse(response, "Booking could not be cancelled.");
      if (!response.ok) throw new Error(data.message || "Booking could not be cancelled.");
      setBookings((current) => current.map((booking) => (
        booking._id === bookingId
          ? {
            ...booking,
            ...data.booking,
            assignedProvider: data.booking.assignedProvider || booking.assignedProvider,
            requestedProvider: data.booking.requestedProvider || booking.requestedProvider,
          }
          : booking
      )));
      setStatusMessage("Booking cancelled successfully.");
      refreshAfterAction({ client: true });
      return data.booking;
    } catch (error) {
      setStatusMessage(error.message);
      return null;
    }
  };

  const submitClientReview = async (bookingId, payload) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await parseApiResponse(response, "Review could not be submitted.");
      if (!response.ok) throw new Error(data.message || "Review could not be submitted.");
      updateClientBooking(data.booking);
      setStatusMessage("Review submitted successfully.");
      refreshAfterAction({ client: true });
      return data.booking;
    } catch (error) {
      setStatusMessage(error.message);
      return null;
    }
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <SEO
        title="ServiceHub India | Best Home Services and Local Service Booking Platform"
        description="Book verified electricians, plumbers, AC repair, cleaners, painters, carpenters, and appliance repair providers on ServiceHub India, a trusted local service marketplace."
        keywords={targetKeywords}
        path="/"
        schema={[
          organizationSchema,
          localBusinessSchema,
          faqSchema,
          reviewSchema,
          ...serviceSchema,
          buildBreadcrumbSchema([{ name: "Home", path: "/" }]),
        ]}
      />
      <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-500 dark:bg-slate-950 dark:text-white">
        <header className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-all duration-300 sm:px-5 ${navScrolled ? "pb-2" : "pb-3"}`}>
          <nav className={`mx-auto flex max-w-[96rem] items-center justify-between gap-3 rounded-[1.35rem] border px-4 shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-white/45 backdrop-blur-2xl transition-all duration-300 dark:ring-white/10 sm:px-5 lg:px-6 ${navScrolled ? "h-16 border-white/80 bg-white/88 dark:border-white/10 dark:bg-slate-950/82" : "h-20 border-white/70 bg-white/74 dark:border-white/10 dark:bg-slate-950/66"}`}>
            <button type="button" onClick={goMainHome} className="group flex min-w-0 flex-none items-center gap-3 rounded-2xl pr-2 transition hover:bg-white/55 dark:hover:bg-white/5">
                <span className={`grid place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-xl shadow-blue-600/20 ring-1 ring-slate-200/80 transition-all duration-300 group-hover:-translate-y-0.5 dark:ring-white/15 ${navScrolled ? "h-10 w-10" : "h-12 w-12"}`}>
                  <img src={SERVICEHUB_ICON} alt="ServiceHub symbol" className="h-full w-full rounded-xl object-contain" />
                </span>
              <span className="leading-tight">
                <span className="block text-xl font-black tracking-tight">ServiceHub</span>
                <span className="hidden text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 sm:block">{t("verifiedLocalServices")}</span>
              </span>
            </button>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-white/82 p-1.5 text-sm font-black text-slate-500 shadow-[0_10px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.id === "top" ? handleHomeNav : () => navigateHome(`#${item.id}`)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 [overflow-wrap:normal] transition ${isNavActive(item.id) ? "bg-slate-950 text-white shadow-md shadow-slate-950/15 dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}
                >
                  <Icon className="flex-none" size={16} />
                  <span className="whitespace-nowrap [overflow-wrap:normal]">{item.label}</span>
                </button>
                );
              })}
              {user?.role === "user" && <button type="button" onClick={() => setActiveView("client")} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 [overflow-wrap:normal] transition ${activeView === "client" ? "bg-slate-950 text-white shadow-md dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}><CalendarCheck className="flex-none" size={16} /><span className="whitespace-nowrap [overflow-wrap:normal]">{t("dashboard")}</span></button>}
              {user?.role === "provider" && <button type="button" onClick={loadProviderDashboard} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 [overflow-wrap:normal] transition ${["provider", "client"].includes(activeView) ? "bg-slate-950 text-white shadow-md dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}><BriefcaseBusiness className="flex-none" size={16} /><span className="whitespace-nowrap [overflow-wrap:normal]">{providerDashboardNavLabel}</span></button>}
              {user?.role === "admin" && <button type="button" onClick={loadAdminDashboard} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 [overflow-wrap:normal] transition ${activeView === "admin" ? "bg-slate-950 text-white shadow-md dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}><ShieldCheck className="flex-none" size={16} /><span className="whitespace-nowrap [overflow-wrap:normal]">{t("admin")}</span></button>}
            </div>
            </div>

            <div className="hidden flex-none items-center gap-2 lg:flex xl:gap-3">
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className={`grid h-11 w-11 place-items-center rounded-full border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isDark
                    ? "border-black bg-black text-white"
                    : "border-slate-200 bg-white text-slate-950"
                }`}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {user ? (
                <>
                  <div ref={accountMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen((current) => !current);
                        setLoginMenuOpen(false);
                        setMoreMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                    >
                      <UserRoundCheck size={20} />
                      Account
                      <ChevronDown size={15} className={`transition ${accountMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {accountMenuOpen && (
                      <div className="absolute right-0 top-12 z-[75] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                        <p className="px-5 pb-3 text-lg font-black text-slate-800 dark:text-white">Your Account</p>
                        {[
                          { label: "My Profile", icon: UserRoundCheck, action: openProfileMenu },
                          {
                            label: user.role === "provider" ? "Provider Dashboard" : user.role === "admin" ? "Admin Dashboard" : "Client Dashboard",
                            icon: CalendarCheck,
                            action: () => {
                              if (user.role === "provider") loadProviderDashboard();
                              else if (user.role === "admin") loadAdminDashboard();
                              else setActiveView("client");
                            },
                          },
                          { label: "Services", icon: BriefcaseBusiness, action: () => navigateHome("#services") },
                          { label: "Providers", icon: MapPin, action: () => navigateHome("#providers") },
                          { label: "Coupons", icon: Sparkles, action: () => setStatusMessage("Coupons will be available soon.") },
                          { label: "ServiceHub Plus Zone", icon: Star, action: () => setStatusMessage("ServiceHub Plus will be available soon.") },
                          { label: "Saved Cards & Wallet", icon: Wallet, action: () => setStatusMessage("Saved cards and wallet will be available soon.") },
                          { label: "Saved Addresses", icon: MapPin, action: openProfileMenu },
                          { label: "Gift Cards", icon: Wallet, action: () => setStatusMessage("Gift cards will be available soon.") },
                          { label: "Notifications", icon: Bell, action: () => setStatusMessage("Notifications are shown inside your dashboard.") },
                          { label: "Logout", icon: ArrowRight, action: handleLogout },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setAccountMenuOpen(false);
                                item.action();
                              }}
                              className="flex w-full items-center gap-4 px-5 py-3 text-left text-base font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              <Icon size={20} className="flex-none" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <LanguageSwitcher language={language} setLanguage={setLanguage} t={t} />
                </>
              ) : (
                <>
                  <div ref={loginMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMenuOpen((current) => !current);
                        setMoreMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-black text-slate-700 [overflow-wrap:normal] transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                    >
                      <UserRoundCheck size={19} />
                      {t("login")}
                      <ChevronDown size={15} className={`transition ${loginMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {loginMenuOpen && (
                      <div className="absolute right-0 top-12 z-[75] w-80 overflow-hidden rounded-b-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                        <span className="absolute -top-2 right-16 h-4 w-4 rotate-45 bg-blue-600" />
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/10">
                          <div>
                            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">New customer?</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginMenuOpen(false);
                              openClientAuth("register");
                            }}
                            className="rounded-lg bg-blue-600 px-6 py-2.5 text-center text-base font-black text-white transition hover:bg-blue-700"
                          >
                            Signup
                          </button>
                        </div>
                        <div className="py-2">
                          {[
                            { label: "My Profile", icon: UserRoundCheck, action: () => openClientAuth("login") },
                            { label: "ServiceHub Plus Zone", icon: Sparkles, action: () => setStatusMessage("Login to access ServiceHub rewards.") },
                            { label: "Services", icon: BriefcaseBusiness, action: () => navigateHome("#services") },
                            { label: "Providers", icon: MapPin, action: () => navigateHome("#providers") },
                            { label: "Become a Provider", icon: BriefcaseBusiness, action: () => openProviderAuth("register") },
                            { label: "Rewards", icon: Wallet, action: () => setStatusMessage("Rewards will be available after login.") },
                            { label: "Notification Preferences", icon: Bell, action: () => setStatusMessage("Notification preferences will be available after login.") },
                            { label: "24x7 Customer Care", icon: MessageCircle, action: () => navigateHome("#contact") },
                            { label: "Advertise", icon: ShieldCheck, action: () => { navigateHome("#contact"); setStatusMessage("Please contact admin for ServiceHub advertising."); } },
                            { label: "Download App", icon: UploadCloud, action: () => setStatusMessage("ServiceHub app download will be available soon.") },
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  setLoginMenuOpen(false);
                                  item.action();
                                }}
                                className="flex w-full items-center gap-4 px-5 py-3 text-left text-base font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                              >
                                <Icon size={20} className="flex-none" />
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={moreMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setMoreMenuOpen((current) => !current);
                        setLoginMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-5 py-3 text-sm font-black text-slate-700 [overflow-wrap:normal] transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                    >
                      More <ChevronDown size={15} className={`transition ${moreMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {moreMenuOpen && (
                      <div className="absolute right-0 top-13 z-[70] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white py-3 text-slate-800 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                        <p className="px-5 pb-2 text-base font-black text-slate-700 dark:text-slate-200">More</p>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            openProviderAuth("register");
                          }}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <BriefcaseBusiness size={20} /> Become a Provider
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setStatusMessage("Notification settings will be available after login.");
                          }}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Bell size={20} /> Notification Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            navigateHome("#contact");
                          }}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MessageCircle size={20} /> 24x7 Customer Care
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            navigateHome("#contact");
                            setStatusMessage("Please contact admin for ServiceHub advertising.");
                          }}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Sparkles size={20} /> Advertise on ServiceHub
                        </button>
                      </div>
                    )}
                  </div>
                  <LanguageSwitcher language={language} setLanguage={setLanguage} t={t} />
                </>
              )}
            </div>

            <button type="button" onClick={() => setMobileNavOpen(true)} className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-950/15 ring-1 ring-white/10 transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950 lg:hidden" aria-label="Open navigation menu">
              <Menu size={20} />
            </button>
          </nav>
          <div className="mx-auto mt-2 h-0.5 max-w-[92rem] overflow-hidden rounded-full bg-transparent">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 via-blue-600 to-amber-300 transition-[width] duration-200" style={{ width: `${navProgress}%` }} />
          </div>
        </header>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-slate-950/74 p-3 backdrop-blur-md sm:p-4 lg:hidden">
              <motion.div initial={{ x: 90 }} animate={{ x: 0 }} exit={{ x: 90 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="ml-auto flex h-full max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-[1.7rem] border border-white/70 bg-[linear-gradient(145deg,#ffffff_0%,#ecfeff_48%,#fff7ed_100%)] p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[linear-gradient(145deg,#020617_0%,#082f49_52%,#111827_100%)] dark:text-white sm:max-h-[calc(100dvh-2rem)] sm:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg shadow-blue-600/20 ring-1 ring-slate-200/80 dark:ring-white/15">
                      <img src={SERVICEHUB_ICON} alt="ServiceHub symbol" className="h-full w-full rounded-xl object-contain" />
                    </span>
                    <div>
                      <p className="font-black">ServiceHub</p>
                      <p className="text-xs font-bold text-slate-400">{t("verifiedLocalServices")}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setMobileNavOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white" aria-label="Close navigation menu"><X size={18} /></button>
                </div>
                {user && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <ProfileAvatar
                      user={user}
                      onClick={() => {
                        openProfileMenu();
                        setMobileNavOpen(false);
                      }}
                    />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{t("signedIn")}</p>
                      <p className="mt-1 font-black">{user.role === "admin" ? t("admin") : user.name}</p>
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.id === "top" ? handleHomeNav : () => navigateHome(`#${item.id}`)}
                      className={`flex items-center justify-between rounded-2xl p-4 text-left font-black transition ${isNavActive(item.id) ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15 dark:bg-amber-300 dark:text-slate-950" : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"}`}
                    >
                      <span className="flex items-center gap-3"><Icon size={18} />{item.label}</span>
                      <ChevronRight size={17} />
                    </button>
                    );
                  })}
                  {user?.role === "user" && <button type="button" onClick={() => { setActiveView("client"); setMobileNavOpen(false); }} className={`flex items-center justify-between rounded-2xl p-4 text-left font-black transition ${activeView === "client" ? "bg-slate-950 text-white dark:bg-amber-300 dark:text-slate-950" : "bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-200"}`}><span className="flex items-center gap-3"><CalendarCheck size={18} />{t("clientDashboard")}</span><ChevronRight size={17} /></button>}
                  {user?.role === "provider" && <button type="button" onClick={() => { loadProviderDashboard(); setMobileNavOpen(false); }} className={`flex items-center justify-between rounded-2xl p-4 text-left font-black transition ${["provider", "client"].includes(activeView) ? "bg-slate-950 text-white dark:bg-amber-300 dark:text-slate-950" : "bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-200"}`}><span className="flex items-center gap-3"><BriefcaseBusiness size={18} />{providerDashboardNavLabel}</span><ChevronRight size={17} /></button>}
                  {user?.role === "admin" && <button type="button" onClick={loadAdminDashboard} className={`flex items-center justify-between rounded-2xl p-4 text-left font-black transition ${activeView === "admin" ? "bg-slate-950 text-white dark:bg-amber-300 dark:text-slate-950" : "bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-200"}`}><span className="flex items-center gap-3"><ShieldCheck size={18} />{t("admin")}</span><ChevronRight size={17} /></button>}
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                  <div className="col-span-2">
                    <LanguageSwitcher language={language} setLanguage={setLanguage} t={t} fullWidth />
                  </div>
                  <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 p-4 font-black transition hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15">{isDark ? <Sun size={18} /> : <Moon size={18} />}{isDark ? t("light") : t("dark")}</button>
                  {user ? (
                    <button type="button" onClick={handleLogout} className="rounded-2xl bg-amber-300 p-4 font-black text-slate-950 shadow-lg shadow-amber-300/20">{t("logout")}</button>
                  ) : (
                    <>
                      <button type="button" onClick={() => openClientAuth("login")} className="rounded-2xl bg-amber-300 p-4 font-black text-slate-950 shadow-lg shadow-amber-300/20">{t("login")}</button>
                      <button type="button" onClick={() => openProviderAuth("register")} className="rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 p-4 font-black text-white shadow-lg shadow-blue-600/20">{t("becomeProvider")}</button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeView === "home" && (
          <main id="top" className="overflow-hidden pt-24 lg:pt-28">
            <Hero searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={searchServices} />
            <section id="services" className="home-section border-y border-[#ded7ca] bg-[#fbfaf6] dark:border-white/10 dark:bg-slate-950">
              <PopularServicesGrid openPopularService={openPopularService} />
              <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[350px_1fr]">
                <Categories
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={(category) => {
                    setSelectedCategory(category);
                    setProviderVisibleCount(4);
                  }}
                />
                <Providers
                  services={filteredServices}
                  providerVisibleCount={providerVisibleCount}
                  setProviderVisibleCount={setProviderVisibleCount}
                  setSelectedService={setSelectedService}
                  ownProviderId={providerProfile?._id || ""}
                />
              </div>
            </section>
            <FAQ />
          </main>
        )}

        {activeView === "client" && (
          <ClientDashboard
            bookings={bookings}
            setActiveView={setActiveView}
            cancelClientBooking={cancelClientBooking}
            onAcceptEstimate={handleAcceptEstimate}
            onRejectEstimate={handleRejectEstimate}
            onSubmitReview={submitClientReview}
            onPayNow={handlePayNow}
            payingBookingId={payingBookingId}
            t={t}
            isProviderClientMode={user?.role === "provider"}
            onBrowseServices={browseServicesAsClient}
            onProviderDashboard={loadProviderDashboard}
            onRefreshBookings={refreshClientBookings}
          />
        )}

        {activeView === "provider" && (
          <ProviderDashboard
            providerProfile={providerProfile}
            providerRequests={providerRequests}
            providerBookings={providerBookings}
            providerEarnings={providerEarnings}
            acceptProviderRequest={acceptProviderRequest}
            updateProviderBookingStatus={updateProviderBookingStatus}
            submitEstimate={handleSubmitProviderEstimate}
            refreshDashboard={loadProviderDashboard}
            setStatusMessage={setStatusMessage}
            providerDashboardLocked={user?.role === "provider" && providerProfile?.approvalStatus !== "approved"}
            onBookAsClient={openProviderClientDashboard}
            toggleProviderAvailability={toggleProviderAvailability}
          />
        )}

        {activeView === "admin" && (
          <AdminPanel
            adminData={adminData}
            selectedProviders={selectedProviders}
            setSelectedProviders={setSelectedProviders}
            updateProviderApproval={updateProviderApproval}
            updateBookingRequest={updateBookingRequest}
            setAdminData={setAdminData}
            refreshAdminContactMessages={refreshAdminContactMessages}
            setStatusMessage={setStatusMessage}
            adminEmail={user?.email || ""}
            paymentData={adminPaymentData}
            refreshAdminPayments={loadAdminDashboard}
          />
        )}

        {activeView === "home" && <ClientSupportSection user={user} setStatusMessage={setStatusMessage} />}
        {activeView !== "admin" && <ServiceHubFooter onServiceClick={openPopularService} />}
        <button
          type="button"
          onClick={toggleChat}
          className="fixed bottom-5 right-5 z-[85] flex h-14 items-center gap-2.5 rounded-full bg-[#FACC15] px-6 text-slate-950 shadow-2xl shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-amber-400/45"
          aria-label={chatOpen ? "Close support chat" : "Open support chat"}
        >
          {chatOpen ? (
            <>
              <X size={18} />
              <span className="text-sm font-black tracking-tight">Close</span>
            </>
          ) : (
            <>
              <Headset size={18} />
              <span className="text-sm font-black tracking-tight">Help & Support</span>
            </>
          )}
        </button>
        <AnimatePresence>
          {chatOpen && (
            <ChatBox
              user={user}
              onClose={() => setChatOpen(false)}
              onServiceClick={openPopularService}
              onDashboardClick={() => setActiveView("client")}
              onProviderSignup={() => openProviderAuth("register")}
              onProviderDashboard={loadProviderDashboard}
              onAdminDashboard={loadAdminDashboard}
              onLogin={() => openClientAuth("login")}
              onContact={() => navigateHome("#contact")}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {statusMessage && <ActionToast message={statusMessage} onClose={() => setStatusMessage("")} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {bookingOpen && (
          <BookingModal
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            submitBooking={submitBooking}
            close={() => setBookingOpen(false)}
            categories={categories}
            user={user}
          />
        )}
      </AnimatePresence>
      {providerAccountOpen && (
        <ProviderAccountDetailsModal
          form={providerAccountForm}
          provider={providerData?.provider}
          onUpdate={() => setProviderAccountEditOpen(true)}
          onClose={() => {
            setProviderAccountOpen(false);
            setProviderAccountEditOpen(false);
          }}
        />
      )}
      {providerAccountEditOpen && (
        <ProviderAccountEditModal
          form={providerAccountForm}
          setForm={setProviderAccountForm}
          categories={categories}
          onSubmit={submitProviderAccount}
          onClose={() => setProviderAccountEditOpen(false)}
        />
      )}
      <AnimatePresence>
        {profileImageOpen && user && user.role !== "provider" && (
          <ProfileImageModal
            user={user}
            onClose={() => setProfileImageOpen(false)}
            onSave={updateProfileImage}
            onProfileSave={updateUserProfile}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedService && (
          <ServiceModal
            service={selectedService}
            onBook={openBooking}
            onClose={() => setSelectedService(null)}
            canBook={
              user?.role !== "admin" &&
              !(
                selectedService.providerId &&
                providerProfile?._id &&
                String(selectedService.providerId) === String(providerProfile._id)
              )
            }
          />
        )}
      </AnimatePresence>
      {authMode && (
        <AuthModal
          mode={authMode}
          initialRole={authRole}
          lockedRole={authLocked}
          language={language}
          onClose={() => setAuthMode(null)}
          onModeChange={setAuthMode}
          onAuthSuccess={(nextUser) => {
            setUser(nextUser);
            setLoginMenuOpen(false);
            setAccountMenuOpen(false);
            setMoreMenuOpen(false);
            setMobileNavOpen(false);
            setActiveView(nextUser.role === "provider" ? "provider" : nextUser.role === "admin" ? "admin" : "client");
            if (nextUser.role === "provider") loadProviderDashboard();
            if (nextUser.role === "admin") loadAdminDashboard();
            if (nextUser.role === "user") refreshClientBookings();
            setStatusMessage(`${formatRoleLabel(nextUser.role)} logged in successfully.`);
          }}
        />
      )}
    </div>
  );
}

function Hero({ searchTerm, setSearchTerm, onSearch }) {
  const [heroStageIndex, setHeroStageIndex] = useState(0);
  const heroStage = heroStages[heroStageIndex];
  const nextHeroStage = heroStages[(heroStageIndex + 1) % heroStages.length];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroStageIndex((current) => (current + 1) % heroStages.length);
    }, 3800);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="home-section relative overflow-hidden bg-white px-4 py-16 shadow-lg shadow-slate-200/30 dark:bg-slate-950/95 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(14,165,233,0.16) 0%, rgba(20,184,166,0.12) 42%, rgba(15,23,42,0.06) 100%), url(${HERO_BACKGROUND_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 border-l-4 border-slate-900 bg-slate-950 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm shadow-slate-900/10">
            <Sparkles size={15} /> Home services, booked clearly
          </motion.span>
          <motion.h1
  variants={fadeUp}
  className="mt-6 max-w-2xl font-display text-3xl font-black leading-[1.12] tracking-[-0.02em] text-slate-950 dark:text-white sm:text-4xl"
>
  Find a{" "}
  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
    reliable local expert
  </span>{" "}
  without the usual back-and-forth.
</motion.h1>
          
          <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            Compare providers, check pricing, choose a time, and track the request from one clean ServiceHub workspace.
          </motion.p>
          <motion.form
            variants={fadeUp}
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
            }}
            className="mt-7 flex flex-col gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/15 dark:border-white/10 dark:bg-slate-900/95 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-950 dark:text-white">
              <Search className="text-slate-500" size={22} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search electrician, plumber, AC repair..."
                className="h-12 w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[1.35rem] bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 hover:-translate-y-0.5 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-slate-100">
              Search services <ArrowRight size={17} />
            </button>
          </motion.form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} className="grid min-w-0 gap-4 lg:grid-cols-[1fr_0.72fr]">
          <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
            <div className="relative h-64 overflow-hidden sm:h-80">
              <AnimatePresence mode="wait">
                <motion.img
                  key={heroStage.title}
                  src={heroStage.image}
                  alt={`${heroStage.title} service`}
                  fetchPriority="high"
                  initial={{ opacity: 0, scale: 1.06, x: 18 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98, x: -18 }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur sm:bottom-4 sm:left-4 sm:right-auto">
                <p className="text-sm font-black text-slate-950">{heroStage.title}</p>
                <p className="text-xs font-bold text-slate-500">{heroStage.note}</p>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div><p className="text-2xl font-black">10k+</p><p className="text-sm font-bold text-slate-500">local users</p></div>
              <div><p className="text-2xl font-black">4.8</p><p className="text-sm font-bold text-slate-500">avg rating</p></div>
              <div><p className="text-2xl font-black">24/7</p><p className="text-sm font-bold text-slate-500">support</p></div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-white/5">
              <div className="relative h-40 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={nextHeroStage.title}
                    src={nextHeroStage.image}
                    alt={`${nextHeroStage.title} service preview`}
                    loading="lazy"
                    decoding="async"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>
              </div>
              <div className="p-4">
                <p className="font-black">Live request status</p>
                <p className="mt-1 text-sm text-slate-500">Pending, confirmed, completed, or cancelled.</p>
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <p className="flex items-center gap-2 font-black"><ShieldCheck className="text-teal-700" size={18} /> Verified providers</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Admins can approve profiles before they appear to clients.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProfileAvatar({ user, onClick, size = "md" }) {
  const imageUrl = user?.profileImage || user?.avatarUrl || user?.photoUrl || "";
  const label = user?.role === "admin" ? "Admin profile" : `${user?.name || "User"} profile`;
  const Component = onClick ? "button" : "span";
  const avatarSize = size === "sm" ? 36 : 48;

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{ width: avatarSize, height: avatarSize, minWidth: avatarSize, minHeight: avatarSize, borderRadius: "9999px" }}
      className={`grid place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0 text-base font-black text-white shadow-sm ring-2 ring-white transition dark:border-white/10 dark:bg-slate-800 dark:ring-white/10 ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-200 dark:focus:ring-teal-400/30" : ""}`}
      title={label}
      aria-label={label}
    >
      {imageUrl ? <img src={imageUrl} alt={label} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <DefaultProfileSymbol />}
    </Component>
  );
}

function DefaultProfileSymbol() {
  return (
    <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#c7c7c7]" aria-hidden="true">
      <span className="absolute left-1/2 top-[22%] h-[30%] w-[30%] -translate-x-1/2 rounded-full bg-white" />
      <span className="absolute bottom-[-5%] left-1/2 h-[46%] w-[64%] -translate-x-1/2 rounded-t-full bg-white" />
    </span>
  );
}

function ProfileImageModal({ user, onClose, onSave, onProfileSave, onProviderDetails }) {
  const [preview, setPreview] = useState(user?.profileImage || "");
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const label = `${user?.name || "User"} profile image`;
  const roleLabel = formatRoleLabel(user?.role || "user");
  const profileRows = [
    ["Account type", roleLabel],
    ["Email", user?.email || "Not available"],
    ["Phone", user?.phone || "Not available"],
    ["Address", user?.address || "Not available"],
  ];
  const updateProfileField = (field) => (event) => setProfileForm((current) => ({ ...current, [field]: event.target.value }));

  const resizeImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 720;
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(Math.round(image.width * scale), 1);
          canvas.height = Math.max(Math.round(image.height * scale), 1);
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        };
        image.onerror = () => reject(new Error("Selected image could not be loaded."));
        image.src = reader.result;
      };
      reader.onerror = () => reject(new Error("Selected image could not be read."));
      reader.readAsDataURL(file);
    });

  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    try {
      setError("");
      setBusy(true);
      const nextPreview = await resizeImage(file);
      setPreview(nextPreview);
    } catch (uploadError) {
      setError(uploadError.message || "Image could not be prepared.");
    } finally {
      setBusy(false);
    }
  };

  const saveImage = async () => {
    setBusy(true);
    setError("");
    try {
      await onSave(preview);
    } catch (saveError) {
      setError(saveError.message || "Profile image could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    setError("");
    try {
      const updatedUser = await onProfileSave(profileForm);
      setProfileForm({
        name: updatedUser?.name || profileForm.name,
        phone: updatedUser?.phone || profileForm.phone,
        address: updatedUser?.address || profileForm.address,
      });
      setEditingProfile(false);
    } catch (saveError) {
      setError(saveError.message || "Profile could not be saved.");
    } finally {
      setProfileBusy(false);
    }
  };

  const openProviderDetails = () => {
    onClose();
    onProviderDetails?.();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-4">
      <motion.div initial={{ y: 26, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.98 }} className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={onClose} className="grid h-10 w-10 flex-none place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white" aria-label="Back from profile">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">{roleLabel} profile</p>
              <h2 className="mt-1 truncate text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{user?.name || "My profile"}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setEditingProfile((current) => !current)} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950">
              {editingProfile ? "Cancel" : "Edit"}
            </button>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white" aria-label="Close profile image editor"><X size={18} /></button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-3xl font-black text-white shadow-2xl shadow-blue-600/20 ring-1 ring-slate-200 dark:border-slate-900 dark:bg-slate-800 dark:ring-white/10 sm:h-32 sm:w-32">
                {preview ? <img src={preview} alt={label} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <DefaultProfileSymbol />}
              </div>

              <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-teal-300 bg-teal-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-500 hover:bg-teal-50 dark:border-teal-300/30 dark:bg-teal-300/10 dark:hover:bg-teal-300/15">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-white text-teal-700 shadow-sm dark:bg-slate-950 dark:text-teal-300"><UploadCloud size={20} /></span>
                <span className="min-w-0">
                  <span className="block font-black text-slate-950 dark:text-white">Choose profile image</span>
                  <span className="mt-1 block text-sm font-bold text-slate-500 dark:text-slate-300">PNG, JPG, JPEG, or WEBP</span>
                </span>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={chooseImage} className="sr-only" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <button type="button" onClick={saveImage} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-300 dark:text-slate-950">
                  <Camera size={18} />
                  {busy ? "Saving..." : "Save image"}
                </button>
                {preview && (
                  <button type="button" onClick={() => setPreview("")} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                    <Trash2 size={17} />
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {editingProfile ? (
                <form onSubmit={saveProfile} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 sm:grid-cols-2">
                  <FormInput label="Name" value={profileForm.name} onChange={updateProfileField("name")} placeholder="Your name" />
                  <FormInput label="Phone" value={profileForm.phone} onChange={updateProfileField("phone")} placeholder="Mobile number" />
                  <label className="grid gap-2 font-bold sm:col-span-2">
                    Address
                    <textarea
                      value={profileForm.address}
                      onChange={updateProfileField("address")}
                      placeholder="Your registered service address"
                      rows="3"
                      className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950"
                    />
                  </label>
                  <button type="submit" disabled={profileBusy} className="rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 disabled:opacity-60 sm:col-span-2">
                    {profileBusy ? "Saving..." : "Save profile"}
                  </button>
                </form>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <div className="grid gap-1 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:grid-cols-[7.5rem_1fr] sm:gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Name</span>
                    <span className="min-w-0 break-words text-sm font-black text-slate-900 dark:text-white">{user?.name || "Not available"}</span>
                  </div>
                  {profileRows.map(([field, value]) => (
                    <div key={field} className="grid gap-1 border-b border-slate-200 px-4 py-3 last:border-b-0 dark:border-white/10 sm:grid-cols-[7.5rem_1fr] sm:gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{field}</span>
                      <span className="min-w-0 break-words text-sm font-black text-slate-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p>}
            </div>
          </div>

          {onProviderDetails && (
            <button type="button" onClick={openProviderDetails} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
              Open provider details
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function LanguageSwitcher({ language, setLanguage, t, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const currentLanguage = supportedLanguages.find((item) => item.code === language) || supportedLanguages[0];
  const chooseLanguage = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div data-no-translate="true" className={`relative ${fullWidth ? "w-full" : "w-auto"}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center justify-between gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-teal-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:ring-teal-400/30 ${fullWidth ? "w-full rounded-2xl px-3 py-3 text-sm" : "min-w-[104px]"}`}
        aria-label={t("language")}
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Languages size={fullWidth ? 15 : 13} />
          <span key={currentLanguage.code} className="truncate">{currentLanguage.label}</span>
        </span>
        <ChevronDown size={14} className={`flex-none transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div data-no-translate="true" className={`absolute right-0 top-[calc(100%+0.45rem)] z-[90] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-sm font-black text-slate-700 shadow-2xl shadow-slate-950/12 dark:border-white/10 dark:bg-slate-900 dark:text-white ${fullWidth ? "left-0 right-auto w-full" : "w-36"}`}>
          {supportedLanguages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => chooseLanguage(item.code)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${item.code === language ? "bg-teal-600 text-white" : "hover:bg-slate-100 dark:hover:bg-white/10"}`}
            >
              <span>{item.label}</span>
              {item.code === language && <CheckCircle size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PopularServicesGrid({ openPopularService }) {
  const popular = [
    {
      title: "Electrician",
      note: "Wiring, fixtures, safety checks",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80",
      color: "text-teal-600",
      border: "border-t-teal-500",
    },
    {
      title: "Plumber",
      note: "Leaks, fittings, emergency repairs",
      image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=640&q=80",
      color: "text-blue-600",
      border: "border-t-blue-500",
    },
    {
      title: "AC Repair",
      note: "Cleaning, gas refill, installation",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Wall_mount_air_conditioner.jpg/960px-Wall_mount_air_conditioner.jpg",
      color: "text-amber-600",
      border: "border-t-amber-500",
    },
    {
      title: "Cleaning",
      note: "Deep home and sofa cleaning",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&q=80",
      color: "text-rose-600",
      border: "border-t-rose-500",
    },
    {
      title: "Painter",
      note: "Interior, exterior, waterproofing",
      image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=640&q=80",
      color: "text-teal-600",
      border: "border-t-teal-500",
    },
    {
      title: "Carpenter",
      note: "Furniture, doors, modular fittings",
      image: "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=640&q=80",
      color: "text-blue-600",
      border: "border-t-blue-500",
    },
    {
      title: "TV Repair",
      note: "Display, sound, wall mounting",
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=640&q=80",
      color: "text-amber-600",
      border: "border-t-amber-500",
    },
    {
      title: "Appliance Repair",
      note: "Fridge, TV, washing machine",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&q=80",
      color: "text-rose-600",
      border: "border-t-rose-500",
    },
  ];

  const renderPopularCard = (service, duplicate = false) => (
    <div key={`${duplicate ? "loop" : "main"}-${service.title}`} className="popular-services-item">
      <button
        type="button"
        onClick={() => openPopularService(service.title)}
        data-popular-service={getServiceSlug(service.title)}
        tabIndex={duplicate ? -1 : undefined}
        className={`group h-full w-full overflow-hidden rounded-2xl border border-[#ded7ca] border-t-4 ${service.border} bg-[#fffefb] text-left shadow-sm transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-white/5`}
      >
        <div className="relative overflow-hidden">
          <img
            src={service.image}
            alt={`${service.title} home service provider on ServiceHub India`}
            loading="lazy"
            decoding="async"
            className="h-36 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <BriefcaseBusiness className={service.color} size={22} />
          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">{service.title}</h3>
          <p className="mt-2 text-base leading-6 text-slate-500 dark:text-slate-300">{service.note}</p>
        </div>
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-8 max-w-4xl">
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
            Popular services
          </span>
          <h2 className="home-section-title mt-4 font-display text-3xl font-black leading-[1.12] tracking-[-0.02em] text-slate-950 dark:text-white md:text-4xl">
            Everything customers expect<br className="hidden md:block" /> in one platform.
          </h2>
        </div>
      </div>

      <div className="popular-services-viewport scrollbar-hidden overflow-hidden">
          <div className="popular-services-marquee">
            <div className="popular-services-set">
              {popular.map((service) => renderPopularCard(service))}
            </div>
            <div className="popular-services-set" aria-hidden="true">
              {popular.map((service) => renderPopularCard(service, true))}
            </div>
          </div>
      </div>
    </div>
  );
}

function Categories({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-full overflow-hidden rounded-tr-[1.75rem] border border-l-0 border-[#ded7ca] bg-[#fffdf8]/80 px-6 py-7 shadow-sm dark:border-white/10 dark:bg-slate-900/90 lg:block">
      <h2 className="home-section-title font-display text-3xl font-black leading-tight text-slate-900 dark:text-white">
        Providers category
      </h2>
      <div className="scrollbar-hidden mt-7 grid max-h-[calc(100vh-14rem)] gap-2.5 overflow-y-auto pr-1">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`border-b border-slate-200/70 px-1 py-3 text-left text-base font-black transition last:border-b-0 dark:border-white/10 ${
              selectedCategory === category
                ? "text-teal-700 dark:text-amber-300"
                : "text-slate-950 hover:translate-x-1 hover:text-teal-700 dark:text-slate-200 dark:hover:text-amber-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </aside>
  );
}

function Providers({ services, providerVisibleCount, setProviderVisibleCount, setSelectedService, ownProviderId = "" }) {
  const providersGridRef = useRef(null);
  const providerBatchSize = 4;
  const visibleCount = Math.min(providerVisibleCount, services.length);
  const visibleServices = services.slice(0, visibleCount);
  const hasMoreProviders = visibleCount < services.length;
  const canShowLessProviders = visibleCount > providerBatchSize;
  const scrollToProvidersGrid = () => {
    window.setTimeout(() => {
      providersGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div id="providers" className="home-section bg-[#fbfaf6] px-4 pb-16 pt-7 dark:bg-slate-950 sm:px-6 lg:px-8 lg:pb-20 lg:pt-7">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="home-section-title font-display text-3xl font-black tracking-[-0.02em] text-slate-950 dark:text-white md:text-4xl">Most booked services</h2>
          </div>
          <div className="rounded-full border border-[#ded7ca] bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
            {services.length} available
          </div>
        </div>
        {visibleServices.length ? (
          <div ref={providersGridRef} className="scroll-mt-24 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {visibleServices.map((service, index) => {
              const isOwnProviderCard = Boolean(service.providerId && ownProviderId && String(service.providerId) === String(ownProviderId));

              return (
            <motion.article
              key={service.id || service.providerId || service.name}
              data-provider-card="true"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="group min-w-0 overflow-hidden rounded-2xl border border-[#ded7ca] bg-[#fffefb] p-3 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <button
                type="button"
                onClick={() => setSelectedService(service)}
                className="block w-full overflow-hidden rounded-xl bg-slate-100 text-left ring-1 ring-slate-100 transition focus:outline-none focus:ring-4 focus:ring-teal-200 dark:bg-white/10 dark:ring-white/10"
                aria-label={`Open ${service.name} profile`}
              >
                <span className="relative block aspect-square overflow-hidden">
                  <img
                    src={service.image || categoryImages[service.category] || categoryImages.Cleaning}
                    alt={`${service.name} ${service.category} provider`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </span>
              </button>
              <div className="px-1 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className="text-left text-lg font-black leading-7 text-slate-950 transition hover:text-teal-700 dark:text-white dark:hover:text-amber-300"
                >
                  {service.name}
                </button>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1"><Star size={15} className="fill-slate-800 text-slate-800 dark:fill-amber-300 dark:text-amber-300" /> {service.rating || 4.8}</span>
                  {service.responseTime && <><span aria-hidden="true">|</span><span className="inline-flex items-center gap-1"><Sparkles size={14} className="fill-teal-600 text-teal-600" /> {service.responseTime.includes("Instant") ? service.responseTime : "Instant"}</span></>}
                  {service.location && <><span aria-hidden="true">|</span><span>{service.location}</span></>}
                </div>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{formatServiceChargeLabel(service.price)}</p>
                {isOwnProviderCard && <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Your provider profile</p>}
              </div>
            </motion.article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No providers found" copy="Try another service category or clear the search box." />
        )}
        {(hasMoreProviders || canShowLessProviders) && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {canShowLessProviders && (
              <button
                type="button"
                onClick={() => {
                  setProviderVisibleCount((current) => Math.max(providerBatchSize, current - providerBatchSize));
                  scrollToProvidersGrid();
                }}
                className="rounded-full border border-[#ded7ca] bg-white px-7 py-3.5 text-base font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              >
                View less
              </button>
            )}
            {hasMoreProviders && (
              <button
                type="button"
                onClick={() => setProviderVisibleCount((current) => Math.min(services.length, current + providerBatchSize))}
                className="rounded-full bg-gradient-to-r from-teal-600 to-blue-600 px-7 py-3.5 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5"
              >
                View more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FAQ() {
  return (
    <section id="faq" className="home-section bg-[#fbfaf6] px-4 py-16 dark:bg-slate-950 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-700">
          FAQ
        </span>
        <h2 className="home-section-title mt-4 max-w-2xl font-display text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-4xl">
          Answers before customers book home services.
        </h2>
        <div className="mt-7 grid gap-0 border-y border-slate-200 dark:border-white/10">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group border-b border-slate-200 px-1 py-4 last:border-b-0 dark:border-white/10"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-black text-slate-950 marker:hidden dark:text-white">
                {item.question}
                <ChevronRight className="h-4 w-4 flex-none transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientDashboard({ bookings, setActiveView, cancelClientBooking, onAcceptEstimate, onRejectEstimate, onSubmitReview, onPayNow, payingBookingId, t = (key) => key, isProviderClientMode = false, onBrowseServices, onProviderDashboard, onRefreshBookings }) {
  const [now, setNow] = useState(INITIAL_DASHBOARD_TIME);
  const [rejectTargetBooking, setRejectTargetBooking] = useState(null);
  const [cancelledPageOpen, setCancelledPageOpen] = useState(false);
  const [completedPageOpen, setCompletedPageOpen] = useState(false);
  const [reviewForms, setReviewForms] = useState({});
  const [reviewSubmittingId, setReviewSubmittingId] = useState("");
  const [refreshingClient, setRefreshingClient] = useState(false);
  const bookingHistoryRef = useRef(null);
  const sectionRefs = useRef({});
  const savedProviderCount = new Set(
    bookings
      .map((booking) => booking.assignedProvider?._id || booking.requestedProvider?._id || booking.assignedProvider || booking.requestedProvider)
      .filter(Boolean)
      .map(String)
  ).size;
  const notifications = [
    ...bookings
      .filter((booking) => booking.estimateStatus === "submitted")
      .map((booking) => ({
        title: "Estimate ready",
        message: `${booking.service} has a final estimate. Accept or reject it from booking history.`,
      })),
    ...bookings
      .filter((booking) => booking.estimateStatus === "accepted" && booking.paymentStatus !== "paid")
      .map((booking) => ({
        title: "Payment pending",
        message: `Complete payment for ${booking.service} so the provider can finish the job.`,
      })),
    ...bookings
      .filter((booking) => booking.status === "confirmed" && booking.paymentStatus === "paid")
      .map((booking) => ({
        title: "Service confirmed",
        message: `${booking.service} payment is successful and the provider can complete the work.`,
      })),
  ].slice(0, 8);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const bookingSections = [
    {
      title: "Pending bookings",
      copy: "Requests waiting for provider response appear here.",
      bookings: bookings.filter((booking) => booking.status === "pending"),
    },
    {
      title: "Active bookings",
      copy: "Accepted, confirmed, and in-progress services appear here.",
      bookings: bookings.filter((booking) => ["accepted", "confirmed", "assigned", "on_the_way", "en_route", "arrived", "job_started"].includes(booking.status)),
    },
    {
      title: "Completed services",
      copy: "Finished services appear here.",
      bookings: bookings.filter((booking) => booking.status === "completed"),
    },
    {
      title: "Cancelled services",
      copy: "Cancelled bookings appear here.",
      bookings: bookings.filter((booking) => booking.status === "cancelled"),
    },
  ];
  const statusBlocks = [
    { title: "Pending", value: bookingSections[0].bookings.length, copy: "Waiting for provider response.", tone: "from-amber-50 to-white text-amber-700" },
    { title: "Active", value: bookingSections[1].bookings.length, copy: "Provider accepted and live work.", tone: "from-blue-50 to-white text-blue-700" },
    { title: "Completed", value: bookingSections[2].bookings.length, copy: "Finished service records.", tone: "from-emerald-50 to-white text-emerald-700" },
    { title: "Cancelled", value: bookingSections[3].bookings.length, copy: "Cancelled request records.", tone: "from-rose-50 to-white text-rose-700" },
  ];

  const updateReviewForm = (bookingId, updates) => {
    setReviewForms((current) => ({
      ...current,
      [bookingId]: {
        rating: current[bookingId]?.rating || 5,
        review: current[bookingId]?.review || "",
        ...updates,
      },
    }));
  };

  const submitReview = async (booking) => {
    const form = reviewForms[booking._id] || {};
    setReviewSubmittingId(booking._id);
    try {
      const updatedBooking = await onSubmitReview?.(booking._id, {
        rating: Number(form.rating || booking.clientRating || 5),
        review: form.review ?? booking.clientReview ?? "",
      });
      if (updatedBooking) {
        setReviewForms((current) => {
          const next = { ...current };
          delete next[booking._id];
          return next;
        });
      }
    } finally {
      setReviewSubmittingId("");
    }
  };

  const refreshBookings = async () => {
    if (!onRefreshBookings || refreshingClient) return;
    setRefreshingClient(true);
    try {
      await onRefreshBookings();
    } finally {
      setRefreshingClient(false);
    }
  };

  const renderBookingCard = (booking) => {
    const provider = booking.assignedProvider || booking.requestedProvider || null;
    const providerName = booking.assignedProviderName || booking.requestedProviderName || provider?.name || "Provider not accepted yet";
    const providerPrice = provider?.price || formatPrice(booking.costEstimate);
    const cancelState = getClientCancelState(booking, now);
    const showCancelAction = !["completed", "cancelled"].includes(booking.status);

    return (
      <div key={booking._id} className="client-service-card rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-lg font-black">{booking.service}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {booking.status !== "cancelled" && <ClientJobProgress booking={booking} />}

        <div className="mt-2 grid gap-2 lg:grid-cols-4">
          <div className="client-service-tile rounded-xl bg-slate-50 p-2.5 dark:bg-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Provider</p>
            <p className="mt-1 text-sm font-black">{providerName}</p>
            <p className="mt-0.5 text-xs text-slate-500">{provider?.phone || "Phone after acceptance"}</p>
          </div>
          <div className="client-service-tile rounded-xl bg-slate-50 p-2.5 dark:bg-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Date</p>
            <p className="mt-1 text-sm font-black">{formatBookingDate(booking.preferredDate)}</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatBookingTime(booking.preferredTime)}</p>
          </div>
          <div className="client-service-tile rounded-xl bg-slate-50 p-2.5 dark:bg-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Service</p>
            <p className="mt-1 text-sm font-black">{booking.service}</p>
            <p className="mt-0.5 text-xs text-slate-500">{booking.serviceDuration}</p>
          </div>
          <div className="client-service-tile rounded-xl bg-slate-50 p-2.5 dark:bg-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Money</p>
            <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-200">{formatPrice(booking.costEstimate)}</p>
            <p className="mt-0.5 text-xs font-bold text-teal-700 dark:text-teal-200">{providerPrice}</p>
          </div>
        </div>

        <div className="client-service-note mt-2 rounded-xl bg-amber-50 p-2.5 text-xs font-semibold text-slate-600 dark:bg-amber-300/10 dark:text-slate-300">
          Address: {booking.address}
          {booking.status !== "completed" && booking.problemDescription && <p className="mt-1">Problem: {booking.problemDescription}</p>}
        </div>
        <ClientPaymentSection
          booking={booking}
          providerStartingPrice={providerPrice}
          onAcceptEstimate={onAcceptEstimate}
          onRejectClick={() => setRejectTargetBooking(booking)}
          onPayNow={onPayNow}
          isPaying={payingBookingId === booking._id}
        />
        {booking.status === "cancelled" && (
          <div className="client-service-note danger mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
            Cancelled by: {booking.cancelledBy || "Not recorded"}
            {booking.cancelledAt && <p className="mt-1">Cancelled on: {formatBookingDate(booking.cancelledAt)}</p>}
            {booking.cancelledBy === "provider" && <p className="mt-1">Reason: {booking.cancellationReason || "Reason not provided"}</p>}
            {booking.adminRejectionReason && <p className="mt-1">Admin reason: {booking.adminRejectionReason}</p>}
          </div>
        )}
        {booking.status === "completed" && (
          <ClientReviewPanel
            booking={booking}
            form={reviewForms[booking._id]}
            submitting={reviewSubmittingId === booking._id}
            onChange={(updates) => updateReviewForm(booking._id, updates)}
            onSubmit={() => submitReview(booking)}
          />
        )}
        {showCancelAction && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500">
              {booking.acceptedAt ? "Cancellation closes 10 minutes after provider acceptance." : "You can cancel until a provider accepts, then for 10 more minutes."}
            </p>
            <button
              type="button"
              disabled={!cancelState.canCancel}
              onClick={async () => {
                const cancelledBooking = await cancelClientBooking(booking._id);
                if (cancelledBooking) {
                  setCancelledPageOpen(true);
                  window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                }
              }}
              className="client-cancel-button rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-rose-600/15 transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
            >
              {cancelState.label}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (cancelledPageOpen) {
    const cancelledBookings = bookingSections[3].bookings;
    return (
      <DashboardShell title="Cancelled Services" subtitle="Review every cancelled booking with provider, date, payment, address, and reason details." notifications={notifications}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setCancelledPageOpen(false)} aria-label="Back to client dashboard" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
            {cancelledBookings.length} cancelled
          </span>
        </div>
        <Panel title="Cancelled service details">
          <div className="grid gap-3 xl:grid-cols-2">
            {cancelledBookings.length ? cancelledBookings.map(renderBookingCard) : <EmptyState title="No cancelled services" copy="Cancelled bookings will appear here." />}
          </div>
        </Panel>
      </DashboardShell>
    );
  }

  if (completedPageOpen) {
    const completedBookings = bookingSections[2].bookings;
    return (
      <DashboardShell title="Completed Services" subtitle="Review every completed service with provider, date, payment, address, and service details." notifications={notifications}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setCompletedPageOpen(false)} aria-label="Back to client dashboard" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
            {completedBookings.length} completed
          </span>
        </div>
        <Panel title="Completed service details">
          <div className="grid gap-3 xl:grid-cols-2">
            {completedBookings.length ? completedBookings.map(renderBookingCard) : <EmptyState title="No completed services" copy="Completed bookings will appear here." />}
          </div>
        </Panel>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={isProviderClientMode ? t("clientBookingDashboard") : t("clientDashboardTitle")}
      subtitle={isProviderClientMode ? t("providerClientSubtitle") : t("clientDashboardSubtitle")}
      notifications={notifications}
      workspaceLabel={t("workspace")}
      headerActions={(
        <button
          type="button"
          onClick={refreshBookings}
          disabled={refreshingClient}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-300 dark:text-slate-950"
        >
          <RefreshCw size={17} className={refreshingClient ? "animate-spin" : ""} />
          {refreshingClient ? "Refreshing" : "Refresh"}
        </button>
      )}
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <button type="button" onClick={onBrowseServices} className="rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5">
          {t("browseServices")}
        </button>
        {isProviderClientMode && (
          <>
            <button type="button" onClick={onProviderDashboard} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
              {t("providerDashboardButton")}
            </button>
          </>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard icon={CalendarCheck} label="My bookings" value={bookings.length} />
        <StatCard icon={Heart} label="Saved providers" value={savedProviderCount} />
        <StatCard icon={Star} label="Pending reviews" value={bookings.filter((booking) => booking.status === "completed" && !booking.clientRating).length} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {statusBlocks.map((block, index) => (
          <button
            key={block.title}
            type="button"
            onClick={() => {
              if (block.title === "Completed") {
                setCompletedPageOpen(true);
                return;
              }
              if (block.title === "Cancelled") {
                setCancelledPageOpen(true);
                return;
              }
              sectionRefs.current[bookingSections[index].title]?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${block.tone} p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:from-white/10 dark:to-white/5`}
          >
            <p className="text-3xl font-black text-slate-950 dark:text-white">{block.value}</p>
            <p className="mt-1 font-black">{block.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{block.copy}</p>
            {block.title === "Cancelled" && (
              <span className="mt-3 inline-flex rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-600/15">
                Cancelled services
              </span>
            )}
            {block.title === "Completed" && (
              <span className="mt-3 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/15">
                Completed services
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-8">
        <Panel title="Booking history">
          <div ref={bookingHistoryRef} className="grid gap-5">
            {bookings.length ? bookingSections.filter((section) => !["Completed services", "Cancelled services"].includes(section.title)).map((section) => (
              <section key={section.title} ref={(node) => { sectionRefs.current[section.title] = node; }} className="scroll-mt-28 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">{section.title}</h3>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-300">{section.copy}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-200">{section.bookings.length}</span>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {section.bookings.length ? section.bookings.map(renderBookingCard) : <EmptyState title={`No ${section.title.toLowerCase()}`} copy={section.copy} />}
                </div>
              </section>
            )) : <EmptyState title="No bookings yet" copy="Booked services will show here with provider, date, time, and price details." />}
          </div>
        </Panel>
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={() => setActiveView("home")} className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white dark:bg-amber-300 dark:text-slate-950">{t("bookAnotherService")}</button>
        </div>
      </div>
      <AnimatePresence>
        {rejectTargetBooking && (
          <RejectEstimateModal
            booking={rejectTargetBooking}
            onClose={() => setRejectTargetBooking(null)}
            onReject={async (reason) => {
              await onRejectEstimate(rejectTargetBooking._id, reason);
              setRejectTargetBooking(null);
            }}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function ClientServiceStatusStrip({ booking }) {
  const status = booking.status || "pending";
  const normalizedStatus = normalizeTrackingStatus(status);
  const activeIndex = getActiveStepIndex(status);
  const trackingEvents = booking.trackingEvents || [];

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Service status</p>
          <p className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">
            {trackingSteps[activeIndex]?.label || "Booking confirmed"}
          </p>
        </div>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700 dark:bg-orange-400/15 dark:text-orange-100">
          {String(status).replace(/_/g, " ")}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-5">
        {trackingSteps.map((step, index) => {
          const event = getLatestTrackingEvent(trackingEvents, step);
          const isDone = index < activeIndex || status === "completed";
          const isActive = step.id === normalizedStatus || (status === "pending" && index === 0);

          return (
            <div key={step.id} className={`rounded-xl border px-3 py-2 ${isActive ? "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-300/30 dark:bg-orange-400/10 dark:text-orange-100" : isDone ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100" : "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-500"}`}>
              <div className="flex items-center gap-2">
                <span className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${isActive ? "border-orange-500 bg-orange-500 text-white" : isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white dark:border-white/10 dark:bg-white/10"}`}>
                  {isDone || isActive ? <CheckCircle size={12} strokeWidth={3} /> : index + 1}
                </span>
                <span className="text-xs font-black leading-tight">{step.label}</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold leading-tight opacity-75">
                {event?.updatedAt ? formatTrackingEventTime(event.updatedAt) : isActive ? "Current status" : step.copy}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientJobProgress({ booking }) {
  const status = booking.status || "pending";
  const normalizedStatus = normalizeTrackingStatus(status);
  const activeIndex = getActiveStepIndex(status);
  const trackingEvents = booking.trackingEvents || [];
  const isPendingRequest = status === "pending";
  const timestampFallbacks = {
    booking_confirmed: booking.acceptedAt || booking.assignedAt || booking.updatedAt || booking.createdAt,
    en_route: booking.providerLocation?.updatedAt,
    arrived: trackingEvents.find((event) => event.status === "arrived")?.updatedAt,
    job_started: trackingEvents.find((event) => event.status === "job_started")?.updatedAt,
    completed: booking.completedAt,
  };

  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-4 text-slate-950 shadow-md shadow-blue-900/5 dark:border-white/10 dark:bg-white/95 dark:text-slate-950">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Track order</p>
          <p className="mt-1 text-sm font-black text-slate-950">{isPendingRequest ? "Request pending" : trackingSteps[activeIndex]?.label || "Booking confirmed"}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black capitalize text-blue-700">
          {String(status).replace(/_/g, " ")}
        </span>
      </div>
      <div className="grid gap-0">
        {trackingSteps.map((step, index) => {
          const event = getLatestTrackingEvent(trackingEvents, step);
          const displayStep = isPendingRequest && step.id === "booking_confirmed"
            ? { ...step, label: "Request pending", copy: "Waiting for provider acceptance" }
            : step;
          const isDone = index < activeIndex || status === "completed";
          const isActive = step.id === normalizedStatus || (status === "pending" && index === 0);
          const isMuted = !isDone && !isActive;
          const updatedAt = event?.updatedAt || timestampFallbacks[step.id];

          return (
            <div key={step.id} className="relative grid grid-cols-[34px_1fr] gap-3 pb-4 last:pb-0">
              {index < trackingSteps.length - 1 && (
                <span className={`absolute left-[16px] top-7 h-full w-0.5 ${isDone ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
              <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 bg-white ${isActive ? "border-blue-600 text-blue-600 shadow-[0_0_0_5px_rgba(37,99,235,0.12)]" : isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}>
                {isDone ? <CheckCircle size={15} strokeWidth={3} /> : isActive ? <span className="h-2.5 w-2.5 rounded-full bg-current" /> : index + 1}
              </span>
              <div className={`min-w-0 rounded-xl px-2 pb-1 ${isActive ? "bg-blue-50/70" : ""}`}>
                <p className={`text-base font-black ${isMuted ? "text-slate-400" : isDone ? "text-emerald-700" : "text-blue-700"}`}>{displayStep.label}</p>
                <p className={`mt-1 text-sm font-bold ${isMuted ? "text-slate-400" : "text-slate-500"}`}>
                  {updatedAt ? `Updated ${formatTrackingEventTime(updatedAt)}` : displayStep.copy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientPaymentSection({ booking, providerStartingPrice, onAcceptEstimate, onRejectClick, onPayNow, isPaying }) {
  const estimateStatus = booking.estimateStatus || "not_submitted";
  const paymentStatus = booking.paymentStatus || "unpaid";
  const hasEstimate = estimateStatus !== "not_submitted" || booking.finalEstimateAmount;
  const startingPrice = providerStartingPrice || booking.assignedProvider?.price || booking.requestedProvider?.price || "Not available";
  const startingPriceAmount = parseMoneyValue(startingPrice);
  const providerEstimateAmount = Number(booking.finalEstimateAmount || 0);
  const finalEstimateTotal = providerEstimateAmount > 0 ? providerEstimateAmount + startingPriceAmount : 0;
  const estimateHistory = Array.isArray(booking.estimateHistory) ? booking.estimateHistory : [];
  const latestEstimateEntry = estimateHistory.length ? estimateHistory[estimateHistory.length - 1] : null;
  const previousEstimateEntries = estimateHistory.length > 1 ? [...estimateHistory].slice(0, -1).reverse() : [];
  if (!hasEstimate) return null;

  return (
    <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-400/20 dark:bg-teal-400/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-200">Payment & Estimate</p>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Provider sends the latest final estimate before online payment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EstimateStatusBadge status={estimateStatus} />
          <PaymentStatusBadge status={paymentStatus} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Provider Starting Price</p>
          <p className="mt-1 font-black text-teal-700 dark:text-teal-200">{startingPrice}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">Registered on platform</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Final Estimate</p>
          <p className="mt-1 font-black text-emerald-700 dark:text-emerald-200">{finalEstimateTotal ? formatMoney(finalEstimateTotal) : "Waiting"}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
            {providerEstimateAmount > 0 ? `${formatMoney(startingPriceAmount)} + ${formatMoney(providerEstimateAmount)}` : "Submitted by provider"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Payment Status</p>
          <div className="mt-1"><PaymentStatusBadge status={paymentStatus} /></div>
        </div>
      </div>
      {latestEstimateEntry?.submittedAt && (
        <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
          <p className="font-black">Latest estimate sent</p>
          <p className="mt-1">{formatEstimateTimestamp(latestEstimateEntry.submittedAt)} for {formatMoney(latestEstimateEntry.amount)}</p>
        </div>
      )}
      {previousEstimateEntries.length > 0 && (
        <div className="mt-4 rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-sm font-black text-slate-900 dark:text-white">Estimate history</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {previousEstimateEntries.map((entry, index) => (
              <div key={`${entry.submittedAt || index}-${entry.amount}`} className="rounded-2xl border border-slate-200 px-3 py-2 dark:border-white/10">
                <p className="font-semibold">{formatMoney(entry.amount)}</p>
                <p>{formatEstimateTimestamp(entry.submittedAt)} · {entry.status === "rejected" ? "Rejected" : "Revised"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {estimateStatus === "submitted" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => onAcceptEstimate(booking._id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/15 transition hover:-translate-y-0.5">
            <CheckCircle size={18} /> Accept Estimate
          </button>
          <button type="button" onClick={onRejectClick} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/15 transition hover:-translate-y-0.5">
            <XCircle size={18} /> Reject Estimate
          </button>
        </div>
      )}
      {estimateStatus === "accepted" && paymentStatus !== "paid" && (
        <button type="button" onClick={() => onPayNow(booking)} disabled={isPaying} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 disabled:opacity-60">
          <CreditCard size={18} /> {isPaying ? "Opening checkout..." : "Pay now"}
        </button>
      )}
      {paymentStatus === "paid" && (
        <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100">
          <span className="inline-flex items-center gap-2"><CheckCircle size={18} /> Payment completed successfully</span>
          {booking.razorpayPaymentId && <p className="mt-2 break-all text-xs text-emerald-700 dark:text-emerald-100">Payment ID: {booking.razorpayPaymentId}</p>}
        </div>
      )}
      {estimateStatus === "rejected" && (
        <div className="mt-4 rounded-xl bg-orange-100 px-4 py-3 text-sm font-black text-orange-800 dark:bg-orange-400/10 dark:text-orange-100">
          Estimate rejected. Rs. 200 penalty applied.
        </div>
      )}
    </div>
  );
}

function ClientReviewPanel({ booking, form, submitting, onChange, onSubmit }) {
  const selectedRating = Number(form?.rating || booking.clientRating || 5);
  const reviewText = form?.review ?? booking.clientReview ?? "";
  const alreadyReviewed = Boolean(booking.clientRating);

  return (
    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-300/20 dark:bg-amber-300/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">{alreadyReviewed ? "Your review" : "Rate this service"}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">Share feedback about the provider's work.</p>
        </div>
        {alreadyReviewed && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm dark:bg-white/10 dark:text-amber-100">Reviewed</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange({ rating })}
            className={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-black transition hover:-translate-y-0.5 ${rating <= selectedRating ? "border-amber-300 bg-amber-300 text-slate-950 shadow-sm" : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/10"}`}
            aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
          >
            <Star size={17} fill={rating <= selectedRating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea
        value={reviewText}
        onChange={(event) => onChange({ review: event.target.value })}
        rows="3"
        maxLength="600"
        placeholder="Write a short review for this provider..."
        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-300/20 dark:border-white/10 dark:bg-slate-950 dark:text-white"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{reviewText.length}/600 characters</p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-300 dark:text-slate-950"
        >
          {submitting ? "Saving..." : alreadyReviewed ? "Update review" : "Submit review"}
        </button>
      </div>
    </div>
  );
}

function ProviderDashboard({ providerProfile, providerRequests, providerBookings, providerEarnings, acceptProviderRequest, updateProviderBookingStatus, submitEstimate, refreshDashboard, setStatusMessage, providerDashboardLocked, onBookAsClient, toggleProviderAvailability }) {
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [estimateTargetBooking, setEstimateTargetBooking] = useState(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [historyPageOpen, setHistoryPageOpen] = useState(false);
  const historySectionRef = useRef(null);
  const confirmedJobs = providerBookings.filter((booking) => !["completed", "cancelled"].includes(booking.status));
  const historyJobs = providerBookings.filter((booking) => ["completed", "cancelled"].includes(booking.status));
  const earningsSummary = providerEarnings?.summary || {};
  const awaitingClientPayment = providerBookings.filter((booking) => booking.estimateStatus === "accepted" && booking.paymentStatus !== "paid").length;
  const approvalStatus = providerProfile?.approvalStatus || "pending";
  const isDashboardLocked = Boolean(providerDashboardLocked || !providerProfile || approvalStatus !== "approved");
  const approvalTitle = approvalStatus === "rejected" ? "Approval not granted" : "Waiting for admin approval";
  const approvalCopy = approvalStatus === "rejected"
    ? "Your provider request was rejected by admin. Please update your profile or contact support before taking jobs."
    : "Your provider registration is under admin review. The dashboard will unlock automatically after admin approval.";
  const notifications = [
    ...(isDashboardLocked ? [{ title: approvalTitle, message: approvalCopy }] : []),
    ...providerRequests.map((booking) => ({
      title: "New client request",
      message: `New ${booking.service} request is waiting. Client name and phone unlock after accept.`,
    })),
    ...providerBookings
      .filter((booking) => booking.paymentStatus === "paid" && booking.status !== "completed")
      .map((booking) => ({
        title: "Payment received",
        message: `${booking.service} is paid. You can now mark it completed.`,
      })),
    ...providerBookings
      .filter((booking) => booking.estimateStatus === "accepted" && booking.paymentStatus !== "paid")
      .map((booking) => ({
        title: "Waiting for client payment",
        message: `${booking.service} estimate accepted, payment is still pending.`,
      })),
  ].slice(0, 8);
  const token = localStorage.getItem("servicehub_token");
  const handleBookingAlert = useCallback((event) => {
    setStatusMessage(`New booking alert: ${event.clientName || "Client"} shared ${event.clientLocation ? "GPS location" : "an address"} for ${event.service}.`);
    refreshDashboard?.();
  }, [refreshDashboard, setStatusMessage]);

  useProviderAlerts({
    apiUrl: API_URL,
    token,
    enabled: Boolean(providerProfile) && !isDashboardLocked,
    onBookingAlert: handleBookingAlert,
  });

  if (isDashboardLocked) {
    return (
      <DashboardShell title="Provider Dashboard" subtitle="Your provider workspace will open after admin approval." notifications={notifications}>
        <ProviderApprovalWaitCard
          approvalStatus={approvalStatus}
          approvalTitle={approvalTitle}
          approvalCopy={approvalCopy}
          refreshDashboard={refreshDashboard}
        />
      </DashboardShell>
    );
  }

  if (historyPageOpen) {
    return (
      <ProviderClientHistoryPage
        historyJobs={historyJobs}
        notifications={notifications}
        refreshDashboard={refreshDashboard}
        onBack={() => setHistoryPageOpen(false)}
      />
    );
  }

  return (
    <DashboardShell
      title="Provider Dashboard"
      subtitle="A premium workspace for accepting requests, managing revenue, and completing service work."
      notifications={notifications}
      headerActions={(
        <button type="button" onClick={onBookAsClient} className="rounded-full bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5">
          Book as client
        </button>
      )}
    >
      <div className="relative">
        <div className={isDashboardLocked ? "pointer-events-none select-none blur-sm opacity-45" : ""} aria-hidden={isDashboardLocked}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#fffefb] px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <span className="text-sm font-black text-slate-700 dark:text-slate-300">
            Available for Work
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={providerProfile?.isActive}
            onClick={() => toggleProviderAvailability?.(!providerProfile?.isActive)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              providerProfile?.isActive ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                providerProfile?.isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black capitalize ${
              providerProfile?.isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
            }`}
          >
            {providerProfile?.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <button type="button" onClick={refreshDashboard} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950">
          Refresh dashboard
        </button>
      </div>
      <div className="grid gap-5 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Projected earnings" value={`Rs. ${providerBookings.reduce((sum, booking) => sum + (booking.costEstimate || 0), 0).toLocaleString("en-IN")}`} />
        <StatCard icon={Bell} label="New requests" value={providerRequests.length} />
        <StatCard icon={BriefcaseBusiness} label="Accepted jobs" value={providerBookings.length} />
        <StatCard icon={Star} label="Rating" value={providerProfile?.rating || "0.0"} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-4">
        <ProviderWithdrawCard earningsSummary={earningsSummary} providerProfile={providerProfile} onWithdrawClick={() => setWithdrawOpen(true)} />
        <PaymentSummaryCard icon={Clock} title="Pending Earnings" amount={formatMoney(earningsSummary.pendingEarnings || 0)} description="Expected 80% share from pending payments." />
        <PaymentSummaryCard icon={CheckCircle} title="Completed Paid Bookings" amount={earningsSummary.totalBookingsPaid || 0} description="Bookings with verified Razorpay payments." />
        <PaymentSummaryCard icon={CreditCard} title="Awaiting Client Payment" amount={awaitingClientPayment} description="Accepted estimates waiting for checkout." />
      </div>
      <div className="mt-8">
        <Panel title="New client requests">
          <div className="grid gap-4">
            {providerRequests.length ? providerRequests.map((booking) => (
              <JobCard key={booking._id} booking={booking} actionLabel="Accept request" onAction={() => acceptProviderRequest(booking._id)} alertMode />
            )) : <EmptyState title="No new requests" copy={`New ${providerProfile?.category || "service"} bookings will appear here.`} />}
          </div>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Confirmed service jobs">
          <div className="grid gap-4">
            {confirmedJobs.length ? confirmedJobs.map((booking) => (
              <div key={booking._id} className="grid gap-3">
                <JobCard
                  booking={booking}
                  secondaryAction={() => setCancelTargetBooking(booking)}
                  onEstimateClick={(booking.status === "arrived" || (booking.status === "job_started" && booking.paymentStatus !== "paid")) ? () => setEstimateTargetBooking(booking) : null}
                />
                <ProviderRoutePanel
                  booking={booking}
                  updateProviderBookingStatus={updateProviderBookingStatus}
                  setStatusMessage={setStatusMessage}
                  apiUrl={API_URL}
                />
              </div>
            )) : <EmptyState title="No confirmed jobs yet" copy="Accepted client jobs will appear here until they are completed or cancelled." />}
          </div>
        </Panel>
        <Panel title="Client history" className="scroll-mt-28" sectionRef={historySectionRef}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div>
              <p className="text-sm font-black text-slate-950 dark:text-white">{historyJobs.length} history record{historyJobs.length === 1 ? "" : "s"}</p>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">Open the full page to review every completed and cancelled client job.</p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryPageOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
            >
              Open all history <ArrowRight size={17} />
            </button>
          </div>
        </Panel>
      </div>
        </div>
        {isDashboardLocked && (
          <div className="absolute inset-x-0 top-6 z-20 flex justify-center px-4">
            <div className="w-full max-w-2xl rounded-[1.75rem] border border-amber-200 bg-white/95 p-6 text-center text-slate-950 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-amber-300/30 dark:bg-slate-900/95 dark:text-white">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">
                <Clock size={25} />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">{approvalStatus}</p>
              <h2 className="mt-2 text-2xl font-black">{approvalTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{approvalCopy}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={refreshDashboard} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 dark:bg-amber-300 dark:text-slate-950">
                  Check approval status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {!isDashboardLocked && cancelTargetBooking && (
          <ProviderCancelModal
            booking={cancelTargetBooking}
            onClose={() => setCancelTargetBooking(null)}
            onSubmit={async (reason) => {
              const updated = await updateProviderBookingStatus(cancelTargetBooking._id, "cancelled", reason);
              if (updated) setCancelTargetBooking(null);
            }}
          />
        )}
        {!isDashboardLocked && estimateTargetBooking && (
          <ProviderEstimateModal
            booking={estimateTargetBooking}
            onClose={() => setEstimateTargetBooking(null)}
            onSubmit={async (amount) => {
              await submitEstimate(estimateTargetBooking._id, amount);
              setEstimateTargetBooking(null);
            }}
          />
        )}
        {!isDashboardLocked && withdrawOpen && (
          <ProviderWithdrawModal
            availableAmount={earningsSummary.availableToWithdraw || 0}
            onClose={() => setWithdrawOpen(false)}
            onSubmit={async (bankDetails) => {
              const data = await withdrawProviderEarnings(bankDetails);
              setStatusMessage(data.message || "Withdrawal completed.");
              setWithdrawOpen(false);
              await refreshDashboard();
            }}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function ProviderClientHistoryPage({ historyJobs, notifications, refreshDashboard, onBack }) {
  const completedCount = historyJobs.filter((booking) => booking.status === "completed").length;
  const cancelledCount = historyJobs.filter((booking) => booking.status === "cancelled").length;

  return (
    <DashboardShell
      title="Client History"
      subtitle="All completed and cancelled client jobs for your provider account."
      notifications={notifications}
      headerActions={(
        <>
          <button type="button" onClick={onBack} className="rounded-full bg-slate-100 px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
            Back to dashboard
          </button>
          <button type="button" onClick={refreshDashboard} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950">
            Refresh
          </button>
        </>
      )}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard icon={BriefcaseBusiness} label="History records" value={historyJobs.length} />
        <StatCard icon={CheckCircle} label="Completed jobs" value={completedCount} />
        <StatCard icon={XCircle} label="Cancelled jobs" value={cancelledCount} />
      </div>
      <div className="mt-8">
        <Panel title="All client history">
          <div className="grid gap-4 lg:grid-cols-2">
            {historyJobs.length ? historyJobs.map((booking) => (
              <JobCard key={booking._id} booking={booking} />
            )) : <EmptyState title="No completed or cancelled jobs yet" copy="Finished and cancelled jobs will appear here as history." />}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}

function ProviderApprovalWaitCard({ approvalStatus, approvalTitle, approvalCopy, refreshDashboard }) {
  return (
    <section className="mx-auto mt-8 grid min-h-[52vh] max-w-3xl place-items-center rounded-[2rem] border border-amber-200 bg-white p-6 text-center text-slate-950 shadow-xl shadow-slate-950/10 dark:border-amber-300/30 dark:bg-white/5 dark:text-white sm:p-10">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">
          <Clock size={30} />
        </div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">{approvalStatus}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">{approvalTitle}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600 dark:text-slate-300">{approvalCopy}</p>
        <button type="button" onClick={refreshDashboard} className="mt-7 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950">
          Check approval status
        </button>
      </div>
    </section>
  );
}

function ProviderWithdrawCard({ earningsSummary, providerProfile, onWithdrawClick }) {
  const totalPaid = earningsSummary.totalPaidEarnings || providerProfile?.paidEarnings || 0;
  const available = earningsSummary.availableToWithdraw || 0;
  const adminReleased = earningsSummary.adminReleasedAmount || 0;
  const withdrawn = earningsSummary.withdrawnAmount || 0;

  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-500 dark:text-slate-300">Total Paid Earnings</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{formatMoney(totalPaid)}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
          <Wallet size={21} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500 dark:text-slate-300">
        <p>Admin released: <span className="font-black text-slate-950 dark:text-white">{formatMoney(adminReleased)}</span></p>
        <p>Already withdrawn: <span className="font-black text-slate-950 dark:text-white">{formatMoney(withdrawn)}</span></p>
        <p>Available to withdraw: <span className="font-black text-emerald-700 dark:text-emerald-100">{formatMoney(available)}</span></p>
      </div>
      <button
        type="button"
        onClick={onWithdrawClick}
        disabled={available <= 0}
        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {available > 0 ? "Withdraw to bank account" : "Waiting for admin payout"}
      </button>
    </div>
  );
}

function ProviderWithdrawModal({ availableAmount, onClose, onSubmit }) {
  const [form, setForm] = useState({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/70 p-4 backdrop-blur"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        className="w-full max-w-xl rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-200">Withdraw earnings</p>
            <h2 className="mt-2 text-2xl font-black">Send {formatMoney(availableAmount)} to bank</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">Enter your bank details to withdraw the amount released by admin.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={18} /></button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormInput label="Account holder" value={form.accountHolder} onChange={update("accountHolder")} placeholder="Full name" />
          <FormInput label="Bank name" value={form.bankName} onChange={update("bankName")} placeholder="Bank name" />
          <FormInput label="Account number" value={form.accountNumber} onChange={update("accountNumber")} placeholder="Account number" />
          <FormInput label="IFSC code" value={form.ifscCode} onChange={update("ifscCode")} placeholder="Example: SBIN0001234" />
        </div>
        <button type="submit" disabled={submitting || availableAmount <= 0} className="mt-6 w-full rounded-2xl bg-slate-950 px-6 py-4 font-black text-white shadow-lg shadow-slate-950/10 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-amber-300 dark:text-slate-950">
          {submitting ? "Withdrawing..." : `Withdraw ${formatMoney(availableAmount)}`}
        </button>
      </motion.form>
    </motion.div>
  );
}

function AdminPanel({ adminData, selectedProviders, setSelectedProviders, updateProviderApproval, updateBookingRequest, setAdminData, refreshAdminContactMessages, setStatusMessage, adminEmail, paymentData, refreshAdminPayments }) {
  const adminBatchSize = 4;
  const providerHistoryBatchSize = 2;
  const [visibleClientRequestCount, setVisibleClientRequestCount] = useState(adminBatchSize);
  const [visibleCompletedHistoryCount, setVisibleCompletedHistoryCount] = useState(adminBatchSize);
  const [visibleProviderPermissionCount, setVisibleProviderPermissionCount] = useState(adminBatchSize);
  const [visibleProviderHistoryCount, setVisibleProviderHistoryCount] = useState(providerHistoryBatchSize);
  const [expandedAdminProviderId, setExpandedAdminProviderId] = useState("");
  const [clientRequestsOpen, setClientRequestsOpen] = useState(false);
  const [clientMessagesOpen, setClientMessagesOpen] = useState(false);
  const [acceptedRequestsOpen, setAcceptedRequestsOpen] = useState(false);
  const [completedHistoryOpen, setCompletedHistoryOpen] = useState(false);
  const [adminPaymentPageOpen, setAdminPaymentPageOpen] = useState(false);
  const [rejectReasons, setRejectReasons] = useState({});
  const [contactReplyDrafts, setContactReplyDrafts] = useState({});

  useEffect(() => {
    if (clientRequestsOpen || completedHistoryOpen || clientMessagesOpen || acceptedRequestsOpen || adminPaymentPageOpen) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [clientRequestsOpen, completedHistoryOpen, clientMessagesOpen, acceptedRequestsOpen, adminPaymentPageOpen]);

  if (!adminData) {
    return <DashboardShell title="Admin Panel" subtitle="Load the admin panel from the navigation after signing in as admin."><EmptyState title="No admin data loaded" copy="Sign in as admin and open the admin panel." /></DashboardShell>;
  }

  const allAdminBookings = adminData.bookings || [];
  const clientRequests = allAdminBookings.filter((booking) => booking.status !== "completed" && !(booking.status === "cancelled" && (["client", "admin"].includes(booking.cancelledBy) || booking.adminRejectedAt || booking.adminRejectionReason)));
  const completedHistory = allAdminBookings.filter((booking) => booking.status === "completed" || (booking.status === "cancelled" && (booking.cancelledBy === "client" || booking.adminRejectedAt || booking.adminRejectionReason)));
  const visibleClientRequests = clientRequests.slice(0, visibleClientRequestCount);
  const pendingClientRequests = visibleClientRequests.filter((booking) => booking.status === "pending");
  const confirmedClientRequests = visibleClientRequests.filter((booking) => booking.status === "confirmed");
  const assignedClientRequests = visibleClientRequests.filter((booking) => booking.status === "assigned");
  const providerCancelledRequests = visibleClientRequests.filter((booking) => booking.status === "cancelled" && booking.cancelledBy === "provider");
  const clientRequestSections = [
    ...(providerCancelledRequests.length
      ? [{ title: "Active requests", emptyTitle: "No provider-cancelled requests", emptyCopy: "Provider-cancelled bookings that need a new provider will appear here.", bookings: providerCancelledRequests }]
      : []),
    { title: "Pending profiles", emptyTitle: "No pending profiles", emptyCopy: "Client bookings with pending status will appear here.", bookings: pendingClientRequests },
    { title: "Confirmed profiles", emptyTitle: "No confirmed profiles", emptyCopy: "Client bookings with confirmed status will appear here.", bookings: confirmedClientRequests },
    { title: "Assigned profiles", emptyTitle: "No assigned profiles", emptyCopy: "Client bookings assigned to providers will appear here.", bookings: assignedClientRequests },
  ];
  const hasMoreClientRequests = visibleClientRequestCount < clientRequests.length;
  const canShowLessClientRequests = visibleClientRequestCount > adminBatchSize;
  const visibleCompletedHistory = completedHistory.slice(0, visibleCompletedHistoryCount);
  const hasMoreCompletedHistory = visibleCompletedHistoryCount < completedHistory.length;
  const canShowLessCompletedHistory = visibleCompletedHistoryCount > adminBatchSize;
  const allProviders = adminData.providers || [];
  const providerPermissions = allProviders.filter((provider) => provider.approvalStatus === "pending");
  const providerPermissionHistory = allProviders.filter((provider) => ["approved", "rejected"].includes(provider.approvalStatus));
  const visibleProviderPermissions = providerPermissions.slice(0, visibleProviderPermissionCount);
  const hasMoreProviderPermissions = visibleProviderPermissionCount < providerPermissions.length;
  const canShowLessProviderPermissions = visibleProviderPermissionCount > adminBatchSize;
  const visibleProviderHistory = providerPermissionHistory.slice(0, visibleProviderHistoryCount);
  const hasMoreProviderHistory = visibleProviderHistoryCount < providerPermissionHistory.length;
  const canShowLessProviderHistory = visibleProviderHistoryCount > providerHistoryBatchSize;
  const contactMessages = sortContactMessages(adminData.contactMessages || []);
  const acceptedProviderRequests = allAdminBookings
    .filter((booking) => {
      const provider = booking.assignedProvider || booking.requestedProvider || null;
      const acceptedByProvider = Boolean(booking.acceptedAt) || ["accepted", "assigned", "confirmed", "on_the_way", "en_route", "arrived", "job_started"].includes(booking.status);
      return acceptedByProvider && provider && !["completed", "cancelled"].includes(booking.status);
    })
    .sort((first, second) => new Date(second.acceptedAt || second.assignedAt || second.updatedAt || second.createdAt || 0) - new Date(first.acceptedAt || first.assignedAt || first.updatedAt || first.createdAt || 0));

  if (adminPaymentPageOpen) {
    return (
      <AdminPaymentPage
        paymentData={paymentData}
        onBack={() => setAdminPaymentPageOpen(false)}
      />
    );
  }

  const markContactMessageReplied = (message, reply) => {
    const repliedMessage = {
      ...message,
      adminReply: reply,
      repliedAt: new Date().toISOString(),
      status: "replied",
    };

    saveContactReply(message._id, reply);
    setAdminData((current) => ({
      ...current,
      contactMessages: sortContactMessages(
        (current?.contactMessages || []).map((currentMessage) =>
          currentMessage._id === message._id ? repliedMessage : currentMessage
        )
      ),
    }));
    setContactReplyDrafts((current) => ({ ...current, [message._id]: "" }));

    fetch(`${API_URL}/admin/contact-messages/${message._id}/mark-replied`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("servicehub_token")}`,
      },
      body: JSON.stringify({ reply }),
    })
      .then(() => refreshAdminContactMessages({ silent: true }))
      .catch(() => {});
  };

  const replyToContactMessage = (message) => {
    const reply = contactReplyDrafts[message._id]?.trim() || "";

    if (!reply) return;

    const subject = "ServiceHub support reply";
    const body = [
      `Hi ${message.name || "there"},`,
      "",
      reply,
      "",
      "Original message:",
      message.message || "",
    ].join("\n");
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: message.email,
      su: subject,
      body,
    });

    if (adminEmail) {
      params.set("cc", adminEmail);
    }

    window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank", "noopener,noreferrer");
    markContactMessageReplied(message, reply);
    setStatusMessage("Gmail opened. Message marked as replied in admin panel.");
  };

  const replyToContactMessageByWhatsApp = (message) => {
    const reply = contactReplyDrafts[message._id]?.trim() || "";
    const whatsappNumber = getWhatsAppNumber(message.phone);

    if (!reply) return;

    if (!whatsappNumber) {
      setStatusMessage("Client registered phone number is not available for WhatsApp.");
      return;
    }

    const whatsappBody = [
      `Hi ${message.name || "there"},`,
      "",
      reply,
      "",
      "Original message:",
      message.message || "",
    ].join("\n");

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappBody)}`, "_blank", "noopener,noreferrer");
    markContactMessageReplied(message, reply);
    setStatusMessage("WhatsApp opened with the registered number. Message marked as replied in admin panel.");
  };

  const toggleAdminProviderDetails = (providerId) => {
    setExpandedAdminProviderId((current) => (current === providerId ? "" : providerId));
  };

  if (clientRequestsOpen) {
    return (
      <DashboardShell
        title="Client Requests"
        subtitle="Review client details, provider details, assignments, and request actions."
        notifications={clientRequests.slice(0, 4).map((booking) => ({
          title: "Client request",
          message: `${booking.service} from ${booking.userName || booking.name} needs admin attention.`,
        }))}
      >
        <motion.div
          key="admin-client-requests-page"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid gap-5"
        >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="font-black text-slate-950 dark:text-white">{clientRequests.length} client requests</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">All client request information is shown on this page.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => refreshAdminPayments?.()}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
            >
              Refresh requests
            </button>
            <button
              type="button"
              onClick={() => setClientRequestsOpen(false)}
              className="rounded-full border border-teal-200 bg-white px-5 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
            >
              Back to admin panel
            </button>
          </div>
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          {clientRequestSections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{section.title}</p>
              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{section.bookings.length}</p>
            </div>
          ))}
        </div>
        <Panel title="Client request details">
          <div className="grid gap-5">
            {clientRequestSections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-100 p-4 dark:border-white/10">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-black text-slate-950 dark:text-white">{section.title}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-200">{section.bookings.length}</span>
                </div>
                <div className="grid gap-4">
                  {section.bookings.map((booking) => {
                    const providers = allProviders.filter((provider) => provider.approvalStatus === "approved" && provider.isActive && provider.category === booking.service);
                    const assignedProvider = booking.assignedProvider || null;
                    const requestedProvider = booking.requestedProvider || null;
                    const providerName = assignedProvider?.name || booking.assignedProviderName || requestedProvider?.name || booking.requestedProviderName || "Provider not assigned";
                    const providerPhone = assignedProvider?.phone || requestedProvider?.phone || "Phone not available";
                    const providerLocation = assignedProvider?.location || requestedProvider?.location || "Location not available";
                    const clientName = booking.user?.name || booking.userName || booking.name;
                    const clientEmail = booking.user?.email || booking.userEmail || "Email not available";
                    const canManageRequest = booking.status === "accepted" || (booking.status === "cancelled" && booking.cancelledBy === "provider");
                    const hasAvailableProviders = providers.length > 0;
                    const canAssignRequest = canManageRequest && hasAvailableProviders;
                    const canRejectRequest = !hasAvailableProviders && ["pending", "accepted", "cancelled"].includes(booking.status);
                    return (
                      <div key={booking._id} className="rounded-2xl border border-slate-200 p-5 dark:border-white/10">
                        <div className="flex flex-wrap justify-between gap-3">
                          <div><p className="font-black">{booking.service}</p><p className="text-sm text-slate-500">{formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}</p></div>
                          <div className="flex flex-wrap justify-end gap-2">
                            {booking.status === "cancelled" && booking.cancelledBy === "provider" && (
                              <span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Cancelled by provider</span>
                            )}
                            <StatusBadge status={booking.status} />
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Client info</p>
                            <p className="mt-2 font-black">{clientName}</p>
                            <p className="mt-1 text-sm text-slate-500">{booking.phone}</p>
                            <p className="mt-1 break-words text-sm text-slate-500">{clientEmail}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Address: {booking.address}</p>
                            {booking.problemDescription && <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Problem: {booking.problemDescription}</p>}
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Provider info</p>
                            <p className="mt-2 font-black">{providerName}</p>
                            <p className="mt-1 text-sm text-slate-500">{providerPhone}</p>
                            <p className="mt-1 text-sm text-slate-500">{providerLocation}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Duration: {booking.serviceDuration}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Estimate: {formatPrice(booking.costEstimate)}</p>
                          </div>
                        </div>
                        {booking.status === "cancelled" && (
                          <div className="mt-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-4 shadow-sm dark:border-rose-400/20 dark:from-rose-400/10 dark:to-amber-300/10">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-500">Cancellation notice</p>
                                <p className="mt-1 text-lg font-black text-rose-800 dark:text-rose-100">Cancelled by {booking.cancelledBy || "not recorded"}</p>
                              </div>
                              {booking.cancelledAt && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-rose-700 shadow-sm dark:bg-white/10 dark:text-rose-100">{formatBookingDate(booking.cancelledAt)}</span>}
                            </div>
                            {booking.cancelledBy === "provider" && (
                              <div className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
                                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Provider reason</span>
                                <p className="mt-1">{booking.cancellationReason || "Reason not provided"}</p>
                              </div>
                            )}
                            {booking.status === "cancelled" && booking.cancelledBy === "provider" && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-100/70 px-3 py-2 text-sm font-black text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">Assign a new provider below to continue this client request.</p>}
                          </div>
                        )}
                        {canAssignRequest && (
                          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                            <select value={selectedProviders[booking._id] || booking.assignedProvider?._id || ""} onChange={(event) => setSelectedProviders((current) => ({ ...current, [booking._id]: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950">
                              <option value="">Choose provider</option>
                              {providers.map((provider) => <option key={provider._id} value={provider._id}>{provider.name} - {provider.location}</option>)}
                            </select>
                            <button type="button" onClick={() => updateBookingRequest(booking._id, { status: "accepted" })} className="rounded-xl bg-slate-100 px-4 py-3 font-black dark:bg-white/10">Accept</button>
                            <button type="button" onClick={() => updateBookingRequest(booking._id, { providerId: selectedProviders[booking._id] || booking.assignedProvider?._id })} className="rounded-xl bg-slate-950 px-4 py-3 font-black text-white dark:bg-amber-300 dark:text-slate-950">Assign</button>
                            {booking.status === "cancelled" && booking.cancelledBy === "provider" && (
                              <button
                                type="button"
                                disabled={!rejectReasons[booking._id]?.trim()}
                                onClick={() => updateBookingRequest(booking._id, { status: "cancelled", adminRejectionReason: rejectReasons[booking._id] || "" })}
                                className="rounded-full bg-rose-600 px-5 py-3 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:translate-y-0"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        )}
                        {canRejectRequest && (
                          <label className="mt-3 grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                            Reason for client
                            <textarea
                              value={rejectReasons[booking._id] || ""}
                              onChange={(event) => setRejectReasons((current) => ({ ...current, [booking._id]: event.target.value }))}
                              placeholder="Explain why this service request is cancelled."
                              rows="3"
                              className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-400 dark:border-white/10 dark:bg-slate-950"
                            />
                          </label>
                        )}
                        {canRejectRequest && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-400/20 dark:bg-rose-400/10">
                            <p className="text-sm font-black text-rose-700 dark:text-rose-100">No active provider is available for this request.</p>
                            <button
                              type="button"
                              disabled={!rejectReasons[booking._id]?.trim()}
                              onClick={() => updateBookingRequest(booking._id, { status: "cancelled", adminRejectionReason: rejectReasons[booking._id] || "" })}
                              className="rounded-full bg-rose-600 px-5 py-3 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:translate-y-0"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!section.bookings.length && <EmptyState title={section.emptyTitle} copy={section.emptyCopy} />}
                </div>
              </section>
            ))}
            {!clientRequests.length && <EmptyState title="No client requests" copy="New client bookings will appear here for admin review." />}
            {(hasMoreClientRequests || canShowLessClientRequests) && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {hasMoreClientRequests && (
                  <button
                    type="button"
                    onClick={() => setVisibleClientRequestCount((count) => Math.min(count + adminBatchSize, clientRequests.length))}
                    className="rounded-full bg-gradient-to-r from-teal-700 to-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:shadow-xl dark:from-teal-500 dark:to-cyan-600 dark:text-white"
                  >
                    View more
                  </button>
                )}
                {canShowLessClientRequests && (
                  <button
                    type="button"
                    onClick={() => setVisibleClientRequestCount(adminBatchSize)}
                    className="rounded-full border border-teal-200 bg-white px-6 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
                  >
                    View less
                  </button>
                )}
              </div>
            )}
          </div>
        </Panel>
        </motion.div>
      </DashboardShell>
    );
  }

  if (completedHistoryOpen) {
    return (
      <DashboardShell
        title="Completed Service History"
        subtitle="Review completed, cancelled, and admin-rejected service records."
        notifications={completedHistory.slice(0, 4).map((booking) => ({
          title: "Service history",
          message: `${booking.service} for ${booking.userName || booking.name || "Client"} is recorded as ${booking.status}.`,
        }))}
      >
        <motion.div
          key="admin-service-history-page"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid gap-5"
        >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="font-black text-slate-950 dark:text-white">{completedHistory.length} history records</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">All completed and cancelled service details are shown on this page.</p>
          </div>
          <button
            type="button"
            onClick={() => setCompletedHistoryOpen(false)}
            className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-white/10 dark:text-emerald-100"
          >
            Back to admin panel
          </button>
        </div>
        <Panel title="Service history details">
          <div className="grid gap-4">
            {visibleCompletedHistory.map((booking) => {
              const provider = booking.assignedProvider || booking.requestedProvider || null;
              const providerName = booking.assignedProviderName || booking.requestedProviderName || provider?.name || "Provider not recorded";
              const clientName = booking.user?.name || booking.userName || booking.name;
              return (
                <div key={booking._id} className={`rounded-2xl border p-5 ${booking.status === "cancelled" ? "border-rose-100 bg-rose-50/60 dark:border-rose-400/20 dark:bg-rose-400/10" : "border-emerald-100 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-400/10"}`}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950 dark:text-white">{booking.service}</p>
                      <p className="text-sm text-slate-500">{formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {booking.status === "cancelled" && booking.cancelledBy === "provider" && (
                        <span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Cancelled by provider</span>
                      )}
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Client</p>
                      <p className="mt-2 font-black">{clientName}</p>
                      <p className="mt-1 text-sm text-slate-500">{booking.phone}</p>
                      <p className="mt-1 break-words text-sm text-slate-500">{booking.user?.email || booking.userEmail || "Email not available"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Provider</p>
                      <p className="mt-2 font-black">{providerName}</p>
                      <p className="mt-1 text-sm text-slate-500">{provider?.phone || "Phone not available"}</p>
                      <p className="mt-1 text-sm text-slate-500">{provider?.location || "Location not available"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Service details</p>
                      <p className="mt-2 font-black">{formatPrice(booking.costEstimate)}</p>
                      <p className="mt-1 text-sm text-slate-500">{booking.serviceDuration}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.status === "cancelled"
                          ? `Cancelled: ${booking.cancelledAt ? formatBookingDate(booking.cancelledAt) : "Marked cancelled"}`
                          : `Completed: ${booking.completedAt ? formatBookingDate(booking.completedAt) : "Marked completed"}`}
                      </p>
                      {booking.status === "cancelled" && <p className="mt-1 text-sm text-slate-500">Cancelled by: {booking.cancelledBy || "Not recorded"}</p>}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
                    Address: {booking.address}
                    {booking.problemDescription && <p className="mt-2">Problem: {booking.problemDescription}</p>}
                    {booking.status === "cancelled" && <p className="mt-2">Cancellation: {booking.adminRejectionReason || booking.cancellationReason || "Cancelled by client"}</p>}
                  </div>
                </div>
              );
            })}
            {!completedHistory.length && <EmptyState title="No completed services yet" copy="Completed, client-cancelled, and admin-rejected services will appear here as history." />}
            {(hasMoreCompletedHistory || canShowLessCompletedHistory) && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {hasMoreCompletedHistory && (
                  <button type="button" onClick={() => setVisibleCompletedHistoryCount((count) => Math.min(count + adminBatchSize, completedHistory.length))} className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5">
                    View more history
                  </button>
                )}
                {canShowLessCompletedHistory && (
                  <button type="button" onClick={() => setVisibleCompletedHistoryCount(adminBatchSize)} className="rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-white/10 dark:text-emerald-100">
                    View less history
                  </button>
                )}
              </div>
            )}
          </div>
        </Panel>
        </motion.div>
      </DashboardShell>
    );
  }

  if (clientMessagesOpen) {
    return (
      <DashboardShell
        title="Client Messages"
        subtitle="Review every client message and reply by email or WhatsApp."
        notifications={contactMessages.slice(0, 4).map((message) => ({
          title: message.status === "replied" || message.adminReply ? "Replied message" : "New client message",
          message: `${message.name || "Client"} sent a support request.`,
        }))}
      >
        <motion.div
          key="admin-client-messages-page"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid gap-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="font-black text-slate-950 dark:text-white">{contactMessages.length} client messages</p>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">All contact form submissions are shown on this page.</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => refreshAdminContactMessages()}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
              >
                Refresh messages
              </button>
              <button
                type="button"
                onClick={() => setClientMessagesOpen(false)}
                className="rounded-full border border-teal-200 bg-white px-5 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
              >
                Back to admin panel
              </button>
            </div>
          </div>
          <Panel title="Client message details">
            <div className="grid gap-4">
              {contactMessages.map((message) => {
                const isReplied = message.status === "replied" || Boolean(message.adminReply);
                return (
                  <div key={message._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950 dark:text-white">{message.name}</p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-500">{message.email}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{message.phone || "No registered phone"}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {isReplied ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-100">Replied</span>
                        ) : (
                          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-700 dark:bg-teal-300/15 dark:text-teal-100">New</span>
                        )}
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-200">{formatBookingDate(message.createdAt)}</span>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-slate-600 shadow-sm dark:bg-slate-950/60 dark:text-slate-300">
                      <p className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Client problem</p>
                      {message.message}
                    </div>
                    {isReplied ? (
                      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
                        <p className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">Admin response</p>
                        {message.adminReply}
                      </div>
                    ) : (
                      <>
                        <label className="mt-4 grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                          Reply to client
                          <textarea
                            value={contactReplyDrafts[message._id] || ""}
                            onChange={(event) => setContactReplyDrafts((current) => ({ ...current, [message._id]: event.target.value }))}
                            placeholder="Write the solution or follow-up message for this client."
                            rows="3"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950"
                          />
                        </label>
                        <div className="mt-3 flex flex-wrap justify-end gap-3">
                          <button
                            type="button"
                            disabled={!contactReplyDrafts[message._id]?.trim()}
                            onClick={() => replyToContactMessage(message)}
                            className="rounded-full bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          >
                            Reply by email
                          </button>
                          <button
                            type="button"
                            disabled={!contactReplyDrafts[message._id]?.trim() || !getWhatsAppNumber(message.phone)}
                            onClick={() => replyToContactMessageByWhatsApp(message)}
                            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          >
                            Reply by WhatsApp
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {!contactMessages.length && <EmptyState title="No client messages" copy="Messages submitted from the contact form will appear here." />}
            </div>
          </Panel>
          <AdminAcceptedProviderRequests bookings={acceptedProviderRequests} />
        </motion.div>
      </DashboardShell>
    );
  }

  if (acceptedRequestsOpen) {
    return (
      <DashboardShell
        title="Accepted Provider Requests"
        subtitle="View every client request accepted by a provider."
        notifications={acceptedProviderRequests.slice(0, 4).map((booking) => ({
          title: "Provider accepted",
          message: `${booking.assignedProviderName || booking.requestedProviderName || "Provider"} accepted ${booking.service} for ${booking.userName || booking.name || "Client"}.`,
        }))}
      >
        <motion.div
          key="admin-accepted-provider-requests-page"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid gap-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="font-black text-slate-950 dark:text-white">{acceptedProviderRequests.length} accepted requests</p>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">All provider-accepted client request history is shown here.</p>
            </div>
            <button
              type="button"
              onClick={() => setAcceptedRequestsOpen(false)}
              className="rounded-full border border-teal-200 bg-white px-5 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
            >
              Back to admin panel
            </button>
          </div>
          <AdminAcceptedProviderRequests bookings={acceptedProviderRequests} />
        </motion.div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Admin Panel"
      subtitle="Manage requests, provider approvals, and assignment quality."
      notifications={[
        ...clientRequests.slice(0, 4).map((booking) => ({
          title: "Client request",
          message: `${booking.service} from ${booking.userName || booking.name} needs admin attention.`,
        })),
        ...allProviders
          .filter((provider) => provider.approvalStatus === "pending")
          .slice(0, 4)
          .map((provider) => ({
            title: "Provider approval",
            message: `${provider.name} is waiting for provider permission review.`,
          })),
      ]}
    >
      <AdminPaymentOverview paymentData={paymentData} setStatusMessage={setStatusMessage} refreshAdminPayments={refreshAdminPayments} onOpenPaymentPage={() => setAdminPaymentPageOpen(true)} />
      <div className="mb-6 grid gap-4 rounded-[1.35rem] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">Operations command center</p>
          <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Monitor bookings, providers, payments, and support from one workspace.</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">Review active client requests, approve provider permissions, inspect service history, and release payouts with a consistent admin workflow.</p>
        </div>
        <div className="grid content-center gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
          {[
            ["Open requests", clientRequests.length],
            ["Pending providers", providerPermissions.length],
            ["Client messages", contactMessages.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-black">{value}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Bookings" value={adminData.stats.totalBookings} />
        <StatCard icon={Bell} label="Open work" value={adminData.stats.pendingWork} />
        <StatCard icon={UserRoundCheck} label="Providers" value={adminData.stats.totalProviders} />
        <StatCard icon={IndianRupee} label="Estimate" value={`Rs. ${adminData.stats.totalCostEstimate.toLocaleString("en-IN")}`} />
      </div>
      <div className="mt-8 grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid content-start gap-5">
        <Panel title="Client requests">
          {!clientRequestsOpen ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{clientRequests.length} client requests</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-300">Manage active, pending, confirmed, and assigned bookings.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setClientRequestsOpen(true)}
                  className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
                >
                  Open client requests
                </button>
              </div>
            </div>
          ) : (
          <div className="grid gap-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setClientRequestsOpen(false)}
                className="rounded-full border border-teal-200 bg-white px-5 py-2.5 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
              >
                Hide client requests
              </button>
            </div>
            {clientRequestSections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-100 p-4 dark:border-white/10">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-black text-slate-950 dark:text-white">{section.title}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-200">{section.bookings.length}</span>
                </div>
                <div className="grid gap-4">
            {section.bookings.map((booking) => {
              const providers = allProviders.filter((provider) => provider.approvalStatus === "approved" && provider.isActive && provider.category === booking.service);
              const assignedProvider = booking.assignedProvider || null;
              const requestedProvider = booking.requestedProvider || null;
              const providerName = assignedProvider?.name || booking.assignedProviderName || requestedProvider?.name || booking.requestedProviderName || "Provider not assigned";
              const providerPhone = assignedProvider?.phone || requestedProvider?.phone || "Phone not available";
              const providerLocation = assignedProvider?.location || requestedProvider?.location || "Location not available";
              const clientName = booking.user?.name || booking.userName || booking.name;
              const clientEmail = booking.user?.email || booking.userEmail || "Email not available";
              const canManageRequest = booking.status === "accepted" || (booking.status === "cancelled" && booking.cancelledBy === "provider");
              const hasAvailableProviders = providers.length > 0;
              const canAssignRequest = canManageRequest && hasAvailableProviders;
              const canRejectRequest = !hasAvailableProviders && ["pending", "accepted", "cancelled"].includes(booking.status);
              return (
                <div key={booking._id} className="rounded-2xl border border-slate-200 p-5 dark:border-white/10">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div><p className="font-black">{booking.service}</p><p className="text-sm text-slate-500">{formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}</p></div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {booking.status === "cancelled" && booking.cancelledBy === "provider" && (
                        <span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Cancelled by provider</span>
                      )}
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Client info</p>
                      <p className="mt-2 font-black">{clientName}</p>
                      <p className="mt-1 text-sm text-slate-500">{booking.phone}</p>
                      <p className="mt-1 break-words text-sm text-slate-500">{clientEmail}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Address: {booking.address}</p>
                      {booking.problemDescription && <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Problem: {booking.problemDescription}</p>}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Provider info</p>
                      <p className="mt-2 font-black">{providerName}</p>
                      <p className="mt-1 text-sm text-slate-500">{providerPhone}</p>
                      <p className="mt-1 text-sm text-slate-500">{providerLocation}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Duration: {booking.serviceDuration}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Estimate: {formatPrice(booking.costEstimate)}</p>
                    </div>
                  </div>
                  {booking.status === "cancelled" && (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-4 shadow-sm dark:border-rose-400/20 dark:from-rose-400/10 dark:to-amber-300/10">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-500">Cancellation notice</p>
                          <p className="mt-1 text-lg font-black text-rose-800 dark:text-rose-100">Cancelled by {booking.cancelledBy || "not recorded"}</p>
                        </div>
                        {booking.cancelledAt && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-rose-700 shadow-sm dark:bg-white/10 dark:text-rose-100">{formatBookingDate(booking.cancelledAt)}</span>}
                      </div>
                      {booking.cancelledBy === "provider" && (
                        <div className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Provider reason</span>
                          <p className="mt-1">{booking.cancellationReason || "Reason not provided"}</p>
                        </div>
                      )}
                      {booking.status === "cancelled" && booking.cancelledBy === "provider" && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-100/70 px-3 py-2 text-sm font-black text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">Assign a new provider below to continue this client request.</p>}
                    </div>
                  )}
                  {canAssignRequest && (
                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                      <select value={selectedProviders[booking._id] || booking.assignedProvider?._id || ""} onChange={(event) => setSelectedProviders((current) => ({ ...current, [booking._id]: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950">
                        <option value="">Choose provider</option>
                        {providers.map((provider) => <option key={provider._id} value={provider._id}>{provider.name} - {provider.location}</option>)}
                      </select>
                      <button type="button" onClick={() => updateBookingRequest(booking._id, { status: "accepted" })} className="rounded-xl bg-slate-100 px-4 py-3 font-black dark:bg-white/10">Accept</button>
                      <button type="button" onClick={() => updateBookingRequest(booking._id, { providerId: selectedProviders[booking._id] || booking.assignedProvider?._id })} className="rounded-xl bg-slate-950 px-4 py-3 font-black text-white dark:bg-amber-300 dark:text-slate-950">Assign</button>
                      {booking.status === "cancelled" && booking.cancelledBy === "provider" && (
                        <button
                          type="button"
                          disabled={!rejectReasons[booking._id]?.trim()}
                          onClick={() => updateBookingRequest(booking._id, { status: "cancelled", adminRejectionReason: rejectReasons[booking._id] || "" })}
                          className="rounded-full bg-rose-600 px-5 py-3 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:translate-y-0"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  )}
                  {canRejectRequest && (
                    <label className="mt-3 grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                      Reason for client
                      <textarea
                        value={rejectReasons[booking._id] || ""}
                        onChange={(event) => setRejectReasons((current) => ({ ...current, [booking._id]: event.target.value }))}
                        placeholder="Explain why this service request is cancelled."
                        rows="3"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-400 dark:border-white/10 dark:bg-slate-950"
                      />
                    </label>
                  )}
                  {canRejectRequest && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-400/20 dark:bg-rose-400/10">
                      <p className="text-sm font-black text-rose-700 dark:text-rose-100">No active provider is available for this request.</p>
                      <button
                        type="button"
                        disabled={!rejectReasons[booking._id]?.trim()}
                        onClick={() => updateBookingRequest(booking._id, { status: "cancelled", adminRejectionReason: rejectReasons[booking._id] || "" })}
                        className="rounded-full bg-rose-600 px-5 py-3 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:translate-y-0"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
                  {!section.bookings.length && <EmptyState title={section.emptyTitle} copy={section.emptyCopy} />}
                </div>
              </section>
            ))}
            {!clientRequests.length && <EmptyState title="No client requests" copy="New client bookings will appear here for admin review." />}
            {(hasMoreClientRequests || canShowLessClientRequests) && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {hasMoreClientRequests && (
                  <button
                    type="button"
                    onClick={() => setVisibleClientRequestCount((count) => Math.min(count + adminBatchSize, clientRequests.length))}
                    className="rounded-full bg-gradient-to-r from-teal-700 to-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:shadow-xl dark:from-teal-500 dark:to-cyan-600 dark:text-white"
                  >
                    View more
                  </button>
                )}
                {canShowLessClientRequests && (
                  <button
                    type="button"
                    onClick={() => setVisibleClientRequestCount(adminBatchSize)}
                    className="rounded-full border border-teal-200 bg-white px-6 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
                  >
                    View less
                  </button>
                )}
              </div>
            )}
          </div>
          )}
        </Panel>
        <Panel title="Completed service history">
          {!completedHistoryOpen ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{completedHistory.length} history records</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-300">View completed, cancelled, and admin-rejected services.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletedHistoryOpen(true)}
                  className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
                >
                  Open service history
                </button>
              </div>
            </div>
          ) : (
          <div className="grid gap-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCompletedHistoryOpen(false)}
                className="rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-white/10 dark:text-emerald-100"
              >
                Hide service history
              </button>
            </div>
            {visibleCompletedHistory.map((booking) => {
              const provider = booking.assignedProvider || booking.requestedProvider || null;
              const providerName = booking.assignedProviderName || booking.requestedProviderName || provider?.name || "Provider not recorded";
              const clientName = booking.user?.name || booking.userName || booking.name;
              return (
                <div key={booking._id} className={`rounded-2xl border p-5 ${booking.status === "cancelled" ? "border-rose-100 bg-rose-50/60 dark:border-rose-400/20 dark:bg-rose-400/10" : "border-emerald-100 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-400/10"}`}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950 dark:text-white">{booking.service}</p>
                      <p className="text-sm text-slate-500">{formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {booking.status === "cancelled" && booking.cancelledBy === "provider" && (
                        <span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Cancelled by provider</span>
                      )}
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Client</p>
                      <p className="mt-2 font-black">{clientName}</p>
                      <p className="mt-1 text-sm text-slate-500">{booking.phone}</p>
                      <p className="mt-1 break-words text-sm text-slate-500">{booking.user?.email || booking.userEmail || "Email not available"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Provider</p>
                      <p className="mt-2 font-black">{providerName}</p>
                      <p className="mt-1 text-sm text-slate-500">{provider?.phone || "Phone not available"}</p>
                      <p className="mt-1 text-sm text-slate-500">{provider?.location || "Location not available"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Service details</p>
                      <p className="mt-2 font-black">{formatPrice(booking.costEstimate)}</p>
                      <p className="mt-1 text-sm text-slate-500">{booking.serviceDuration}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.status === "cancelled"
                          ? `Cancelled: ${booking.cancelledAt ? formatBookingDate(booking.cancelledAt) : "Marked cancelled"}`
                          : `Completed: ${booking.completedAt ? formatBookingDate(booking.completedAt) : "Marked completed"}`}
                      </p>
                      {booking.status === "cancelled" && <p className="mt-1 text-sm text-slate-500">Cancelled by: {booking.cancelledBy || "Not recorded"}</p>}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
                    Address: {booking.address}
                    {booking.problemDescription && <p className="mt-2">Problem: {booking.problemDescription}</p>}
                    {booking.status === "cancelled" && <p className="mt-2">Cancellation: {booking.adminRejectionReason || booking.cancellationReason || "Cancelled by client"}</p>}
                  </div>
                </div>
              );
            })}
            {!completedHistory.length && <EmptyState title="No completed services yet" copy="Completed, client-cancelled, and admin-rejected services will appear here as history." />}
            {(hasMoreCompletedHistory || canShowLessCompletedHistory) && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {hasMoreCompletedHistory && (
                  <button type="button" onClick={() => setVisibleCompletedHistoryCount((count) => Math.min(count + adminBatchSize, completedHistory.length))} className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5">
                    View more history
                  </button>
                )}
                {canShowLessCompletedHistory && (
                  <button type="button" onClick={() => setVisibleCompletedHistoryCount(adminBatchSize)} className="rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-white/10 dark:text-emerald-100">
                    View less history
                  </button>
                )}
              </div>
            )}
          </div>
          )}
        </Panel>
        <Panel title="Client messages">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">{contactMessages.length} client messages</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-300">View and reply to every contact form message.</p>
              </div>
              <button
                type="button"
                onClick={() => setClientMessagesOpen(true)}
                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
              >
                Open client messages
              </button>
            </div>
          </div>
        </Panel>
        <AdminAcceptedProviderRequests bookings={acceptedProviderRequests} totalCount={acceptedProviderRequests.length} compact />
        </div>
        <div className="grid content-start gap-5">
        <Panel title="Provider permissions">
          <div className="grid gap-4">
            {visibleProviderPermissions.map((provider) => (
              <div key={provider._id} className="rounded-2xl border border-slate-200 p-5 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleAdminProviderDetails(provider._id)}
                    className="text-left transition hover:translate-x-1"
                  >
                    <p className="font-black text-slate-950 underline-offset-4 hover:text-teal-700 hover:underline dark:text-white">{provider.name}</p>
                    <p className="text-sm text-slate-500">{provider.category} | {provider.location}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAdminProviderDetails(provider._id)}
                    className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-black text-teal-800 transition hover:-translate-y-0.5 hover:bg-teal-100 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-100"
                  >
                    {expandedAdminProviderId === provider._id ? "Hide profile" : "View profile"}
                  </button>
                </div>
                <StatusBadge status={provider.approvalStatus} />
                {expandedAdminProviderId === provider._id && <AdminProviderDetails provider={provider} />}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => updateProviderApproval(provider._id, "approved")} className="rounded-xl bg-slate-100 px-4 py-3 font-black text-slate-950 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">Allow</button>
                  <button type="button" onClick={() => updateProviderApproval(provider._id, "rejected")} className="rounded-xl bg-slate-950 px-4 py-3 font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-teal-600">Reject</button>
                </div>
              </div>
            ))}
            {!providerPermissions.length && <EmptyState title="No pending provider permissions" copy="Approved and rejected provider requests move into history automatically." />}
            {(hasMoreProviderPermissions || canShowLessProviderPermissions) && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {hasMoreProviderPermissions && (
                  <button
                    type="button"
                    onClick={() => setVisibleProviderPermissionCount((count) => Math.min(count + adminBatchSize, providerPermissions.length))}
                    className="rounded-full bg-gradient-to-r from-teal-700 to-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:shadow-xl dark:from-teal-500 dark:to-cyan-600 dark:text-white"
                  >
                    View more
                  </button>
                )}
                {canShowLessProviderPermissions && (
                  <button
                    type="button"
                    onClick={() => setVisibleProviderPermissionCount(adminBatchSize)}
                    className="rounded-full border border-teal-200 bg-white px-6 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
                  >
                    View less
                  </button>
                )}
              </div>
            )}
          </div>
        </Panel>
        <Panel title="Provider permission history">
          <div className="grid gap-4">
            {visibleProviderHistory.map((provider) => (
              <div key={provider._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleAdminProviderDetails(provider._id)}
                    className="text-left transition hover:translate-x-1"
                  >
                    <p className="font-black text-slate-950 underline-offset-4 hover:text-teal-700 hover:underline dark:text-white">{provider.name}</p>
                    <p className="text-sm text-slate-500">{provider.category} | {provider.location}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAdminProviderDetails(provider._id)}
                    className="rounded-full border border-teal-200 bg-white px-4 py-2 text-xs font-black text-teal-800 transition hover:-translate-y-0.5 hover:bg-teal-50 dark:border-teal-400/30 dark:bg-white/10 dark:text-teal-100"
                  >
                    {expandedAdminProviderId === provider._id ? "Hide profile" : "View profile"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={provider.approvalStatus} />
                    {provider.approvalStatus === "approved" && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black capitalize ${provider.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"}`}>
                        {provider.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    {provider.approvalStatus === "approved"
                      ? `Approved ${formatBookingDate(provider.approvedAt || provider.updatedAt)}`
                    : `Rejected ${formatBookingDate(provider.updatedAt)}`}
                  </span>
                </div>
                {expandedAdminProviderId === provider._id && <AdminProviderDetails provider={provider} />}
                {provider.approvalStatus === "approved" && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => updateProviderApproval(provider._id, "rejected")}
                      className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-teal-600"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!providerPermissionHistory.length && <EmptyState title="No provider history yet" copy="Approved and rejected provider permissions will appear here." />}
            {(hasMoreProviderHistory || canShowLessProviderHistory) && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {hasMoreProviderHistory && (
                  <button
                    type="button"
                    onClick={() => setVisibleProviderHistoryCount((count) => Math.min(count + providerHistoryBatchSize, providerPermissionHistory.length))}
                    className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5"
                  >
                    View more history
                  </button>
                )}
                {canShowLessProviderHistory && (
                  <button
                    type="button"
                    onClick={() => setVisibleProviderHistoryCount((count) => Math.max(count - providerHistoryBatchSize, providerHistoryBatchSize))}
                    className="rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-white/10 dark:text-emerald-100"
                  >
                    View less history
                  </button>
                )}
              </div>
            )}
          </div>
        </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}

function AdminAcceptedProviderRequests({ bookings = [], compact = false, totalCount = bookings.length }) {
  const [compactOpen, setCompactOpen] = useState(false);
  const shouldShowDetails = !compact || compactOpen;

  return (
    <Panel title="Provider accepted client requests">
      <div className="grid gap-4">
        {compact && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">{totalCount} accepted requests</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-300">View all client requests accepted by providers.</p>
              </div>
              <button
                type="button"
                onClick={() => setCompactOpen((current) => !current)}
                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
              >
                {compactOpen ? "Hide accepted history" : "Open accepted history"}
              </button>
            </div>
          </div>
        )}
        {shouldShowDetails && bookings.map((booking) => {
          const provider = booking.assignedProvider || booking.requestedProvider || null;
          const providerName = booking.assignedProviderName || booking.requestedProviderName || provider?.name || "Provider";
          const clientName = booking.user?.name || booking.userName || booking.name || "Client";
          const acceptedDate = booking.acceptedAt || booking.assignedAt || booking.updatedAt || booking.createdAt;

          return (
            <div key={booking._id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-300/20 dark:bg-emerald-300/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">Accepted request</p>
                  <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{booking.service}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
                    {formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Client</p>
                  <p className="mt-2 font-black text-slate-950 dark:text-white">{clientName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{booking.phone || booking.user?.phone || "Phone not available"}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-500">{booking.user?.email || booking.userEmail || "Email not available"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Provider</p>
                  <p className="mt-2 font-black text-slate-950 dark:text-white">{providerName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{provider?.phone || "Phone not available"}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{provider?.location || "Location not available"}</p>
                </div>
              </div>
              {!compact && (
                <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
                  <p>Accepted: {acceptedDate ? formatDateTime(acceptedDate) : "Accepted time not recorded"}</p>
                  <p className="mt-1">Address: {booking.address || "Address not available"}</p>
                  {booking.problemDescription && <p className="mt-1">Problem: {booking.problemDescription}</p>}
                </div>
              )}
            </div>
          );
        })}
        {shouldShowDetails && !bookings.length && (
          <EmptyState
            title="No accepted provider requests"
            copy="When a provider accepts a client request, the details will appear here."
          />
        )}
      </div>
    </Panel>
  );
}

function AdminProviderDetails({ provider }) {
  const bankDetails = provider.bankDetails || {};
  const features = Array.isArray(provider.features) && provider.features.length ? provider.features.join(", ") : "Not added";
  const detailRows = [
    ["Provider code", provider.providerCode || "Not available"],
    ["Name", provider.name || "Not available"],
    ["Email", provider.email || "Not available"],
    ["Phone", provider.phone || "Not available"],
    ["Category", provider.category || "Not available"],
    ["Location", provider.location || "Not available"],
    ["Approval", provider.approvalStatus || "pending"],
    ["Active", provider.isActive ? "Yes" : "No"],
    ["Available", provider.isAvailable ? "Yes" : "No"],
    ["Rating", `${provider.rating || 0} (${provider.reviews || 0} reviews)`],
    ["Response time", provider.responseTime || "Not set"],
    ["Price", provider.price || "Not set"],
    ["Total earnings", formatMoney(provider.totalEarnings || 0)],
    ["Pending earnings", formatMoney(provider.pendingEarnings || 0)],
    ["Paid earnings", formatMoney(provider.paidEarnings || 0)],
    ["Bank holder", bankDetails.accountHolder || "Not added"],
    ["Bank name", bankDetails.bankName || "Not added"],
    ["Account number", bankDetails.accountNumber || "Not added"],
    ["IFSC code", bankDetails.ifscCode || "Not added"],
    ["Created", formatDateTime(provider.createdAt) || "Not available"],
    ["Updated", formatDateTime(provider.updatedAt) || "Not available"],
    ["Approved", formatDateTime(provider.approvedAt) || "Not approved"],
  ];

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
      <div className="grid gap-3 sm:grid-cols-2">
        {detailRows.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-white/10">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/10">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Description</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{provider.description || "Not added"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/10">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">About</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{provider.about || "Not added"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/10">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Features</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{features}</p>
        </div>
      </div>
    </div>
  );
}

function AdminPaymentPage({ paymentData, onBack }) {
  const overview = paymentData?.overview || {};
  const recentPayments = paymentData?.recentPayments || [];
  const providerPayoutHistory = paymentData?.providerPayoutHistory || [];
  const providerPayouts = paymentData?.providerPayouts || [];
  const payoutHistoryByProvider = Object.values(
    providerPayoutHistory.reduce((groups, entry) => {
      const key = entry.providerId || entry.providerName || "unknown-provider";
      if (!groups[key]) {
        groups[key] = {
          providerId: entry.providerId,
          providerName: entry.providerName,
          providerCategory: entry.providerCategory,
          totalAmount: 0,
          entries: [],
        };
      }
      groups[key].totalAmount += entry.amount || 0;
      groups[key].entries.push(entry);
      return groups;
    }, {})
  ).map((group) => ({
    ...group,
    entries: group.entries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
  }));
  const notifications = [
    ...providerPayouts
      .filter((payout) => Number(payout.totalPayable || payout.readyToWithdraw || 0) > 0)
      .slice(0, 2)
      .map((payout) => ({
        title: "Provider payout ready",
        message: `${payout.name || "Provider"} has ${formatMoney(payout.totalPayable || payout.readyToWithdraw || 0)} ready to release.`,
      })),
    ...recentPayments.slice(0, 2).map((payment) => ({
      title: "Payment update",
      message: `${payment.booking?.service || "Booking"} payment is ${payment.status || "updated"}.`,
    })),
  ];

  return (
    <DashboardShell
      title="Admin Payments"
      subtitle="View revenue, platform commission, provider payable amounts, payout history, and payment transactions."
      notifications={notifications}
      headerActions={(
        <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
          <ArrowLeft size={17} />
          Back to admin
        </button>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PaymentSummaryCard icon={IndianRupee} title="Gross Revenue" amount={formatMoney(overview.grossRevenue || 0)} />
        <PaymentSummaryCard icon={ShieldCheck} title="Platform Commission 20%" amount={formatMoney(overview.platformRevenue || 0)} />
        <PaymentSummaryCard icon={Wallet} title="Provider Payable 80%" amount={formatMoney(overview.providerPayable || 0)} />
        <PaymentSummaryCard icon={AlertTriangle} title="Penalty Collected" amount={formatMoney(overview.penaltyCollected || 0)} />
        <PaymentSummaryCard icon={Clock} title="Pending Payments" amount={overview.pendingPayments || 0} />
        <PaymentSummaryCard icon={CheckCircle} title="Paid Bookings" amount={overview.paidPayments || 0} />
      </div>

      <div className="mt-6 grid gap-5">
        <Panel title="Provider payout history">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Money released by admin to provider dashboard balances.</p>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {payoutHistoryByProvider.length ? payoutHistoryByProvider.map((group) => (
              <div key={group.providerId || group.providerName} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black leading-tight text-slate-950 dark:text-white">{group.providerName || "Provider"}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">{group.providerCategory || "Provider"} | {group.entries.length} transaction{group.entries.length === 1 ? "" : "s"}</p>
                  </div>
                  <p className="font-black text-slate-950 dark:text-white">{formatMoney(group.totalAmount || 0)}</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="rounded-xl bg-white p-3 dark:bg-slate-950">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black leading-tight text-slate-950 dark:text-white">{formatMoney(entry.amount || 0)}</p>
                          <p className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">{formatDateTime(entry.createdAt)}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${entry.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100" : entry.status === "failed" ? "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-100" : "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-100"}`}>
                          {entry.status || "pending"}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-300 sm:grid-cols-2">
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Provider ID: {entry.providerId || "Not available"}</span>
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Sent by: {entry.metadata?.sentBy || "Admin"}</span>
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Sent at: {formatDateTime(entry.metadata?.sentAt || entry.createdAt)}</span>
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Payout ref: {entry.metadata?.razorpayPayoutId || entry.id || "Ledger payout"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : <EmptyState title="No provider payouts sent yet" copy="Successful admin payments to providers will appear here." />}
          </div>
        </Panel>

        <Panel title="Payment transaction records">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Razorpay Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {recentPayments.map((payment) => {
                  const booking = payment.booking || {};
                  const user = payment.user || {};
                  const provider = payment.provider || {};
                  return (
                    <tr key={payment._id} className="align-top">
                      <td className="px-4 py-3 font-bold">{user.name || booking.userName || "Client"}</td>
                      <td className="px-4 py-3">{booking.service || "Booking"}</td>
                      <td className="px-4 py-3">{provider.name || booking.assignedProviderName || "Provider not assigned"}</td>
                      <td className="px-4 py-3 font-black">{formatMoney(payment.amount || 0)}</td>
                      <td className="px-4 py-3"><PaymentStatusBadge status={payment.status} /></td>
                      <td className="max-w-[180px] break-all px-4 py-3 text-xs font-bold text-slate-500">{payment.razorpayPaymentId || "Not paid"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!recentPayments.length && <EmptyState title="No payment records yet" copy="Razorpay orders, penalties, and verified payments will appear here." />}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}

function AdminPaymentOverview({ paymentData, setStatusMessage, refreshAdminPayments, onOpenPaymentPage }) {
  const [providerPaymentsOpen, setProviderPaymentsOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [payingProviderId, setPayingProviderId] = useState("");
  const [visiblePayoutHistoryCounts, setVisiblePayoutHistoryCounts] = useState({});
  const overview = paymentData?.overview || {};
  const recentPayments = paymentData?.recentPayments || [];
  const providerPayouts = paymentData?.providerPayouts || [];
  const pendingProviderPayouts = providerPayouts.filter((payout) => Number(payout.totalPayable || payout.readyToWithdraw || 0) > 0);
  const providerPayoutHistory = paymentData?.providerPayoutHistory || [];
  const payoutHistoryByProvider = Object.values(
    providerPayoutHistory.reduce((groups, entry) => {
      const key = entry.providerId || entry.providerName || "unknown-provider";
      if (!groups[key]) {
        groups[key] = {
          providerId: entry.providerId,
          providerName: entry.providerName,
          providerCategory: entry.providerCategory,
          totalAmount: 0,
          entries: [],
        };
      }
      groups[key].totalAmount += entry.amount || 0;
      groups[key].entries.push(entry);
      return groups;
    }, {})
  ).map((group) => ({
    ...group,
    entries: group.entries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
  }));
  const handleSendProviderPayout = async (providerId) => {
    setPayingProviderId(providerId);
    try {
      const data = await sendProviderPayout(providerId);
      setStatusMessage(data.message || "Provider payment sent.");
      await refreshAdminPayments?.();
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setPayingProviderId("");
    }
  };

  return (
    <Panel title="Payment overview" className="mb-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PaymentSummaryCard icon={IndianRupee} title="Gross Revenue" amount={formatMoney(overview.grossRevenue || 0)} />
        <PaymentSummaryCard icon={ShieldCheck} title="Platform Commission 20%" amount={formatMoney(overview.platformRevenue || 0)} />
        <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-slate-500 dark:text-slate-300">Provider Payable 80%</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{formatMoney(overview.providerPayable || 0)}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
              <Wallet size={21} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProviderPaymentsOpen((current) => !current)}
            className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
          >
            {providerPaymentsOpen ? "Hide provider payments" : "View all provider payments"}
          </button>
        </div>
        <PaymentSummaryCard icon={AlertTriangle} title="Penalty Collected" amount={formatMoney(overview.penaltyCollected || 0)} />
        <PaymentSummaryCard icon={Clock} title="Pending Payments" amount={overview.pendingPayments || 0} />
        <PaymentSummaryCard icon={CheckCircle} title="Paid Bookings" amount={overview.paidPayments || 0} />
      </div>
      {providerPaymentsOpen && (
        <div className="mt-5 rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Provider payment details</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">Review payable provider amounts without resizing the overview cards.</p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {pendingProviderPayouts.length ? pendingProviderPayouts.map((payout) => {
              const payableAmount = payout.totalPayable || payout.readyToWithdraw || 0;
              const hasReadyAmount = payableAmount > 0;
              const pendingPayments = (payout.payments || []).filter((payment) => payment.payoutStatus !== "money_sent" && Number(payment.remainingShare ?? payment.providerShare ?? 0) > 0);
              return (
                <div key={payout.providerId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950 dark:text-white">{payout.name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">{payout.category || "Provider"} | {payout.paidBookings || 0} paid booking{payout.paidBookings === 1 ? "" : "s"}</p>
                    </div>
                    <p className="shrink-0 font-black text-slate-950 dark:text-white">{formatMoney(payout.totalPayable || 0)}</p>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs font-black sm:grid-cols-2">
                    <span className="rounded-xl bg-emerald-100 px-3 py-2 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100">Ready: {formatMoney(payableAmount)}</span>
                    <span className="rounded-xl bg-blue-100 px-3 py-2 text-blue-800 dark:bg-blue-400/10 dark:text-blue-100">Immediate payout</span>
                  </div>
                  <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Provider payments</p>
                      <button
                        type="button"
                        onClick={() => handleSendProviderPayout(payout.providerId)}
                        disabled={!hasReadyAmount || payingProviderId === payout.providerId || payout.providerId === "unassigned"}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                          {payingProviderId === payout.providerId ? "Releasing..." : "Release to provider"}
                      </button>
                    </div>
                    {pendingPayments.map((payment) => (
                      <div key={payment.paymentId} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-black text-slate-950 dark:text-white">{payment.booking}</p>
                            <p className="mt-1 font-bold text-slate-500 dark:text-slate-300">{payment.client} | Paid {formatDateTime(payment.paidAt)}</p>
                          </div>
                          <p className="shrink-0 font-black text-slate-950 dark:text-white">{formatMoney(payment.providerShare || 0)}</p>
                        </div>
                        <p className="mt-2 font-black text-emerald-700 dark:text-emerald-100">Ready to send</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }) : <EmptyState title="No pending provider payments" copy="Provider payments move to payout history after admin sends the money." />}
          </div>
        </div>
      )}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Admin payment history</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">Open payout and payment transaction history when needed.</p>
          </div>
          <button
            type="button"
            onClick={onOpenPaymentPage}
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
          >
            Open payment history
          </button>
        </div>
      </div>
      {paymentHistoryOpen && (
      <>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-5">
        <h3 className="text-lg font-black text-slate-950 dark:text-white">Admin provider payout history</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">Money released by admin to provider dashboard balances.</p>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {payoutHistoryByProvider.length ? payoutHistoryByProvider.map((group) => {
            const visibleCount = visiblePayoutHistoryCounts[group.providerId] || 4;
            const visibleEntries = group.entries.slice(0, visibleCount);
            const hasMore = visibleCount < group.entries.length;
            const canShowLess = visibleCount > 4;

            return (
              <div key={group.providerId || group.providerName} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black leading-tight text-slate-950 dark:text-white">{group.providerName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">{group.providerCategory || "Provider"} | {group.entries.length} transaction{group.entries.length === 1 ? "" : "s"}</p>
                  </div>
                  <p className="font-black text-slate-950 dark:text-white">{formatMoney(group.totalAmount || 0)}</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {visibleEntries.map((entry) => (
                    <div key={entry.id} className="rounded-xl bg-white p-3 dark:bg-slate-950">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black leading-tight text-slate-950 dark:text-white">{formatMoney(entry.amount || 0)}</p>
                          <p className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">{formatDateTime(entry.createdAt)}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${entry.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100" : entry.status === "failed" ? "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-100" : "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-100"}`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-300 sm:grid-cols-2">
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Provider ID: {entry.providerId || "Not available"}</span>
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Sent by: {entry.metadata?.sentBy || "Admin"}</span>
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Sent at: {formatDateTime(entry.metadata?.sentAt || entry.createdAt)}</span>
                        <span className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">Payout ref: {entry.metadata?.razorpayPayoutId || entry.id || "Ledger payout"}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {(hasMore || canShowLess) && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setVisiblePayoutHistoryCounts((counts) => ({ ...counts, [group.providerId]: Math.min(visibleCount + 4, group.entries.length) }))}
                        className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white shadow-lg shadow-slate-950/10 dark:bg-amber-300 dark:text-slate-950"
                      >
                        View more
                      </button>
                    )}
                    {canShowLess && (
                      <button
                        type="button"
                        onClick={() => setVisiblePayoutHistoryCounts((counts) => ({ ...counts, [group.providerId]: Math.max(visibleCount - 4, 4) }))}
                        className="rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-950 shadow-sm transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                      >
                        View less
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          }) : <EmptyState title="No provider payouts sent yet" copy="Successful admin payments to providers will appear here." />}
        </div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:bg-white/5 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment Status</th>
              <th className="px-4 py-3">Razorpay Payment ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {recentPayments.map((payment) => {
              const booking = payment.booking || {};
              const user = payment.user || {};
              const provider = payment.provider || {};
              return (
                <tr key={payment._id} className="align-top">
                  <td className="px-4 py-3 font-bold">{user.name || booking.userName || "Client"}</td>
                  <td className="px-4 py-3">{booking.service || "Booking"}</td>
                  <td className="px-4 py-3">{provider.name || booking.assignedProviderName || "Provider not assigned"}</td>
                  <td className="px-4 py-3 font-black">{formatMoney(payment.amount || 0)}</td>
                  <td className="px-4 py-3"><PaymentStatusBadge status={payment.status} /></td>
                  <td className="max-w-[180px] break-all px-4 py-3 text-xs font-bold text-slate-500">{payment.razorpayPaymentId || "Not paid"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!recentPayments.length && <EmptyState title="No payment records yet" copy="Razorpay orders, penalties, and verified payments will appear here." />}
      </div>
      </>
      )}
    </Panel>
  );
}

function BookingModal({ bookingForm, setBookingForm, submitBooking, close, categories, user }) {
  const addressFieldRef = useRef(null);
  const update = (field) => (event) => setBookingForm((current) => ({ ...current, [field]: event.target.value }));
  const hasSelectedProviderService = Boolean(bookingForm.providerId && bookingForm.service);
  const registeredAddress = String(user?.address || "").trim();
  const useRegisteredAddress = () => {
    if (!registeredAddress) return;
    setBookingForm((current) => ({ ...current, address: registeredAddress }));
    window.setTimeout(() => addressFieldRef.current?.focus(), 0);
  };
  const today = getTodayInputDate();
  const updateDate = (event) => {
    const value = event.target.value;
    setBookingForm((current) => ({ ...current, date: value && value < today ? today : value }));
  };
  const durationField = parseDurationValue(bookingForm.duration);
  const updateDuration = (next = {}) => {
    setBookingForm((current) => {
      const currentDuration = parseDurationValue(current.duration);
      return {
        ...current,
        duration: buildDurationValue(next.amount ?? currentDuration.amount, next.unit ?? currentDuration.unit),
      };
    });
  };
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/70 p-4 backdrop-blur"
      onClick={close}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <motion.form
        onSubmit={submitBooking}
        onClick={(event) => event.stopPropagation()}
        className="scrollbar-hidden relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" onClick={close} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={18} /></button>
        <p className="font-black text-amber-600">Service booking</p>
        <h2 className="mt-2 text-3xl font-black">Schedule your next job</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormInput label="Name" value={bookingForm.name} onChange={update("name")} placeholder="Your name" />
          <FormInput label="Phone" value={bookingForm.phone} onChange={update("phone")} placeholder="Mobile number" />
          <label className="grid gap-2 font-bold">
            Service
            {hasSelectedProviderService ? (
              <input
                type="text"
                value={bookingForm.service}
                readOnly
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            ) : (
              <select value={bookingForm.service} onChange={update("service")} required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                <option value="">Choose service</option>
                {categories.filter((category) => category !== "All").map((category) => <option key={category}>{category}</option>)}
              </select>
            )}
          </label>
          <FormInput label="Date" type="date" value={bookingForm.date} onChange={updateDate} min={today} />
          <FormInput label="Time" type="time" value={bookingForm.time} onChange={update("time")} />
          <fieldset className="grid gap-2">
            <legend className="font-bold">Duration</legend>
            <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 transition focus-within:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white">
              <span className="grid w-12 place-items-center border-r border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300">
                <Clock size={19} />
              </span>
              <input
                type="number"
                min="1"
                max="99"
                value={durationField.amount}
                onChange={(event) => updateDuration({ amount: event.target.value })}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 font-black outline-none"
                aria-label="Duration amount"
              />
              <select
                value={durationField.unit}
                onChange={(event) => updateDuration({ unit: event.target.value })}
                className="border-l border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                aria-label="Duration unit"
              >
                <option value="min">min</option>
                <option value="hours">hour</option>
                <option value="days">day</option>
              </select>
            </div>
          </fieldset>
          <label className="grid gap-2 font-bold md:col-span-2">
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span>Address</span>
              {registeredAddress && (
                <button
                  type="button"
                  onClick={useRegisteredAddress}
                  className="min-h-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-700 transition hover:bg-teal-100 dark:border-teal-300/25 dark:bg-teal-300/10 dark:text-teal-100"
                >
                  Use registered address
                </button>
              )}
            </span>
            <textarea ref={addressFieldRef} value={bookingForm.address} onChange={update("address")} placeholder={registeredAddress ? "Type address or use your registered address" : "Service address"} rows="4" required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500" />
          </label>
          <label className="grid gap-2 font-bold md:col-span-2">Describe the problem<textarea value={bookingForm.problemDescription} onChange={update("problemDescription")} placeholder="Tell us what issue you are facing" rows="4" required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500" /></label>
        </div>
        <button className="mt-6 rounded-2xl bg-slate-950 px-6 py-4 font-black text-white dark:bg-amber-300 dark:text-slate-950">Confirm booking & notify provider</button>
      </motion.form>
    </motion.div>
  );
}

function ProviderAccountDetailsModal({ form, provider, onUpdate, onClose }) {
  const approval = provider?.approvalStatus || "pending";
  const activeStatus = provider?.isActive === false ? "Inactive" : "Active";
  const info = [
    ["Email", "Official", form.email, Mail],
    ["Phone number", "Mobile", form.phone, Phone],
    ["Service category", "Provider type", form.category, BriefcaseBusiness],
    ["Location", "Service area", form.location, MapPin],
    ["Pricing", "Starting price", form.price, IndianRupee],
    ["Response time", "Average reply", form.responseTime, CalendarCheck],
  ];
  const bank = form.bankDetails || {};
  const features = form.features
    ? form.features.split(",").map((feature) => feature.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="scrollbar-hidden relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50/60 px-5 pb-5 pt-5 dark:border-white/10 dark:from-white/5 dark:via-slate-900 dark:to-white/5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={18} /></button>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Provider details</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900">
            <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-600/20">
              {(form.name || "P").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">{form.name || "Provider profile"}</h2>
                <button type="button" onClick={onUpdate} className="ml-auto rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950">Edit</button>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{form.category || "Service provider"}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            {info.map(([label, subLabel, value, Icon]) => (
              <div key={label} className="flex gap-4 border-b border-slate-100 px-5 py-5 transition hover:bg-slate-50 last:border-b-0 dark:border-white/10 dark:hover:bg-white/5">
                <span className="mt-1 grid h-10 w-10 flex-none place-items-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm dark:bg-amber-300/15 dark:text-amber-300"><Icon size={19} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-slate-950 dark:text-white">{label}</p>
                  <p className="mt-3 text-sm font-bold text-slate-400">{subLabel}</p>
                  <p className="mt-1 break-words text-base font-black text-slate-700 dark:text-slate-200">{value || "Not added"}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-4 border-b border-slate-100 px-5 py-5 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
              <span className="mt-1 grid h-10 w-10 flex-none place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-300/15 dark:text-emerald-300"><ShieldCheck size={19} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-950 dark:text-white">Provider status</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">{activeStatus}</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-black capitalize text-[#5a45d6]">{approval}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 px-5 py-5 transition hover:bg-slate-50 dark:hover:bg-white/5">
              <span className="mt-1 grid h-10 w-10 flex-none place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-sm dark:bg-teal-300/15 dark:text-teal-300"><Star size={19} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-950 dark:text-white">What's included</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(features.length ? features : ["Not added"]).map((feature) => (
                  <span key={feature} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-white">{feature}</span>
                ))}
              </div>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">About</p>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{form.about || "Add your experience, service style, and what clients can expect."}</p>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Bank payout account</p>
            <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <span>Account holder: {bank.accountHolder || "Not added"}</span>
              <span>Bank: {bank.bankName || "Not added"}</span>
              <span>Account: {bank.accountNumber ? `****${String(bank.accountNumber).slice(-4)}` : "Not added"}</span>
              <span>IFSC: {bank.ifscCode || "Not added"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderAccountEditModal({ form, setForm, categories, onSubmit, onClose }) {
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateBank = (field) => (event) => setForm((current) => ({
    ...current,
    bankDetails: {
      ...(current.bankDetails || {}),
      [field]: event.target.value,
    },
  }));
  const serviceCategories = categories.filter((category) => category !== "All");

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-3 backdrop-blur sm:p-4">
      <form onSubmit={onSubmit} className="scrollbar-hidden relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-[#fbfaf6] shadow-2xl dark:bg-slate-900">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-blue-600 text-lg font-black text-white shadow-lg shadow-blue-600/20">
                {(form.name || "P").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">Provider account</p>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Edit service profile</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={18} /></button>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-300">Update the details clients and admins see for your provider account.</p>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Business details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormInput label="Business name" value={form.name} onChange={update("name")} placeholder="Your service profile name" />
              <label className="grid gap-2 font-bold">
            Service category
            <select value={form.category} onChange={update("category")} required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950">
              <option value="">Choose service category</option>
              {serviceCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
              </label>
              <FormInput label="Location" value={form.location} onChange={update("location")} placeholder="City or service area" />
              <FormInput label="Phone" value={form.phone} onChange={update("phone")} placeholder="Mobile number" />
              <FormInput label="Email" type="email" value={form.email} onChange={update("email")} placeholder="provider@example.com" />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Service details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormInput label="Pricing" value={form.price} onChange={update("price")} placeholder="From Rs. 299" />
              <FormInput label="Response time" value={form.responseTime} onChange={update("responseTime")} placeholder="~1 hr" />
              <FormInput label="What's included" value={form.features} onChange={update("features")} placeholder="Repair, installation, inspection" />
              <label className="grid gap-2 font-bold md:col-span-2">
                Short description
                <textarea value={form.description} onChange={update("description")} placeholder="Describe your service for clients" rows="3" required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-300 dark:border-white/10 dark:bg-slate-950" />
              </label>
              <label className="grid gap-2 font-bold md:col-span-2">
                About provider
                <textarea value={form.about} onChange={update("about")} placeholder="Tell clients about your experience and work style" rows="4" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-300 dark:border-white/10 dark:bg-slate-950" />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Bank details for payouts</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">Admin payments are sent to this bank account through RazorpayX.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormInput label="Account holder" value={form.bankDetails?.accountHolder || ""} onChange={updateBank("accountHolder")} placeholder="Full name as per bank" />
              <FormInput label="Bank name" value={form.bankDetails?.bankName || ""} onChange={updateBank("bankName")} placeholder="Bank name" />
              <FormInput label="Account number" value={form.bankDetails?.accountNumber || ""} onChange={updateBank("accountNumber")} placeholder="Account number" />
              <FormInput label="IFSC code" value={form.bankDetails?.ifscCode || ""} onChange={updateBank("ifscCode")} placeholder="Example: SBIN0001234" />
            </div>
          </section>

          <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 sm:-mx-6 sm:-mb-6 sm:px-6">
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-6 py-4 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white">Cancel</button>
            <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950">Save profile</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormInput({ label, type = "text", value, defaultValue, onChange, placeholder = "", min, name }) {
  const inputProps = value !== undefined ? { value, onChange } : { defaultValue };
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <input type={type} {...inputProps} name={name} min={min} placeholder={placeholder} required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500" />
    </label>
  );
}

function DashboardShell({ title, subtitle, children, notifications = [], headerActions = null, workspaceLabel = "ServiceHub workspace" }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const hasNotifications = notifications.length > 0;
  const isAdminWorkspace = /admin/i.test(title);

  return (
    <main className={`min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-8 ${isAdminWorkspace ? "bg-[linear-gradient(180deg,#f8fafc_0%,#eef6f5_42%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#08111f_52%,#020617_100%)]" : "dark:bg-slate-950"}`}>
      <div className="mx-auto max-w-[92rem]">
        <div className={`relative z-20 mb-8 overflow-visible rounded-[1.35rem] border p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6 ${isAdminWorkspace ? "border-white/80 bg-white/88 dark:border-white/10 dark:bg-white/7" : "border-transparent bg-transparent shadow-none"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700 dark:text-teal-200">{workspaceLabel}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300 sm:text-base">{subtitle}</p>
          </div>
          <div className="relative z-30 flex flex-wrap items-center justify-end gap-3">
            {headerActions}
            <button
              type="button"
              onClick={() => setNotificationsOpen((current) => !current)}
              aria-label="Open notifications"
              className="relative grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700 hover:shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              <Bell size={18} />
              {hasNotifications && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
                  {notifications.length}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-14 z-[120] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
                  <p className="font-black">Notifications</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-200">{notifications.length}</span>
                </div>
                <div className="max-h-80 overflow-y-auto p-3">
                  {hasNotifications ? notifications.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-xl p-3 transition hover:bg-slate-50 dark:hover:bg-white/5">
                      <p className="font-black">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{item.message}</p>
                    </div>
                  )) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center dark:border-white/10">
                      <p className="font-black">No notifications</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">New updates will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-blue-600 to-amber-300" />
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition group-hover:scale-105 dark:bg-teal-300/10 dark:text-teal-100 dark:ring-teal-300/20">
          <Icon size={22} />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-white/10 dark:text-slate-300">Live</span>
      </div>
      <p className="mt-5 text-3xl font-black leading-none text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">{label}</p>
    </div>
  );
}

function Panel({ title, children, className = "", sectionRef }) {
  return (
    <section ref={sectionRef} className={`h-fit overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-white/10 dark:bg-white/5 sm:px-6">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function JobCard({ booking, actionLabel, onAction, secondaryAction, disabled, onEstimateClick, alertMode = false }) {
  const contactLocked = alertMode || booking.contactLocked;
  const canSubmitFinalEstimate = booking.status === "arrived" && Boolean(onEstimateClick);
  const canUpdateFinalEstimate = booking.status === "job_started" && booking.paymentStatus !== "paid" && Boolean(onEstimateClick);
  const estimateActionLabel = booking.finalEstimateAmount ? "Update Final Estimate" : "Submit Final Estimate";
  const hasGps = Boolean(
    booking.clientLocation?.latitude ||
    booking.clientLocation?.lat ||
    (Array.isArray(booking.clientLocation?.coordinates) && booking.clientLocation.coordinates.length === 2)
  );
  return (
    <article className="rounded-2xl border border-slate-200 p-5 dark:border-white/10">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="font-black">{booking.service}</p>
          <p className="text-sm text-slate-500">
            {contactLocked ? "Client name hidden until accepted" : `${booking.name} | ${booking.phone || "Phone not available"}`}
          </p>
          <p className="text-sm text-slate-500">{booking.address || "Address not available"}</p>
          {booking.problemDescription && <p className="text-sm text-slate-500">Problem: {booking.problemDescription}</p>}
        </div>
        <StatusBadge status={booking.status} />
      </div>
      {alertMode && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">Booking alert</span>
          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">Contact unlocks after accept</span>
          <span className={`rounded-full px-3 py-1.5 ${hasGps && !contactLocked ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200"}`}>
            {hasGps ? "lat/lng ready for route" : "address route fallback"}
          </span>
        </div>
      )}
      <div className="mt-4 grid gap-2 text-sm text-slate-500">
        <span>{formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}</span>
        <span>{booking.serviceDuration} | {formatPrice(booking.costEstimate)}</span>
        {booking.status === "cancelled" && booking.cancelledBy === "client" && <span className="font-black text-rose-600">Cancelled by client</span>}
        {booking.status === "cancelled" && booking.cancelledBy === "provider" && <span className="font-black text-rose-600">Cancelled by provider: {booking.cancellationReason || "Reason not provided"}</span>}
      </div>
      {Boolean(onEstimateClick || booking.finalEstimateAmount) && (
        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-400/20 dark:bg-teal-400/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-200">Estimate & earnings</p>
            <div className="flex flex-wrap gap-2">
              <EstimateStatusBadge status={booking.estimateStatus || "not_submitted"} />
              <PaymentStatusBadge status={booking.paymentStatus || "unpaid"} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-xl bg-white p-3 font-black shadow-sm dark:bg-white/10">Final Estimate: {booking.finalEstimateAmount ? formatMoney(booking.finalEstimateAmount) : "Not sent"}</span>
            {booking.providerShare ? <span className="rounded-xl bg-white p-3 font-black shadow-sm dark:bg-white/10">Your Share: {formatMoney(booking.providerShare)}</span> : null}
          </div>
          {booking.estimateHistory?.length > 1 && (
            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Estimate revised {booking.estimateHistory.length - 1} time{booking.estimateHistory.length - 1 === 1 ? "" : "s"}.</p>
          )}
          {booking.estimateStatus === "submitted" && <p className="mt-3 text-sm font-black text-amber-700 dark:text-amber-200">Estimate sent. Waiting for client response.</p>}
          {(canSubmitFinalEstimate || canUpdateFinalEstimate) && (
            <button type="button" onClick={onEstimateClick} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/10 dark:text-teal-100">
              <IndianRupee size={17} /> {estimateActionLabel}
            </button>
          )}
        </div>
      )}
      {!canSubmitFinalEstimate && !canUpdateFinalEstimate && !booking.finalEstimateAmount && !["completed", "cancelled"].includes(booking.status) && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 dark:bg-amber-300/10 dark:text-amber-100">
          Mark arrived before sending the final estimate.
        </p>
      )}
      {actionLabel && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={disabled} onClick={onAction} className="rounded-xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-50 dark:bg-amber-300 dark:text-slate-950">{actionLabel}</button>
          {secondaryAction && <button type="button" onClick={secondaryAction} className="rounded-xl bg-slate-100 px-4 py-3 font-black transition hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15">Cancel</button>}
        </div>
      )}
    </article>
  );
}

function ProviderCancelModal({ booking, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/70 p-4 backdrop-blur"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-600">Cancel booking</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{booking.service}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">{booking.name} | {booking.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={18} /></button>
        </div>
        <label className="mt-5 grid gap-2 font-bold">
          Reason for cancellation
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows="5"
            required
            placeholder="Explain why you cannot complete this service so admin can assign another provider."
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400 dark:border-white/10 dark:bg-slate-950"
          />
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white">Keep booking</button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-rose-600 px-5 py-3 font-black text-white shadow-lg shadow-rose-600/15 transition hover:-translate-y-0.5 disabled:opacity-60">
            {submitting ? "Cancelling..." : "Cancel booking"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function StatusBadge({ status = "pending" }) {
  const color = status === "completed" ? "bg-emerald-100 text-emerald-700" : status === "cancelled" || status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
  return <span className={`h-fit rounded-full px-3 py-1 text-xs font-black capitalize ${color}`}>{String(status).replace(/_/g, " ")}</span>;
}

function EmptyState({ title, copy }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15"><p className="font-black">{title}</p><p className="mt-2 text-sm text-slate-500">{copy}</p></div>;
}

function ChatBox({ user, onClose, onServiceClick, onDashboardClick, onProviderSignup, onProviderDashboard, onAdminDashboard, onLogin, onContact }) {
  const messageIdRef = useRef(0);
  const getTimeLabel = () => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  const buildMessage = ({ role, text, action, suggestions = [] }) => ({
    id: `${role}-${messageIdRef.current++}`,
    role,
    text,
    action,
    suggestions,
    time: getTimeLabel(),
  });
  const [messages, setMessages] = useState([
    {
      id: "bot-welcome",
      role: "bot",
      text: user?.name
        ? `Hi ${user.name.split(" ")[0]}, I'm Liza from ServiceHub Support. Tell me what is stuck and I will point you to the right place.`
        : "Hi, I'm Liza from ServiceHub Support. I can help with booking status, payments, provider signup, or getting help from the team.",
      suggestions: ["Book a service", "Booking status", "Payment issue", "Talk to support"],
      time: INITIAL_CHAT_TIME_LABEL,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastIntent, setLastIntent] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const messagesEndRef = useRef(null);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const quickActions = [
    { label: "Book", value: "I want to book a service" },
    { label: "Status", value: "Check my booking status" },
    { label: "Payment", value: "I need help with payment" },
    { label: "Provider", value: "I want provider help" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  useEffect(() => () => {
    if (canSpeak) window.speechSynthesis.cancel();
  }, [canSpeak]);

  const speakText = (text) => {
    if (!voiceEnabled || !canSpeak || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    // Priority 1: Indian English Female
    selectedVoice = voices.find(
      (voice) =>
        voice.lang === "en-IN" &&
        (voice.name.toLowerCase().includes("female") ||
          voice.name.toLowerCase().includes("heera") ||
          voice.name.toLowerCase().includes("veena") ||
          voice.name.toLowerCase().includes("neeraja"))
    );
    
    // Priority 2: General English Female (e.g. Zira, Samantha, Google UK English Female, Google US English Female, Karen, Hazel, Tessa)
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("zira") ||
            voice.name.toLowerCase().includes("samantha") ||
            voice.name.toLowerCase().includes("karen") ||
            voice.name.toLowerCase().includes("hazel") ||
            voice.name.toLowerCase().includes("lisa") ||
            voice.name.toLowerCase().includes("liza") ||
            voice.name.toLowerCase().includes("tessa"))
      );
    }
    
    // Priority 3: General en-IN voice
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => voice.lang === "en-IN");
    }
    
    // Priority 4: General English voice
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => voice.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = 0.88; // Slow enough for clear understanding
    utterance.pitch = 1.05; // Pleasant, friendly tone
    window.speechSynthesis.speak(utterance);
  };

  const closeChat = () => {
    if (canSpeak) window.speechSynthesis.cancel();
    onClose?.();
  };

  const getBotReply = (text) => {
    const query = text.toLowerCase();
    const serviceMatch = [
      ["Electrician", /electric|wiring|power|switch|fan|light/],
      ["Plumber", /plumb|leak|tap|pipe|bathroom|water/],
      ["Cleaning", /clean|sofa|deep clean|housekeep/],
      ["AC Repair", /\bac\b|air condition|cooling/],
      ["Carpenter", /carpent|wood|door|furniture/],
      ["Painter", /paint|wall|colour|color/],
      ["TV Repair", /\btv\b|television|display/],
      ["Refrigerator Repair", /fridge|refrigerator/],
      ["Washing Machine Repair", /washing|washer|laundry/],
    ].find(([, pattern]) => pattern.test(query));

    if (/hi|hello|hey|namaste|good morning|good evening/.test(query)) {
      return {
        intent: "greeting",
        text: user?.name
          ? `Hi ${user.name.split(" ")[0]}. I can help faster if you tell me whether this is about a booking, payment, provider account, or support.`
          : "Hi. Are you trying to book a service, check an existing booking, become a provider, or contact support?",
        suggestions: ["Book a service", "Booking status", "Provider signup", "Contact support"],
      };
    }

    if (/where|track|tracking|live|location|map|gps|provider.*come|on the way|eta|arriv/.test(query)) {
      if (!user) {
        return {
          intent: "tracking",
          text: "Map tracking is not available right now. Login and open your dashboard to check the latest booking status, provider details, payment, and support options.",
          action: { label: "Login", run: onLogin },
          suggestions: ["Booking status", "Contact support"],
        };
      }
      if (user.role === "provider") {
        return {
          intent: "tracking",
          text: "Map tracking is hidden for now. Open your provider dashboard to accept jobs, update service status, send estimates, and manage payments.",
          action: { label: "Provider dashboard", run: onProviderDashboard },
          suggestions: ["Payment help", "Cancel job"],
        };
      }
      return {
        intent: "tracking",
        text: "Map tracking is hidden for now. Open your client dashboard to see active bookings, provider details, payment status, and support options.",
        action: { label: "Open dashboard", run: onDashboardClick },
        suggestions: ["Payment help", "Provider details", "Contact support"],
      };
    }

    if (serviceMatch || /book|schedule|repair|service|need someone|appointment/.test(query)) {
      const serviceName = serviceMatch?.[0] || "Electrician";
      return {
        intent: "booking",
        text: serviceMatch
          ? `Got it. For ${serviceName}, choose a verified provider, tap Book Now, add your address and problem details, then confirm the booking.`
          : "You can pick a service category, compare providers, add your address, and book a slot.",
        action: { label: serviceMatch ? `Open ${serviceName}` : "Open services", run: () => onServiceClick?.(serviceName) },
        suggestions: ["Booking status", "Payment process", "Need urgent help"],
      };
    }

    if (/booking|dashboard|status|request|history|cancel|reschedule/.test(query)) {
      if (!user) {
        return {
          intent: "dashboard",
          text: "Your booking history is protected, so you will need to login first. After that the dashboard shows status, estimates, payment, cancellation, and support options.",
          action: { label: "Login", run: onLogin },
          suggestions: ["Book a service", "Contact support"],
        };
      }
      if (user.role === "user") return {
        intent: "dashboard",
        text: "Your client dashboard has active, completed, and cancelled services. For active work, you can review provider details, estimate/payment status, or cancel if still allowed.",
        action: { label: "Open dashboard", run: onDashboardClick },
        suggestions: ["Booking status", "Payment help", "Contact support"],
      };
      if (user.role === "provider") return {
        intent: "dashboard",
        text: "Your provider dashboard shows new requests, estimates, job history, earnings, and bank withdrawal details.",
        action: { label: "Provider dashboard", run: onProviderDashboard },
        suggestions: ["Job status", "Withdraw money"],
      };
      return {
        intent: "dashboard",
        text: "The admin panel has booking management, provider approvals, contact replies, payment overview, and provider payout history.",
        action: { label: "Admin panel", run: onAdminDashboard },
        suggestions: ["Provider approval", "Payment issue"],
      };
    }

    if (/provider|work|join|partner|earn|job|professional|withdraw|bank/.test(query)) {
      if (user?.role === "provider") return {
        intent: "provider",
        text: "You are already signed in as a provider. Keep your profile, bank details, job status, and estimates updated so clients and admins can process work smoothly.",
        action: { label: "Provider dashboard", run: onProviderDashboard },
        suggestions: ["Job status", "Withdraw money", "Payment help"],
      };
      return {
        intent: "provider",
        text: "To work with ServiceHub, register as a provider, complete your service profile, wait for admin approval, then accept jobs from your provider dashboard.",
        action: { label: "Become provider", run: onProviderSignup },
        suggestions: ["How payouts work", "Contact support"],
      };
    }

    if (/pay|payment|money|withdraw|razorpay|estimate|refund|penalty|payout|upi|card/.test(query)) {
      return {
        intent: "payment",
        text: "Here is the payment flow: provider sends a final estimate, client accepts it, Razorpay checkout opens, admin releases provider share, then the provider withdraws the released balance to their bank account.",
        suggestions: ["Estimate not showing", "Payment failed", "Provider payout"],
      };
    }

    if (/admin/.test(query)) {
      if (user?.role === "admin") return {
        intent: "admin",
        text: "You can use the admin panel to approve providers, assign bookings, reply to contact messages, and release provider payouts.",
        action: { label: "Admin panel", run: onAdminDashboard },
        suggestions: ["Provider approval", "Payout history"],
      };
      return {
        intent: "admin",
        text: "Admin access is limited to the seeded superadmin account. If you are an admin, login with the admin credentials and open the admin panel.",
        action: { label: "Login", run: onLogin },
        suggestions: ["Contact support"],
      };
    }

    if (/contact|support|help|call|email|human|agent|complaint|stuck|issue|problem/.test(query)) {
      return {
        intent: "support",
        text: "I can take you to the support form. Add your booking ID, phone number, and a short note about the issue so the team can respond with context.",
        action: { label: "Contact support", run: onContact },
        suggestions: ["Booking status", "Payment issue", "Provider issue"],
      };
    }

    if (/thank|thanks|ok|okay|done/.test(query)) {
      return {
        intent: lastIntent || "thanks",
        text: "You're welcome. I will stay here if you need the next step.",
        suggestions: ["Book a service", "Booking status", "Contact support"],
      };
    }

    return {
      intent: "fallback",
      text: "I want to make sure I guide you correctly. Is this about booking a service, booking status, payment, provider signup, or support?",
      suggestions: ["Book a service", "Booking status", "Payment help", "Contact support"],
    };
  };

  const sendMessage = (value = input) => {
    const text = value.trim();
    if (!text || isTyping) return;

    const reply = getBotReply(text);
    setLastIntent(reply.intent || lastIntent);
    setMessages((current) => [...current, buildMessage({ role: "user", text })]);
    setInput("");
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        buildMessage({
          role: "bot",
          text: reply.text,
          action: reply.action,
          suggestions: reply.suggestions || [],
        }),
      ]);
      speakText(reply.text);
      setIsTyping(false);
    }, Math.min(1200, Math.max(520, reply.text.length * 8)));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.96 }} className="fixed bottom-24 right-5 z-[80] flex h-[min(34rem,calc(100vh-7rem))] w-[min(340px,calc(100vw-32px))] flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900">
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-950 to-teal-800 px-3 py-3.5 text-white dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-10 flex-none rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-md">
            <svg viewBox="0 0 100 100" className="h-full w-full rounded-full fill-white">
              {/* Head / Face */}
              <circle cx="50" cy="45" r="22" fill="#FED7AA" />
              {/* Hair */}
              <path d="M28,45 C28,25 72,25 72,45 C72,50 68,40 65,35 C60,30 40,30 35,35 C32,40 28,50 28,45 Z" fill="#4B5563" />
              <path d="M28,45 C28,55 32,60 35,55 C35,45 32,40 28,45 Z" fill="#4B5563" />
              <path d="M72,45 C72,55 68,60 65,55 C65,45 68,40 72,45 Z" fill="#4B5563" />
              {/* Shoulders / Clothes */}
              <path d="M20,85 C20,70 30,65 50,65 C70,65 80,70 80,85 Z" fill="#0D9488" />
              {/* Headset Mic */}
              <path d="M68,48 C72,48 74,54 70,58 C66,62 58,62 55,60" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Headset Ear Cup */}
              <rect x="68" y="40" width="6" height="12" rx="3" fill="#1F2937" />
              {/* Headset Band */}
              <path d="M32,45 C32,25 68,25 68,45" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-snug">Liza, ServiceHub support</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-teal-100">
              Online now | {voiceEnabled ? "Voice replies on" : "Usually replies instantly"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!canSpeak) return;
              setVoiceEnabled((current) => {
                const next = !current;
                if (current) window.speechSynthesis.cancel();
                return next;
              });
            }}
            className={`grid h-8 w-8 place-items-center rounded-full text-white transition hover:bg-white/20 ${voiceEnabled ? "bg-emerald-400/25 ring-1 ring-emerald-200/50" : "bg-white/10"}`}
            aria-label={voiceEnabled ? "Turn voice replies off" : "Turn voice replies on"}
            title={voiceEnabled ? "Voice replies on" : "Voice replies off"}
          >
            {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button type="button" onClick={closeChat} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Close chatbot">
            <X size={17} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-3 dark:bg-slate-950/40">
        <div className="grid gap-3 text-sm">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`grid gap-2 ${message.role === "user" ? "justify-items-end" : "justify-items-start"}`}>
              <div className={`max-w-[88%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                <p className={`rounded-2xl px-3 py-2.5 text-sm font-semibold leading-6 shadow-sm ${message.role === "user" ? "rounded-br-md bg-amber-300 text-slate-950" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/10"}`}>
                  {message.text}
                </p>
                <p className="mt-1 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{message.time}</p>
                {message.action && (
                  <button
                    type="button"
                    onClick={() => {
                      message.action.run?.();
                      onClose?.();
                    }}
                    className="mt-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
                  >
                    {message.action.label}
                  </button>
                )}
                {message.suggestions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={`${message.id}-${suggestion}`}
                        type="button"
                        onClick={() => sendMessage(suggestion)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="grid justify-items-start">
              <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button key={action.value} type="button" onClick={() => sendMessage(action.value)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-teal-50 hover:text-teal-800 dark:bg-white/10 dark:text-white">
              {action.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 rounded-2xl border border-slate-200 p-2 dark:border-white/10"
        >
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Describe your issue..." className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold outline-none placeholder:text-slate-400" />
          <button type="submit" disabled={isTyping || !input.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-amber-300 dark:text-slate-950" aria-label="Send message"><Send size={16} /></button>
        </form>
      </div>
    </motion.div>
  );
}

function ActionToast({ message, onClose }) {
  const isError = /failed|could not|not found|not available|please|required|expired|invalid|error/i.test(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-1/2 top-4 z-[120] w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 sm:top-5 sm:w-[min(92vw,36rem)]"
      role="status"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950">
        <div className={`h-1.5 ${isError ? "bg-rose-500" : "bg-gradient-to-r from-teal-500 via-blue-500 to-amber-300"}`} />
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <div className={`grid h-10 w-10 flex-none place-items-center rounded-2xl ${isError ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-700"}`}>
            <Bell size={20} />
          </div>
          <p className="min-w-0 flex-1 pt-1 text-sm font-black leading-6 text-slate-900 dark:text-white sm:text-base">
            {message}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 flex-none place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white"
            aria-label="Close message"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ClientSupportSection({ user, setStatusMessage }) {
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const canSendSupportMessage = user?.role === "user";

  const submitSupport = async (event) => {
    event.preventDefault();
    if (!canSendSupportMessage) {
      setStatusMessage("Please login to send a message");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: user?.name || String(formData.get("name") || "").trim(),
      email: user?.email || String(formData.get("email") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    setSupportSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("servicehub_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await parseApiResponse(response, "Message could not be sent.");
      if (!response.ok) throw new Error(data.message || "Message could not be sent.");
      form.reset();
      setStatusMessage("Message sent successfully. Admin can view it in the admin panel.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setSupportSubmitting(false);
    }
  };

  return (
    <section id="contact" className="home-section bg-[#f6f1e8] px-4 py-16 dark:bg-slate-900 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.7rem] border border-[#ded7ca] bg-[#fffefb] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 lg:p-10">
          <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
            Contact page
          </span>
          <h2 className="home-section-title mt-7 max-w-2xl font-display text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-4xl">
            Talk to ServiceHub support
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500 dark:text-slate-300">
            For urgent services, provider onboarding, partnerships, or booking support.
          </p>
          <div className="mt-7 grid gap-3 text-base font-medium text-slate-950 dark:text-white">
            <span className="flex items-center gap-3"><MessageCircle size={21} /> info.aparaitech@gmail.com</span>
            <span className="flex items-center gap-3"><MapPin size={21} /> Baramati, Maharashtra, India</span>
            <span className="flex items-center gap-3"><CalendarCheck size={21} /> 8:00 AM - 9:00 PM</span>
          </div>
        </div>

        <form onSubmit={submitSupport} className="rounded-[1.7rem] border border-[#ded7ca] bg-[#fffefb] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 lg:p-10">
          {!canSendSupportMessage && (
            <div className="mb-5 inline-flex rounded-full border border-teal-200 bg-teal-50 px-5 py-3 text-base font-black text-teal-700 dark:border-teal-300/25 dark:bg-teal-300/10 dark:text-teal-100">
              Contact us
            </div>
          )}
          <FormInput label="Name" name="name" defaultValue={user?.name || ""} placeholder="Your name" />
          <div className="mt-5">
            <FormInput label="Email" name="email" type="email" defaultValue={user?.email || ""} placeholder="you@example.com" />
          </div>
          <label className="mt-5 grid gap-2 font-bold">
            Message
            <textarea
              name="message"
              placeholder="How can we help?"
              rows="5"
              required
              className="rounded-2xl border border-[#ded7ca] bg-[#f0e7da] px-4 py-4 outline-none transition placeholder:text-slate-500 focus:border-teal-400 dark:border-white/10 dark:bg-white/10"
            />
          </label>
          <button type="submit" disabled={supportSubmitting} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-4 font-black text-white shadow-xl shadow-teal-500/20 transition disabled:cursor-not-allowed disabled:opacity-65">
            <Send size={18} /> {supportSubmitting ? "Sending..." : canSendSupportMessage ? "Send message" : "Contact us"}
          </button>
        </form>
      </div>
    </section>
  );
}

function ServiceHubFooter({ onServiceClick }) {
  return (
    <footer className="bg-[#151f28] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_1.05fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg shadow-black/20">
                <img src={SERVICEHUB_ICON} alt="ServiceHub symbol" className="h-full w-full rounded-xl object-contain" />
              </span>
              <h2 className="font-display text-4xl font-black tracking-[-0.035em]">ServiceHub</h2>
            </div>
            <p className="mt-4 max-w-md text-lg leading-8 text-slate-200">
              Trusted local professionals for home repairs, maintenance, installation, and emergency support.
            </p>
            <div className="mt-5 flex items-start gap-3 font-black leading-7">
              <ShieldCheck className="mt-1 h-5 w-5 flex-none text-amber-300" />
              <span>Verified providers with reliable client support</span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">Services</h3>
            <div className="mt-4 grid gap-2 text-lg text-slate-200">
              {["Plumber", "Electrician", "Carpenter", "Painter", "AC Repair", "Refrigerator Repair", "Washing Machine Repair", "TV Repair"].map((service) => (
                <button key={service} type="button" onClick={() => onServiceClick(service)} className="w-fit text-left transition hover:text-amber-300">
                  {service}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">Contact</h3>
            <div className="mt-4 grid gap-4 text-lg text-slate-200">
              <span className="flex items-center gap-3"><Phone className="h-5 w-5 text-amber-300" /> +91 9158852129</span>
              <span className="flex items-center gap-3"><Mail className="h-5 w-5 text-amber-300" /> info.aparaitech@gmail.com</span>
              <span className="flex items-center gap-3"><MapPin className="h-5 w-5 text-amber-300" /> Baramati, Maharashtra</span>
              <span className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-amber-300" /> Mon - Sun, 8:00 AM - 9:00 PM</span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">For Clients</h3>
            <p className="mt-4 text-lg leading-8 text-slate-200">
              Book nearby service providers, compare ratings, and get help for urgent repair needs.
            </p>
            <div className="mt-3 border-l-4 border-amber-300 pl-4 text-lg leading-8 text-slate-200">
              <p className="font-black text-white">Need help?</p>
              <p>Call us for booking assistance or service issues.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-white/15 pt-6 text-base text-slate-200">
          <span>© 2026 ServiceHub. All Rights Reserved.</span>
          <div className="flex flex-wrap gap-4">
            <a href="/contact" className="transition hover:text-amber-300">Contact</a>
            <a href="/privacy-policy" className="transition hover:text-amber-300">Privacy Policy</a>
            <a href="/terms-and-conditions" className="transition hover:text-amber-300">Terms</a>
            <span>Serving homes across Pune and nearby cities.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function ModernFooter() {
  return (
    <footer className="bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white p-1"><img src={SERVICEHUB_ICON} alt="ServiceHub symbol" className="h-full w-full rounded-xl object-contain" /></span><span className="text-xl font-black">ServiceHub</span></div><p className="mt-4 max-w-sm text-slate-400">Premium local services for Indian homes, built with trust, status clarity, and real provider workflows.</p></div>
        {["Company", "Services", "Support"].map((group) => <div key={group}><p className="font-black">{group}</p><div className="mt-4 grid gap-3 text-slate-400"><span>About</span><span>Providers</span><span>Careers</span></div></div>)}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400"><span>© 2026 ServiceHub</span><span className="flex items-center gap-2">Made for modern service teams <ChevronRight size={14} /></span></div>
    </footer>
  );
}
