(() => {
  "use strict";

  const CONSENT_KEY = "bd_cookie_consent";
  const UID_KEY = "bd_consent_uid";
  const POLICY_VERSION = "v2";
  const SITE = "growthbydaphne";
  const CONSENT_MAX_AGE_DAYS = 183;
  const FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSfsKxAIPLCjMhmV50vRE5e0aCAWU9rDr3J7ZA3HJuQ8l5oxYg/formResponse";
  const FORM_FIELDS = {
    uid:       "entry.961622031",
    decision:  "entry.109364102",
    analytics: "entry.141650209",
    ads:       "entry.182416439",
    page:      "entry.100032831",
    version:   "entry.181332719",
    site:      "entry.1268469245",
  };
  const GTM_ID = "GTM-MGVGJ6DS";
  const dataLayer = (window.dataLayer = window.dataLayer || []);

  function gtag() {
    dataLayer.push(arguments);
  }

  function normaliseChoice(choice) {
    if (choice === "accepted") return { analytics: true, advertising: true };
    if (choice === "refused") return { analytics: false, advertising: false };
    if (choice && typeof choice === "object") {
      return {
        analytics: choice.analytics === true,
        advertising: choice.advertising === true,
      };
    }
    return null;
  }

  function getConsentUid() {
    try {
      let uid = localStorage.getItem(UID_KEY);
      if (!uid) {
        uid = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
            });
        localStorage.setItem(UID_KEY, uid);
      }
      return uid;
    } catch (_) {
      return "unavailable";
    }
  }

  function logToSheet(preferences, decision) {
    try {
      const params = new URLSearchParams();
      params.append(FORM_FIELDS.uid, getConsentUid());
      params.append(FORM_FIELDS.decision, decision);
      params.append(FORM_FIELDS.analytics, preferences.analytics ? "Oui" : "Non");
      params.append(FORM_FIELDS.ads, preferences.advertising ? "Oui" : "Non");
      params.append(FORM_FIELDS.page, window.location.pathname);
      params.append(FORM_FIELDS.version, POLICY_VERSION);
      params.append(FORM_FIELDS.site, SITE);
      fetch(FORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }).catch(() => {});
    } catch (_) {}
  }

  function updateConsent(choice) {
    const analytics = choice.analytics ? "granted" : "denied";
    const advertising = choice.advertising ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: advertising,
      ad_user_data: advertising,
      ad_personalization: advertising,
      analytics_storage: analytics,
    });
    if (choice.analytics || choice.advertising) {
      dataLayer.push({ event: "bd_consent_ok" });
    }
  }

  function loadGtm() {
    if (document.body?.hasAttribute("data-cookie-settings-page")) return;
    if (document.querySelector("script[data-growth-gtm]")) return;
    dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    script.dataset.growthGtm = "true";
    document.head.appendChild(script);
  }

  function initGtm() {
    if (document.body) {
      loadGtm();
    } else {
      document.addEventListener("DOMContentLoaded", loadGtm, { once: true });
    }
  }

  function applyConsent(choice) {
    const preferences = normaliseChoice(choice);
    if (!preferences) return;
    const record = {
      analytics: preferences.analytics,
      advertising: preferences.advertising,
      ts: Date.now(),
      version: POLICY_VERSION,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    updateConsent(preferences);
    const decision = choice === "accepted" ? "accept_all"
      : choice === "refused" ? "refuse_all"
      : "custom";
    logToSheet(preferences, decision);
  }

  window.bdSetCookieConsent = applyConsent;

  function dismissBanner() {
    const banner = document.getElementById("bd-cookie-banner");
    const overlay = document.getElementById("bd-cookie-overlay");
    if (banner) banner.remove();
    if (overlay) overlay.remove();
  }

  function createBanner() {
    if (document.getElementById("bd-cookie-banner")) return;

    const overlay = document.createElement("div");
    overlay.id = "bd-cookie-overlay";
    document.body.appendChild(overlay);

    const banner = document.createElement("aside");
    banner.id = "bd-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "bd-cookie-title");
    banner.setAttribute("aria-describedby", "bd-cookie-description");
    banner.innerHTML = `
      <div id="bd-cookie-main">
        <div>
          <strong id="bd-cookie-title">Votre confidentialité compte.</strong>
          <p id="bd-cookie-description">Nous utilisons des outils de mesure d’audience et de publicité ciblée uniquement avec votre accord. Vous pouvez refuser ou modifier votre choix à tout moment.</p>
          <a href="/confidentialite.html">En savoir plus</a>
        </div>
        <div class="bd-cookie-actions">
          <button type="button" data-bd-cookie="refused">Tout refuser</button>
          <button type="button" data-bd-cookie="customize">Personnaliser</button>
          <button type="button" data-bd-cookie="accepted" class="bd-cookie-accept">Tout accepter</button>
        </div>
      </div>
      <div id="bd-cookie-custom" hidden>
        <strong>Personnaliser vos choix</strong>
        <div class="bd-cookie-purposes">
          <label class="bd-cookie-purpose">
            <div>
              <strong>Mesure d’audience</strong>
              <span>Google Analytics et Microsoft Clarity — comprendre comment les visiteurs utilisent le site, et enregistrer le parcours de navigation (clics, scroll) pour repérer ce qui bloque. Sans vous identifier, et sans enregistrer ce que vous tapez.</span>
            </div>
            <input type="checkbox" id="bd-toggle-analytics">
            <span class="bd-toggle"></span>
          </label>
          <label class="bd-cookie-purpose">
            <div>
              <strong>Publicité ciblée</strong>
              <span>Meta Pixel — afficher des publicités pertinentes</span>
            </div>
            <input type="checkbox" id="bd-toggle-advertising">
            <span class="bd-toggle"></span>
          </label>
        </div>
        <div class="bd-cookie-actions">
          <button type="button" data-bd-cookie="refused">Tout refuser</button>
          <button type="button" data-bd-cookie="save-custom" class="bd-cookie-accept">Enregistrer mes choix</button>
        </div>
      </div>`;
    document.body.appendChild(banner);

    banner.querySelectorAll("[data-bd-cookie]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.bdCookie;
        if (action === "customize") {
          banner.querySelector("#bd-cookie-main").hidden = true;
          banner.querySelector("#bd-cookie-custom").hidden = false;
          return;
        }
        if (action === "save-custom") {
          applyConsent({
            analytics: banner.querySelector("#bd-toggle-analytics").checked,
            advertising: banner.querySelector("#bd-toggle-advertising").checked,
          });
          dismissBanner();
          return;
        }
        applyConsent(action);
        dismissBanner();
      });
    });
  }

  function bindManageLinks() {
    document.querySelectorAll("[data-bd-cookie-manage]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        logToSheet({ analytics: false, advertising: false }, "withdraw");
        localStorage.removeItem(CONSENT_KEY);
        updateConsent({ analytics: false, advertising: false });
        window.location.reload();
      });
    });
  }

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #bd-cookie-overlay{position:fixed;z-index:2147483645;inset:0;background:rgba(61,29,51,.55)}
      #bd-cookie-banner{position:fixed;z-index:2147483646;top:50%;left:50%;transform:translate(-50%,-50%);width:calc(100% - 32px);max-width:720px;padding:28px 24px;border-radius:8px;background:#FFF9EE;color:#3D1D33;box-shadow:0 16px 50px rgba(61,29,51,.3);font:14px/1.55 'DM Sans',sans-serif}
      #bd-cookie-main{max-width:100%}
      #bd-cookie-custom{max-width:100%}
      #bd-cookie-custom[hidden]{display:none}
      #bd-cookie-banner strong{font-family:'Playfair Display',serif;font-size:18px;font-weight:400}
      #bd-cookie-banner p{max-width:660px;margin:5px 0 4px}
      #bd-cookie-banner a{color:#3D1D33;text-decoration:underline;text-underline-offset:2px}
      .bd-cookie-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
      .bd-cookie-actions button{padding:10px 14px;border:1px solid #3D1D33;border-radius:4px;background:transparent;color:#3D1D33;font:500 13px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
      .bd-cookie-actions .bd-cookie-accept{border-color:#E0B84A;background:#E0B84A}
      .bd-cookie-purposes{display:flex;gap:12px;margin:14px 0}
      .bd-cookie-purpose{display:flex;align-items:center;justify-content:space-between;gap:16px;flex:1;padding:14px 16px;border:1px solid rgba(61,29,51,.15);border-radius:6px;cursor:pointer}
      .bd-cookie-purpose strong{font-size:15px!important}
      .bd-cookie-purpose>div>span{font-size:13px;opacity:.7;display:block;margin-top:2px}
      .bd-cookie-purpose input{position:absolute;opacity:0;pointer-events:none}
      .bd-toggle{position:relative;flex:none;width:44px;height:24px;border-radius:12px;background:rgba(61,29,51,.2);transition:background .2s}
      .bd-toggle::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}
      .bd-cookie-purpose input:checked+.bd-toggle{background:#E0B84A}
      .bd-cookie-purpose input:checked+.bd-toggle::after{transform:translateX(20px)}
      #bd-cookie-custom .bd-cookie-actions{justify-content:flex-end}
      @media(max-width:700px){.bd-cookie-purposes{flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });

  let savedChoice = null;
  try {
    const rawChoice = localStorage.getItem(CONSENT_KEY);
    if (rawChoice === "accepted" || rawChoice === "refused") {
      localStorage.removeItem(CONSENT_KEY);
      savedChoice = null;
    } else if (rawChoice) {
      const stored = JSON.parse(rawChoice);
      const expired =
        typeof stored.ts !== "number" ||
        Date.now() - stored.ts > CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000 ||
        stored.version !== POLICY_VERSION;
      if (expired) {
        localStorage.removeItem(CONSENT_KEY);
        savedChoice = null;
      } else {
        savedChoice = normaliseChoice(stored);
      }
    }
  } catch (error) {
    savedChoice = null;
  }

  if (savedChoice) {
    updateConsent(savedChoice);
  }

  initGtm();

  document.addEventListener("DOMContentLoaded", () => {
    addStyles();
    if (
      !document.body.hasAttribute("data-cookie-settings-page") &&
      !savedChoice
    )
      createBanner();
    bindManageLinks();
  });
})();
