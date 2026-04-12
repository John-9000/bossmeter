function rollBossLinearWeights() {
  const w1 = 1.1;
  const w100 = 0.9;

  let total = 0;
  for (let n = 1; n <= 100; n += 1) {
    const t = (n - 1) / 99;
    total += w1 + (w100 - w1) * t;
  }

  let r = Math.random() * total;
  for (let n = 1; n <= 100; n += 1) {
    const t = (n - 1) / 99;
    r -= w1 + (w100 - w1) * t;
    if (r <= 0) return n;
  }

  return 100;
}

const BASE_URL = "https://bossmeter.app";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uk.co.bossdeboss.bossmeter";
const SIGNING_SECRET = "bossdeboss-score-v1";

function toBase64Url(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Base64Url(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(hash));
}

async function makeScoreSignature(level) {
  const payload = `l=${level}`;
  const sig = await sha256Base64Url(`${SIGNING_SECRET}:${payload}`);
  return sig.slice(0, 20);
}

async function makeSignedScoreUrl(level) {
  const sig = await makeScoreSignature(level);
  return `${BASE_URL}/sharedscore.html?l=${encodeURIComponent(level)}&s=${encodeURIComponent(sig)}`;
}

async function verifySignedScore(level, sig) {
  if (!Number.isFinite(level) || level < 1 || level > 100) return false;
  const expected = await makeScoreSignature(level);
  return String(sig || "") === expected;
}

function shareEmojiFor(level) {
  if (level >= 90) return "\uD83C\uDFC6";
  if (level >= 70) return "\uD83D\uDC51";
  if (level >= 50) return "\u26A1";
  if (level >= 30) return "\uD83C\uDFAF";
  return "\u2728";
}

const ICONS = {
  autoAwesome:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zm-6.5 9L6.7 14 9 15.3 6.7 16.6 5.5 20l-1.2-3.4L2 15.3 4.3 14 5.5 11zm13 0l1.2 3L22 15.3l-2.3 1.3L18.5 20l-1.2-3.4-2.3-1.3 2.3-1.3 1.2-3z"/></svg>',
  centerFocusStrong:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3h4v2H7v2H5V3zm10 0h4v4h-2V5h-2V3zM5 17h2v2h2v2H5v-4zm12 0h2v4h-4v-2h2v-2zM12 8a4 4 0 100 8 4 4 0 000-8zm0 2.2A1.8 1.8 0 1112 13.8 1.8 1.8 0 0112 10.2z"/></svg>',
  bolt:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 21h-1l1-7H7.5a1 1 0 01-.8-1.6l6-8A1 1 0 0113.5 4h1l-1 7H16.5a1 1 0 01.8 1.6l-6 8A1 1 0 0111 21z"/></svg>',
  starOutline:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  star:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>'
};

function tierFor(level) {
  if (level >= 90) return { title: "LEGENDARY BOSS", colorVar: "--yellow", icon: "star" };
  if (level >= 70) return { title: "ELITE BOSS", colorVar: "--purple", icon: "starOutline" };
  if (level >= 50) return { title: "RISING BOSS", colorVar: "--blue", icon: "bolt" };
  if (level >= 30) return { title: "APPRENTICE BOSS", colorVar: "--green", icon: "centerFocusStrong" };
  return { title: "NOVICE BOSS", colorVar: "--gray", icon: "autoAwesome" };
}

