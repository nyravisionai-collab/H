/* Static PeerJS calling app. Room membership is coordinated by the creator's
   temporary PeerJS ID; media and messages still travel peer-to-peer. */
const $ = (id) => document.getElementById(id);
const statusEl = $("status"), myIdEl = $("myId");
let peer, localStream = null, privateCall = null, pendingPrivate = null;
let privateConnection = null, room = null, pendingGroupCalls = [], groupCalls = new Map();
let reconnectAttempts = 0, roomJoinTimer = null, inGroupCall = false;

function status(text) { statusEl.textContent = text; }
function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }
function view(name) { ["homeView", "friendView", "roomView"].forEach((id) => $(id).classList.toggle("hidden", id !== name)); }
function safeText(value) { return typeof value === "string" ? value.trim().slice(0, 1000) : ""; }
function safeFileName(value) { return safeText(value).slice(0, 180) || "file"; }
function liveTracks(stream, kind) { return (stream?.getTracks() || []).filter((track) => track.kind === kind && track.readyState !== "ended"); }
function stopMedia() { if (localStream) localStream.getTracks().forEach((track) => track.stop()); localStream = null; updateMediaControls(); }

function wireLocalStream(stream) {
  stream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => { updateMediaControls(); refreshLocalTiles(); });
  });
  updateMediaControls();
}

// Deliberately called only from Call/Answer buttons: opening the site never asks for media.
async function getMedia(video) {
  const hasUsableAudio = liveTracks(localStream, "audio").length > 0;
  const hasRequestedVideo = !video || liveTracks(localStream, "video").length > 0;
  if (localStream && hasUsableAudio && hasRequestedVideo) { updateMediaControls(); return localStream; }
  if (!navigator.mediaDevices?.getUserMedia) { status("Camera/microphone access is unsupported in this browser."); return null; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: { ideal: "user" } } : false });
    if (localStream) stopMedia();
    localStream = stream;
    wireLocalStream(stream);
    return stream;
  } catch (error) { console.error(error); status("Microphone/camera permission was denied or is unavailable."); return null; }
}
function addMessage(containerId, text, mine, sender = "") {
  const container = $(containerId), empty = container.querySelector(".empty"); if (empty) empty.remove();
  const item = document.createElement("article"); item.className = "message " + (mine ? "mine" : "theirs");
  const body = document.createElement("div"); body.textContent = safeText(text); item.append(body);
  const meta = document.createElement("small"); meta.textContent = sender || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); item.append(meta);
  container.append(item); container.scrollTop = container.scrollHeight;
}
function clearMessages(id) { $(id).replaceChildren(Object.assign(document.createElement("p"), { className: "empty", textContent: "No messages yet" })); }
function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
}

async function copyText(text, button) {
  if (!text) return status("Nothing to copy yet.");
  const old = button.textContent;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else if (!fallbackCopy(text)) throw new Error("clipboard unavailable");
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = old; }, 1100);
  } catch (error) {
    console.error(error);
    status("Could not copy to clipboard.");
  }
}

// File sharing (direct binary over PeerJS data channels, chunked, with progress,
// backpressure, size limits and SHA-256 integrity verification).
const FILE_CHUNK_SIZE = 32 * 1024;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const BUFFERED_AMOUNT_HIGH = 2 * 1024 * 1024; // pause sending once a data channel has this much queued
const INCOMING_FILE_TIMEOUT_MS = 5 * 60 * 1000; // Abandon unfinished transfers after ~5 minutes.
const MAX_FILE_CHUNKS = Math.ceil(MAX_FILE_SIZE / FILE_CHUNK_SIZE) + 1;
const incomingFiles = new Map(); // fileId -> { name, mime, size, totalChunks, hash, sender, chunks, receivedBytes, timeoutId }
const fileMessageEls = new Map(); // fileId -> { item, body, progressWrap, progressBar, statusEl, fileName, link }

function fileTransferId() { return globalThis.crypto?.randomUUID?.() || Date.now() + "-" + Math.random().toString(36).slice(2, 8); }

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function normalizeIncomingChunk(chunk) {
  if (chunk instanceof ArrayBuffer) return chunk;
  if (ArrayBuffer.isView(chunk)) return chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
  return null;
}

function failIncomingFile(fileId, message) {
  const fd = incomingFiles.get(fileId);
  if (fd?.timeoutId) clearTimeout(fd.timeoutId);
  incomingFiles.delete(fileId);
  finalizeFileMessage(fileId, { ok: false, error: message });
}

async function sha256Hex(buffer) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("SHA-256 is unavailable in this browser.");
  const digest = await subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Revoke a blob/object URL once it's no longer needed so memory isn't held forever.
function scheduleUrlRevoke(url, delayMs = 10 * 60 * 1000) {
  if (!url) return;
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) { /* already revoked */ } }, delayMs);
}

function appendFileDownloadLink(refs, url) {
  const link = document.createElement("a");
  link.href = url; link.textContent = "Download"; link.className = "file-link"; link.download = refs.fileName || "file";
  link.addEventListener("click", () => scheduleUrlRevoke(url, 60 * 1000), { once: true });
  scheduleUrlRevoke(url);
  refs.body.insertBefore(link, refs.statusEl);
  refs.link = link;
}

