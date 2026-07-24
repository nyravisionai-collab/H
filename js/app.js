// Browser-based calling app (WebRTC via PeerJS — no backend required).
// GitHub Pages serves this statically; PeerJS provides the free public
// signaling broker so two browsers can connect peer-to-peer.

const myIdEl = document.getElementById("myId");
const peerIdInput = document.getElementById("peerId");
const statusEl = document.getElementById("status");
const videoStage = document.getElementById("videoStage");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const audioOnlyNotice = document.getElementById("audioOnlyNotice");
const copyBtn = document.getElementById("copyBtn");
const callBtn = document.getElementById("callBtn");
const answerBtn = document.getElementById("answerBtn");
const hangupBtn = document.getElementById("hangupBtn");
const modeToggleBtn = document.getElementById("modeToggleBtn");
const outputToggleBtn = document.getElementById("outputToggleBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const incomingRow = document.getElementById("incoming");
const chatStatusEl = document.getElementById("chatStatus");
const chatMessagesEl = document.getElementById("chatMessages");
const chatEmptyEl = document.getElementById("chatEmpty");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const clearChatBtn = document.getElementById("clearChatBtn");

let peer = null;
let localStream = null;
let currentCall = null;
let pendingCall = null;
let isAudioOnly = false;
let outputMode = "speaker";
let facingMode = "user";
let currentVideoDeviceId = null;
let outgoingAudioSender = null;
let outgoingVideoSender = null;
let chatConnection = null;
let chatConnectingPeer = null;
let queuedMessages = [];

function setStatus(text) {
  statusEl.textContent = text;
}

function modeName() {
  return isAudioOnly ? "Audio-only" : "Video";
}

function outputModeName() {
  return outputMode === "speaker" ? "Speaker" : "Earpiece";
}

function updateControls() {
  videoStage.classList.toggle("audio-only", isAudioOnly);
  audioOnlyNotice.classList.toggle("hidden", !isAudioOnly);
  modeToggleBtn.textContent = isAudioOnly ? "Use Video" : "Use Audio-Only";
  outputToggleBtn.textContent = "Output: " + outputModeName();
  outputToggleBtn.classList.toggle("hidden", !isAudioOnly);
  switchCameraBtn.classList.toggle("hidden", isAudioOnly);
}

function setControlsBusy(isBusy) {
  modeToggleBtn.disabled = isBusy;
  outputToggleBtn.disabled = isBusy;
  switchCameraBtn.disabled = isBusy;
}

function getVideoConstraints() {
  if (currentVideoDeviceId) {
    return { deviceId: { exact: currentVideoDeviceId } };
  }

  return { facingMode: { ideal: facingMode } };
}

function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

function updateLocalPreview() {
  localVideo.srcObject = isAudioOnly ? null : localStream;
}

function getPeerConnection() {
  return currentCall && currentCall.peerConnection ? currentCall.peerConnection : null;
}

function cacheOutgoingSenders() {
  const connection = getPeerConnection();
  if (!connection || typeof connection.getSenders !== "function") return;

  connection.getSenders().forEach((sender) => {
    if (!sender.track) return;
    if (sender.track.kind === "audio") outgoingAudioSender = sender;
    if (sender.track.kind === "video") outgoingVideoSender = sender;
  });
}

async function replaceOutgoingTracks(stream) {
  cacheOutgoingSenders();

  const audioTrack = stream.getAudioTracks()[0] || null;
  const videoTrack = stream.getVideoTracks()[0] || null;
  const replacements = [];

  if (outgoingAudioSender && audioTrack) {
    replacements.push(outgoingAudioSender.replaceTrack(audioTrack));
  }

  if (outgoingVideoSender) {
    replacements.push(outgoingVideoSender.replaceTrack(videoTrack));
  }

  await Promise.all(replacements);

  if (!outgoingVideoSender && videoTrack && currentCall) {
    setStatus("Video will apply on the next call.");
  }
}

// Get the user's microphone, plus camera when video mode is active.
async function refreshLocalMedia() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("This browser does not support camera/microphone access.");
    return false;
  }

  const constraints = {
    audio: true,
    video: isAudioOnly ? false : getVideoConstraints(),
  };
  const previousStream = localStream;

  try {
    const nextStream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream = nextStream;

    const videoTrack = nextStream.getVideoTracks()[0];
    const videoSettings = videoTrack && videoTrack.getSettings ? videoTrack.getSettings() : null;
    if (videoSettings && videoSettings.deviceId) {
      currentVideoDeviceId = videoSettings.deviceId;
    }

    updateLocalPreview();

    if (currentCall) {
      await replaceOutgoingTracks(nextStream);
    }

    if (previousStream && previousStream !== nextStream) {
      stopStream(previousStream);
    }

    updateControls();
    return true;
  } catch (err) {
    const deviceLabel = isAudioOnly ? "microphone" : "camera/microphone";
    setStatus(deviceLabel.charAt(0).toUpperCase() + deviceLabel.slice(1) + " permission denied or unavailable.");
    console.error(err);
    return false;
  }
}

