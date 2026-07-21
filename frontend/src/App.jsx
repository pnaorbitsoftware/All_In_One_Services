import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import Home from "./pages/home/Home";

const ContactPage = lazy(() => import("./pages/SeoPages").then((module) => ({ default: module.ContactPage })));
const LocationPage = lazy(() => import("./pages/SeoPages").then((module) => ({ default: module.LocationPage })));
const PolicyPage = lazy(() => import("./pages/SeoPages").then((module) => ({ default: module.PolicyPage })));
const ServicePage = lazy(() => import("./pages/SeoPages").then((module) => ({ default: module.ServicePage })));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf6] p-8 font-black text-slate-950">Loading ServiceHub...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services/:slug" element={<ServicePage />} />
        <Route path="/locations/:citySlug" element={<LocationPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />
        <Route path="/terms-and-conditions" element={<PolicyPage type="terms" />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  );
}