// Creates the chat message shell for a file transfer (sender or receiver side) with
// a name/size line, an optional immediate download link (sender's own copy), and a
// progress bar that's updated as chunks are sent/received.
function createFileMessage(containerId, { fileId, fileName, mine, senderLabel = "", sizeBytes, url }) {
  fileName = safeFileName(fileName);
  const container = $(containerId), empty = container.querySelector(".empty"); if (empty) empty.remove();
  const item = document.createElement("article"); item.className = "message file-message " + (mine ? "mine" : "theirs");
  const body = document.createElement("div"); body.className = "file-body";
  const nameRow = document.createElement("div"); nameRow.className = "file-name-row";
  const nameEl = document.createElement("span"); nameEl.className = "file-name"; nameEl.textContent = "📎 " + fileName;
  nameRow.append(nameEl);
  if (typeof sizeBytes === "number") { const sizeEl = document.createElement("span"); sizeEl.className = "file-size"; sizeEl.textContent = formatFileSize(sizeBytes); nameRow.append(sizeEl); }
  body.append(nameRow);
  const progressWrap = document.createElement("div"); progressWrap.className = "file-progress-wrap";
  const progressBar = document.createElement("div"); progressBar.className = "file-progress-bar";
  progressWrap.append(progressBar); body.append(progressWrap);
  const statusEl = document.createElement("small"); statusEl.className = "file-status muted";
  statusEl.textContent = mine ? "Sending… 0%" : "Waiting for file…";
  body.append(statusEl);
  item.append(body);
  const meta = document.createElement("small"); meta.textContent = senderLabel || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); item.append(meta);
  container.append(item); container.scrollTop = container.scrollHeight;
  const refs = { item, body, progressWrap, progressBar, statusEl, fileName, link: null };
  fileMessageEls.set(fileId, refs);
  if (url) appendFileDownloadLink(refs, url);
  return refs;
}

function updateFileProgress(fileId, percent, text) {
  const refs = fileMessageEls.get(fileId); if (!refs) return;
  refs.progressBar.style.width = Math.max(0, Math.min(100, percent)) + "%";
  if (text) refs.statusEl.textContent = text;
}

function finalizeFileMessage(fileId, { ok, url, error, sent } = {}) {
  const refs = fileMessageEls.get(fileId);
  if (!refs) { if (url) scheduleUrlRevoke(url); return; }
  refs.progressWrap.remove();
  if (ok) {
    if (url && !refs.link) appendFileDownloadLink(refs, url);
    refs.statusEl.textContent = sent ? "Sent" : "Received";
    refs.statusEl.classList.remove("file-error");
  } else {
    refs.statusEl.textContent = error || "File transfer failed.";
    refs.statusEl.classList.add("file-error");
  }
  fileMessageEls.delete(fileId);
}

// Wait until every target data channel has drained below the "high" threshold so a
// tight sending loop cannot overflow the channel's send buffer (basic backpressure).
function waitForBufferedAmount(connections) {
  return new Promise((resolve) => {
    const check = () => {
      const busy = (connections() || []).some((c) => c?.open && (c.dataChannel?.bufferedAmount || 0) > BUFFERED_AMOUNT_HIGH);
      if (!busy) return resolve();
      setTimeout(check, 40);
    };
    check();
  });
}

function handleFileStart(data, containerId) {
  if (!data || data.type !== "file-start") return;
  const fileId = typeof data.fileId === "string" && data.fileId.length <= 120 ? data.fileId : "";
  const size = Number(data.size);
  const totalChunks = Number(data.totalChunks);
  const expectedChunks = Number.isFinite(size) ? Math.max(1, Math.ceil(size / FILE_CHUNK_SIZE)) : 0;
  const invalidHash = data.hash && (typeof data.hash !== "string" || !/^[a-f0-9]{64}$/i.test(data.hash));
  if (!fileId || incomingFiles.has(fileId)) return;
  if (!Number.isFinite(size) || size < 0 || size > MAX_FILE_SIZE || !Number.isInteger(totalChunks) || totalChunks < 1 || totalChunks > MAX_FILE_CHUNKS || totalChunks !== expectedChunks || invalidHash) {
    status("Rejected an incoming file with invalid metadata.");
    return;
  }

  const timeoutId = setTimeout(() => {
    incomingFiles.delete(fileId);
    finalizeFileMessage(fileId, { ok: false, error: "File transfer timed out." });
  }, INCOMING_FILE_TIMEOUT_MS);
  incomingFiles.set(fileId, {
    name: safeFileName(data.name),
    mime: typeof data.mime === "string" && data.mime.length <= 120 ? data.mime : "application/octet-stream",
    size,
    totalChunks,
    hash: data.hash ? data.hash.toLowerCase() : "",
    sender: safeText(data.sender),
    chunks: new Map(),
    receivedBytes: 0,
    timeoutId,
  });
  createFileMessage(containerId, { fileId, fileName: data.name, mine: false, senderLabel: safeText(data.sender) || "Participant", sizeBytes: size });
}

