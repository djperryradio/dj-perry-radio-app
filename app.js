const stations = {
  dj: {
    name: "DJ Perry Radio",
    stream: "https://audio.cloudrad.io/ef8751af/live",
    target: "np-dj",
    logo: "djperry-logo.png"
  },

  strobe: {
    name: "The Strobe Radio",
    stream: "https://audio.cloudrad.io/ac7b42b9/live",
    target: "np-strobe",
    logo: "strobe-logo.jpg"
  },

  pulse: {
    name: "Pulse 107",
    stream: "https://audio.cloudrad.io/c80559c5/live",
    target: "np-pulse",
    logo: "pulse107-logo.jpg"
  }
};


const audio = document.getElementById("audio");

const buttons = [
  ...document.querySelectorAll(".listen")
];

const playerBar =
  document.getElementById("playerBar");

const currentStation =
  document.getElementById("currentStation");

const currentTrack =
  document.getElementById("currentTrack");

const playerStatus =
  document.getElementById("playerStatus");

const pauseButton =
  document.getElementById("pauseButton");

const playerLogo =
  document.getElementById("playerLogo");


let currentKey = null;

let switchToken = 0;

const metadata = {
  dj: "",
  strobe: "",
  pulse: ""
};


/* =========================================
   GOATCOUNTER ANALYTICS
========================================= */

const analyticsQueue = [];


/*
  Determines which version of the app
  the listener entered through.
*/

function getAppEntry() {

  if (/\/pulse\/?$/.test(location.pathname)) {
    return "pulse";
  }

  if (/\/strobe\/?$/.test(location.pathname)) {
    return "strobe";
  }

  return "dj";
}


/*
  Sends a custom event to GoatCounter.

  If GoatCounter hasn't finished loading yet,
  the event is temporarily stored and sent later.
*/

function trackEvent(path, title) {

  const eventData = {
    path: path,
    title: title,
    event: true,
    no_session: true
  };

  if (
    window.goatcounter &&
    typeof window.goatcounter.count === "function"
  ) {

    window.goatcounter.count(eventData);

  } else {

    analyticsQueue.push(eventData);
  }
}


/*
  Sends any events that occurred before
  GoatCounter finished loading.
*/

function flushAnalyticsQueue() {

  if (
    !window.goatcounter ||
    typeof window.goatcounter.count !== "function"
  ) {
    return false;
  }

  while (analyticsQueue.length) {

    const eventData =
      analyticsQueue.shift();

    window.goatcounter.count(
      eventData
    );
  }

  return true;
}


/*
  Give GoatCounter time to load if it was
  downloaded after app.js.
*/

window.addEventListener("load", () => {

  let attempts = 0;

  const analyticsTimer =
    setInterval(() => {

      attempts++;

      if (
        flushAnalyticsQueue() ||
        attempts >= 20
      ) {
        clearInterval(
          analyticsTimer
        );
      }

    }, 500);

});


/* =========================================
   STATION BUTTON STATES
========================================= */

function setButtonState(
  key,
  playing
) {

  buttons.forEach((b) => {

    const on =
      playing &&
      b.dataset.station === key;

    b.classList.toggle(
      "playing",
      on
    );

    b.innerHTML =
      on
        ? "<b>PLAYING</b>"
        : "<b>LISTEN LIVE</b>";
  });
}


/* =========================================
   SHARED PLAY / PAUSE CONTROL
========================================= */

function setPlayerControl(state) {

  if (!pauseButton) return;


  if (state === "playing") {

    pauseButton.innerHTML =
      "&#10074;&#10074;";

    pauseButton.setAttribute(
      "aria-label",
      "Pause"
    );

    pauseButton.title =
      "Pause";

  }

  else if (state === "paused") {

    pauseButton.innerHTML =
      "&#9654;";

    pauseButton.setAttribute(
      "aria-label",
      "Play"
    );

    pauseButton.title =
      "Play";

  }

  else {

    pauseButton.textContent =
      "";

    pauseButton.setAttribute(
      "aria-label",
      "Play"
    );

    pauseButton.title =
      "Play";
  }
}


/* =========================================
   STOP CURRENT STREAM
========================================= */

function fullyStopAudio() {

  audio.pause();

  audio.removeAttribute(
    "src"
  );

  audio.load();

  setButtonState(
    null,
    false
  );
}


/* =========================================
   PLAYER STATION LOGO
========================================= */

function updatePlayerLogo(key) {

  if (
    !playerLogo ||
    !stations[key]
  ) {
    return;
  }

  playerLogo.src =
    baseAsset(
      stations[key].logo
    );

  playerLogo.alt =
    stations[key].name +
    " logo";
}


