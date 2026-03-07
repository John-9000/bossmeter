// --- Linear weighted boss roll (low numbers more common, high rarer) ---
function rollBossLinearWeights() {
  const w1 = 0.9;   // weight at 1 (most common)
  const w100 = 1.1; // weight at 100 (rarest)

  let total = 0;
  for (let n = 1; n <= 100; n++) {
    const t = (n - 1) / 99;
    total += w1 + (w100 - w1) * t;
  }

  let r = Math.random() * total;
  for (let n = 1; n <= 100; n++) {
    const t = (n - 1) / 99;
    r -= w1 + (w100 - w1) * t;
    if (r <= 0) return n;
  }
  return 100;
}

const BASE_URL = "https://bossmeter.app";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uk.co.bossdeboss.bossmeter";

// --- Signed score sharing (client-side signature) ---
// Note: this is an integrity check, not a secret (the key ships to clients).
const SIGNING_SECRET = "bossdeboss-score-v1";

function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
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
  if (level >= 90) return "🏆";
  if (level >= 70) return "👑";
  if (level >= 50) return "⚡";
  if (level >= 30) return "🎯";
  return "✨";
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
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  megaphone:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z"></path><path d="M16 8a3 3 0 0 1 0 8"></path><path d="M19 5a7 7 0 0 1 0 14"></path></svg>',
};

function tierFor(level) {
  if (level >= 90) return { title: "LEGENDARY BOSS", colorVar: "--yellow", icon: "star" };
  if (level >= 70) return { title: "ELITE BOSS", colorVar: "--purple", icon: "starOutline" };
  if (level >= 50) return { title: "RISING BOSS", colorVar: "--blue", icon: "bolt" };
  if (level >= 30) return { title: "APPRENTICE BOSS", colorVar: "--green", icon: "centerFocusStrong" };
  return { title: "NOVICE BOSS", colorVar: "--gray", icon: "autoAwesome" };
}

const FUNNY_TEXTS = {
  novice: [
    "Every boss starts somewhere",
    "Still reading the boss manual",
    "Coffee break boss energy",
    "Boss in training mode",
    "Keyboard louder than confidence",
    "Assistant to the regional boss",
    "Wi-Fi stronger than power",
    "Still unlocking boss skills",
    "Boss vibes buffering…",
    "Learning the secret handshake",
    "Boss shoes still shiny",
    "Power nap certified",
    "Boss alarm snoozed",
    "Spreadsheet warrior",
    "Boss aura loading…",
    "Motivation pending approval",
    "Office chair CEO",
    "Almost intimidating",
    "Boss energy on airplane mode",
    "Practicing the stare",
    "Budget boss",
    "Boss level: tutorial",
    "Confidence warming up",
    "Boss instincts downloading…",
    "Legend pending",
    "Small boss, big dreams",
    "Not bossy—just ambitious",
    "CEO of “maybe later”",
    "Junior boss vibes. You’ll get there",
    "Still in tutorial mode 😄",
    "Small steps. Big boss later",
    "Boss energy loading… please wait",
    "Accidentally powerful",
    "Still reading the tutorial",
    "Boss in training wheels",
    "Confidently unsure",
    "Main character in the background",
    "Pressed the boss button by mistake",
  ],
  apprentice: [
    "Boss with potential",
    "Confidence upgraded",
    "People starting to notice",
    "Boss energy rising",
    "Office legend rumors",
    "Still humble, mostly",
    "Boss handshake unlocked",
    "Voice carries further",
    "Meetings fear you",
    "Keyboard respected",
    "Coffee obeys you",
    "Promotion aura detected",
    "Boss mode warming",
    "Authority increasing",
    "Decisions slightly faster",
    "Boss instincts sharp",
    "Desk presence strong",
    "Leadership beta",
    "Power stance improving",
    "Boss shoes broken in",
    "Respect installing…",
    "Boss playlist curated",
    "Confidence compiling…",
    "Boss brain online",
    "Almost legendary",
    "You’re not late—you’re dramatic",
    "Rising like fresh toast",
    "CEO of “good enough”",
    "Respectable boss energy",
    "You're leveling up fast",
    "Not bad… not bad at all",
  ],
  rising: [
    "People listen now",
    "Boss energy undeniable",
    "Meetings end faster",
    "Decisions land hard",
    "Boss presence felt",
    "Power suit energy",
    "Confidence at scale",
    "Voice carries weight",
    "Room temperature changes",
    "Boss aura stable",
    "Respect delivered",
    "Authority unlocked",
    "Boss instincts sharp",
    "Momentum building",
    "Eyes follow you",
    "Keyboard obeys",
    "Boss energy certified",
    "Leadership activated",
    "No nonsense detected",
    "Commanding presence",
    "Boss level rising",
    "Strategy installed",
    "Confidence overflow",
    "Boss energy flex",
    "Legend forming",
    "Walking KPI",
    "You negotiate with gravity",
    "Meetings request *you*",
    "Boss momentum is real",
    "People are starting to listen",
    "Confidence: unlocked",
  ],
  elite: [
    "Room goes quiet",
    "Boss energy intimidating",
    "Decisions shape reality",
    "Authority unquestioned",
    "Power walks louder",
    "Boss aura maxed",
    "Respect guaranteed",
    "Leadership absolute",
    "Meetings obey",
    "Confidence unstoppable",
    "Boss instincts elite",
    "Commanding silence",
    "Strategy flawless",
    "Boss presence heavy",
    "Influence detected",
    "Boss energy peaks",
    "Power undeniable",
    "Leadership refined",
    "Elite mindset active",
    "Boss moves decisive",
    "Authority mastered",
    "Confidence lethal",
    "Boss legend near",
    "Feared politely",
    "Your calendar fears you",
    "You don’t chase goals—goals chase you",
    "Handshake is a contract",
    "Elite aura detected 😎",
    "CEO energy. No refunds",
    "You walk in, the room changes",
  ],
  legendary: [
    "Boss mythology confirmed",
    "Legend walks among us",
    "Reality bends slightly",
    "Boss energy absolute",
    "Power unmatched",
    "History remembers this",
    "Authority unquestionable",
    "Boss aura eternal",
    "Legends whisper",
    "Respect infinite",
    "Power level capped",
    "Boss final form",
    "Legacy activated",
    "Influence timeless",
    "Boss energy god-tier",
    "Legend certified",
    "Myth unlocked",
    "Boss presence iconic",
    "Power perfected",
    "History rewritten",
    "Boss energy complete",
    "Ultimate authority",
    "Legend status permanent",
    "Reality approves",
    "Boss achieved",
    "Your name is a strategy",
    "Even luck takes notes",
    "The room pays rent to you",
    "Legend status confirmed",
    "Absolute unit of boss",
    "This is what power looks like",
    "You did not roll this, you earned it",
    "Other bosses listen",
    "Power level confidential",
    "Destiny adjusted accordingly",
    "Achieved boss enlightenment",
    "The end credits roll early",
    "Boss of bosses",
  ],
};