async function assembleIncomingFile(fileId, fd, containerId) {
  const chunks = [];
  for (let i = 0; i < fd.totalChunks; i++) {
    if (!fd.chunks.has(i)) { finalizeFileMessage(fileId, { ok: false, error: "File transfer is incomplete." }); return; }
    chunks.push(fd.chunks.get(i));
  }
  const blob = new Blob(chunks, { type: fd.mime || "application/octet-stream" });
  if (blob.size !== fd.size) { finalizeFileMessage(fileId, { ok: false, error: "File size mismatch — transfer stopped." }); return; }
  if (fd.hash && globalThis.crypto?.subtle?.digest) {
    updateFileProgress(fileId, 100, "Verifying…");
    try {
      const buffer = await blob.arrayBuffer();
      const actualHash = await sha256Hex(buffer);
      if (actualHash !== fd.hash) { finalizeFileMessage(fileId, { ok: false, error: "Integrity check failed — file may be corrupted." }); return; }
    } catch (e) { console.error("Hash verification error:", e); }
  }
  const url = URL.createObjectURL(blob);
  finalizeFileMessage(fileId, { ok: true, url });
}

function handleFileChunk(data, containerId) {
  if (!data || data.type !== "file-chunk") return;
  const fd = incomingFiles.get(data.fileId);
  if (!fd) return; // No matching file-start (already finished, timed out, or never seen).
  const index = Number(data.index);
  const chunk = normalizeIncomingChunk(data.chunk);
  if (!Number.isInteger(index) || index < 0 || index >= fd.totalChunks || !chunk) return;
  if (fd.chunks.has(index)) return; // Ignore duplicate chunks rather than double-counting them.

  const expectedBytes = index === fd.totalChunks - 1 ? fd.size - FILE_CHUNK_SIZE * (fd.totalChunks - 1) : FILE_CHUNK_SIZE;
  if (chunk.byteLength !== expectedBytes || chunk.byteLength > FILE_CHUNK_SIZE) {
    failIncomingFile(data.fileId, "File transfer stopped: invalid chunk size.");
    return;
  }

  fd.receivedBytes += chunk.byteLength;
  if (fd.receivedBytes > fd.size) {
    failIncomingFile(data.fileId, "File transfer stopped: received too much data.");
    return;
  }

  fd.chunks.set(index, chunk);
  const percent = Math.round((fd.chunks.size / fd.totalChunks) * 100);
  updateFileProgress(data.fileId, percent, "Receiving… " + percent + "%");
  if (fd.chunks.size >= fd.totalChunks) {
    clearTimeout(fd.timeoutId);
    incomingFiles.delete(data.fileId);
    assembleIncomingFile(data.fileId, fd, containerId);
  }
}

// Generic sender used for both private chat and room chat. `sendFn` transmits one
// message to the relevant peer(s); `getConnections` returns the live DataConnection(s)
// used for backpressure checks (it's re-evaluated on every wait, since room membership
// can change mid-transfer).
async function sendFile({ file, containerId, mine, senderLabel, sendFn, getConnections }) {
  if (!file) return;
  if (!Number.isFinite(file.size) || file.size > MAX_FILE_SIZE) { status("File is too large (max " + formatFileSize(MAX_FILE_SIZE) + ")."); return; }
  const fileId = fileTransferId();
  const localUrl = URL.createObjectURL(file);
  createFileMessage(containerId, { fileId, fileName: file.name, mine, senderLabel, sizeBytes: file.size, url: localUrl });
  try {
    const buffer = await file.arrayBuffer();
    let hash = null;
    if (globalThis.crypto?.subtle?.digest) { try { hash = await sha256Hex(buffer); } catch (e) { console.error("Hashing error:", e); } }
    const total = Math.max(1, Math.ceil(buffer.byteLength / FILE_CHUNK_SIZE));
    sendFn({ type: "file-start", fileId, name: file.name, mime: file.type || "application/octet-stream", size: buffer.byteLength, totalChunks: total, hash, sender: peer?.id || "" });
    for (let i = 0; i < total; i++) {
      await waitForBufferedAmount(getConnections);
      const chunk = buffer.slice(i * FILE_CHUNK_SIZE, (i + 1) * FILE_CHUNK_SIZE);
      sendFn({ type: "file-chunk", fileId, index: i, chunk, sender: peer?.id || "" });
      const percent = Math.round(((i + 1) / total) * 100);
      updateFileProgress(fileId, percent, "Sending… " + percent + "%");
      if (i % 8 === 7) await new Promise((resolve) => setTimeout(resolve, 0)); // yield periodically
    }
    finalizeFileMessage(fileId, { ok: true, sent: true });
  } catch (e) {
    console.error("File send error:", e);
    finalizeFileMessage(fileId, { ok: false, error: "Failed to send file." });
  }
}
function wirePrivateConnection(connection) {
  connection.on("open", () => { privateConnection = connection; $("privateChatStatus").textContent = "Connected to " + connection.peer; });
  connection.on("data", (data) => {
    if (data?.type === "private-chat") addMessage("privateMessages", data.text, false);
    if (data?.type === "file-start") handleFileStart(data, "privateMessages");
    if (data?.type === "file-chunk") handleFileChunk(data, "privateMessages");
  });
  connection.on("close", () => { if (privateConnection === connection) { privateConnection = null; $("privateChatStatus").textContent = "Chat disconnected."; } });
  connection.on("error", () => { $("privateChatStatus").textContent = "Could not connect to chat."; });
}
function waitForConnectionOpen(connection, timeoutMs = 8000) {
  if (connection?.open) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    connection.once("open", () => finish(true));
    connection.once("close", () => finish(false));
    connection.once("error", () => finish(false));
  });
}

