/* Static PeerJS calling app. Room membership is coordinated by the creator's
   temporary PeerJS ID; media and messages still travel peer-to-peer. */
const $ = (id) => document.getElementById(id);
const statusEl = $("status"), myIdEl = $("myId");
let peer, localStream = null, privateCall = null, pendingPrivate = null;
let privateConnection = null, room = null, pendingGroupCalls = [], groupCalls = new Map();
let reconnectAttempts = 0;

function status(text) { statusEl.textContent = text; }
function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }
function view(name) { ["homeView", "friendView", "roomView"].forEach((id) => $(id).classList.toggle("hidden", id !== name)); }
function safeText(value) { return typeof value === "string" ? value.trim().slice(0, 1000) : ""; }
function stopMedia() { if (localStream) localStream.getTracks().forEach((track) => track.stop()); localStream = null; }

// Deliberately called only from Call/Answer buttons: opening the site never asks for media.
async function getMedia(video) {
  if (localStream && (!video || localStream.getVideoTracks().length)) return localStream;
  if (!navigator.mediaDevices?.getUserMedia) { status("Camera/microphone access is unsupported in this browser."); return null; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: { ideal: "user" } } : false });
    if (localStream) stopMedia();
    localStream = stream;
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
function copyText(text, button) { navigator.clipboard?.writeText(text).then(() => { const old = button.textContent; button.textContent = "Copied"; setTimeout(() => { button.textContent = old; }, 1000); }).catch(() => status("Could not copy to clipboard.")); }

// File sharing (direct binary over PeerJS data channels, chunked, with progress,
// backpressure, size limits and SHA-256 integrity verification).
const FILE_CHUNK_SIZE = 32 * 1024;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const BUFFERED_AMOUNT_HIGH = 2 * 1024 * 1024; // pause sending once a data channel has this much queued
const INCOMING_FILE_TIMEOUT_MS = 5 * 60 * 1000; // Abandon unfinished transfers after ~5 minutes.
const incomingFiles = new Map(); // fileId -> { name, mime, size, totalChunks, hash, sender, chunks, timeoutId }
const fileMessageEls = new Map(); // fileId -> { item, body, progressWrap, progressBar, statusEl, fileName, link }

function fileTransferId() { return Date.now() + "-" + Math.random().toString(36).slice(2, 8); }

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
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
  const container = $(containerId), empty = container.querySelector(".empty"); if (empty) empty.remove();
  const item = document.createElement("article"); item.className = "message file-message " + (mine ? "mine" : "theirs");
  const body = document.createElement("div"); body.className = "file-body";
  const nameRow = document.createElement("div"); nameRow.className = "file-name-row";
  const nameEl = document.createElement("span"); nameEl.className = "file-name"; nameEl.textContent = "📎 " + safeText(fileName);
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
  const { fileId, name, mime, size, totalChunks, hash, sender } = data;
  if (incomingFiles.has(fileId)) return;
  const timeoutId = setTimeout(() => {
    incomingFiles.delete(fileId);
    finalizeFileMessage(fileId, { ok: false, error: "File transfer timed out." });
  }, INCOMING_FILE_TIMEOUT_MS);
  incomingFiles.set(fileId, { name, mime, size, totalChunks: Math.max(1, totalChunks || 1), hash, sender, chunks: new Map(), timeoutId });
  createFileMessage(containerId, { fileId, fileName: name, mine: false, senderLabel: sender || "Participant", sizeBytes: size });
}

