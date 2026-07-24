// Browser-based calling app (WebRTC via PeerJS — no backend required).
// GitHub Pages serves this statically; PeerJS provides the free public
// signaling broker so two browsers can connect peer-to-peer.

const myIdEl = document.getElementById("myId");
const peerIdInput = document.getElementById("peerId");
const statusEl = document.getElementById("status");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const copyBtn = document.getElementById("copyBtn");
const callBtn = document.getElementById("callBtn");
const answerBtn = document.getElementById("answerBtn");
const hangupBtn = document.getElementById("hangupBtn");
const incomingRow = document.getElementById("incoming");

let peer = null;
let localStream = null;
let currentCall = null;
let pendingCall = null;

function setStatus(text) {
  statusEl.textContent = text;
}

// 1. Get the user's camera + microphone.
async function initMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
  } catch (err) {
    setStatus("Camera/microphone permission denied.");
    console.error(err);
  }
}

// 2. Connect to the PeerJS signaling broker and get our ID.
function initPeer() {
  peer = new Peer();

  peer.on("open", (id) => {
    myIdEl.textContent = id;
    setStatus("Ready. Share your ID to receive a call.");
  });

  peer.on("error", (err) => {
    setStatus("Connection error: " + err.type);
    console.error(err);
  });

  peer.on("disconnected", () => {
    setStatus("Disconnected. Reconnecting…");
    peer.reconnect();
  });

  // 3. Incoming call.
  peer.on("call", (call) => {
    pendingCall = call;
    incomingRow.classList.remove("hidden");
    setStatus("Incoming call…");
  });
}

// 4. Start a call to a remote peer.
function startCall() {
  const remoteId = peerIdInput.value.trim();
  if (!remoteId) {
    setStatus("Enter a friend's ID first.");
    return;
  }
  if (!localStream) {
    setStatus("Waiting for camera/microphone…");
    return;
  }
  setStatus("Calling " + remoteId + " …");
  const call = peer.call(remoteId, localStream);
  handleCall(call);
}

// 5. Answer an incoming call.
function answerCall() {
  if (!pendingCall) return;
  setStatus("Connecting…");
  pendingCall.answer(localStream);
  handleCall(pendingCall);
  pendingCall = null;
  incomingRow.classList.add("hidden");
}

// Shared call-event wiring for outgoing and incoming calls.
function handleCall(call) {
  currentCall = call;
  callBtn.classList.add("hidden");
  hangupBtn.classList.remove("hidden");

  call.on("stream", (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
    setStatus("Connected.");
  });

  call.on("close", endCall);
  call.on("error", (err) => {
    setStatus("Call error: " + err.type);
    endCall();
  });
}

// 6. Hang up.
function endCall() {
  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }
  pendingCall = null;
  remoteVideo.srcObject = null;
  incomingRow.classList.add("hidden");
  callBtn.classList.remove("hidden");
  hangupBtn.classList.add("hidden");
  setStatus("Call ended. Ready.");
}

// Copy my ID to clipboard.
copyBtn.addEventListener("click", async () => {
  const id = myIdEl.textContent;
  if (!id || id === "—") return;
  try {
    await navigator.clipboard.writeText(id);
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = original), 1200);
  } catch (err) {
    console.error(err);
  }
});

callBtn.addEventListener("click", startCall);
answerBtn.addEventListener("click", answerCall);
hangupBtn.addEventListener("click", endCall);

// Boot.
initMedia();
initPeer();