function setColor(el, cssVarName) {
  if (!el) return;
  const color = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  el.style.color = color || "";
}

document.addEventListener("DOMContentLoaded", () => {
  let currentLevel = null;

  // -------------------------
  // 1-hour cooldown (localStorage)
  // -------------------------
  const COOLDOWN_MS = 12 * 60 * 60 * 1000;
  const STORAGE_KEY = "boss_last_check_ms";
  const RESULT_KEY = "boss_last_result";
  const HISTORY_KEY = "boss_history_v1";

  function getLastCheck() {
    const v = localStorage.getItem(STORAGE_KEY);
    const n = v ? Number(v) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function setLastCheck(ms) {
    localStorage.setItem(STORAGE_KEY, String(ms));
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

  // -------------------------
  // Cookie consent + AdSense load gating (localStorage)
  // -------------------------
  const CONSENT_KEY = "boss_cookie_consent";
  const cookieBanner = document.getElementById("cookieBanner");
  const cookieAccept = document.getElementById("cookieAccept");
  const cookieDecline = document.getElementById("cookieDecline");

  const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
  const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

  let adsenseLoaded = false;

  function getCookie(name) {
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
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

  function setConsent(v) {
    localStorage.setItem(CONSENT_KEY, v);
    setCookie(CONSENT_KEY, v, 365);
  }

  function showCookieBanner(show) {
    if (!cookieBanner) return;
    cookieBanner.classList.toggle("hidden", !show);
  }

  function loadAdSenseOnce() {
    if (adsenseLoaded) return;
    if (document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      adsenseLoaded = true;
      return;
    }

    adsenseLoaded = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = ADSENSE_SRC;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }

  function tryRenderAds() {
    if (getConsent() !== "granted") return;
    loadAdSenseOnce();

    const units = document.querySelectorAll("ins.adsbygoogle");
    units.forEach((u) => {
      if (u.getAttribute("data-ads-init") === "1") return;
      u.setAttribute("data-ads-init", "1");
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
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

  // -------------------------
  // Shared score page
  // -------------------------
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
        if (sharedNumber) sharedNumber.textContent = "—";
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
        try { sessionStorage.setItem("boss_autoroll", "1"); } catch {}
        location.href = "./index.html";
      });
    })();

    return;
  }

  // -------------------------
  // Boss checker
  // -------------------------
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

  let cooldownTimer = null;

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
      if (isAnimating) {
        btnIcon.innerHTML = ICONS.autoAwesome;
        btnIcon.querySelector("svg")?.classList.add("spin");
      } else {
        btnIcon.innerHTML = ICONS.centerFocusStrong;
        btnIcon.querySelector("svg")?.classList.remove("spin");
      }
    }
  }

  function showResult(level) {
    resultShareBtn?.classList.remove("hidden");
    currentLevel = level;

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
    progressFill.style.background = color || "";
    progressFill.style.width = `${clamped}%`;
  }

  function renderFunny(text) {
    if (!progressBlock) return;

    progressBlock.querySelectorAll(".bossFunny").forEach((n) => n.remove());
    if (!text) return;

    const funny = document.createElement("div");
    funny.className = "bossFunny";
    funny.textContent = text;
    progressBlock.appendChild(funny);
  }

  function saveLastResult(level, funnyText) {
    try {
      localStorage.setItem(RESULT_KEY, JSON.stringify({ level, funnyText }));
      sessionStorage.setItem(RESULT_KEY, JSON.stringify({ level, funnyText }));
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

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveHistory(level) {
    try {
      const ts = Date.now();
      const arr = loadHistory();
      const newest = arr[0];

      if (newest && newest.level === level && typeof newest.ts === "number" && (ts - newest.ts) < 1500) {
        return;
      }

      const next = [{ level, ts }, ...arr].slice(0, 3);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  function formatWhen(ts) {
    const now = Date.now();
    const diffMs = Math.max(0, now - ts);
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;

    if (diffMs < hourMs) return "Just now";

    const hours = Math.floor(diffMs / hourMs);
    if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

    if (hours < 48) return "Yesterday";

    const days = Math.floor(diffMs / dayMs);
    if (days < 14) return `${days} days ago`;

    try {
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(ts));
    } catch {
      const d = new Date(ts);
      return d.toLocaleDateString();
    }
  }

  function shortTierLabel(level) {
    const t = tierFor(level).title || "";
    return t.replace(/\s*BOSS\s*$/i, "");
  }

  function renderHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    const items = loadHistory();
    if (!items.length) {
      list.innerHTML = '<div class="historyEmpty">No history yet.\n<br/>Check your Boss Level to create entries.</div>';
      return;
    }

    list.innerHTML = items.map((it) => {
      const lvl = Math.max(1, Math.min(100, Number(it.level) || 1));
      const info = tierFor(lvl);
      const label = shortTierLabel(lvl);
      const when = formatWhen(Number(it.ts) || Date.now());
      const color = getComputedStyle(document.documentElement).getPropertyValue(info.colorVar).trim() || "";

      const safeLabel = label.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeWhen = when.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      return `
        <div class="historyRow">
          <div class="historyLabel" style="color:${color}">${safeLabel}</div>
          <div class="historyBar" aria-label="Result ${lvl}">
            <div class="historyBarFill" style="width:${lvl}%; background:${color}"></div>
            <div class="historyBarText">${lvl}</div>
          </div>
          <div class="historyWhen" style="color:${color}">${safeWhen}</div>
        </div>
      `;
    }).join("");
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

  const shareBtn = document.getElementById("shareBtn");
  const historyBtn = document.getElementById("historyBtn");
  const historyModal = document.getElementById("historyModal");
  const historyClose = document.getElementById("historyClose");

  async function shareBossScore(level) {
    if (!Number.isFinite(level) || level < 1 || level > 100) return;

    const url = await makeSignedScoreUrl(level);
    const info = tierFor(level);
    const emoji = shareEmojiFor(level);
    const text = `${emoji} I rolled ${level} — ${info.title}`;

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

  resultShareBtn?.addEventListener("click", async () => {
    await shareBossScore(currentLevel);
  });

  function openHistory() {
    if (!historyModal) return;
    renderHistory();
    historyModal.classList.remove("hidden");
  }

  function closeHistory() {
    historyModal?.classList.add("hidden");
  }

  historyBtn?.addEventListener("click", openHistory);
  historyClose?.addEventListener("click", closeHistory);
  historyModal?.addEventListener("click", (e) => {
    if (e.target === historyModal) closeHistory();
  });

  const shareModal = document.getElementById("shareModal");
  const shareClose = document.getElementById("shareClose");
  const shareSiteLinkBtn = document.getElementById("shareSiteLinkBtn");
  const shareBossScoreBtn = document.getElementById("shareBossScoreBtn");

  function openShareModal() {
    if (!shareModal) return;
    const hasScore = Number.isFinite(currentLevel) && currentLevel >= 1 && currentLevel <= 100;
    shareBossScoreBtn?.classList.toggle("hidden", !hasScore);
    shareModal.classList.remove("hidden");
  }

  function closeShareModal() {
    shareModal?.classList.add("hidden");
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

  shareBtn?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openShareModal();
    },
    { passive: false }
  );

  shareClose?.addEventListener("click", closeShareModal);
  shareModal?.addEventListener("click", (e) => {
    if (e.target === shareModal) closeShareModal();
  });

  shareSiteLinkBtn?.addEventListener("click", async () => {
    await shareSiteLink();
    closeShareModal();
  });

  shareBossScoreBtn?.addEventListener("click", async () => {
    await shareBossScore(currentLevel);
    closeShareModal();
  });

  let timer = null;

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

    function tick(t) {
      const p = Math.min(1, (t - start) / duration);
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
      const arr = FUNNY_TEXTS[tierKey] || [];
      const funnyText = (arr[Math.floor(Math.random() * arr.length)] || "");

      renderFunny(funnyText);

      saveLastResult(level, funnyText);
      saveHistory(level);

      setAnimating(false);
      timer = null;

      updateCooldownUI();
    }

    requestAnimationFrame(tick);
  });
});
