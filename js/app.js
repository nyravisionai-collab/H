/* Static PeerJS calling app. Room membership is coordinated by the creator's
   temporary PeerJS ID; media and messages still travel peer-to-peer. */
const $ = (id) => document.getElementById(id);
const statusEl = $("status"), myIdEl = $("myId");
let peer, localStream = null, privateCall = null, pendingPrivate = null;
let privateConnection = null, room = null, pendingGroupCalls = [], groupCalls = new Map();

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

// File sharing (direct binary over PeerJS data channels with chunking)
const FILE_CHUNK_SIZE = 32 * 1024;
const incomingFiles = new Map();

function fileTransferId() { return Date.now() + "-" + Math.random().toString(36).slice(2, 8); }

function addFileLinkMessage(containerId, fileName, mine, sender = "", url = null) {
  const container = $(containerId), empty = container.querySelector(".empty"); if (empty) empty.remove();
  const item = document.createElement("article"); item.className = "message " + (mine ? "mine" : "theirs");
  const body = document.createElement("div");
  const link = document.createElement("a"); link.href = url || "#"; link.textContent = "📎 " + safeText(fileName); link.style.color = "var(--primary)"; link.style.textDecoration = "underline"; link.download = fileName || "file"; body.append(link);
  item.append(body);
  const meta = document.createElement("small"); meta.textContent = sender || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); item.append(meta);
  container.append(item); container.scrollTop = container.scrollHeight;
}

function handleFileChunk(data, containerId) {
  if (!data || data.type !== "file-chunk") return;
  const { fileId, name, mime, index, totalChunks, chunk, sender } = data;
  if (!incomingFiles.has(fileId)) incomingFiles.set(fileId, { name, mime, chunks: new Map(), totalChunks, sender });
  const fd = incomingFiles.get(fileId);
  fd.chunks.set(index, chunk);
  if (fd.chunks.size >= fd.totalChunks) {
    const chunks = []; for (let i = 0; i < fd.totalChunks; i++) chunks.push(fd.chunks.get(i));
    const blob = new Blob(chunks, { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    addFileLinkMessage(containerId, fd.name, false, fd.sender || "Participant", url);
    incomingFiles.delete(fileId);
  }
}

function sendFileViaConnection(connection, file, containerId, mine = false, senderLabel = "") {
  if (!connection?.open) return status("Connection is not open — cannot send file.");
  const id = fileTransferId();
  const url = URL.createObjectURL(file);
  addFileLinkMessage(containerId, file.name, mine, senderLabel || (mine ? "You" : "Participant"), url);
  const reader = new FileReader();
  reader.onload = () => {
    const buffer = reader.result; const total = Math.ceil(buffer.byteLength / FILE_CHUNK_SIZE);
    for (let i = 0; i < total; i++) {
      const chunk = buffer.slice(i * FILE_CHUNK_SIZE, (i + 1) * FILE_CHUNK_SIZE);
      try { connection.send({ type: "file-chunk", fileId: id, name: file.name, mime: file.type || "application/octet-stream", index: i, totalChunks: total, chunk, sender: connection.peer || peer?.id }); } catch (e) { console.error("File chunk send error:", e); }
    }
  };
  reader.readAsArrayBuffer(file);
}
function wirePrivateConnection(connection) {
  connection.on("open", () => { privateConnection = connection; $("privateChatStatus").textContent = "Connected to " + connection.peer; });
  connection.on("data", (data) => {
    if (data?.type === "private-chat") addMessage("privateMessages", data.text, false);
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
    if (data.type === "file-chunk") { room.members.forEach((conn) => { if (conn.open && conn.peer !== connection.peer) conn.send(data); }); return; }
    return;
  }
  if (data.type === "welcome" || data.type === "roster") { room.roster = data.roster || []; room.callActive = Boolean(data.active); room.video = Boolean(data.video); updateRoomUI(); if (room.callActive) offerGroupAnswer(); }
  if (data.type === "room-chat") { const text = safeText(data.text); if (text) roomMessage(text, data.sender); }
  if (data.type === "call-state") { room.callActive = Boolean(data.active); room.video = Boolean(data.video); if (room.callActive) offerGroupAnswer(); else finishGroupCall(false); }
  if (data.type === "file-chunk") {
    if (room?.creator) { broadcast(data); }
    else { handleFileChunk(data, "roomMessages"); }
    return;
  }
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
  peer = new Peer(); peer.on("open", (id) => { myIdEl.textContent = id; status("Ready. Choose Call a Friend or Join a Room."); });
  peer.on("error", (error) => { console.error(error); status("Connection error: " + (error.type || "unknown") + "."); });
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
$("privateChatForm").onsubmit = (event) => { event.preventDefault(); const text = safeText($("privateMessage").value), id = $("peerId").value.trim(); if (!text || !id) return; const connection = privateChatConnection(id); if (!connection) return $("privateChatStatus").textContent = "Could not start chat."; connection.on("open", () => connection.send({ type: "private-chat", text })); if (connection.open) connection.send({ type: "private-chat", text }); addMessage("privateMessages", text, true); $("privateMessage").value = ""; };
$("clearPrivateChat").onclick = () => clearMessages("privateMessages"); $("createRoomBtn").onclick = createRoom; $("joinRoomBtn").onclick = joinRoom; $("roomCodeInput").oninput = (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }; $("copyRoomBtn").onclick = () => copyText(room?.code || "", $("copyRoomBtn")); $("leaveRoomBtn").onclick = () => leaveRoom(true);
$("startVideoBtn").onclick = () => startGroupCall(true); $("startAudioBtn").onclick = () => startGroupCall(false); $("answerGroupBtn").onclick = answerGroupCall; $("endGroupBtn").onclick = () => endGroupCall(true);
$("roomChatForm").onsubmit = (event) => { event.preventDefault(); const text = safeText($("roomMessage").value); if (!text || !room) return; if (room.creator) { broadcast({ type: "room-chat", text, sender: peer.id }); roomMessage(text, peer.id); } else sendHost({ type: "room-chat", text }); $("roomMessage").value = ""; }; $("clearRoomChat").onclick = () => clearMessages("roomMessages"); $("modalAnswerBtn").onclick = answerIncomingGroup; $("modalDeclineBtn").onclick = () => { pendingGroupCalls.splice(0).forEach((call) => call.close()); hide("incomingModal"); };
window.addEventListener("beforeunload", () => { if (room?.creator) room.hostPeer?.destroy(); stopMedia(); });

function handlePrivateFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  const id = $("peerId").value.trim(); if (!id) return status("Enter a friend's ID first.");
  const connection = privateChatConnection(id);
  if (!connection) return status("Could not connect for file transfer.");
  sendFileViaConnection(connection, file, "privateMessages", true, "You");
  input.value = "";
}
function handleRoomFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  if (!room) return status("Not in a room.");
  if (room.creator) {
    const url = URL.createObjectURL(file);
    addFileLinkMessage("roomMessages", file.name, true, "You", url);
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result; const total = Math.ceil(buffer.byteLength / FILE_CHUNK_SIZE);
      const fileId = fileTransferId();
      for (let i = 0; i < total; i++) {
        const chunk = buffer.slice(i * FILE_CHUNK_SIZE, (i + 1) * FILE_CHUNK_SIZE);
        const chunkData = { type: "file-chunk", fileId, name: file.name, mime: file.type || "application/octet-stream", index: i, totalChunks: total, chunk, sender: peer?.id || "" };
        broadcast(chunkData);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    sendFileViaConnection(room.hostConnection, file, "roomMessages", true, "You");
  }
  input.value = "";
}
initPeer();