async function initMedia() {
  const mediaReady = await refreshLocalMedia();

  // If the camera is unavailable, fall back to audio-only so calls can still work.
  if (!mediaReady && !isAudioOnly) {
    isAudioOnly = true;
    currentVideoDeviceId = null;
    updateControls();
    setStatus("Camera unavailable. Trying audio-only mode…");
    await refreshLocalMedia();
  }
}

function setChatStatus(text) {
  chatStatusEl.textContent = text;
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addChatMessage(text, direction, timestamp = Date.now(), state = "") {
  chatEmptyEl.classList.add("hidden");

  const messageEl = document.createElement("article");
  messageEl.className = "message " + direction;
  if (state === "failed") messageEl.classList.add("failed");

  const textEl = document.createElement("p");
  textEl.className = "message-text";
  textEl.textContent = text;

  const metaEl = document.createElement("p");
  metaEl.className = "message-meta";
  metaEl.textContent = formatMessageTime(timestamp) + (state ? " · " + state : "");

  messageEl.append(textEl, metaEl);
  chatMessagesEl.appendChild(messageEl);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  return messageEl;
}

function updateMessageState(messageEl, state) {
  if (!messageEl) return;
  messageEl.classList.toggle("failed", state === "Failed");
  const metaEl = messageEl.querySelector(".message-meta");
  if (!metaEl) return;
  const time = metaEl.textContent.split(" · ")[0];
  metaEl.textContent = time + (state ? " · " + state : "");
}

function isChatOpen(connection = chatConnection) {
  return Boolean(connection && connection.open);
}

function sendQueuedMessages(connection) {
  const remaining = [];

  queuedMessages.forEach((item) => {
    if (item.peerId !== connection.peer) {
      remaining.push(item);
      return;
    }

    try {
      connection.send(item.payload);
      updateMessageState(item.messageEl, "Sent");
    } catch (err) {
      console.error(err);
      updateMessageState(item.messageEl, "Failed");
    }
  });

  queuedMessages = remaining;
}

function handleIncomingMessage(data, connection) {
  let text = "";
  let timestamp = Date.now();

  if (typeof data === "string") {
    text = data;
  } else if (data && data.type === "chat" && typeof data.text === "string") {
    text = data.text;
    timestamp = data.timestamp || timestamp;
  }

  text = text.trim();
  if (!text) return;

  if (peerIdInput.value.trim() !== connection.peer) {
    peerIdInput.value = connection.peer;
  }
  addChatMessage(text.slice(0, 1000), "incoming", timestamp);
}

function wireChatConnection(connection) {
  if (!connection) return;

  connection.on("open", () => {
    chatConnection = connection;
    chatConnectingPeer = null;
    peerIdInput.value = connection.peer;
    setChatStatus("Connected to " + connection.peer);
    sendQueuedMessages(connection);
    messageInput.focus();
  });

  connection.on("data", (data) => handleIncomingMessage(data, connection));

  connection.on("close", () => {
    if (chatConnection !== connection) return;
    chatConnection = null;
    chatConnectingPeer = null;
    setChatStatus("Chat disconnected. Send a message to reconnect.");
  });

  connection.on("error", (err) => {
    console.error(err);
    if (chatConnection === connection || chatConnectingPeer === connection.peer) {
      chatConnectingPeer = null;
      setChatStatus("Could not connect to " + connection.peer + ".");
    }
  });
}

function ensureChatConnection(remoteId) {
  if (!peer || peer.disconnected || !peer.open) {
    setChatStatus("Still connecting. Try again in a moment.");
    return null;
  }
  if (remoteId === peer.id) {
    setChatStatus("You cannot chat with your own ID.");
    return null;
  }
  if (isChatOpen() && chatConnection.peer === remoteId) {
    return chatConnection;
  }
  if (chatConnectingPeer === remoteId) {
    return chatConnection;
  }

  if (chatConnection && chatConnection.peer !== remoteId) {
    chatConnection.close();
    chatConnection = null;
  }

  chatConnectingPeer = remoteId;
  setChatStatus("Connecting to " + remoteId + "…");
  const connection = peer.connect(remoteId, { reliable: true, serialization: "json" });
  chatConnection = connection;
  wireChatConnection(connection);
  return connection;
}

// Connect to the PeerJS signaling broker and get our ID.
function initPeer() {
  peer = new Peer();

  peer.on("open", (id) => {
    myIdEl.textContent = id;
    setStatus(modeName() + " mode. Ready. Share your ID to receive a call.");
    setChatStatus("Enter a friend’s ID to start chatting.");
  });

  peer.on("error", (err) => {
    setStatus("Connection error: " + err.type);
    console.error(err);
  });

  peer.on("disconnected", () => {
    setStatus("Disconnected. Reconnecting…");
    setChatStatus("Disconnected. Reconnecting…");
    peer.reconnect();
  });

  // Incoming text chat connections are accepted automatically by PeerJS.
  peer.on("connection", (connection) => {
    chatConnection = connection;
    chatConnectingPeer = connection.peer;
    peerIdInput.value = connection.peer;
    setChatStatus("Connecting to " + connection.peer + "…");
    wireChatConnection(connection);
  });

  // Incoming call.
  peer.on("call", (call) => {
    if (currentCall) {
      call.close();
      setStatus("Already in a call. Incoming call declined.");
      return;
    }

    pendingCall = call;
    incomingRow.classList.remove("hidden");
    setStatus("Incoming call…");
  });
}

async function ensureLocalMedia() {
  if (localStream) return true;
  return refreshLocalMedia();
}

// Start a call to a remote peer.
async function startCall() {
  const remoteId = peerIdInput.value.trim();
  if (!remoteId) {
    setStatus("Enter a friend's ID first.");
    return;
  }
  if (!peer || peer.disconnected) {
    setStatus("Still connecting. Try again in a moment.");
    return;
  }
  if (!(await ensureLocalMedia())) {
    return;
  }

  setStatus("Calling " + remoteId + " …");
  ensureChatConnection(remoteId);
  const call = peer.call(remoteId, localStream);
  handleCall(call);
}

// Answer an incoming call.
async function answerCall() {
  if (!pendingCall) return;
  if (!(await ensureLocalMedia())) {
    return;
  }

  setStatus("Connecting…");
  pendingCall.answer(localStream);
  handleCall(pendingCall);
  pendingCall = null;
  incomingRow.classList.add("hidden");
}

// Shared call-event wiring for outgoing and incoming calls.
function handleCall(call) {
  if (!call) {
    setStatus("Could not start call.");
    return;
  }

  currentCall = call;
  outgoingAudioSender = null;
  outgoingVideoSender = null;
  cacheOutgoingSenders();
  callBtn.classList.add("hidden");
  hangupBtn.classList.remove("hidden");

  call.on("stream", (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
    remoteVideo.play().catch(() => {
      // User interaction with the call buttons normally permits playback.
    });
    if (isAudioOnly) {
      applyAudioOutput();
    }
    setStatus("Connected.");
  });

  call.on("close", endCall);
  call.on("error", (err) => {
    setStatus("Call error: " + err.type);
    endCall();
  });
}

// Hang up.
function endCall() {
  const call = currentCall;
  currentCall = null;
  pendingCall = null;
  outgoingAudioSender = null;
  outgoingVideoSender = null;

  if (call) {
    call.close();
  }

  remoteVideo.srcObject = null;
  incomingRow.classList.add("hidden");
  callBtn.classList.remove("hidden");
  hangupBtn.classList.add("hidden");
  setStatus("Call ended. " + modeName() + " mode ready.");
}

async function toggleMode() {
  const previousMode = isAudioOnly;
  const previousVideoDeviceId = currentVideoDeviceId;

  isAudioOnly = !isAudioOnly;
  if (isAudioOnly) {
    currentVideoDeviceId = null;
  }
  updateControls();
  setControlsBusy(true);
  setStatus("Switching to " + modeName().toLowerCase() + " mode…");

  const mediaReady = await refreshLocalMedia();

  if (!mediaReady) {
    isAudioOnly = previousMode;
    currentVideoDeviceId = previousVideoDeviceId;
    updateControls();
    await refreshLocalMedia();
    setStatus("Could not switch modes. Staying in " + modeName().toLowerCase() + " mode.");
  } else {
    if (isAudioOnly) {
      await applyAudioOutput();
    }

    setStatus(currentCall ? "Connected in " + modeName().toLowerCase() + " mode." : modeName() + " mode. Ready.");
  }

  setControlsBusy(false);
  updateControls();
}

async function chooseNextCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((device) => device.kind === "videoinput");

  if (cameras.length > 1) {
    const currentTrack = localStream && localStream.getVideoTracks()[0];
    const currentSettings = currentTrack && currentTrack.getSettings ? currentTrack.getSettings() : {};
    const activeDeviceId = currentSettings.deviceId || currentVideoDeviceId;
    const activeIndex = cameras.findIndex((camera) => camera.deviceId === activeDeviceId);
    const nextCamera = cameras[(activeIndex + 1 + cameras.length) % cameras.length];
    currentVideoDeviceId = nextCamera.deviceId;
    return;
  }

  currentVideoDeviceId = null;
  facingMode = facingMode === "user" ? "environment" : "user";
}

