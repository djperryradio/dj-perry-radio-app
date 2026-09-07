
const stations = {
  dj: {
    name: "DJ Perry Radio",
    stream: "https://audio.cloudrad.io/ef8751af/live",
    target: "np-dj"
  },
  strobe: {
    name: "The Strobe Radio",
    stream: "https://audio.cloudrad.io/ac7b42b9/live",
    target: "np-strobe"
  },
  pulse: {
    name: "Pulse 107",
    stream: "https://audio.cloudrad.io/c80559c5/live",
    target: "np-pulse"
  }
};

const audio = document.getElementById("audio");
const buttons = [...document.querySelectorAll(".listen")];
const playerBar = document.getElementById("playerBar");
const currentStation = document.getElementById("currentStation");
const currentTrack = document.getElementById("currentTrack");
const playerStatus = document.getElementById("playerStatus");
const pauseButton = document.getElementById("pauseButton");

let currentKey = null;
let switchToken = 0;
const metadata = { dj: "", strobe: "", pulse: "" };

function setButtonState(key, playing) {
  buttons.forEach((b) => {
    const on = playing && b.dataset.station === key;
    b.classList.toggle("playing", on);
    b.innerHTML = on ? "<b>PLAYING</b>" : "<b>LISTEN LIVE</b>";
  });
}

function fullyStopAudio() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  setButtonState(null, false);
}

async function playStation(key) {
  const s = stations[key];
  if (!s) return;

  if (currentKey === key && !audio.paused && audio.src) {
    audio.pause();
    playerStatus.textContent = "Paused";
    pauseButton.textContent = "PLAY";
    setButtonState(key, false);
    return;
  }

  const token = ++switchToken;
  fullyStopAudio();
  currentKey = key;
  currentStation.textContent = s.name;
  currentTrack.textContent = metadata[key] || "Waiting for song information...";
  playerStatus.textContent = "Connecting...";
  playerBar.hidden = false;
  audio.src = s.stream;

  try {
    await audio.play();
    if (token !== switchToken || currentKey !== key) {
      fullyStopAudio();
      return;
    }
    playerStatus.textContent = "Streaming live";
    pauseButton.textContent = "PAUSE";
    setButtonState(key, true);
    updateMediaSession();
  } catch (e) {
    playerStatus.textContent = "Tap LISTEN LIVE to try again";
    setButtonState(key, false);
  }
}

buttons.forEach((b) => b.addEventListener("click", () => playStation(b.dataset.station)));

pauseButton.addEventListener("click", async () => {
  if (!currentKey) return;

  if (!audio.paused) {
    audio.pause();
    playerStatus.textContent = "Paused";
    pauseButton.textContent = "PLAY";
    setButtonState(currentKey, false);
    return;
  }

  if (!audio.getAttribute("src")) audio.src = stations[currentKey].stream;

  try {
    await audio.play();
    playerStatus.textContent = "Streaming live";
    pauseButton.textContent = "PAUSE";
    setButtonState(currentKey, true);
    updateMediaSession();
  } catch (e) {
    playerStatus.textContent = "Tap LISTEN LIVE to try again";
  }
});

window.addEventListener("message", (e) => {
  if (e.origin !== location.origin) return;
  const d = e.data || {};
  if (d.type !== "cloudradio-now-playing" || !stations[d.station] || typeof d.text !== "string") return;

  const text = d.text.trim();
  if (!text) return;

  metadata[d.station] = text;
  const target = document.getElementById(stations[d.station].target);
  if (target) target.textContent = text;

  if (currentKey === d.station) {
    currentTrack.textContent = text;
    updateMediaSession();
  }
});

function parseTrack(raw) {
  raw = (raw || "").trim();
  const separators = [" - ", " \u2013 ", " \u2014 "];
  for (const sep of separators) {
    const i = raw.indexOf(sep);
    if (i > 0) {
      return {
        artist: raw.slice(0, i).trim(),
        title: raw.slice(i + sep.length).trim()
      };
    }
  }
  return {
    artist: currentKey ? stations[currentKey].name : "DJ Perry Radio",
    title: raw || "Live Stream"
  };
}

function updateMediaSession() {
  if (!currentKey || !("mediaSession" in navigator) || !("MediaMetadata" in window)) return;
  const p = parseTrack(metadata[currentKey]);

  navigator.mediaSession.metadata = new MediaMetadata({
    title: p.title,
    artist: p.artist,
    album: stations[currentKey].name,
    artwork: [
      { src: baseAsset("icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: baseAsset("icon-512.png"), sizes: "512x512", type: "image/png" }
    ]
  });

  try {
    navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
  } catch (e) {}
}

audio.addEventListener("play", updateMediaSession);
audio.addEventListener("pause", updateMediaSession);

if ("mediaSession" in navigator) {
  try {
    navigator.mediaSession.setActionHandler("play", async () => {
      if (!currentKey) return;
      if (!audio.getAttribute("src")) audio.src = stations[currentKey].stream;
      await audio.play();
      setButtonState(currentKey, true);
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audio.pause();
      setButtonState(currentKey, false);
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      ++switchToken;
      fullyStopAudio();
      currentKey = null;
      playerBar.hidden = true;
    });
  } catch (e) {}
}

const drawer = document.getElementById("drawer");
const scrim = document.getElementById("scrim");

function closeDrawer() {
  drawer.classList.remove("open");
  scrim.classList.remove("show");
  drawer.setAttribute("aria-hidden", "true");
}

document.getElementById("menuButton").onclick = () => {
  drawer.classList.add("open");
  scrim.classList.add("show");
  drawer.setAttribute("aria-hidden", "false");
};

document.getElementById("closeMenu").onclick = closeDrawer;
scrim.onclick = closeDrawer;
document.querySelectorAll(".drawer a").forEach((a) => a.addEventListener("click", closeDrawer));

let deferredInstallPrompt = null;
const installButton = document.getElementById("installAppButton");
const installModal = document.getElementById("installModal");
const installInstructions = document.getElementById("installInstructions");

function standalone() {
  return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function isiOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

installButton.onclick = async () => {
  if (standalone()) {
    installButton.hidden = true;
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (e) {}
    deferredInstallPrompt = null;
    return;
  }

  installInstructions.innerHTML = isiOS()
    ? "<p>On iPhone or iPad:</p><ol><li>Open this page in <strong>Safari</strong>.</li><li>Tap <strong>Share</strong>.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol>"
    : "<p>On Android:</p><ol><li>Open this page in <strong>Chrome</strong>.</li><li>Open the browser menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li></ol>";

  installModal.hidden = false;
};

document.getElementById("closeInstallModal").onclick = () => installModal.hidden = true;
installModal.onclick = (e) => { if (e.target === installModal) installModal.hidden = true; };

if (standalone()) installButton.hidden = true;

function isBrandedSubpage() {
  return /\/(pulse|strobe)\/?$/.test(location.pathname);
}

function baseAsset(filename) {
  return isBrandedSubpage() ? "../" + filename : filename;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const swUrl = isBrandedSubpage() ? "../service-worker.js" : "./service-worker.js";
      const reg = await navigator.serviceWorker.register(swUrl);

      // Ask the browser to check for an updated worker on every page load.
      reg.update();

      // If a new worker is waiting, activate it immediately.
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });

      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            nw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
}