/* =========================================
   HIDE SHARED PLAYER
========================================= */

function hidePlayer() {

  currentKey = null;

  setPlayerControl(
    "stopped"
  );

  playerBar.hidden =
    true;
}


/* =========================================
   PLAY STATION
========================================= */

async function playStation(key) {

  const s =
    stations[key];

  if (!s) return;


  /*
    If the same station is already playing,
    this click pauses it.

    We do NOT count that as another
    Listen Live event.
  */

  if (
    currentKey === key &&
    !audio.paused &&
    audio.src
  ) {

    audio.pause();

    playerStatus.textContent =
      "Paused";

    setPlayerControl(
      "paused"
    );

    setButtonState(
      key,
      false
    );

    updateMediaSession();

    return;
  }


  /*
    Count a new attempt to listen
    to this station.
  */

  trackEvent(
    "listen-" + key,
    "Listen Live - " + s.name
  );


  const token =
    ++switchToken;


  /*
    Always stop the previous stream
    before starting another.
  */

  fullyStopAudio();


  currentKey =
    key;


  updatePlayerLogo(
    key
  );


  currentStation.textContent =
    s.name;


  currentTrack.textContent =
    metadata[key] ||
    "Waiting for song information...";


  playerStatus.textContent =
    "Connecting...";


  setPlayerControl(
    "paused"
  );


  playerBar.hidden =
    false;


  audio.src =
    s.stream;


  try {

    await audio.play();


    /*
      Prevent an older stream request
      from taking over after the user
      has already changed stations.
    */

    if (
      token !== switchToken ||
      currentKey !== key
    ) {

      fullyStopAudio();

      return;
    }


    playerStatus.textContent =
      "Streaming live";


    setPlayerControl(
      "playing"
    );


    setButtonState(
      key,
      true
    );


    updateMediaSession();

  }

  catch (e) {

    playerStatus.textContent =
      "Tap LISTEN LIVE to try again";


    setPlayerControl(
      "paused"
    );


    setButtonState(
      key,
      false
    );


    updateMediaSession();
  }
}


/* =========================================
   STATION LISTEN BUTTONS
========================================= */

buttons.forEach((b) => {

  b.addEventListener(
    "click",
    () =>
      playStation(
        b.dataset.station
      )
  );

});


/* =========================================
   SHARED PLAY / PAUSE BUTTON
========================================= */

pauseButton.addEventListener(
  "click",
  async () => {

    if (!currentKey) {
      return;
    }


    if (!audio.paused) {

      audio.pause();


      playerStatus.textContent =
        "Paused";


      setPlayerControl(
        "paused"
      );


      setButtonState(
        currentKey,
        false
      );


      updateMediaSession();


      return;
    }


    if (
      !audio.getAttribute(
        "src"
      )
    ) {

      audio.src =
        stations[
          currentKey
        ].stream;
    }


    try {

      await audio.play();


      playerStatus.textContent =
        "Streaming live";


      setPlayerControl(
        "playing"
      );


      setButtonState(
        currentKey,
        true
      );


      updateMediaSession();

    }

    catch (e) {

      playerStatus.textContent =
        "Tap LISTEN LIVE to try again";


      setPlayerControl(
        "paused"
      );


      updateMediaSession();
    }
  }
);


/* =========================================
   CLOUDRADIO METADATA
========================================= */

window.addEventListener(
  "message",
  (e) => {

    if (
      e.origin !==
      location.origin
    ) {
      return;
    }


    const d =
      e.data || {};


    if (
      d.type !==
        "cloudradio-now-playing" ||
      !stations[d.station] ||
      typeof d.text !==
        "string"
    ) {
      return;
    }


    const text =
      d.text.trim();


    if (!text) {
      return;
    }


    metadata[d.station] =
      text;


    const target =
      document.getElementById(
        stations[
          d.station
        ].target
      );


    if (target) {

      target.textContent =
        text;
    }


    if (
      currentKey ===
      d.station
    ) {

      currentTrack.textContent =
        text;


      updateMediaSession();
    }
  }
);


/* =========================================
   SONG TITLE / ARTIST
========================================= */

function parseTrack(raw) {

  raw =
    (raw || "").trim();


  const separators = [
    " - ",
    " – ",
    " — "
  ];


  for (
    const sep
    of separators
  ) {

    const i =
      raw.indexOf(
        sep
      );


    if (i > 0) {

      return {

        artist:
          raw
            .slice(
              0,
              i
            )
            .trim(),

        title:
          raw
            .slice(
              i +
              sep.length
            )
            .trim()
      };
    }
  }


  return {

    artist:
      currentKey
        ? stations[
            currentKey
          ].name
        : "DJ Perry Radio",

    title:
      raw ||
      "Live Stream"
  };
}