async function switchCamera() {
  if (isAudioOnly) {
    setStatus("Switch to video mode before switching cameras.");
    return;
  }

  const previousFacingMode = facingMode;
  const previousVideoDeviceId = currentVideoDeviceId;

  try {
    await chooseNextCamera();
  } catch (err) {
    console.error(err);
    currentVideoDeviceId = null;
    facingMode = facingMode === "user" ? "environment" : "user";
  }

  setControlsBusy(true);
  setStatus("Switching camera…");

  // Mobile browsers often require the active camera track to be released
  // before a different front/back camera can be opened.
  if (localStream) {
    localStream.getVideoTracks().forEach((track) => track.stop());
  }

  const mediaReady = await refreshLocalMedia();

  if (!mediaReady) {
    facingMode = previousFacingMode;
    currentVideoDeviceId = previousVideoDeviceId;
    await refreshLocalMedia();
    setStatus("Could not switch camera.");
  } else if (!currentCall) {
    setStatus("Camera switched. Ready.");
  } else {
    setStatus("Camera switched.");
  }

  setControlsBusy(false);
  updateControls();
}

function chooseOutputDevice(outputs, requestedMode) {
  if (requestedMode === "earpiece") {
    return outputs.find((device) => /earpiece|receiver|phone|communication/i.test(device.label)) ||
      outputs.find((device) => device.deviceId === "communications") ||
      null;
  }

  return outputs.find((device) => /speaker/i.test(device.label)) ||
    outputs.find((device) => device.deviceId === "default") ||
    outputs[0] ||
    null;
}

