DJ PERRY RADIO — CONFIGURED THREE-STATION APP

This version is configured for:
- DJ Perry Radio
- The Strobe Radio
- Pulse 107

NOW PLAYING
The app loads each station's official CloudRadio streaminfo.js separately:
DJ Perry Radio:
https://public.cloudrad.io/ef8751af/live/streaminfo.js

The Strobe Radio:
https://public.cloudrad.io/ac7b42b9/live/streaminfo.js

Pulse 107:
https://public.cloudrad.io/c80559c5/live/streaminfo.js

The current CloudRadio song text is passed into the main app and appears:
- in the station's NOW PLAYING area
- in the bottom player when that station is active
- in supported phone/browser media controls

ONE STREAM AT A TIME
The app has exactly ONE HTML audio element.
Before a different station starts, it:
1. pauses the old stream
2. removes the old stream URL
3. resets the audio element
4. assigns the new stream
5. starts the new station

It also uses a switch token so rapidly tapping different stations cannot leave an older pending play request active.

GITHUB UPDATE
1. Extract this ZIP.
2. Open:
   https://github.com/djperryradio/dj-perry-radio-app
3. Choose Add file > Upload files.
4. Upload every individual file from the extracted folder into the repository root.
5. Replace matching files.
6. Commit changes.
7. Leave GitHub Pages set to main / root.
8. Wait a few minutes, then open:
   https://djperryradio.github.io/dj-perry-radio-app/

IMPORTANT
Do not upload the ZIP itself into the repository. Upload the files inside it.
