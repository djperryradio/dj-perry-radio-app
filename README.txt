DJ PERRY RADIO - SHARED CORE BUILD

This version is designed to avoid the broken Strobe/Pulse pages.

PUBLIC LINKS AFTER UPLOAD
DJ Perry Radio:
https://djperryradio.github.io/dj-perry-radio-app/

Pulse 107:
https://djperryradio.github.io/dj-perry-radio-app/pulse/

The Strobe Radio:
https://djperryradio.github.io/dj-perry-radio-app/strobe/

HOW IT WORKS
- The main root contains the shared design, player, metadata code, logos, and service worker.
- /pulse/ has only its branded page, manifest, and install icons.
- /strobe/ has only its branded page, manifest, and install icons.
- Pulse and Strobe reference the shared root files, so there are fewer files to get out of sync.
- All visible navigation and schedule text uses plain ASCII-safe characters.

AUTOMATIC UPDATES
- The service worker checks for updates on page load.
- HTML is network-first, so published page changes are fetched when online.
- Static files refresh in the background.
- When a new service worker is ready, it activates and reloads the app.
- Users normally do NOT need to uninstall/reinstall the app for ordinary code/design updates.

WHEN REINSTALLING MAY STILL BE NEEDED
- If you change the installed app identity, icon, or manifest name and a device keeps the old icon/name.
- If a browser has an unusually stubborn old PWA cache.


BOTTOM NAV FIX
- Restored the five bottom navigation buttons.
- Forced the nav above page content and player with a high z-index.
- Added enough bottom padding so the page cannot cover the nav.
- Added cache-busting so phones and installed PWAs fetch the new CSS immediately.