function privateChatConnection(remoteId) {
  if (!peer?.open || !remoteId || remoteId === peer.id) return null;
  if (privateConnection?.open && privateConnection.peer === remoteId) return privateConnection;
  if (privateConnection) privateConnection.close();
  privateConnection = peer.connect(remoteId, { reliable: true }); wirePrivateConnection(privateConnection); return privateConnection;
}
function endPrivateCall() {
  const call = privateCall;
  privateCall = null;
  if (call) call.close();
  clearMediaTiles("privateTiles");
  if (!inGroupCall) stopMedia();
  hide("privateCallControls");
  hide("privateHangupBtn");
  show("callBtn");
  show("audioCallBtn");
  status("Private call ended.");
}
function wirePrivateCall(call) {
  privateCall = call;
  hide("callBtn");
  hide("audioCallBtn");
  show("privateCallControls");
  show("privateHangupBtn");
  updateMediaControls();
  call.on("stream", (stream) => addPrivateTile(call.peer, stream));
  call.on("close", () => { clearMediaTiles("privateTiles"); if (privateCall === call) endPrivateCall(); });
  call.on("error", () => endPrivateCall());
}
async function startPrivateCall(video = true) {
  if (inGroupCall) return status("End the group call before starting a private call.");
  const remoteId = $("peerId").value.trim(); if (!remoteId) return status("Enter a friend's ID first."); if (remoteId === peer?.id) return status("You cannot call your own ID.");
  const stream = await getMedia(video); if (!stream) return; addPrivateTile(peer.id, stream, true); privateChatConnection(remoteId); status("Calling " + remoteId + "…"); wirePrivateCall(peer.call(remoteId, stream, { metadata: { kind: "private", video } }));
}
async function answerPrivate() { if (!pendingPrivate) return; if (inGroupCall) return status("End the group call before answering a private call."); const stream = await getMedia(Boolean(pendingPrivate.metadata?.video !== false)); if (!stream) return; addPrivateTile(peer.id, stream, true); const call = pendingPrivate; pendingPrivate = null; hide("privateIncoming"); wirePrivateCall(call); call.answer(stream); }

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(6);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
  else for (let i = 0; i < values.length; i++) values[i] = Math.floor(Math.random() * 0xffffffff);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}