/* =========================================
   MEDIA SESSION
========================================= */

function updateMediaSession() {

  if (
    !currentKey ||
    !(
      "mediaSession"
      in navigator
    ) ||
    !(
      "MediaMetadata"
      in window
    )
  ) {
    return;
  }


  const p =
    parseTrack(
      metadata[
        currentKey
      ]
    );


  const station =
    stations[
      currentKey
    ];


  navigator.mediaSession.metadata =
    new MediaMetadata({

      title:
        p.title,

      artist:
        p.artist,

      album:
        station.name,

      artwork: [
        {
          src:
            baseAsset(
              station.logo
            )
        }
      ]
    });


  try {

    navigator
      .mediaSession
      .playbackState =
        audio.paused
          ? "paused"
          : "playing";

  }

  catch (e) {}
}


/* =========================================
   AUDIO EVENTS
========================================= */

audio.addEventListener(
  "play",
  () => {

    if (currentKey) {

      setPlayerControl(
        "playing"
      );
    }


    updateMediaSession();
  }
);


audio.addEventListener(
  "pause",
  () => {

    if (currentKey) {

      setPlayerControl(
        "paused"
      );
    }


    updateMediaSession();
  }
);

/* =========================================
   NEXT / PREVIOUS STATION
========================================= */

function nextStation() {

  const order = [
    "dj",
    "strobe",
    "pulse"
  ];

  let index =
    order.indexOf(currentKey);

  if (index === -1) {

    index = 0;

  } else {

    index =
      (index + 1) %
      order.length;
  }

  playStation(
    order[index]
  );
}


function previousStation() {

  const order = [
    "dj",
    "strobe",
    "pulse"
  ];

  let index =
    order.indexOf(currentKey);

  if (index === -1) {

    index = 0;

  } else {

    index =
      (
        index -
        1 +
        order.length
      ) %
      order.length;
  }

  playStation(
    order[index]
  );
}
/* =========================================
   MEDIA SESSION CONTROLS
========================================= */

if (
  "mediaSession"
  in navigator
) {

  try {

    navigator
      .mediaSession
      .setActionHandler(
        "play",
        async () => {
try {

  navigator.mediaSession.setActionHandler(
    "nexttrack",
    () => {

      nextStation();
    }
  );

} catch (e) {}


try {

  navigator.mediaSession.setActionHandler(
    "previoustrack",
    () => {

      previousStation();
    }
  );

} catch (e) {}
          if (!currentKey) {
            return;
          }


          if (
            !audio.getAttribute(
              "src"
            )
          ) {

            audio.src =
              stations[
                currentKey
              ].stream;
          }


          try {

            await audio.play();


            playerStatus.textContent =
              "Streaming live";


            setPlayerControl(
              "playing"
            );


            setButtonState(
              currentKey,
              true
            );


            updatePlayerLogo(
              currentKey
            );


            updateMediaSession();

          }

          catch (e) {}
        }
      );


    navigator
      .mediaSession
      .setActionHandler(
        "pause",
        () => {
try {

  navigator.mediaSession.setActionHandler(
    "nexttrack",
    () => {

      nextStation();
    }
  );

} catch (e) {}


try {

  navigator.mediaSession.setActionHandler(
    "previoustrack",
    () => {

      previousStation();
    }
  );

} catch (e) {}
          audio.pause();


          playerStatus.textContent =
            "Paused";


          setPlayerControl(
            "paused"
          );


          setButtonState(
            currentKey,
            false
          );


          updateMediaSession();
        }
      );


    navigator
      .mediaSession
      .setActionHandler(
        "stop",
        () => {
try {

  navigator.mediaSession.setActionHandler(
    "nexttrack",
    () => {

      nextStation();
    }
  );

} catch (e) {}


try {

  navigator.mediaSession.setActionHandler(
    "previoustrack",
    () => {

      previousStation();
    }
  );

} catch (e) {}
          ++switchToken;


          fullyStopAudio();


          hidePlayer();
        }
      );

  }

  catch (e) {}
}


/* =========================================
   SIDE MENU
========================================= */

const drawer =
  document.getElementById(
    "drawer"
  );


const scrim =
  document.getElementById(
    "scrim"
  );


function closeDrawer() {

  drawer.classList.remove(
    "open"
  );


  scrim.classList.remove(
    "show"
  );


  drawer.setAttribute(
    "aria-hidden",
    "true"
  );
}


