import { Platform } from "react-native";

// Widget Crisp Chat — WEB UNIQUEMENT (le snippet injecte un <script> dans le DOM,
// inexistant sur natif). Sur iOS/Android ces fonctions sont des no-op.
const CRISP_WEBSITE_ID = "3a68af50-a416-4be0-92c1-7ef7beb45aad";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

let injected = false;

/**
 * Injecte le script Crisp (idempotent). À appeler au montage sur le web.
 * Position : bottom-right (défaut Crisp, on s'assure de ne pas inverser).
 * Couleur principale (#D4AF37) : à définir dans le dashboard Crisp
 * (Settings → Chatbox → Appearance) — l'API JS n'accepte pas de hex arbitraire.
 */
export function initCrisp(): void {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (injected || window.CRISP_WEBSITE_ID) return;
  injected = true;

  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

  const s = document.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = true;
  document.getElementsByTagName("head")[0].appendChild(s);

  // Passe le launcher en bottom-LEFT pour ne pas chevaucher le bouton profil
  // (tab bar, bottom-right). true = inversion vers la gauche.
  window.$crisp.push(["config", "position:reverse", [true]]);

  // Offset vertical : remonte le launcher de 80px au-dessus de la tab bar.
  const style = document.createElement("style");
  style.id = "crisp-offset";
  style.innerHTML = `
    .cc-13wro { bottom: 80px !important; }
  `;
  document.head.appendChild(style);
}

/**
 * Pré-remplit l'identité du visiteur connecté dans Crisp (email + nom).
 * Les pushes sont mis en file d'attente par $crisp même avant le chargement
 * complet du script — sûr à appeler dès qu'une session est disponible.
 */
export function setCrispUser(email?: string | null, name?: string | null): void {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || !window.$crisp) return;
  if (email) window.$crisp.push(["set", "user:email", [email]]);
  if (name)  window.$crisp.push(["set", "user:nickname", [name]]);
}
