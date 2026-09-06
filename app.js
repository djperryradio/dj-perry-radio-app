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

function setButtonState(activeKey, playing) {
  buttons.forEach(btn => {
    const active = playing && btn.dataset.station === activeKey;
    btn.classList.toggle("playing", active);
    btn.textContent = active ? "❚❚ PLAYING" : "▶ LISTEN LIVE";
  });
}

function fullyStopAudio() {
  audio.pause();
  audio.currentTime = 0;
  audio.removeAttribute("src");
  audio.load();
  setButtonState(null, false);
}

async function playStation(key) {
  const station = stations[key];
  if (!station) return;

  // Same station: pause instead of creating/restarting another stream.
  if (currentKey === key && !audio.paused && audio.src) {
    audio.pause();
    playerStatus.textContent = "Paused";
    pauseButton.textContent = "▶";
    setButtonState(key, false);
    return;
  }

  // Invalidate any prior in-flight play request.
  const myToken = ++switchToken;

  // Important: completely stop and detach the prior stream BEFORE assigning the next one.
  fullyStopAudio();

  currentKey = key;
  currentStation.textContent = station.name;
  currentTrack.textContent = metadata[key] || "Waiting for song information…";
  playerStatus.textContent = "Connecting…";
  playerBar.hidden = false;

  audio.src = station.stream;

  try {
    await audio.play();

    // If another station was tapped while this play() was pending, stop this one.
    if (myToken !== switchToken || currentKey !== key) {
      fullyStopAudio();
      return;
    }

    playerStatus.textContent = "Streaming live";
    pauseButton.textContent = "❚❚";
    setButtonState(key, true);
    updateMediaSession();
  } catch (err) {
    console.error("Playback failed:", err);
    if (myToken === switchToken) {
      playerStatus.textContent = "Tap Listen Live to try again";
      setButtonState(key, false);
    }
  }
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => playStation(btn.dataset.station));
});

pauseButton.addEventListener("click", async () => {
  if (!currentKey) return;

  if (!audio.paused) {
    audio.pause();
    playerStatus.textContent = "Paused";
    pauseButton.textContent = "▶";
    setButtonState(currentKey, false);
    return;
  }

  // If src was removed for any reason, restore only the selected station.
  if (!audio.getAttribute("src")) {
    audio.src = stations[currentKey].stream;
  }

  try {
    await audio.play();
    playerStatus.textContent = "Streaming live";
    pauseButton.textContent = "❚❚";
    setButtonState(currentKey, true);
    updateMediaSession();
  } catch (err) {
    console.error("Resume failed:", err);
    playerStatus.textContent = "Tap Listen Live to try again";
  }
});

// Receive song text from the three isolated CloudRadio metadata bridge pages.
window.addEventListener("message", event => {
  if (event.origin !== location.origin) return;
  const data = event.data || {};
  if (data.type !== "cloudradio-now-playing") return;
  if (!stations[data.station] || typeof data.text !== "string") return;

  const text = data.text.trim();
  if (!text) return;

  metadata[data.station] = text;
  const target = document.getElementById(stations[data.station].target);
  if (target) target.textContent = text;

  if (currentKey === data.station) {
    currentTrack.textContent = text;
    updateMediaSession();
  }
});

function updateMediaSession() {
  if (!currentKey || !("mediaSession" in navigator) || !("MediaMetadata" in window)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: metadata[currentKey] || "Live Stream",
    artist: stations[currentKey].name,
    artwork: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  });
}

if ("mediaSession" in navigator) {
  try {
    navigator.mediaSession.setActionHandler("play", async () => {
      if (!currentKey) return;
      if (!audio.getAttribute("src")) audio.src = stations[currentKey].stream;
      try {
        await audio.play();
        playerStatus.textContent = "Streaming live";
        pauseButton.textContent = "❚❚";
        setButtonState(currentKey, true);
      } catch {}
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audio.pause();
      playerStatus.textContent = "Paused";
      pauseButton.textContent = "▶";
      setButtonState(currentKey, false);
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      ++switchToken;
      fullyStopAudio();
      currentKey = null;
      playerBar.hidden = true;
    });
  } catch {}
}

// Drawer
const drawer = document.getElementById("drawer");
const scrim = document.getElementById("scrim");

function closeDrawer() {
  drawer.classList.remove("open");
  scrim.classList.remove("show");
  drawer.setAttribute("aria-hidden", "true");
}

document.getElementById("menuButton").addEventListener("click", () => {
  drawer.classList.add("open");
  scrim.classList.add("show");
  drawer.setAttribute("aria-hidden", "false");
});
document.getElementById("closeMenu").addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);
document.querySelectorAll(".drawer a").forEach(a => a.addEventListener("click", closeDrawer));

// Register the service worker.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(console.error);
  });
}