async function assembleIncomingFile(fileId, fd, containerId) {
  const chunks = []; for (let i = 0; i < fd.totalChunks; i++) chunks.push(fd.chunks.get(i) || new ArrayBuffer(0));
  const blob = new Blob(chunks, { type: fd.mime || "application/octet-stream" });
  if (fd.hash && crypto?.subtle?.digest) {
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
  fd.chunks.set(data.index, data.chunk);
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
  if (file.size > MAX_FILE_SIZE) { status("File is too large (max " + formatFileSize(MAX_FILE_SIZE) + ")."); return; }
  const fileId = fileTransferId();
  const localUrl = URL.createObjectURL(file);
  createFileMessage(containerId, { fileId, fileName: file.name, mine, senderLabel, sizeBytes: file.size, url: localUrl });
  try {
    const buffer = await file.arrayBuffer();
    let hash = null;
    if (crypto?.subtle?.digest) { try { hash = await sha256Hex(buffer); } catch (e) { console.error("Hashing error:", e); } }
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
function privateChatConnection(remoteId) {
  if (!peer?.open || !remoteId || remoteId === peer.id) return null;
  if (privateConnection?.open && privateConnection.peer === remoteId) return privateConnection;
  if (privateConnection) privateConnection.close();
  privateConnection = peer.connect(remoteId, { reliable: true }); wirePrivateConnection(privateConnection); return privateConnection;
}
function endPrivateCall() { const call = privateCall; privateCall = null; if (call) call.close(); $("privateTiles").replaceChildren(); if (!groupCalls.size) stopMedia(); hide("privateHangupBtn"); show("callBtn"); show("audioCallBtn"); status("Private call ended."); }
function wirePrivateCall(call) {
  privateCall = call; hide("callBtn"); hide("audioCallBtn"); show("privateHangupBtn");
  call.on("stream", (stream) => addPrivateTile(call.peer, stream));
  call.on("close", () => { $("privateTiles").replaceChildren(); if (privateCall === call) endPrivateCall(); });
  call.on("error", () => endPrivateCall());
}
async function startPrivateCall(video = true) {
  const remoteId = $("peerId").value.trim(); if (!remoteId) return status("Enter a friend's ID first."); if (remoteId === peer?.id) return status("You cannot call your own ID.");
  const stream = await getMedia(video); if (!stream) return; if (video) addPrivateTile(peer.id, stream, true); privateChatConnection(remoteId); status("Calling " + remoteId + "…"); wirePrivateCall(peer.call(remoteId, stream, { metadata: { kind: "private", video } }));
}
async function answerPrivate() { if (!pendingPrivate) return; const stream = await getMedia(Boolean(pendingPrivate.metadata?.video !== false)); if (!stream) return; addPrivateTile(peer.id, stream, true); const call = pendingPrivate; pendingPrivate = null; hide("privateIncoming"); call.answer(stream); wirePrivateCall(call); }

function randomCode() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const values = crypto.getRandomValues(new Uint32Array(6)); return Array.from(values, (v) => chars[v % chars.length]).join(""); }
function roomHostId(code) { return "call-room-" + code; }
function memberIds() { return room?.creator ? [...room.members.keys()] : (room?.roster || []).filter((id) => id !== peer.id); }
function allRoomIds() { return room?.creator ? [peer.id, ...room.members.keys()] : [peer.id, ...(room?.roster || []).filter((id) => id !== peer.id)]; }
function sendHost(data) { if (room?.hostConnection?.open) room.hostConnection.send(data); }
function broadcast(data) { if (!room?.creator) return; room.members.forEach((connection) => { if (connection.open) connection.send(data); }); }
function updateRoomUI() { if (!room) return; $("roomCode").textContent = room.code; $("participantCount").textContent = allRoomIds().length + " participant" + (allRoomIds().length === 1 ? "" : "s") + " online"; }
function announceRoster() { const roster = allRoomIds(); broadcast({ type: "roster", roster, active: room.callActive, video: room.video }); updateRoomUI(); }
function roomMessage(text, sender) { addMessage("roomMessages", text, sender === peer.id, sender === peer.id ? "You" : "Participant"); }
function handleRoomData(data, connection) {
  if (!data || typeof data.type !== "string") return;
  if (room?.creator) {
    if (data.type === "join" && data.peerId === connection.peer) { room.members.set(connection.peer, connection); connection.send({ type: "welcome", code: room.code, roster: allRoomIds(), active: room.callActive, video: room.video }); announceRoster(); if (room.callActive && localStream) connectGroupPeers(); status("Room active — share the code."); }
    if (data.type === "leave") { room.members.delete(connection.peer); announceRoster(); }
    if (data.type === "room-chat") { const text = safeText(data.text); if (text) { broadcast({ type: "room-chat", text, sender: connection.peer }); roomMessage(text, connection.peer); } }
    if (data.type === "start-call") { room.callActive = true; room.video = Boolean(data.video); broadcast({ type: "call-state", active: true, video: room.video, starter: connection.peer }); }
    if (data.type === "end-call") endGroupCall(true);
    if (data.type === "file-start" || data.type === "file-chunk") {
      // Relay to every other member (never back to the sender) and also assemble
      // it locally so the creator's own chat sees files sent by participants.
      room.members.forEach((conn) => { if (conn.open && conn.peer !== data.sender) conn.send(data); });
      if (data.type === "file-start") handleFileStart(data, "roomMessages"); else handleFileChunk(data, "roomMessages");
      return;
    }
    return;
  }
  if (data.type === "welcome" || data.type === "roster") { room.roster = data.roster || []; room.callActive = Boolean(data.active); room.video = Boolean(data.video); updateRoomUI(); if (room.callActive) offerGroupAnswer(); }
  if (data.type === "room-chat") { const text = safeText(data.text); if (text) roomMessage(text, data.sender); }
  if (data.type === "call-state") { room.callActive = Boolean(data.active); room.video = Boolean(data.video); if (room.callActive) offerGroupAnswer(); else finishGroupCall(false); }
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
  const code = $("roomCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g, ""); if (!/^[A-Z0-9]{6}$/.test(code)) return status("Enter a valid 6-character room code."); if (!peer?.open) return status("Still connecting — please try again.");
  room = { code, creator: false, hostConnection: peer.connect(roomHostId(code), { reliable: true }), roster: [], callActive: false, video: true };
  room.hostConnection.on("open", () => { room.hostConnection.send({ type: "join", peerId: peer.id }); hide("roomLobby"); show("roomActive"); show("leaveRoomBtn"); status("Joining room " + code + "…"); });
  room.hostConnection.on("error", () => { status("Room not found or creator is offline."); leaveRoom(false); }); wireHostConnection(room.hostConnection);
}
function leaveRoom(changeView = true) {
  if (!room) return; if (room.creator) { broadcast({ type: "room-closed" }); room.hostPeer?.destroy(); } else sendHost({ type: "leave" });
  finishGroupCall(false); room.hostConnection?.close(); room = null; hide("roomActive"); hide("leaveRoomBtn"); show("roomLobby"); clearMessages("roomMessages"); if (changeView) { view("homeView"); status("You left the room."); }
}
function addPrivateTile(id, stream, local = false) {
  const tileId = "private-" + id.replace(/[^a-z0-9_-]/gi, "_"); let tile = $(tileId);
  if (!tile) { tile = document.createElement("div"); tile.id = tileId; tile.className = "tile"; const video = document.createElement("video"); video.autoplay = true; video.playsInline = true; video.muted = local; tile.append(video); const label = document.createElement("span"); label.textContent = local ? "You" : "Friend"; tile.append(label); $("privateTiles").append(tile); }
  const video = tile.querySelector("video"); video.srcObject = stream; video.play().catch(() => {});
}
function addTile(id, stream, local) {
  const tileId = "tile-" + id.replace(/[^a-z0-9_-]/gi, "_"); let tile = $(tileId); if (!tile) { tile = document.createElement("div"); tile.id = tileId; tile.className = "tile"; const video = document.createElement("video"); video.autoplay = true; video.playsInline = true; video.muted = local; tile.append(video); const label = document.createElement("span"); label.textContent = local ? "You" : "Participant"; tile.append(label); $("participantTiles").append(tile); } const video = tile.querySelector("video"); video.srcObject = stream; video.play().catch(() => {}); }
function removeTile(id) { $("tile-" + id.replace(/[^a-z0-9_-]/gi, "_"))?.remove(); }
function connectGroupPeers() { if (!room || !localStream) return; memberIds().forEach((id) => { if (id === peer.id || groupCalls.has(id)) return; const call = peer.call(id, localStream, { metadata: { kind: "group", room: room.code, video: room.video } }); wireGroupCall(call); }); }
function wireGroupCall(call) { if (groupCalls.has(call.peer)) { call.close(); return; } groupCalls.set(call.peer, call); call.on("stream", (stream) => addTile(call.peer, stream, false)); call.on("close", () => { groupCalls.delete(call.peer); removeTile(call.peer); }); call.on("error", () => { groupCalls.delete(call.peer); removeTile(call.peer); }); }
function offerGroupAnswer() { $("groupCallStatus").textContent = "A group " + (room.video ? "video" : "audio") + " call is active."; show("answerGroupBtn"); }
async function startGroupCall(video) { if (!room) return; const stream = await getMedia(video); if (!stream) return; room.callActive = true; room.video = video; addTile(peer.id, stream, true); hide("startVideoBtn"); hide("startAudioBtn"); hide("answerGroupBtn"); show("endGroupBtn"); $("groupCallStatus").textContent = "Calling everyone in the room…"; if (room.creator) { broadcast({ type: "call-state", active: true, video, starter: peer.id }); } else sendHost({ type: "start-call", video }); connectGroupPeers(); }
async function answerGroupCall() { if (!room?.callActive) return; const stream = await getMedia(room.video); if (!stream) return; addTile(peer.id, stream, true); hide("answerGroupBtn"); hide("startVideoBtn"); hide("startAudioBtn"); show("endGroupBtn"); $("groupCallStatus").textContent = "Connected to group call."; connectGroupPeers(); }
function finishGroupCall(resetState = true) { groupCalls.forEach((call) => call.close()); groupCalls.clear(); $("participantTiles").replaceChildren(); if (!privateCall) stopMedia(); if (resetState && room) room.callActive = false; hide("endGroupBtn"); hide("answerGroupBtn"); show("startVideoBtn"); show("startAudioBtn"); $("groupCallStatus").textContent = "No group call is active."; }
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
    if (call.metadata?.kind === "group") { if (!room || call.metadata.room !== room.code) return call.close(); pendingGroupCalls.push(call); show("incomingModal"); $("incomingText").textContent = "A participant is inviting you to the group " + (call.metadata.video ? "video" : "audio") + " call."; return; }
    if (privateCall || pendingPrivate) return call.close(); pendingPrivate = call; show("privateIncoming"); status("Incoming private call.");
  });
}
async function answerIncomingGroup() {
  const calls = pendingGroupCalls.splice(0); if (!calls.length) return hide("incomingModal");
  room.callActive = true; room.video = Boolean(calls[0].metadata?.video); hide("incomingModal");
  const stream = await getMedia(room.video); if (!stream) return;
  addTile(peer.id, stream, true); hide("answerGroupBtn"); hide("startVideoBtn"); hide("startAudioBtn"); show("endGroupBtn"); $("groupCallStatus").textContent = "Connected to group call.";
  calls.forEach((call) => { call.answer(stream); wireGroupCall(call); });
  // Connect only to room members that did not already invite us.
  connectGroupPeers();
}