document.getElementById(
  "menuButton"
).onclick = () => {

  drawer.classList.add(
    "open"
  );


  scrim.classList.add(
    "show"
  );


  drawer.setAttribute(
    "aria-hidden",
    "false"
  );
};


document.getElementById(
  "closeMenu"
).onclick =
  closeDrawer;


scrim.onclick =
  closeDrawer;


document
  .querySelectorAll(
    ".drawer a"
  )
  .forEach((a) => {

    a.addEventListener(
      "click",
      closeDrawer
    );
  });


/* =========================================
   INSTALL APP
========================================= */

let deferredInstallPrompt =
  null;


const installButton =
  document.getElementById(
    "installAppButton"
  );


const installModal =
  document.getElementById(
    "installModal"
  );


const installInstructions =
  document.getElementById(
    "installInstructions"
  );


function standalone() {

  return (

    matchMedia(
      "(display-mode: standalone)"
    ).matches ||

    navigator.standalone ===
      true

  );
}


function isiOS() {

  return /iphone|ipad|ipod/i
    .test(
      navigator.userAgent
    );
}


/*
  Android / Chromium install prompt
*/

window.addEventListener(
  "beforeinstallprompt",
  (e) => {

    e.preventDefault();

    deferredInstallPrompt =
      e;
  }
);


/*
  Browser confirms installation.
*/

window.addEventListener(
  "appinstalled",
  () => {

    const entry =
      getAppEntry();


    trackEvent(
      "install-confirmed-" +
        entry,

      "Confirmed Install - " +
        entry.toUpperCase()
    );


    deferredInstallPrompt =
      null;


    installButton.hidden =
      true;
  }
);


/*
  Install App button
*/

installButton.onclick =
  async () => {

    const entry =
      getAppEntry();


    /*
      Count every Install App
      button press.
    */

    trackEvent(
      "install-click-" +
        entry,

      "Install App Click - " +
        entry.toUpperCase()
    );


    if (standalone()) {

      installButton.hidden =
        true;

      return;
    }


    if (
      deferredInstallPrompt
    ) {

      deferredInstallPrompt
        .prompt();


      try {

        await deferredInstallPrompt
          .userChoice;

      }

      catch (e) {}


      deferredInstallPrompt =
        null;


      return;
    }


    installInstructions.innerHTML =
      isiOS()

        ? "<p>On iPhone or iPad:</p><ol><li>Open this page in <strong>Safari</strong>.</li><li>Tap <strong>Share</strong>.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol>"

        : "<p>On Android:</p><ol><li>Open this page in <strong>Chrome</strong>.</li><li>Open the browser menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li></ol>";


    installModal.hidden =
      false;
  };


document.getElementById(
  "closeInstallModal"
).onclick = () => {

  installModal.hidden =
    true;
};


installModal.onclick =
  (e) => {

    if (
      e.target ===
      installModal
    ) {

      installModal.hidden =
        true;
    }
  };


if (standalone()) {

  installButton.hidden =
    true;
}


/* =========================================
   ROOT / BRANDED PAGE PATHS
========================================= */

function isBrandedSubpage() {

  return /\/(pulse|strobe)\/?$/
    .test(
      location.pathname
    );
}


function baseAsset(filename) {

  return isBrandedSubpage()
    ? "../" + filename
    : filename;
}


/* =========================================
   SERVICE WORKER
========================================= */

if (
  "serviceWorker"
  in navigator
) {

  window.addEventListener(
    "load",
    async () => {

      try {

        const swUrl =
          isBrandedSubpage()

            ? "../service-worker.js"

            : "./service-worker.js";


        const reg =
          await navigator
            .serviceWorker
            .register(
              swUrl
            );


        reg.update();


        if (
          reg.waiting
        ) {

          reg.waiting
            .postMessage({
              type:
                "SKIP_WAITING"
            });
        }


        reg.addEventListener(
          "updatefound",
          () => {

            const nw =
              reg.installing;


            if (!nw) {
              return;
            }


            nw.addEventListener(
              "statechange",
              () => {

                if (
                  nw.state ===
                    "installed" &&

                  navigator
                    .serviceWorker
                    .controller
                ) {

                  nw.postMessage({
                    type:
                      "SKIP_WAITING"
                  });
                }
              }
            );
          }
        );

      }

      catch (e) {

        console.error(e);
      }
    }
  );


  let refreshing =
    false;


  navigator
    .serviceWorker
    .addEventListener(
      "controllerchange",
      () => {

        if (refreshing) {
          return;
        }


        refreshing =
          true;


        location.reload();
      }
    );
}
