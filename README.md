# Call

A minimal, browser-based calling and chat web app: share your ID, call or
message a friend by their ID, answer, and hang up. Calls support video mode,
audio-only mode, audio output selection in audio-only mode, and camera switching
while in video mode. Text messages are sent directly between peers in real time.

Built with [WebRTC](https://webrtc.org/) via
[PeerJS](https://peerjs.com/), so it runs entirely in the browser and can be
hosted as a static site (e.g. GitHub Pages) with no backend.

## How to use

1. Open the site and allow camera/microphone access.
2. Use **Use Audio-Only** if you want to call without camera video.
3. Copy your **Your ID** and send it to a friend.
4. Enter your friend's ID and press **Call** — or press **Answer** when they call you.
5. To chat without calling, enter your friend's ID, type a message, and press **Send**.
6. During a video call, press **Switch Camera** to change cameras.
7. In audio-only mode, use **Output: Speaker/Earpiece** when your browser supports audio output switching.
8. Press **Hang Up** to end the call. Chat remains available before, during, and after calls.

> Note: WebRTC requires a secure context, so the app must be served over
> `https://` (GitHub Pages provides this) or from `localhost`.