$("friendChoice").onclick = () => view("friendView"); $("roomChoice").onclick = () => view("roomView"); document.querySelectorAll(".back-btn").forEach((button) => button.onclick = () => { if (room) leaveRoom(false); view("homeView"); });
$("copyBtn").onclick = () => copyText(peer?.id || "", $("copyBtn")); $("callBtn").onclick = () => startPrivateCall(true); $("audioCallBtn").onclick = () => startPrivateCall(false); $("answerPrivateBtn").onclick = answerPrivate; $("privateHangupBtn").onclick = endPrivateCall;
$("privateChatForm").onsubmit = (event) => { event.preventDefault(); const text = safeText($("privateMessage").value), id = $("peerId").value.trim(); if (!text || !id) return; const connection = privateChatConnection(id); if (!connection) return $("privateChatStatus").textContent = "Could not start chat."; if (connection.open) connection.send({ type: "private-chat", text }); else connection.once("open", () => connection.send({ type: "private-chat", text })); addMessage("privateMessages", text, true); $("privateMessage").value = ""; };
$("clearPrivateChat").onclick = () => clearMessages("privateMessages"); $("createRoomBtn").onclick = createRoom; $("joinRoomBtn").onclick = joinRoom; $("roomCodeInput").oninput = (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }; $("copyRoomBtn").onclick = () => copyText(room?.code || "", $("copyRoomBtn")); $("leaveRoomBtn").onclick = () => leaveRoom(true);
$("startVideoBtn").onclick = () => startGroupCall(true); $("startAudioBtn").onclick = () => startGroupCall(false); $("answerGroupBtn").onclick = answerGroupCall; $("endGroupBtn").onclick = () => endGroupCall(true);
$("roomChatForm").onsubmit = (event) => { event.preventDefault(); const text = safeText($("roomMessage").value); if (!text || !room) return; if (room.creator) { broadcast({ type: "room-chat", text, sender: peer.id }); roomMessage(text, peer.id); } else sendHost({ type: "room-chat", text }); $("roomMessage").value = ""; }; $("clearRoomChat").onclick = () => clearMessages("roomMessages"); $("modalAnswerBtn").onclick = answerIncomingGroup; $("modalDeclineBtn").onclick = () => { pendingGroupCalls.splice(0).forEach((call) => call.close()); hide("incomingModal"); };
window.addEventListener("beforeunload", () => { if (room?.creator) room.hostPeer?.destroy(); stopMedia(); });

function handlePrivateFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  const id = $("peerId").value.trim(); if (!id) { status("Enter a friend's ID first."); input.value = ""; return; }
  const connection = privateChatConnection(id);
  if (!connection?.open) { status("Could not connect for file transfer."); input.value = ""; return; }
  sendFile({
    file, containerId: "privateMessages", mine: true, senderLabel: "You",
    sendFn: (payload) => { try { connection.send(payload); } catch (e) { console.error("File send error:", e); } },
    getConnections: () => [connection],
  });
  input.value = "";
}
function handleRoomFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  if (!room) { status("Not in a room."); input.value = ""; return; }
  if (room.creator) {
    sendFile({
      file, containerId: "roomMessages", mine: true, senderLabel: "You",
      sendFn: (payload) => broadcast(payload),
      getConnections: () => [...room.members.values()],
    });
  } else {
    if (!room.hostConnection?.open) { status("Not connected to the room."); input.value = ""; return; }
    sendFile({
      file, containerId: "roomMessages", mine: true, senderLabel: "You",
      sendFn: (payload) => { try { room.hostConnection.send(payload); } catch (e) { console.error("File send error:", e); } },
      getConnections: () => [room.hostConnection],
    });
  }
  input.value = "";
}
initPeer();