function setColor(el, cssVarName) {
  if (!el) return;
  const color = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  el.style.color = color || "";
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function getStoredJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function getCookieJson(key) {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${key.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`));
    const raw = match ? decodeURIComponent(match[1]) : "";
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCookieJson(key, value, days = 7) {
  try {
    const encoded = encodeURIComponent(JSON.stringify(value));
    document.cookie = `${key}=${encoded}; max-age=${days * 24 * 60 * 60}; path=/; samesite=lax`;
  } catch {}
}

function getSyncedJson(key) {
  const local = getStoredJson(key);
  const cookie = getCookieJson(key);
  const localUpdatedAt = Number(local?.updatedAt);
  const cookieUpdatedAt = Number(cookie?.updatedAt);

  if (Number.isFinite(localUpdatedAt) && Number.isFinite(cookieUpdatedAt)) {
    return localUpdatedAt >= cookieUpdatedAt ? local : cookie;
  }

  return local || cookie;
}

function setSyncedJson(key, value) {
  setStoredJson(key, value);
  setCookieJson(key, value);
}

function getInspirationState(now, durationMs, storageKey, quotes) {
  if (!Array.isArray(quotes) || quotes.length === 0 || durationMs <= 0) {
    return {
      quote: "",
      updatedAt: now,
      percent: 0,
      ready: false
    };
  }

  const stored = getSyncedJson(storageKey);
  const storedQuoteIndex = Number(stored?.quoteIndex);
  const storedUpdatedAt = Number(stored?.updatedAt);
  const storedQuote = Number.isInteger(storedQuoteIndex) && storedQuoteIndex >= 0 && storedQuoteIndex < quotes.length
    ? quotes[storedQuoteIndex]
    : "";

  if (!storedQuote || !Number.isFinite(storedUpdatedAt)) {
    const initial = {
      quoteIndex: 0,
      updatedAt: now - durationMs
    };
    setSyncedJson(storageKey, initial);
    return {
      quote: quotes[0],
      quoteIndex: 0,
      updatedAt: initial.updatedAt,
      percent: 100,
      ready: true
    };
  }

  const elapsed = Math.max(0, now - storedUpdatedAt);
  const percent = Math.max(0, Math.min(100, Math.round((elapsed / durationMs) * 100)));
  const ready = percent >= 100;

  return {
    quote: storedQuote,
    quoteIndex: storedQuoteIndex,
    updatedAt: storedUpdatedAt,
    percent,
    ready
  };
}

function parseInspirationQuote(raw) {
  const value = String(raw || "").trim();
  const colonIndex = value.indexOf(":");
  if (colonIndex > 0 && colonIndex < value.length - 1) {
    return {
      author: value.slice(0, colonIndex).trim(),
      quote: value.slice(colonIndex + 1).trim()
    };
  }

  return {
    author: "",
    quote: value
  };
}

function getLastSavedBossLevel(resultKey) {
  const local = getStoredJson(resultKey);
  const session = (() => {
    try {
      const raw = sessionStorage.getItem(resultKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const localLevel = Number(local?.level);
  if (Number.isFinite(localLevel) && localLevel >= 1 && localLevel <= 100) return localLevel;

  const sessionLevel = Number(session?.level);
  if (Number.isFinite(sessionLevel) && sessionLevel >= 1 && sessionLevel <= 100) return sessionLevel;

  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  const COOLDOWN_MS = 1 * 60 * 60 * 1000;
  const INSPIRATION_MS = 6 * 60 * 60 * 1000;
  const STORAGE_KEY = "boss_last_check_ms";
  const RESULT_KEY = "boss_last_result";
  const INSPIRATION_KEY = "boss_inspiration";
  const COMMERCIAL_HEADER_KEY = "boss_commercial_header";
  const CONSENT_KEY = "boss_cookie_consent";
  const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
  const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  const inspirationChannel = "BroadcastChannel" in window
    ? new BroadcastChannel("boss_inspiration_sync")
    : null;

  let currentLevel = null;
  let adsenseLoaded = false;

  function getLastCheck() {
    const v = localStorage.getItem(STORAGE_KEY);
    const n = v ? Number(v) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function setLastCheck(ms) {
    localStorage.setItem(STORAGE_KEY, String(ms));
  }

  function getCookie(name) {
    try {
      const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`));
      return m ? decodeURIComponent(m[1]) : null;
    } catch {
      return null;
    }
  }

  function setCookie(name, value, days) {
    try {
      const maxAge = days ? `; max-age=${days * 24 * 60 * 60}` : "";
      document.cookie = `${name}=${encodeURIComponent(value)}${maxAge}; path=/; samesite=lax`;
    } catch {}
  }

  function getConsent() {
    return localStorage.getItem(CONSENT_KEY) || getCookie(CONSENT_KEY);
  }

  function setConsent(value) {
    localStorage.setItem(CONSENT_KEY, value);
    setCookie(CONSENT_KEY, value, 365);
  }

  function loadAdSenseOnce() {
    if (adsenseLoaded) return;
    if (document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      adsenseLoaded = true;
      return;
    }

    adsenseLoaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = ADSENSE_SRC;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }

  function tryRenderAds() {
    if (getConsent() !== "granted") return;
    loadAdSenseOnce();

    const units = document.querySelectorAll("ins.adsbygoogle");
    units.forEach((unit) => {
      if (unit.getAttribute("data-ads-init") === "1") return;
      unit.setAttribute("data-ads-init", "1");
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  const cookieBanner = document.getElementById("cookieBanner");
  const cookieAccept = document.getElementById("cookieAccept");
  const cookieDecline = document.getElementById("cookieDecline");

  function showCookieBanner(show) {
    if (!cookieBanner) return;
    cookieBanner.classList.toggle("hidden", !show);
  }

  const consent = getConsent();
  if (consent !== "granted" && consent !== "denied") {
    showCookieBanner(true);
  } else {
    showCookieBanner(false);
    if (consent === "granted") loadAdSenseOnce();
  }

  cookieAccept?.addEventListener("click", () => {
    setConsent("granted");
    showCookieBanner(false);
    tryRenderAds();
  });

  cookieDecline?.addEventListener("click", () => {
    setConsent("denied");
    showCookieBanner(false);
  });

  tryRenderAds();

  const commercialsHeader = document.getElementById("commercialsHeader");
  function refreshCommercialsHeader() {
    if (!commercialsHeader || !window.BOSS_CONTENT) return;
    const previous = getStoredJson(COMMERCIAL_HEADER_KEY)?.text || null;
    const next = pickNonRepeating(BOSS_CONTENT.commercialsHeaders, previous);
    if (!next) return;
    commercialsHeader.textContent = next;
    setStoredJson(COMMERCIAL_HEADER_KEY, { text: next, updatedAt: Date.now() });
  }

  if (commercialsHeader && window.BOSS_CONTENT) {
    refreshCommercialsHeader();
  }

  const sharedScoreRoot = document.getElementById("sharedScoreRoot");
  if (sharedScoreRoot) {
    (async () => {
      const params = new URLSearchParams(location.search);
      const level = Number(params.get("l"));
      const sig = params.get("s") || "";

      const ok = await verifySignedScore(level, sig);
      const sharedNumber = document.getElementById("resultNumber");
      const sharedTier = document.getElementById("resultTier");
      const sharedIcon = document.getElementById("resultIcon");
      const sharedLabel = document.getElementById("sharedLabel");
      const sharedToMainBtn = document.getElementById("sharedToMainBtn");

      if (!ok) {
        if (sharedNumber) sharedNumber.textContent = "-";
        if (sharedTier) sharedTier.textContent = "INVALID LINK";
        if (sharedIcon) sharedIcon.innerHTML = "";
        if (sharedLabel) sharedLabel.textContent = " ";
      } else {
        const info = tierFor(level);
        if (sharedNumber) sharedNumber.textContent = String(level);
        if (sharedTier) sharedTier.textContent = info.title;
        setColor(sharedNumber, info.colorVar);
        setColor(sharedTier, info.colorVar);

        if (sharedIcon) {
          sharedIcon.innerHTML = ICONS[info.icon] || ICONS.autoAwesome;
          const svg = sharedIcon.querySelector("svg");
          if (svg) {
            svg.classList.add("icon");
            setColor(svg, info.colorVar);
          }
        }

        if (sharedLabel) sharedLabel.textContent = " ";
      }

      sharedToMainBtn?.addEventListener("click", () => {
        try {
          sessionStorage.setItem("boss_autoroll", "1");
        } catch {}
        location.href = "./index.html";
      });
    })();

    return;
  }

  const inspirationQuote = document.getElementById("inspirationQuote");
  const inspirationAuthor = document.getElementById("inspirationAuthor");
  const inspirationPercent = document.getElementById("inspirationPercent");
  const inspirationPillBtn = document.getElementById("inspirationPillBtn");

  if (inspirationQuote && inspirationAuthor && inspirationPercent && inspirationPillBtn && window.BOSS_CONTENT) {
    function updateInspirationUI() {
      const now = Date.now();
      const inspiration = getInspirationState(
        now,
        INSPIRATION_MS,
        INSPIRATION_KEY,
        BOSS_CONTENT.successQuotes
      );

      const parsedQuote = parseInspirationQuote(inspiration.quote);
      inspirationQuote.textContent = parsedQuote.quote ? `"${parsedQuote.quote}"` : "";
      inspirationAuthor.textContent = parsedQuote.author || "";
      inspirationPercent.textContent = `${inspiration.percent}%`;
      inspirationPillBtn.classList.toggle("is-ready", inspiration.ready);
      inspirationPercent.classList.toggle("is-ready", inspiration.ready);
      inspirationPillBtn.setAttribute("aria-pressed", inspiration.ready ? "true" : "false");
    }

    function notifyInspirationChanged() {
      try {
        inspirationChannel?.postMessage({ type: "inspiration-updated", at: Date.now() });
      } catch {}
    }

    inspirationPillBtn.addEventListener("click", () => {
      const now = Date.now();
      const current = getInspirationState(
        now,
        INSPIRATION_MS,
        INSPIRATION_KEY,
        BOSS_CONTENT.successQuotes
      );

      if (!current.ready) return;

      const availableIndexes = BOSS_CONTENT.successQuotes
        .map((_, index) => index)
        .filter((index) => index !== current.quoteIndex);
      const nextQuoteIndex = availableIndexes.length > 0
        ? availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
        : 0;

      setSyncedJson(INSPIRATION_KEY, {
        quoteIndex: nextQuoteIndex,
        updatedAt: now
      });
      notifyInspirationChanged();
      updateInspirationUI();
    });

    updateInspirationUI();
    setInterval(updateInspirationUI, 1000);
    window.addEventListener("storage", (event) => {
      if (event.key === INSPIRATION_KEY) updateInspirationUI();
    });
    inspirationChannel?.addEventListener("message", (event) => {
      if (event?.data?.type === "inspiration-updated") updateInspirationUI();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") updateInspirationUI();
    });
    window.addEventListener("pageshow", updateInspirationUI);
    window.addEventListener("focus", updateInspirationUI);
  }

  const commercialsBackBtn = document.getElementById("commercialsBackBtn");
  const commercialAdsRoot = document.getElementById("commercialAdsRoot");
  const commercialAdsStatus = document.getElementById("commercialAdsStatus");
  const otherCommercialsBtn = document.getElementById("otherCommercialsBtn");

  if (commercialsBackBtn) {
    const savedLevel = getLastSavedBossLevel(RESULT_KEY);
    commercialsBackBtn.textContent = `Boss Score: ${savedLevel ?? "--"}`;
  }

  if (commercialAdsRoot && otherCommercialsBtn) {
    let commercialsCooldownTimer = null;
    let commercialsCooldownSeconds = 0;

    function updateOtherCommercialsButton() {
      if (commercialsCooldownSeconds > 0) {
        otherCommercialsBtn.disabled = true;
        otherCommercialsBtn.textContent = `Other Boss Commercials (${commercialsCooldownSeconds}s)`;
        return;
      }

      otherCommercialsBtn.disabled = false;
      otherCommercialsBtn.textContent = "Other Boss Commercials";
    }

    function startCommercialsCooldown() {
      if (commercialsCooldownTimer) clearInterval(commercialsCooldownTimer);
      commercialsCooldownSeconds = 3;
      updateOtherCommercialsButton();

      commercialsCooldownTimer = setInterval(() => {
        commercialsCooldownSeconds -= 1;
        if (commercialsCooldownSeconds <= 0) {
          commercialsCooldownSeconds = 0;
          clearInterval(commercialsCooldownTimer);
          commercialsCooldownTimer = null;
        }
        updateOtherCommercialsButton();
      }, 1000);
    }

    function renderCommercialSlot() {
      commercialAdsRoot.querySelectorAll("ins.adsbygoogle").forEach((node) => node.remove());
      const adUnit = document.createElement("ins");
      adUnit.className = "adsbygoogle commercialAdsUnit";
      adUnit.style.display = "block";
      adUnit.setAttribute("data-ad-client", "ca-pub-7548877721858943");
      adUnit.setAttribute("data-ad-slot", "1234567890");
      adUnit.setAttribute("data-ad-format", "auto");
      adUnit.setAttribute("data-full-width-responsive", "true");
      commercialAdsRoot.appendChild(adUnit);

      if (commercialAdsStatus) {
        commercialAdsStatus.textContent = getConsent() === "granted"
          ? "Ad slot"
          : "Ad slot";
      }

      tryRenderAds();
      refreshCommercialsHeader();
    }

    renderCommercialSlot();
    updateOtherCommercialsButton();
    otherCommercialsBtn.addEventListener("click", () => {
      if (otherCommercialsBtn.disabled) return;
      renderCommercialSlot();
      startCommercialsCooldown();
    });
  }

  const checkBtn = document.getElementById("checkBtn");
  if (!checkBtn) return;

  const placeholder = document.getElementById("placeholder");
  const result = document.getElementById("result");
  const resultNumber = document.getElementById("resultNumber");
  const resultTier = document.getElementById("resultTier");
  const resultIcon = document.getElementById("resultIcon");
  const bossImage = document.getElementById("bossImage");
  const progressBlock = document.getElementById("progressBlock");
  const progressValue = document.getElementById("progressValue");
  const progressFill = document.getElementById("progressFill");
  const btnIcon = document.getElementById("btnIcon");
  const btnText = document.getElementById("btnText");
  const resultShareBtn = document.getElementById("resultShareBtn");
  const shareModal = document.getElementById("shareModal");
  const shareClose = document.getElementById("shareClose");
  const shareSiteLinkBtn = document.getElementById("shareSiteLinkBtn");
  const shareBossScoreBtn = document.getElementById("shareBossScoreBtn");

  let cooldownTimer = null;
  let timer = null;

  function updateCooldownUI() {
    const last = getLastCheck();
    const now = Date.now();
    const remaining = last + COOLDOWN_MS - now;

    if (remaining > 0) {
      if (!checkBtn.disabled) checkBtn.disabled = true;
      if (btnText && btnText.textContent !== "Checking...") {
        btnText.textContent = `Come back in ${formatRemaining(remaining)}`;
      }
      return true;
    }

    if (btnText && btnText.textContent !== "Checking...") {
      btnText.textContent = "Check My Boss Level";
    }
    checkBtn.disabled = false;
    return false;
  }

  function startCooldownTicker() {
    if (cooldownTimer) clearInterval(cooldownTimer);
    cooldownTimer = setInterval(() => {
      const stillCooling = updateCooldownUI();
      if (!stillCooling) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  }

  function setAnimating(isAnimating) {
    if (isAnimating) checkBtn.disabled = true;
    if (btnText) btnText.textContent = isAnimating ? "Checking..." : "Check My Boss Level";

    if (btnIcon) {
      btnIcon.innerHTML = isAnimating ? ICONS.autoAwesome : ICONS.centerFocusStrong;
      btnIcon.querySelector("svg")?.classList.toggle("spin", isAnimating);
    }
  }

  function showResult(level) {
    currentLevel = level;
    resultShareBtn?.classList.remove("hidden");

    if (bossImage) {
      bossImage.removeAttribute("src");
      bossImage.classList.add("hidden");
    }
    result?.classList.remove("hasImage");

    const info = tierFor(level);
    if (resultNumber) resultNumber.textContent = String(level);
    if (resultTier) resultTier.textContent = info.title;
    setColor(resultNumber, info.colorVar);
    setColor(resultTier, info.colorVar);

    if (resultIcon) {
      resultIcon.innerHTML = ICONS[info.icon] || ICONS.autoAwesome;
      const svg = resultIcon.querySelector("svg");
      if (svg) {
        svg.classList.add("icon");
        setColor(svg, info.colorVar);
      }
    }

    placeholder?.classList.add("hidden");
    result?.classList.remove("hidden");
  }

  function updateLiveResult(level) {
    resultShareBtn?.classList.add("hidden");

    const info = tierFor(level);
    if (bossImage) {
      bossImage.removeAttribute("src");
      bossImage.classList.add("hidden");
    }
    result?.classList.remove("hasImage");

    if (resultNumber) resultNumber.textContent = String(level);
    if (resultTier) resultTier.textContent = info.title;
    setColor(resultNumber, info.colorVar);
    setColor(resultTier, info.colorVar);

    if (resultIcon) {
      resultIcon.innerHTML = ICONS[info.icon] || ICONS.autoAwesome;
      const svg = resultIcon.querySelector("svg");
      if (svg) {
        svg.classList.add("icon");
        setColor(svg, info.colorVar);
      }
    }
  }

  function setProgress(value) {
    if (!progressBlock || !progressValue || !progressFill) return;

    progressBlock.classList.remove("hidden");
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    progressValue.textContent = String(clamped);

    const info = tierFor(clamped);
    const color = getComputedStyle(document.documentElement).getPropertyValue(info.colorVar).trim() || "";
    progressValue.style.color = color;
    progressFill.style.background = color;
    progressFill.style.width = `${clamped}%`;
  }

  function renderFunny(text) {
    if (!progressBlock) return;
    progressBlock.querySelectorAll(".bossFunny").forEach((node) => node.remove());
    if (!text) return;

    const funny = document.createElement("div");
    funny.className = "bossFunny";
    funny.textContent = text;
    progressBlock.appendChild(funny);
  }

  function saveLastResult(level, funnyText) {
    try {
      const payload = JSON.stringify({ level, funnyText });
      localStorage.setItem(RESULT_KEY, payload);
      sessionStorage.setItem(RESULT_KEY, payload);
    } catch {}
  }

  function restoreLastResult() {
    try {
      const raw = localStorage.getItem(RESULT_KEY) || sessionStorage.getItem(RESULT_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const level = Number(parsed?.level);
      if (!Number.isFinite(level) || level < 1 || level > 100) return false;

      showResult(level);
      setProgress(level);
      renderFunny(parsed?.funnyText || "");
      return true;
    } catch {
      return false;
    }
  }

  async function shareBossScore(level) {
    if (!Number.isFinite(level) || level < 1 || level > 100) return;

    const url = await makeSignedScoreUrl(level);
    const info = tierFor(level);
    const emoji = shareEmojiFor(level);
    const text = `${emoji} I rolled ${level} - ${info.title}`;

    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {}
    }

    const payload = `${text}\n${url}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      prompt("Copy this:", payload);
    }
  }

  async function shareSiteLink() {
    const url = PLAY_STORE_URL;
    const text = "Get the Boss Meter App";

    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {}
    }

    const payload = `${text}\n${url}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      prompt("Copy this:", payload);
    }
  }

  function openShareModal() {
    if (!shareModal) return;
    const hasScore = Number.isFinite(currentLevel) && currentLevel >= 1 && currentLevel <= 100;
    shareBossScoreBtn?.classList.toggle("hidden", !hasScore);
    shareModal.classList.remove("hidden");
  }

  function closeShareModal() {
    shareModal?.classList.add("hidden");
  }

  if (btnIcon) btnIcon.innerHTML = ICONS.centerFocusStrong;
  updateCooldownUI();
  startCooldownTicker();
  restoreLastResult();

  try {
    if (sessionStorage.getItem("boss_autoroll") === "1") {
      sessionStorage.removeItem("boss_autoroll");
      setTimeout(() => {
        checkBtn.click();
      }, 0);
    }
  } catch {}

  resultShareBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openShareModal();
  });

  shareClose?.addEventListener("click", closeShareModal);
  shareModal?.addEventListener("click", (event) => {
    if (event.target === shareModal) closeShareModal();
  });

  shareSiteLinkBtn?.addEventListener("click", async () => {
    await shareSiteLink();
    closeShareModal();
  });

  shareBossScoreBtn?.addEventListener("click", async () => {
    await shareBossScore(currentLevel);
    closeShareModal();
  });

  checkBtn.addEventListener("click", () => {
    const last = getLastCheck();
    const now = Date.now();
    const remaining = last + COOLDOWN_MS - now;

    if (remaining > 0) {
      if (btnText) btnText.textContent = `Come back in ${formatRemaining(remaining)}`;
      startCooldownTicker();
      return;
    }

    const level = rollBossLinearWeights();
    setLastCheck(now);
    updateCooldownUI();
    startCooldownTicker();

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    setAnimating(true);
    placeholder?.classList.add("hidden");
    result?.classList.remove("hidden");
    result?.classList.remove("hasImage");
    if (bossImage) {
      bossImage.removeAttribute("src");
      bossImage.classList.add("hidden");
    }

    setProgress(0);
    updateLiveResult(0);

    const duration = 720;
    const start = performance.now();

    function tick(timestamp) {
      const p = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - Math.pow(1 - p, 1.3);
      const current = Math.floor(level * eased);
      setProgress(current);
      updateLiveResult(current);

      if (p < 1) {
        requestAnimationFrame(tick);
        return;
      }

      setProgress(level);
      showResult(level);

      const tierKey = tierFor(level).title.replace(/\s*BOSS/i, "").toLowerCase();
      const funnyTexts = window.BOSS_CONTENT?.funnyTexts?.[tierKey] || [];
      const lastFunnyText = getStoredJson(RESULT_KEY)?.funnyText || null;
      const funnyText = pickNonRepeating(funnyTexts, lastFunnyText);

      renderFunny(funnyText);
      saveLastResult(level, funnyText);

      setAnimating(false);
      timer = null;
      updateCooldownUI();
    }

    requestAnimationFrame(tick);
  });
});
