import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

if (gaMeasurementId) {
  const gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaMeasurementId);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
