# Call

A minimal, browser-based calling web app: share your ID, call a friend by their
ID, answer, and hang up. Calls support video mode, audio-only mode, audio output
selection in audio-only mode, and camera switching while in video mode.

Built with [WebRTC](https://webrtc.org/) via
[PeerJS](https://peerjs.com/), so it runs entirely in the browser and can be
hosted as a static site (e.g. GitHub Pages) with no backend.

## How to use

1. Open the site and allow camera/microphone access.
2. Use **Use Audio-Only** if you want to call without camera video.
3. Copy your **Your ID** and send it to a friend.
4. Enter your friend's ID and press **Call** — or press **Answer** when they call you.
5. During a video call, press **Switch Camera** to change cameras.
6. In audio-only mode, use **Output: Speaker/Earpiece** when your browser supports audio output switching.
7. Press **Hang Up** to end the call.

> Note: WebRTC requires a secure context, so the app must be served over
> `https://` (GitHub Pages provides this) or from `localhost`.
