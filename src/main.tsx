import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./fonts.css";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Installable + offline. Updates apply on the next launch.
registerSW({ immediate: true });

// Ask the browser not to evict our localStorage under storage pressure (granted for installed apps).
try {
  void navigator.storage?.persist?.();
} catch {
  /* not supported */
}