function roomHostId(code) { return "call-room-" + code; }
function memberIds() { return room?.creator ? [...room.members.keys()] : (room?.roster || []).filter((id) => id !== peer.id); }
function allRoomIds() { return room?.creator ? [peer.id, ...room.members.keys()] : [peer.id, ...(room?.roster || []).filter((id) => id !== peer.id)]; }
function sendHost(data) { if (room?.hostConnection?.open) room.hostConnection.send(data); }
function broadcast(data) { if (!room?.creator) return; room.members.forEach((connection) => { if (connection.open) connection.send(data); }); }
function updateRoomUI() { if (!room) return; $("roomCode").textContent = room.code; $("participantCount").textContent = allRoomIds().length + " participant" + (allRoomIds().length === 1 ? "" : "s") + " online"; }
function announceRoster() { const roster = allRoomIds(); broadcast({ type: "roster", roster, active: room.callActive, video: room.video }); updateRoomUI(); }
function roomMessage(text, sender) { addMessage("roomMessages", text, sender === peer.id, sender === peer.id ? "You" : "Participant"); }
function clearRoomJoinTimer() { if (roomJoinTimer) clearTimeout(roomJoinTimer); roomJoinTimer = null; }
function closePendingGroupCalls() { pendingGroupCalls.splice(0).forEach((call) => call.close()); hide("incomingModal"); }
function showIncomingGroupCall(video) {
  if (!room || inGroupCall) return;
  offerGroupAnswer();
  show("incomingModal");
  $("incomingText").textContent = "A participant is inviting you to the group " + (video ? "video" : "audio") + " call.";
}
function handleRoomData(data, connection) {
  if (!data || typeof data.type !== "string") return;
  if (room?.creator) {
    if (data.type === "join" && data.peerId === connection.peer) { room.members.set(connection.peer, connection); connection.send({ type: "welcome", code: room.code, roster: allRoomIds(), active: room.callActive, video: room.video }); announceRoster(); if (room.callActive && localStream) connectGroupPeers(); status("Room active — share the code."); }
    if (data.type === "leave") { room.members.delete(connection.peer); announceRoster(); }
    if (data.type === "room-chat") { const text = safeText(data.text); if (text) { broadcast({ type: "room-chat", text, sender: connection.peer }); roomMessage(text, connection.peer); } }
    if (data.type === "start-call") { room.callActive = true; room.video = Boolean(data.video); broadcast({ type: "call-state", active: true, video: room.video, starter: connection.peer }); if (!inGroupCall) offerGroupAnswer(); }
    if (data.type === "end-call") endGroupCall(true);
    if (data.type === "file-start" || data.type === "file-chunk") {
      // Relay to every other member (never back to the sender) and also assemble
      // it locally so the creator's own chat sees files sent by participants.
      const relayed = { ...data, sender: connection.peer };
      room.members.forEach((conn) => { if (conn.open && conn.peer !== connection.peer) conn.send(relayed); });
      if (relayed.type === "file-start") handleFileStart(relayed, "roomMessages"); else handleFileChunk(relayed, "roomMessages");
      return;
    }
    return;
  }
  if (data.type === "welcome" || data.type === "roster") { room.roster = data.roster || []; room.callActive = Boolean(data.active); room.video = Boolean(data.video); updateRoomUI(); if (room.callActive && !inGroupCall) offerGroupAnswer(); else if (!room.callActive) finishGroupCall(false); }
  if (data.type === "room-chat") { const text = safeText(data.text); if (text) roomMessage(text, data.sender); }
  if (data.type === "call-state") { room.callActive = Boolean(data.active); room.video = Boolean(data.video); if (room.callActive) { if (!inGroupCall) offerGroupAnswer(); } else finishGroupCall(false); }
  if (data.type === "file-start") { handleFileStart(data, "roomMessages"); return; }
  if (data.type === "file-chunk") { handleFileChunk(data, "roomMessages"); return; }
  if (data.type === "room-closed") { status("The room creator left; this room is closed."); leaveRoom(false); }
}
function wireHostConnection(connection) {
  connection.on("data", (data) => handleRoomData(data, connection));
  connection.on("close", () => { if (room?.creator) { room.members.delete(connection.peer); announceRoster(); } else if (room?.hostConnection === connection) { status("Room creator is offline; the room has closed."); leaveRoom(false); } });
}
function createRoom() {
  if (!peer?.open) return status("Still connecting — please try again.");
  const code = randomCode(), host = new Peer(roomHostId(code));
  room = { code, creator: true, hostPeer: host, members: new Map(), roster: [peer.id], callActive: false, video: true };
  host.on("open", () => { hide("roomLobby"); show("roomActive"); show("leaveRoomBtn"); updateRoomUI(); status("Room created. Share code " + code + "."); });
  host.on("connection", (connection) => wireHostConnection(connection));
  host.on("error", (error) => { console.error(error); status("Could not create room. Please try again."); leaveRoom(false); });
}
function joinRoom() {
  const code = $("roomCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z0-9]{6}$/.test(code)) return status("Enter a valid 6-character room code.");
  if (!peer?.open) return status("Still connecting — please try again.");
  clearRoomJoinTimer();
  const hostConnection = peer.connect(roomHostId(code), { reliable: true });
  room = { code, creator: false, hostConnection, roster: [], callActive: false, video: true };
  status("Looking for room " + code + "…");
  roomJoinTimer = setTimeout(() => {
    if (room?.hostConnection === hostConnection && !hostConnection.open) {
      status("Room not found or creator is offline.");
      leaveRoom(false);
    }
  }, 8000);
  hostConnection.on("open", () => {
    clearRoomJoinTimer();
    hostConnection.send({ type: "join", peerId: peer.id });
    hide("roomLobby");
    show("roomActive");
    show("leaveRoomBtn");
    status("Joining room " + code + "…");
  });
  hostConnection.on("error", () => { clearRoomJoinTimer(); status("Room not found or creator is offline."); leaveRoom(false); });
  wireHostConnection(hostConnection);
}
function leaveRoom(changeView = true) {
  clearRoomJoinTimer();
  if (!room) return;
  const currentRoom = room;
  if (currentRoom.creator) { broadcast({ type: "room-closed" }); currentRoom.hostPeer?.destroy(); }
  else if (currentRoom.hostConnection?.open) currentRoom.hostConnection.send({ type: "leave" });
  finishGroupCall(false);
  room = null;
  currentRoom.hostConnection?.close();
  hide("roomActive");
  hide("leaveRoomBtn");
  show("roomLobby");
  clearMessages("roomMessages");
  if (changeView) { view("homeView"); status("You left the room."); }
}
function setPressed(button, pressed) {
  if (!button) return;
  button.setAttribute("aria-pressed", String(pressed));
  button.classList.toggle("active", pressed);
}

function updateMediaControls() {
  const audioTracks = liveTracks(localStream, "audio");
  const videoTracks = liveTracks(localStream, "video");
  const muted = audioTracks.length > 0 && audioTracks.every((track) => !track.enabled);
  const cameraOff = videoTracks.length > 0 && videoTracks.every((track) => !track.enabled);
  [
    [$("privateMuteBtn"), $("privateCameraBtn")],
    [$("groupMuteBtn"), $("groupCameraBtn")],
  ].forEach(([muteBtn, cameraBtn]) => {
    if (muteBtn) {
      muteBtn.disabled = audioTracks.length === 0;
      muteBtn.textContent = muted ? "Unmute mic" : "Mute mic";
      setPressed(muteBtn, muted);
    }
    if (cameraBtn) {
      cameraBtn.disabled = videoTracks.length === 0;
      cameraBtn.textContent = videoTracks.length === 0 ? "Audio only" : (cameraOff ? "Turn camera on" : "Turn camera off");
      setPressed(cameraBtn, cameraOff);
    }
  });
}

function toggleMic() {
  const audioTracks = liveTracks(localStream, "audio");
  if (!audioTracks.length) return;
  const mute = audioTracks.some((track) => track.enabled);
  audioTracks.forEach((track) => { track.enabled = !mute; });
  updateMediaControls();
  refreshLocalTiles();
}

function toggleCamera() {
  const videoTracks = liveTracks(localStream, "video");
  if (!videoTracks.length) return;
  const turnOff = videoTracks.some((track) => track.enabled);
  videoTracks.forEach((track) => { track.enabled = !turnOff; });
  updateMediaControls();
  refreshLocalTiles();
}

function safeTileId(prefix, id) { return prefix + String(id || "unknown").replace(/[^a-z0-9_-]/gi, "_"); }

function hasVisibleVideo(stream) {
  // Do not use MediaStreamTrack.muted here. Remote WebRTC video tracks often
  // start in a muted state until the first frame arrives; if we hide the <video>
  // at that moment and never re-check, the other person's video appears stuck as
  // "Audio only" even though video is flowing.
  return liveTracks(stream, "video").some((track) => track.enabled);
}

function updateTileVisual(tile, stream, local) {
  const visibleVideo = hasVisibleVideo(stream);
  const hasVideoTrack = liveTracks(stream, "video").length > 0;
  const micMuted = liveTracks(stream, "audio").length > 0 && liveTracks(stream, "audio").every((track) => !track.enabled);
  tile.classList.toggle("audio", !visibleVideo);
  const title = tile.querySelector(".audio-title");
  const detail = tile.querySelector(".audio-detail");
  if (title) title.textContent = hasVideoTrack ? (local ? "Camera off" : "Waiting for video…") : "Audio only";
  if (detail) detail.textContent = local ? (micMuted ? "Your microphone is muted" : "Your microphone is connected") : "Audio stream connected";
}

function bindTileMediaEvents(tile, stream, local) {
  if (typeof tile._cleanupMediaTile === "function") tile._cleanupMediaTile();
  const video = tile.querySelector("video");
  const listeners = [];
  const listen = (target, event, handler) => {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  };
  const refresh = () => updateTileVisual(tile, stream, local);
  const tryPlay = () => video.play().catch(() => {});

  ["loadedmetadata", "loadeddata", "canplay", "playing", "resize"].forEach((event) => {
    listen(video, event, () => { refresh(); tryPlay(); });
  });
  if (typeof stream.addEventListener === "function") {
    ["addtrack", "removetrack"].forEach((event) => listen(stream, event, refresh));
  }
  (stream.getTracks() || []).forEach((track) => {
    ["mute", "unmute", "ended"].forEach((event) => listen(track, event, refresh));
  });

  tile._cleanupMediaTile = () => {
    listeners.splice(0).forEach((cleanup) => cleanup());
    tile._cleanupMediaTile = null;
  };
}

function createMediaTile(containerId, tileId, labelText) {
  let tile = $(tileId);
  if (tile) return tile;
  tile = document.createElement("div");
  tile.id = tileId;
  tile.className = "tile";
  const video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  tile.append(video);
  const placeholder = document.createElement("div");
  placeholder.className = "audio-placeholder";
  placeholder.innerHTML = '<div class="audio-avatar" aria-hidden="true">🎧</div><div class="audio-title">Audio only</div><p class="audio-detail">Audio stream connected</p>';
  tile.append(placeholder);
  const label = document.createElement("span");
  label.textContent = labelText;
  tile.append(label);
  $(containerId).append(tile);
  return tile;
}

function setTileStream(tile, stream, local) {
  const video = tile.querySelector("video");
  video.muted = local;
  video.srcObject = stream;
  bindTileMediaEvents(tile, stream, local);
  video.play().catch(() => {});
  updateTileVisual(tile, stream, local);
}

function refreshLocalTiles() {
  if (!peer?.id || !localStream) return;
  const privateTile = $(safeTileId("private-", peer.id));
  const groupTile = $(safeTileId("tile-", peer.id));
  if (privateTile) updateTileVisual(privateTile, localStream, true);
  if (groupTile) updateTileVisual(groupTile, localStream, true);
}

function addPrivateTile(id, stream, local = false) {
  const tile = createMediaTile("privateTiles", safeTileId("private-", id), local ? "You" : "Friend");
  setTileStream(tile, stream, local);
}
function addTile(id, stream, local) {
  const tile = createMediaTile("participantTiles", safeTileId("tile-", id), local ? "You" : "Participant");
  setTileStream(tile, stream, local);
}
function cleanupMediaTile(tile) { if (typeof tile?._cleanupMediaTile === "function") tile._cleanupMediaTile(); }
function clearMediaTiles(containerId) { const container = $(containerId); container?.querySelectorAll(".tile").forEach(cleanupMediaTile); container?.replaceChildren(); }
function removeTile(id) { const tile = $(safeTileId("tile-", id)); cleanupMediaTile(tile); tile?.remove(); }
function connectGroupPeers() { if (!room || !localStream) return; memberIds().forEach((id) => { if (id === peer.id || groupCalls.has(id)) return; const call = peer.call(id, localStream, { metadata: { kind: "group", room: room.code, video: room.video } }); wireGroupCall(call); }); }
function wireGroupCall(call) { if (groupCalls.has(call.peer)) { call.close(); return; } groupCalls.set(call.peer, call); call.on("stream", (stream) => addTile(call.peer, stream, false)); call.on("close", () => { groupCalls.delete(call.peer); removeTile(call.peer); }); call.on("error", () => { groupCalls.delete(call.peer); removeTile(call.peer); }); }
function offerGroupAnswer() {
  $("groupCallStatus").textContent = "A group " + (room.video ? "video" : "audio") + " call is active.";
  hide("startVideoBtn");
  hide("startAudioBtn");
  show("answerGroupBtn");
}
async function startGroupCall(video) {
  if (!room) return;
  if (privateCall) return status("End the private call before starting a group call.");
  const stream = await getMedia(video); if (!stream) return;
  room.callActive = true;
  room.video = video;
  inGroupCall = true;
  addTile(peer.id, stream, true);
  hide("startVideoBtn");
  hide("startAudioBtn");
  hide("answerGroupBtn");
  show("groupCallControls");
  show("endGroupBtn");
  updateMediaControls();
  $("groupCallStatus").textContent = "Calling everyone in the room…";
  if (room.creator) { broadcast({ type: "call-state", active: true, video, starter: peer.id }); } else sendHost({ type: "start-call", video });
  connectGroupPeers();
}
async function answerGroupCall() {
  if (pendingGroupCalls.length) return answerIncomingGroup();
  if (!room?.callActive) return;
  if (privateCall) return status("End the private call before joining a group call.");
  const stream = await getMedia(room.video); if (!stream) return;
  inGroupCall = true;
  addTile(peer.id, stream, true);
  hide("answerGroupBtn");
  hide("startVideoBtn");
  hide("startAudioBtn");
  show("groupCallControls");
  show("endGroupBtn");
  updateMediaControls();
  $("groupCallStatus").textContent = "Connected to group call.";
  connectGroupPeers();
}
function finishGroupCall(resetState = true) {
  closePendingGroupCalls();
  groupCalls.forEach((call) => call.close());
  groupCalls.clear();
  inGroupCall = false;
  clearMediaTiles("participantTiles");
  if (!privateCall) stopMedia();
  if (resetState && room) room.callActive = false;
  hide("groupCallControls");
  hide("endGroupBtn");
  hide("answerGroupBtn");
  show("startVideoBtn");
  show("startAudioBtn");
  $("groupCallStatus").textContent = "No group call is active.";
}
function endGroupCall(notify) { if (notify && room) { if (room.creator) { room.callActive = false; broadcast({ type: "call-state", active: false }); } else sendHost({ type: "end-call" }); } finishGroupCall(true); }


function initPeer() {
  peer = new Peer(); peer.on("open", (id) => { myIdEl.textContent = id; status("Ready. Choose Call a Friend or Join a Room."); reconnectAttempts = 0; });
  peer.on("error", (error) => { console.error(error); status("Connection error: " + (error.type || "unknown") + "."); });
  peer.on("disconnected", () => {
    // Peer lost its connection to the signaling server (not a call/data failure).
    // Try to reconnect with a short backoff instead of leaving the app dead in the water.
    status("Disconnected from the signaling server — reconnecting…");
    reconnectAttempts += 1;
    const delay = Math.min(10000, 1000 * reconnectAttempts);
    setTimeout(() => { if (peer && !peer.destroyed && peer.disconnected) peer.reconnect(); }, delay);
  });
  peer.on("connection", (connection) => { privateConnection?.close(); privateConnection = connection; wirePrivateConnection(connection); });
  peer.on("call", (call) => {
    if (call.metadata?.kind === "group") {
      if (!room || call.metadata.room !== room.code) return call.close();
      room.callActive = true;
      room.video = Boolean(call.metadata.video);
      if (inGroupCall && localStream) {
        if (groupCalls.has(call.peer)) return call.close();
        wireGroupCall(call);
        call.answer(localStream);
        return;
      }
      if (pendingGroupCalls.some((pending) => pending.peer === call.peer)) return call.close();
      pendingGroupCalls.push(call);
      showIncomingGroupCall(room.video);
      return;
    }
    if (privateCall || pendingPrivate) return call.close(); pendingPrivate = call; show("privateIncoming"); status("Incoming private call.");
  });
}
async function answerIncomingGroup() {
  if (privateCall) return status("End the private call before joining a group call.");
  const calls = pendingGroupCalls.splice(0);
  hide("incomingModal");
  if (!calls.length) return;
  if (!room) { calls.forEach((call) => call.close()); return; }
  const matchingCalls = calls.filter((call) => call.metadata?.room === room.code);
  calls.forEach((call) => { if (!matchingCalls.includes(call)) call.close(); });
  if (!matchingCalls.length) return;
  room.callActive = true; room.video = Boolean(matchingCalls[0].metadata?.video);
  const stream = await getMedia(room.video); if (!stream) { matchingCalls.forEach((call) => call.close()); return; }
  inGroupCall = true;
  addTile(peer.id, stream, true); hide("answerGroupBtn"); hide("startVideoBtn"); hide("startAudioBtn"); show("groupCallControls"); show("endGroupBtn"); updateMediaControls(); $("groupCallStatus").textContent = "Connected to group call.";
  matchingCalls.forEach((call) => { wireGroupCall(call); call.answer(stream); });
  // Connect only to room members that did not already invite us.
  connectGroupPeers();
}

$("friendChoice").onclick = () => view("friendView"); $("roomChoice").onclick = () => view("roomView"); document.querySelectorAll(".back-btn").forEach((button) => button.onclick = () => { if (room) leaveRoom(false); view("homeView"); });
$("copyBtn").onclick = () => copyText(peer?.id || "", $("copyBtn")); $("callBtn").onclick = () => startPrivateCall(true); $("audioCallBtn").onclick = () => startPrivateCall(false); $("answerPrivateBtn").onclick = answerPrivate; $("privateHangupBtn").onclick = endPrivateCall;
$("privateMuteBtn").onclick = toggleMic; $("privateCameraBtn").onclick = toggleCamera; $("groupMuteBtn").onclick = toggleMic; $("groupCameraBtn").onclick = toggleCamera;
$("privateChatForm").onsubmit = async (event) => {
  event.preventDefault();
  const text = safeText($("privateMessage").value), id = $("peerId").value.trim();
  if (!text || !id) return;
  const connection = privateChatConnection(id);
  if (!connection) return $("privateChatStatus").textContent = "Could not start chat.";
  if (!connection.open) {
    $("privateChatStatus").textContent = "Connecting to chat…";
    const connected = await waitForConnectionOpen(connection);
    if (!connected) return $("privateChatStatus").textContent = "Could not connect to chat.";
  }
  connection.send({ type: "private-chat", text });
  addMessage("privateMessages", text, true);
  $("privateMessage").value = "";
};
$("clearPrivateChat").onclick = () => clearMessages("privateMessages"); $("createRoomBtn").onclick = createRoom; $("joinRoomBtn").onclick = joinRoom; $("roomCodeInput").oninput = (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }; $("copyRoomBtn").onclick = () => copyText(room?.code || "", $("copyRoomBtn")); $("leaveRoomBtn").onclick = () => leaveRoom(true);
$("startVideoBtn").onclick = () => startGroupCall(true); $("startAudioBtn").onclick = () => startGroupCall(false); $("answerGroupBtn").onclick = answerGroupCall; $("endGroupBtn").onclick = () => endGroupCall(true);
$("roomChatForm").onsubmit = (event) => {
  event.preventDefault();
  const text = safeText($("roomMessage").value);
  if (!text || !room) return;
  if (room.creator) {
    broadcast({ type: "room-chat", text, sender: peer.id });
    roomMessage(text, peer.id);
  } else {
    if (!room.hostConnection?.open) return status("Not connected to the room.");
    sendHost({ type: "room-chat", text });
  }
  $("roomMessage").value = "";
};
$("clearRoomChat").onclick = () => clearMessages("roomMessages"); $("modalAnswerBtn").onclick = answerIncomingGroup; $("modalDeclineBtn").onclick = closePendingGroupCalls;
window.addEventListener("beforeunload", () => { if (room?.creator) room.hostPeer?.destroy(); stopMedia(); });

async function handlePrivateFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  const id = $("peerId").value.trim(); if (!id) { status("Enter a friend's ID first."); input.value = ""; return; }
  const connection = privateChatConnection(id);
  if (!connection) { status("Could not connect for file transfer."); input.value = ""; return; }
  if (!connection.open) {
    $("privateChatStatus").textContent = "Connecting for file transfer…";
    const connected = await waitForConnectionOpen(connection);
    if (!connected) { status("Could not connect for file transfer."); input.value = ""; return; }
  }
  await sendFile({
    file, containerId: "privateMessages", mine: true, senderLabel: "You",
    sendFn: (payload) => connection.send(payload),
    getConnections: () => [connection],
  });
  input.value = "";
}
function openRoomMemberConnections() { return room?.creator ? [...room.members.values()].filter((connection) => connection.open) : []; }
async function handleRoomFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  if (!room) { status("Not in a room."); input.value = ""; return; }
  if (room.creator) {
    if (!openRoomMemberConnections().length) { status("No other room participants are connected yet."); input.value = ""; return; }
    await sendFile({
      file, containerId: "roomMessages", mine: true, senderLabel: "You",
      sendFn: (payload) => {
        const targets = openRoomMemberConnections();
        if (!targets.length) throw new Error("No open room connections.");
        targets.forEach((connection) => connection.send(payload));
      },
      getConnections: openRoomMemberConnections,
    });
  } else {
    if (!room.hostConnection?.open) { status("Not connected to the room."); input.value = ""; return; }
    await sendFile({
      file, containerId: "roomMessages", mine: true, senderLabel: "You",
      sendFn: (payload) => room.hostConnection.send(payload),
      getConnections: () => [room.hostConnection],
    });
  }
  input.value = "";
}
initPeer();
