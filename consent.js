(() => {
  "use strict";

  const CONSENT_KEY = "bd_cookie_consent";
  const GTM_ID = "GTM-MGVGJ6DS";
  const dataLayer = window.dataLayer = window.dataLayer || [];

  function gtag() {
    dataLayer.push(arguments);
  }

  function normaliseChoice(choice) {
    if (choice === "accepted") return { analytics: true, advertising: true };
    if (choice === "refused") return { analytics: false, advertising: false };
    if (choice && typeof choice === "object") {
      return { analytics: choice.analytics === true, advertising: choice.advertising === true };
    }
    return null;
  }

  function updateConsent(choice) {
    const analytics = choice.analytics ? "granted" : "denied";
    const advertising = choice.advertising ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: advertising,
      ad_user_data: advertising,
      ad_personalization: advertising,
      analytics_storage: analytics
    });
  }

  function loadGtm() {
    if (document.body?.hasAttribute("data-cookie-settings-page")) return;
    if (document.querySelector("script[data-growth-gtm]")) return;
    dataLayer.push({ event: "bd_consent_ok" });
    dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    script.dataset.growthGtm = "true";
    document.head.appendChild(script);
  }

  function applyConsent(choice) {
    const preferences = normaliseChoice(choice);
    if (!preferences) return;
    localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences));
    updateConsent(preferences);
    if (preferences.analytics || preferences.advertising) loadGtm();
  }

  window.bdSetCookieConsent = applyConsent;

  function createBanner() {
    if (document.getElementById("bd-cookie-banner")) return;
    const banner = document.createElement("aside");
    banner.id = "bd-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "bd-cookie-title");
    banner.setAttribute("aria-describedby", "bd-cookie-description");
    banner.innerHTML = `
      <div>
        <strong id="bd-cookie-title">Votre confidentialité compte.</strong>
        <p id="bd-cookie-description">Nous utilisons des outils de mesure et de publicité uniquement avec votre accord. Vous pouvez refuser ou modifier votre choix à tout moment.</p>
        <a href="/confidentialite.html">En savoir plus</a>
      </div>
      <div class="bd-cookie-actions">
        <button type="button" data-bd-cookie="refused">Refuser</button>
        <button type="button" data-bd-cookie="accepted" class="bd-cookie-accept">Accepter</button>
      </div>`;
    document.body.appendChild(banner);
    banner.querySelectorAll("[data-bd-cookie]").forEach((button) => {
      button.addEventListener("click", () => {
        applyConsent(button.dataset.bdCookie);
        banner.remove();
      });
    });
  }

  function bindManageLinks() {
    document.querySelectorAll("[data-bd-cookie-manage]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
      localStorage.removeItem(CONSENT_KEY);
      updateConsent(false);
      window.location.reload();
      });
    });
  }

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #bd-cookie-banner { position:fixed; z-index:2147483646; right:20px; bottom:20px; left:20px; display:flex; align-items:center; justify-content:space-between; gap:24px; max-width:920px; margin:0 auto; padding:18px 20px; border:1px solid rgba(61,29,51,.18); border-radius:6px; background:#FFF9EE; color:#3D1D33; box-shadow:0 10px 35px rgba(61,29,51,.22); font:14px/1.55 'DM Sans', sans-serif; }
      #bd-cookie-banner strong { font-family:'Playfair Display', serif; font-size:18px; font-weight:400; }
      #bd-cookie-banner p { max-width:660px; margin:5px 0 4px; }
      #bd-cookie-banner a { color:#3D1D33; text-decoration:underline; text-underline-offset:2px; }
      .bd-cookie-actions { display:flex; flex:none; gap:10px; }
      .bd-cookie-actions button { padding:10px 14px; border:1px solid #3D1D33; border-radius:4px; background:transparent; color:#3D1D33; font:500 13px 'DM Sans', sans-serif; cursor:pointer; }
      .bd-cookie-actions .bd-cookie-accept { border-color:#E0B84A; background:#E0B84A; }
      @media (max-width:700px) { #bd-cookie-banner { display:block; } .bd-cookie-actions { margin-top:14px; } }
    `;
    document.head.appendChild(style);
  }

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });

  let savedChoice = null;
  try {
    const rawChoice = localStorage.getItem(CONSENT_KEY);
    if (rawChoice === "accepted" || rawChoice === "refused") {
      savedChoice = normaliseChoice(rawChoice);
      localStorage.setItem(CONSENT_KEY, JSON.stringify(savedChoice));
    } else if (rawChoice) {
      savedChoice = normaliseChoice(JSON.parse(rawChoice));
    }
  } catch (error) {
    savedChoice = null;
  }

  if (savedChoice) {
    updateConsent(savedChoice);
    if (savedChoice.analytics || savedChoice.advertising) loadGtm();
  }

  document.addEventListener("DOMContentLoaded", () => {
    addStyles();
    if (!document.body.hasAttribute("data-cookie-settings-page") && !savedChoice) createBanner();
    bindManageLinks();
  });
})();
