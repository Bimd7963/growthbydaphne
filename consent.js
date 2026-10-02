(() => {
  "use strict";

  const CONSENT_KEY = "bd_cookie_consent";
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
    localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences));
    updateConsent(preferences);
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
              <span>Google Analytics — comprendre comment les visiteurs utilisent le site</span>
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
        localStorage.removeItem(CONSENT_KEY);
        updateConsent(false);
        window.location.reload();
      });
    });
  }

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #bd-cookie-overlay{position:fixed;z-index:2147483645;inset:0;background:rgba(61,29,51,.45)}
      #bd-cookie-banner{position:fixed;z-index:2147483646;right:0;bottom:0;left:0;padding:24px 20px;background:#FFF9EE;color:#3D1D33;box-shadow:0 -4px 30px rgba(61,29,51,.25);font:14px/1.55 'DM Sans',sans-serif}
      #bd-cookie-main{display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:960px;margin:0 auto}
      #bd-cookie-custom{max-width:960px;margin:0 auto}
      #bd-cookie-custom[hidden]{display:none}
      #bd-cookie-banner strong{font-family:'Playfair Display',serif;font-size:18px;font-weight:400}
      #bd-cookie-banner p{max-width:660px;margin:5px 0 4px}
      #bd-cookie-banner a{color:#3D1D33;text-decoration:underline;text-underline-offset:2px}
      .bd-cookie-actions{display:flex;flex:none;gap:10px}
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
      #bd-cookie-custom .bd-cookie-actions{justify-content:flex-end;margin-top:14px}
      @media(max-width:700px){#bd-cookie-main{display:block}#bd-cookie-main .bd-cookie-actions{margin-top:14px}.bd-cookie-purposes{flex-direction:column}}
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