async function applyAudioOutput() {
  updateControls();

  if (typeof remoteVideo.setSinkId !== "function") {
    setStatus("Speaker/earpiece switching is not supported by this browser.");
    return false;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter((device) => device.kind === "audiooutput");
    const outputDevice = chooseOutputDevice(outputs, outputMode);

    if (!outputDevice) {
      const defaultOutput = outputs.find((device) => device.deviceId === "default");
      await remoteVideo.setSinkId(defaultOutput ? defaultOutput.deviceId : "");
      setStatus(outputModeName() + " output not found. Using default output.");
      return false;
    }

    await remoteVideo.setSinkId(outputDevice.deviceId);
    return true;
  } catch (err) {
    setStatus("Could not change audio output on this browser.");
    console.error(err);
    return false;
  }
}

async function toggleAudioOutput() {
  if (!isAudioOnly) return;

  outputMode = outputMode === "speaker" ? "earpiece" : "speaker";
  updateControls();

  if (await applyAudioOutput()) {
    setStatus("Audio output set to " + outputModeName() + ".");
  }
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
modeToggleBtn.addEventListener("click", toggleMode);
outputToggleBtn.addEventListener("click", toggleAudioOutput);
switchCameraBtn.addEventListener("click", switchCamera);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  const remoteId = peerIdInput.value.trim();
  if (!text) return;
  if (!remoteId) {
    setChatStatus("Enter a friend’s ID first.");
    peerIdInput.focus();
    return;
  }

  const payload = {
    type: "chat",
    text: text.slice(0, 1000),
    timestamp: Date.now(),
  };
  const messageEl = addChatMessage(payload.text, "outgoing", payload.timestamp, "Sending");
  messageInput.value = "";

  if (isChatOpen() && chatConnection.peer === remoteId) {
    try {
      chatConnection.send(payload);
      updateMessageState(messageEl, "Sent");
    } catch (err) {
      console.error(err);
      updateMessageState(messageEl, "Failed");
    }
    return;
  }

  queuedMessages.push({ peerId: remoteId, payload, messageEl });
  if (!ensureChatConnection(remoteId)) {
    queuedMessages = queuedMessages.filter((item) => item.messageEl !== messageEl);
    updateMessageState(messageEl, "Failed");
  }
});

clearChatBtn.addEventListener("click", () => {
  chatMessagesEl.querySelectorAll(".message").forEach((message) => message.remove());
  queuedMessages = [];
  chatEmptyEl.classList.remove("hidden");
  messageInput.focus();
});

peerIdInput.addEventListener("input", () => {
  const remoteId = peerIdInput.value.trim();
  if (isChatOpen() && remoteId === chatConnection.peer) {
    setChatStatus("Connected to " + remoteId);
  } else if (remoteId) {
    setChatStatus("Ready to chat with " + remoteId);
  } else {
    setChatStatus("Enter a friend’s ID to start chatting.");
  }
});

// Boot.
updateControls();
initMedia();
initPeer();
