# Call

A minimal, browser-based calling web app. The **only** feature is calling:
share your ID, call a friend by their ID, answer, and hang up. No accounts,
no extra features.

Built with [WebRTC](https://webrtc.org/) via
[PeerJS](https://peerjs.com/), so it runs entirely in the browser and can be
hosted as a static site (e.g. GitHub Pages) with no backend.

## How to use

1. Open the site and allow camera/microphone access.
2. Copy your **Your ID** and send it to a friend.
3. Enter your friend's ID and press **Call** — or press **Answer** when they call you.
4. Press **Hang Up** to end the call.

> Note: WebRTC requires a secure context, so the app must be served over
> `https://` (GitHub Pages provides this) or from `localhost`.
