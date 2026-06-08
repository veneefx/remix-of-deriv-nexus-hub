import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { hydrateTokenVault } from "./lib/token-vault";

// Lock to portrait where supported so phone tilts don't rotate the UI.
try {
  const orientation = (screen as Screen & { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
  if (orientation?.lock) orientation.lock("portrait").catch(() => {});
} catch {}

// Decrypt stored Deriv tokens into memory before first render so existing
// sync accessors keep working. Failures fall back to plaintext (legacy).
hydrateTokenVault().catch(() => {}).finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
