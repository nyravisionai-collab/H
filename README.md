# Peer Call

A static, browser-based PeerJS/WebRTC calling app. It supports private
one-to-one calls, temporary group rooms, text chat, and peer-to-peer file
sharing without an application backend.

## Use it

1. Open the site. It starts at a choice between **Call a Friend** and **Join a Room**.
2. For a private call, choose **Call a Friend** to see live users by their
   profile username. Select any live user and choose **Video Call** or
   **Audio Call**. Private text chat works before, during, and after a call.
3. For a group, choose **Create a Room** and share the generated six-character
   code, or enter a shared code to join an existing room.
4. In a room, use **Start Video Call** or **Start Audio Call**. Other members can
   answer the invitation; people joining an active room are invited automatically.
   Use **End Call for Everyone** to stop the current group call, or **Leave Room**
   to leave the room.
5. During calls, use the call controls to mute/unmute your microphone or turn
   your camera on/off. Audio-only calls display an audio tile instead of a blank
   video panel. To avoid accidentally sharing the wrong media stream, the app
   keeps you in one active call at a time.

Camera and microphone permission is requested only when someone starts or
answers a call—not when the page opens. Chat messages are rendered as text, not
HTML, so messages cannot inject markup into the page.

## File sharing

Files are sent directly over PeerJS data channels in small chunks with progress
updates and backpressure to avoid overfilling the browser data channel buffer.
Incoming file metadata and chunk sizes are validated, transfers time out if they
remain incomplete, and SHA-256 hashes are verified when the browser supports the
Web Crypto API.

## How rooms and live friend discovery work

The live friend list uses a temporary PeerJS lobby so online browsers can share
only their PeerJS connection ID and profile username with each other; the UI
shows usernames and keeps the IDs hidden. One online browser hosts that lobby,
and others reconnect automatically if it changes.

The room creator reserves a temporary PeerJS ID derived from the room code and
acts only as the membership coordinator. The creator relays membership, call
state, and chat/file notifications; browser-to-browser WebRTC connections carry
media. Consequently, rooms remain available only while the creator has the page
open. This is intentionally a lightweight temporary-room design, not a durable
or moderated conferencing service.

The app uses the public PeerJS signaling service and must be served from a
secure context (`https://`) or `localhost`; GitHub Pages is suitable. PeerJS is
loaded from the PeerJS CDN, so clients also need network access to that service.
