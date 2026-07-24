# Call

A static, browser-based PeerJS/WebRTC calling app. It supports both private
one-to-one calls and temporary group rooms without an application backend.

## Use it

1. Open the site. It starts at a choice between **Call a Friend** and **Join a Room**.
2. For a private call, copy your Peer ID, share it with a friend, enter their ID,
   and choose **Call**. Private text chat works before, during, and after a call.
3. For a group, choose **Create a Room** and share the generated six-character
   code, or enter a shared code to join an existing room.
4. In a room, use **Start Video Call** or **Start Audio Call**. Other members can
   answer the invitation; people joining an active room are invited automatically.
   Use **End Call for Everyone** to stop the current group call, or **Leave Room**
   to leave the room.

Camera and microphone permission is requested only when someone starts or
answers a call—not when the page opens. Chat messages are rendered as text, not
HTML, so messages cannot inject markup into the page.

## How rooms work

The room creator reserves a temporary PeerJS ID derived from the room code and
acts only as the membership coordinator. The creator relays membership, call
state, and chat notifications; browser-to-browser WebRTC connections carry
media. Consequently, rooms remain available only while the creator has the page
open. This is intentionally a lightweight temporary-room design, not a durable
or moderated conferencing service.

The app uses the public PeerJS signaling service and must be served from a
secure context (`https://`) or `localhost`; GitHub Pages is suitable. PeerJS is
loaded from the PeerJS CDN, so clients also need network access to that service.
