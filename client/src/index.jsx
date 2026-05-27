import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import 'katex/dist/katex.min.css';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </HelmetProvider>
);

// Register service worker for push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => { })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}