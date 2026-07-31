/* Peer Call – Dating App (P2P, browser-stored profiles, PWA) */
"use strict";
const $ = (id) => document.getElementById(id);

/* ===== IndexedDB – Photo Storage ===== */
const DB_NAME = "peercall-dating-db", DB_STORE = "photos";
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE, { keyPath: "idx" }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(idx, data) { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(DB_STORE, "readwrite"); tx.objectStore(DB_STORE).put({ idx, data }); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }
async function dbGet(idx) { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(DB_STORE, "readonly"); const r = tx.objectStore(DB_STORE).get(idx); r.onsuccess = () => res(r.result?.data || null); r.onerror = () => rej(r.error); }); }
async function dbDelete(idx) { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(DB_STORE, "readwrite"); tx.objectStore(DB_STORE).delete(idx); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }
async function dbClear() { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(DB_STORE, "readwrite"); tx.objectStore(DB_STORE).clear(); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }

/* ===== Storage Keys ===== */
const SK = { PROFILE: "pc-profile", SETUP_DONE: "pc-setup-done", SENT_LIKES: "pc-sent-likes", RECEIVED_LIKES: "pc-received-likes", MATCHES: "pc-matches", CONVOS: "pc-conversations", THEME: "pc-theme", LANG: "pc-lang" };
function lsGet(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function lsRemove(key) { localStorage.removeItem(key); }

/* ===== App State ===== */
let myProfile = null, myPhotos = [], sentLikes = new Set(), receivedLikes = new Set(), matches = new Set(), conversations = {};
let onlineProfiles = new Map(), activeChatPeer = null, localStream = null, activeCall = null, pendingCall = null;
let peer = null, lobbyState = "idle", lobbyHostConn = null, lobbyMembers = new Map();
const FRIEND_LOBBY_ID = "peercall-dating-lobby-v2";
const MAX_PHOTOS = 6;
const INTERESTS = ["travel","music","movies","reading","cooking","fitness","photography","art","gaming","dancing","yoga","hiking","foodie","coffee","nature","tech","fashion","cricket","animals","languages","writing","spirituality","comedy","food"];

/* ===== i18n ===== */
const STRINGS = {
  en: { _name:"English",_native:"English", appTitle:"Peer Call", setupTitle:"Create Your Profile", setupSubtitle:"Tell people about yourself. Your data stays on this device only.", photosLabel:"Your Photos", photosHint:"Add up to 6 photos. First photo is your main display.", addPhotos:"Add", name:"Name", yourNamePh:"Your name", dateOfBirth:"Date of Birth", gender:"Gender", male:"Male", female:"Female", other:"Other", interestedIn:"Interested in", men:"Men", women:"Women", everyoneOpt:"Everyone", aboutYou:"About You", bioPh:"Write something interesting about yourself…", interests:"Interests", lookingFor:"Looking for", relationship:"Relationship", casual:"Casual", friends:"Friends", justChat:"Just Chat", optionalDetails:"Details (optional)", height:"Height (cm)", city:"City", cityPh:"Ahmedabad", education:"Education", educationPh:"Engineer", profession:"Profession", professionPh:"Developer", completeSetup:"Complete Profile", discover:"Discover", refresh:"Refresh", lookingForPeople:"Looking for people online…", noOnlinePeople:"No one online right now. Check back soon!", matches:"Matches", noMatchesYet:"No matches yet. Keep exploring!", chats:"Chats", noChatsYet:"No conversations yet. Match with someone to start chatting!", myProfile:"My Profile", editProfile:"Edit Profile", toggleTheme:"🌙 Theme", language:"🌐 Language", clearAllData:"Clear All Data", save:"Save", cancel:"Cancel", back:"← Back", itsAMatch:"It's a Match!", sendMessage:"Send Message", keepBrowsing:"Keep Browsing", incomingCall:"Incoming call", answer:"Answer", decline:"Decline", muteMic:"Mute mic", unmuteMic:"Unmute mic", turnCameraOff:"Turn camera off", turnCameraOn:"Turn camera on", hangUp:"Hang Up", typeMessage:"Type a message…", send:"Send", noMessages:"No messages yet", online:"Online", offline:"Offline", chooseLanguage:"Choose language", close:"Close", you:"You", nameRequired:"Please enter your name.", dobRequired:"Please enter your date of birth.", genderRequired:"Please select your gender.", profileSaved:"Profile saved!", setupComplete:"Profile created! Let's find your match.", likeSent:"Like sent!", matchFound:"You matched with {name}!", noOneToLike:"No one available to like right now.", cannotLikeSelf:"You can't like yourself.", clearConfirm:"This will delete your profile, matches, and all data. Are you sure?", dataCleared:"All data cleared.", installApp:"Install this app on your device!", install:"Install", pass:"Pass", viewProfile:"View Profile", connectStatus:"Connecting…", readyStatus:"Ready", ageSuffix:" yrs", noPhoto:"No photo", matchWith:"You and {name} liked each other!", chatOffline:"This person is offline right now.", fileTooBig:"File is too large (max 50MB)." },
  gu: { _name:"Gujarati",_native:"ગુજરાતી", appTitle:"પીઅર કૉલ", setupTitle:"તમારી પ્રોફાઇલ બનાવો", setupSubtitle:"તમારા વિશે જણાવો. તમારો ડેટા ફક્ત આ ડિવાઇસ પર રહેશે.", photosLabel:"તમારા ફોટા", photosHint:"6 સુધી ફોટા ઉમેરો. પહેલો ફોટો મુખ્ય ડિસ્પ્લે છે.", addPhotos:"ઉમેરો", name:"નામ", yourNamePh:"તમારું નામ", dateOfBirth:"જન્મ તારીખ", gender:"લિંગ", male:"પુરુષ", female:"સ્ત્રી", other:"અન્ય", interestedIn:"રસ છે", men:"પુરુષો", women:"સ્ત્રીઓ", everyoneOpt:"બધા", aboutYou:"તમારા વિશે", bioPh:"તમારા વિશે કંઈક રસપ્રદ લખો…", interests:"રુચિઓ", lookingFor:"શોધો છો", relationship:"સંબંધ", casual:"કૅઝ્યુઅલ", friends:"મિત્રો", justChat:"ફક્ત ચેટ", optionalDetails:"વિગતો (વૈકલ્પિક)", height:"ઊંચાઈ (cm)", city:"શહેર", cityPh:"અમદાવાદ", education:"શિક્ષણ", educationPh:"એન્જિનિયર", profession:"વ્યવસાય", professionPh:"ડેવલપર", completeSetup:"પ્રોફાઇલ પૂર્ણ કરો", discover:"શોધો", refresh:"રીફ્રેશ", lookingForPeople:"નલાઇન લોકો શોધી રહ્યા છીએ…", noOnlinePeople:"હાલ કોઈ ઑનલાઇન નથી.", matches:"મૅચ", noMatchesYet:"હજુ કોઈ મૅચ નથી.", chats:"ચેટ", noChatsYet:"હજુ કોઈ વાતચીત નથી.", myProfile:"મારી પ્રોફાઇલ", editProfile:"પ્રોફાઇલ સંપાદિત કરો", toggleTheme:"🌙 થીમ", language:"🌐 ભાષા", clearAllData:"બધો ડેટા સાફ કરો", save:"સાચવો", cancel:"રદ કરો", back:"← પાછા", itsAMatch:"મૅચ થયો!", sendMessage:"સંદેશ મોકલો", keepBrowsing:"શોધ ચાલુ રાખો", incomingCall:"આવતી કૉલ", answer:"જવાબ આપો", decline:"નકારો", muteMic:"માઇક મ્યૂટ", unmuteMic:"માઇક અનમ્યૂટ", turnCameraOff:"કૅમેરા બંધ", turnCameraOn:"કૅમેરા ચાલુ", hangUp:"કૉલ કાપો", typeMessage:"સંદેશ લખો…", send:"મોકલો", noMessages:"હજુ કોઈ સંદેશ નથી", online:"ઑનલાઇન", offline:"ઑફલાઇન", chooseLanguage:"ભાષા પસંદ કરો", close:"બંધ કરો", you:"તમે", nameRequired:"કૃપા કરીને નામ દાખલ કરો.", dobRequired:"કૃપા કરીને જન્મ તારીખ દાખલ કરો.", genderRequired:"કૃપા કરીને લિંગ પસંદ કરો.", profileSaved:"પ્રોફાઇલ સાચવાઈ!", setupComplete:"પ્રોફાઇલ બની ગઈ!", likeSent:"લાઈક મોકલાઈ!", matchFound:"{name} સાથે મૅચ થયો!", noOneToLike:"લાઈક કરવા કોઈ નથી.", cannotLikeSelf:"જાતને લાઈક ન કરી શકો.", clearConfirm:"બધો ડેટા ડિલીટ થશે. ખાતરી?", dataCleared:"બધો ડેટા સાફ થયો.", installApp:"આ એપ ઇન્સ્ટોલ કરો!", install:"ઇન્સ્ટોલ", pass:"પાસ", viewProfile:"પ્રોફાઇલ જુઓ", connectStatus:"કનેક્ટ થઈ રહ્યું છે…", readyStatus:"તૈયાર", ageSuffix:" વર્ષ", noPhoto:"ફોટો નથી", matchWith:"તમે અને {name} એ એકબીજાને લાઈક કર્યા!", chatOffline:"આ વ્યક્તિ ઑફલાઇન છે.", fileTooBig:"ફાઇલ ખૂબ મોટી છે (50MB)." }
};
let currentLang = lsGet(SK.LANG, "en");
function t(key, params) { let str = STRINGS[currentLang]?.[key] || STRINGS.en[key] || key; if (params) Object.keys(params).forEach(k => { str = str.replace(`{${k}}`, params[k]); }); return str; }
function applyI18n() { document.querySelectorAll("[data-i18n]").forEach(el => { const key = el.getAttribute("data-i18n"); const val = t(key); if (val) el.textContent = val; }); document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { const key = el.getAttribute("data-i18n-placeholder"); const val = t(key); if (val) el.placeholder = val; }); }

/* ===== Utilities ===== */
function safeText(s) { const d = document.createElement("div"); d.textContent = s || ""; return d.textContent; }
function show(id) { $(id)?.classList.remove("hidden"); }
function hide(id) { $(id)?.classList.add("hidden"); }
function calcAge(dob) { if (!dob) return 0; const d = new Date(dob), n = new Date(); let age = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) age--; return age; }
function timeAgo(ts) { if (!ts) return ""; const diff = Date.now() - ts; if (diff < 60000) return "now"; if (diff < 3600000) return Math.floor(diff/60000)+"m"; if (diff < 86400000) return Math.floor(diff/3600000)+"h"; return Math.floor(diff/86400000)+"d"; }

/* ===== Theme ===== */
function applyTheme() { document.body.setAttribute("data-theme", lsGet(SK.THEME, "dark")); }
function toggleTheme() { const cur = document.body.getAttribute("data-theme"); const next = cur === "dark" ? "light" : "dark"; document.body.setAttribute("data-theme", next); lsSet(SK.THEME, next); }

/* ===== Profile Management ===== */
function loadLocalProfile() { myProfile = lsGet(SK.PROFILE, null); myPhotos = []; sentLikes = new Set(lsGet(SK.SENT_LIKES, [])); receivedLikes = new Set(lsGet(SK.RECEIVED_LIKES, [])); matches = new Set(lsGet(SK.MATCHES, [])); conversations = lsGet(SK.CONVOS, {}); }
async function loadPhotosFromDB() { myPhotos = []; for (let i = 0; i < MAX_PHOTOS; i++) { const data = await dbGet(i); myPhotos.push(data || null); } }
async function saveProfileToStorage() { lsSet(SK.PROFILE, myProfile); lsSet(SK.SETUP_DONE, true); lsSet(SK.SENT_LIKES, [...sentLikes]); lsSet(SK.RECEIVED_LIKES, [...receivedLikes]); lsSet(SK.MATCHES, [...matches]); lsSet(SK.CONVOS, conversations); }
async function savePhotoToSlot(index, dataUrl) { await dbPut(index, dataUrl); myPhotos[index] = dataUrl; }
function getProfileSummary() { if (!myProfile) return null; return { name:myProfile.name, age:calcAge(myProfile.dob), gender:myProfile.gender, interestedIn:myProfile.interestedIn, bio:myProfile.bio||"", photo:myPhotos[0]||null, photos:myPhotos.filter(Boolean), interests:myProfile.interests||[], city:myProfile.city||"", lookingFor:myProfile.lookingFor||"", education:myProfile.education||"", profession:myProfile.profession||"", height:myProfile.height||0 }; }

/* ===== Setup View ===== */
let setupSelectedGender="", setupSelectedInterested="", setupSelectedLookingFor="", setupSelectedInterests = new Set(), setupPhotos = [];
function initSetupView() {
  renderInterestsGrid("interestsGrid", setupSelectedInterests);
  const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() - 18); $("setupDob").max = maxDate.toISOString().split("T")[0];
  $("genderGroup").querySelectorAll(".option-btn").forEach(btn => { btn.onclick = () => { $("genderGroup").querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); setupSelectedGender = btn.dataset.value; }; });
  $("interestedGroup").querySelectorAll(".option-btn").forEach(btn => { btn.onclick = () => { $("interestedGroup").querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); setupSelectedInterested = btn.dataset.value; }; });
  $("lookingForGroup").querySelectorAll(".option-btn").forEach(btn => { btn.onclick = () => { $("lookingForGroup").querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); setupSelectedLookingFor = btn.dataset.value; }; });
  $("photoInput").onchange = async (e) => { const files = Array.from(e.target.files||[]); for (const file of files) { if (setupPhotos.length >= MAX_PHOTOS) break; const dataUrl = await readFileAsDataURL(file); if (dataUrl) { setupPhotos.push(dataUrl); renderSetupPhotoGrid(); } } e.target.value = ""; };
  $("completeSetupBtn").onclick = completeSetup;
}
function renderSetupPhotoGrid() { const grid = $("photoGrid"); grid.innerHTML = ""; setupPhotos.forEach((photo,i) => { const slot = document.createElement("div"); slot.className = "photo-slot" + (i===0?" main-photo":""); slot.innerHTML = `<img src="${photo}"><button class="photo-remove" data-idx="${i}">×</button>`; slot.querySelector(".photo-remove").onclick = () => { setupPhotos.splice(i,1); renderSetupPhotoGrid(); }; grid.appendChild(slot); }); if (setupPhotos.length < MAX_PHOTOS) { const addBtn = document.createElement("label"); addBtn.className = "photo-add"; addBtn.innerHTML = `<input type="file" accept="image/*" class="file-input" onchange="handleSetupPhotoAdd(this)"><span class="photo-add-icon">+</span><span class="photo-add-text">${t("addPhotos")}</span>`; grid.appendChild(addBtn); } }
async function handleSetupPhotoAdd(input) { const files = Array.from(input.files||[]); for (const file of files) { if (setupPhotos.length >= MAX_PHOTOS) break; const dataUrl = await readFileAsDataURL(file); if (dataUrl) setupPhotos.push(dataUrl); } input.value = ""; renderSetupPhotoGrid(); }
function renderInterestsGrid(containerId, selectedSet) { const grid = $(containerId); grid.innerHTML = ""; INTERESTS.forEach(interest => { const tag = document.createElement("button"); tag.type = "button"; tag.className = "interest-tag" + (selectedSet.has(interest)?" selected":""); tag.textContent = interest.charAt(0).toUpperCase()+interest.slice(1); tag.onclick = () => { if (selectedSet.has(interest)) { selectedSet.delete(interest); tag.classList.remove("selected"); } else { selectedSet.add(interest); tag.classList.add("selected"); } }; grid.appendChild(tag); }); }

async function completeSetup() {
  const name = safeText($("setupName").value).trim(); const dob = $("setupDob").value;
  if (!name) return alert(t("nameRequired")); if (!dob) return alert(t("dobRequired")); if (!setupSelectedGender) return alert(t("genderRequired"));
  myProfile = { name, dob, gender:setupSelectedGender, interestedIn:setupSelectedInterested, bio:safeText($("setupBio").value).trim(), interests:[...setupSelectedInterests], lookingFor:setupSelectedLookingFor, height:parseInt($("setupHeight").value)||0, city:safeText($("setupCity").value).trim(), education:safeText($("setupEducation").value).trim(), profession:safeText($("setupProfession").value).trim() };
  myPhotos = []; for (let i = 0; i < MAX_PHOTOS; i++) { if (setupPhotos[i]) { await savePhotoToSlot(i, setupPhotos[i]); myPhotos[i] = setupPhotos[i]; } else { myPhotos[i] = null; } }
  await saveProfileToStorage(); showMainApp();
}
function readFileAsDataURL(file) { return new Promise(resolve => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const canvas = document.createElement("canvas"); const MAX = 800; let w = img.width, h = img.height; if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h*MAX/w); w = MAX; } else { w = Math.round(w*MAX/h); h = MAX; } } canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img,0,0,w,h); resolve(canvas.toDataURL("image/jpeg",0.8)); }; img.onerror = () => resolve(null); img.src = reader.result; }; reader.onerror = () => resolve(null); reader.readAsDataURL(file); }); }

/* ===== Edit Profile ===== */
let editPhotos = [], editInterests = new Set();
function openEditProfile() { editPhotos = [...myPhotos]; editInterests = new Set(myProfile.interests||[]); $("editName").value = myProfile.name||""; $("editBio").value = myProfile.bio||""; $("editCity").value = myProfile.city||""; $("editEducation").value = myProfile.education||""; $("editProfession").value = myProfile.profession||""; renderEditPhotoGrid(); renderInterestsGrid("editInterestsGrid", editInterests); view("editProfileView"); }
function renderEditPhotoGrid() { const grid = $("editPhotoGrid"); grid.innerHTML = ""; editPhotos.forEach((photo,i) => { if (!photo) return; const slot = document.createElement("div"); slot.className = "photo-slot"+(i===0?" main-photo":""); slot.innerHTML = `<img src="${photo}"><button class="photo-remove" data-idx="${i}">×</button>`; slot.querySelector(".photo-remove").onclick = async () => { editPhotos.splice(i,1); while(editPhotos.length<MAX_PHOTOS) editPhotos.push(null); editPhotos = editPhotos.filter(Boolean); while(editPhotos.length<MAX_PHOTOS) editPhotos.push(null); renderEditPhotoGrid(); }; grid.appendChild(slot); }); const photoCount = editPhotos.filter(Boolean).length; if (photoCount < MAX_PHOTOS) { const addBtn = document.createElement("label"); addBtn.className = "photo-add"; addBtn.innerHTML = `<input type="file" accept="image/*" class="file-input" onchange="handleEditPhotoAdd(this)"><span class="photo-add-icon">+</span><span class="photo-add-text">${t("addPhotos")}</span>`; grid.appendChild(addBtn); } }
async function handleEditPhotoAdd(input) { const files = Array.from(input.files||[]); for (const file of files) { const count = editPhotos.filter(Boolean).length; if (count >= MAX_PHOTOS) break; const dataUrl = await readFileAsDataURL(file); if (dataUrl) { const idx = editPhotos.findIndex(p => !p); if (idx >= 0) editPhotos[idx] = dataUrl; else editPhotos.push(dataUrl); } } input.value = ""; renderEditPhotoGrid(); }
async function saveEditProfile() { const name = safeText($("editName").value).trim(); if (!name) return alert(t("nameRequired")); myProfile.name = name; myProfile.bio = safeText($("editBio").value).trim(); myProfile.city = safeText($("editCity").value).trim(); myProfile.education = safeText($("editEducation").value).trim(); myProfile.profession = safeText($("editProfession").value).trim(); myProfile.interests = [...editInterests]; myPhotos = []; for (let i = 0; i < MAX_PHOTOS; i++) { if (editPhotos[i]) { await savePhotoToSlot(i, editPhotos[i]); myPhotos[i] = editPhotos[i]; } else { await dbDelete(i); myPhotos[i] = null; } } await saveProfileToStorage(); broadcastProfileToLobby(); renderProfileView(); view("profileView"); }

/* ===== Render Profile View ===== */
function renderProfileView() { if (!myProfile) return; const row = $("profilePhotosRow"); row.innerHTML = ""; myPhotos.filter(Boolean).forEach(photo => { const thumb = document.createElement("div"); thumb.className = "profile-thumb"; thumb.innerHTML = `<img src="${photo}">`; row.appendChild(thumb); }); const age = calcAge(myProfile.dob); $("profileDisplayName").textContent = `${myProfile.name}, ${age}`; const meta = []; if (myProfile.city) meta.push("📍 "+myProfile.city); if (myProfile.gender) meta.push(t(myProfile.gender)); if (myProfile.profession) meta.push("💼 "+myProfile.profession); $("profileDisplayMeta").textContent = meta.join(" · ")||""; $("profileDisplayBio").textContent = myProfile.bio||""; const intDiv = $("profileDisplayInterests"); intDiv.innerHTML = ""; (myProfile.interests||[]).forEach(i => { const tag = document.createElement("span"); tag.className = "interest-display-tag"; tag.textContent = i.charAt(0).toUpperCase()+i.slice(1); intDiv.appendChild(tag); }); const detDiv = $("profileDisplayDetails"); detDiv.innerHTML = ""; if (myProfile.height) detDiv.innerHTML += `<div class="detail-item"><span class="detail-icon">📏</span> ${myProfile.height} cm</div>`; if (myProfile.education) detDiv.innerHTML += `<div class="detail-item"><span class="detail-icon"></span> ${safeText(myProfile.education)}</div>`; if (myProfile.lookingFor) detDiv.innerHTML += `<div class="detail-item"><span class="detail-icon">💫</span> ${t(myProfile.lookingFor)}</div>`; }

/* ===== Navigation ===== */
function view(viewId) { ["setupView","discoverView","matchesView","chatListView","chatView","profileView","editProfileView"].forEach(id => { if (id === viewId) show(id); else hide(id); }); document.querySelectorAll(".nav-btn").forEach(btn => { btn.classList.toggle("active", btn.dataset.view === viewId); }); }
function showMainApp() { show("bottomNav"); renderProfileView(); renderMatchesView(); renderChatListView(); view("discoverView"); refreshDiscover(); }
function initNavigation() { document.querySelectorAll(".nav-btn").forEach(btn => { btn.onclick = () => { const v = btn.dataset.view; if (v==="discoverView") refreshDiscover(); if (v==="matchesView") renderMatchesView(); if (v==="chatListView") renderChatListView(); if (v==="profileView") renderProfileView(); view(v); }; }); }

/* ===== PeerJS & Lobby ===== */
function initPeer() { const peerId = "pc-dating-"+Math.random().toString(36).slice(2,10); peer = new Peer(peerId, { debug: 0 }); peer.on("open", () => { joinLobby(); }); peer.on("connection", (conn) => { conn.on("data", (data) => { if (!data?.type) return; if (data.type === "chat-msg") receiveChatMessage(data.from, data.text, data.ts); }); }); peer.on("call", (call) => { if (matches.has(call.peer) || onlineProfiles.has(call.peer)) { pendingCall = call; showIncomingCallModal(call); } else { call.close(); } }); peer.on("disconnected", () => { setTimeout(() => { try { peer.reconnect(); } catch(_){} }, 2000); }); peer.on("error", (err) => { if (err.type === "unavailable-id") setTimeout(() => joinLobby(), 1000); }); }

function joinLobby() { const testPeer = new Peer(FRIEND_LOBBY_ID, { debug: 0 }); testPeer.on("open", () => { testPeer.destroy(); becomeLobbyHost(); }); testPeer.on("error", () => { testPeer.destroy(); becomeLobbyMember(); }); }

function becomeLobbyHost() { const hostPeer = new Peer(FRIEND_LOBBY_ID, { debug: 0 }); hostPeer.on("open", () => { lobbyState = "host"; hostPeer.on("connection", (conn) => { lobbyMembers.set(conn.peer, conn); conn.on("open", () => { const roster = {}; onlineProfiles.forEach((p,id) => { if (id !== conn.peer) roster[id] = p; }); conn.send({ type:"roster", roster }); broadcastMyProfileToMember(conn); }); conn.on("data", (data) => handleLobbyMessage(data, conn)); conn.on("close", () => { lobbyMembers.delete(conn.peer); onlineProfiles.delete(conn.peer); broadcastRoster(); refreshDiscover(); }); }); }); hostPeer.on("error", () => { hostPeer.destroy(); becomeLobbyMember(); }); window.addEventListener("beforeunload", () => { try { hostPeer.destroy(); } catch(_){} }); }

function becomeLobbyMember() { lobbyState = "member"; const conn = peer.connect(FRIEND_LOBBY_ID, { reliable: true }); lobbyHostConn = conn; conn.on("open", () => { broadcastProfileToLobby(); }); conn.on("data", (data) => handleLobbyMessage(data, conn)); conn.on("close", () => { lobbyHostConn = null; setTimeout(() => { if (lobbyState==="member") becomeLobbyMember(); }, 3000); }); conn.on("error", () => { setTimeout(() => { if (lobbyState==="member") becomeLobbyMember(); }, 3000); }); }

function broadcastProfileToLobby() { const summary = getProfileSummary(); if (!summary) return; const msg = { type:"profile", profile:summary }; if (lobbyState === "host") { lobbyMembers.forEach((conn) => { if (conn.open) conn.send(msg); }); onlineProfiles.set(peer.id, summary); broadcastRoster(); } else if (lobbyHostConn?.open) { lobbyHostConn.send(msg); } }
function broadcastMyProfileToMember(conn) { const summary = getProfileSummary(); if (!summary || !conn.open) return; conn.send({ type:"profile", profile:summary }); }
function broadcastRoster() { if (lobbyState !== "host") return; const roster = {}; onlineProfiles.forEach((p,id) => { roster[id] = p; }); lobbyMembers.forEach((conn) => { if (conn.open) conn.send({ type:"roster", roster }); }); }

function handleLobbyMessage(data, conn) {
  if (!data || !data.type) return;
  switch (data.type) {
    case "profile":
      if (data.profile && conn.peer !== peer.id) { onlineProfiles.set(conn.peer, data.profile); if (lobbyState==="host") { lobbyMembers.forEach((c) => { if (c!==conn && c.open) c.send(data); }); broadcastRoster(); } refreshDiscover(); }
      break;
    case "roster":
      if (data.roster) { onlineProfiles.clear(); Object.entries(data.roster).forEach(([id,p]) => onlineProfiles.set(id,p)); const mySummary = getProfileSummary(); if (mySummary) onlineProfiles.set(peer.id, mySummary); refreshDiscover(); }
      break;
    case "like":
      if (lobbyState==="host" && data.target) { const targetConn = lobbyMembers.get(data.target); if (targetConn?.open) targetConn.send({ type:"incoming-like", from:data.from }); if (data.target===peer.id) handleIncomingLike(data.from); }
      break;
    case "incoming-like":
      handleIncomingLike(data.from);
      break;
    case "match-notification":
      handleMatchNotification(data.matchedWith);
      break;
    case "relay":
      if (lobbyState==="host" && data.target) { const targetConn = lobbyMembers.get(data.target); if (targetConn?.open) targetConn.send(data.payload); if (data.target===peer.id) handleRelayPayload(data.payload); }
      break;
    default:
      handleRelayPayload(data);
      break;
  }
}
function handleRelayPayload(data) { if (!data?.type) return; if (data.type==="chat-msg") receiveChatMessage(data.from, data.text, data.ts); }
function sendViaLobby(targetPeerId, payload) { if (lobbyState==="host") { const targetConn = lobbyMembers.get(targetPeerId); if (targetConn?.open) targetConn.send(payload); if (targetPeerId===peer.id) handleRelayPayload(payload); } else if (lobbyHostConn?.open) { lobbyHostConn.send({ type:"relay", target:targetPeerId, payload }); } }

/* ===== Discover ===== */
function refreshDiscover() {
  const container = $("discoverCards"), status = $("discoverStatus");
  const available = []; onlineProfiles.forEach((profile, peerId) => { if (peerId===peer.id) return; if (matches.has(peerId)) return; if (sentLikes.has(peerId)) return; available.push({ peerId, profile }); });
  if (available.length === 0) { container.innerHTML = `<div class="discover-empty"><p class="empty-icon">🔍</p><p>${t("noOnlinePeople")}</p></div>`; status.textContent = onlineProfiles.size > 1 ? `${onlineProfiles.size-1} online` : t("lookingForPeople"); return; }
  status.textContent = `${available.length} ${available.length===1?"person":"people"} online`; container.innerHTML = "";
  available.forEach(({ peerId, profile }) => { container.appendChild(createDiscoverCard(peerId, profile)); });
}
function createDiscoverCard(peerId, profile) {
  const card = document.createElement("div"); card.className = "discover-card"; card.dataset.peerId = peerId;
  const photos = profile.photos || (profile.photo ? [profile.photo] : []);
  let photosHTML = "";
  if (photos.length > 0) { photosHTML = `<div class="card-photo-container"><img src="${photos[0]}" alt="${safeText(profile.name)}"><div class="card-gradient"></div><div class="card-info"><h3>${safeText(profile.name)}, ${profile.age}${t("ageSuffix")}</h3>${profile.city?`<div class="card-city">📍 ${safeText(profile.city)}</div>`:""}${profile.bio?`<div class="card-bio">${safeText(profile.bio)}</div>`:""}${(profile.interests||[]).length?`<div class="card-interests">${profile.interests.slice(0,4).map(i=>`<span class="card-interest-tag">${safeText(i)}</span>`).join("")}</div>`:""}</div></div>${photos.length>1?`<div class="card-photo-dots">${photos.map((_,i)=>`<div class="card-photo-dot${i===0?" active":""}" data-idx="${i}"></div>`).join("")}</div>`:""}`; }
  else { photosHTML = `<div class="card-photo-container"><div class="no-photo-placeholder">👤</div><div class="card-gradient"></div><div class="card-info"><h3>${safeText(profile.name)}, ${profile.age}${t("ageSuffix")}</h3>${profile.city?`<div class="card-city">📍 ${safeText(profile.city)}</div>`:""}${profile.bio?`<div class="card-bio">${safeText(profile.bio)}</div>`:""}</div></div>`; }
  card.innerHTML = `${photosHTML}<div class="card-actions"><button class="card-action-btn info-btn" data-action="info">ℹ️</button><button class="card-action-btn pass-btn" data-action="pass">✗</button><button class="card-action-btn like-btn" data-action="like">❤️</button></div>`;
  if (photos.length > 1) { card.querySelectorAll(".card-photo-dot").forEach(dot => { dot.onclick = () => { const idx = parseInt(dot.dataset.idx); card.querySelector(".card-photo-container img").src = photos[idx]; card.querySelectorAll(".card-photo-dot").forEach(d => d.classList.toggle("active", d===dot)); }; }); }
  card.querySelector('[data-action="pass"]').onclick = () => { card.classList.add("swiping-left"); setTimeout(() => card.remove(), 300); };
  card.querySelector('[data-action="like"]').onclick = () => { sendLike(peerId); card.classList.add("swiping-right"); setTimeout(() => card.remove(), 300); };
  card.querySelector('[data-action="info"]').onclick = () => { showRemoteProfile(peerId, profile); };
  return card;
}

/* ===== Like/Match ===== */
function sendLike(targetPeerId) { if (targetPeerId===peer.id) return; if (sentLikes.has(targetPeerId)) return; if (matches.has(targetPeerId)) return; sentLikes.add(targetPeerId); lsSet(SK.SENT_LIKES, [...sentLikes]); if (lobbyState==="host") { const targetConn = lobbyMembers.get(targetPeerId); if (targetConn?.open) targetConn.send({ type:"incoming-like", from:peer.id }); if (targetPeerId===peer.id) handleIncomingLike(peer.id); } else if (lobbyHostConn?.open) { lobbyHostConn.send({ type:"like", from:peer.id, target:targetPeerId }); } if (receivedLikes.has(targetPeerId)) createMatch(targetPeerId); }
function handleIncomingLike(fromPeerId) { if (!fromPeerId || fromPeerId===peer.id) return; receivedLikes.add(fromPeerId); lsSet(SK.RECEIVED_LIKES, [...receivedLikes]); if (sentLikes.has(fromPeerId)) { createMatch(fromPeerId); if (lobbyState==="host") { const fromConn = lobbyMembers.get(fromPeerId); if (fromConn?.open) fromConn.send({ type:"match-notification", matchedWith:peer.id }); } else if (lobbyHostConn?.open) { lobbyHostConn.send({ type:"relay", target:fromPeerId, payload:{ type:"match-notification", matchedWith:peer.id } }); } } }
function createMatch(peerId) { if (matches.has(peerId)) return; matches.add(peerId); lsSet(SK.MATCHES, [...matches]); const profile = onlineProfiles.get(peerId); if (profile) showMatchModal(peerId, profile); refreshDiscover(); }
function handleMatchNotification(matchedPeerId) { if (!matchedPeerId || matches.has(matchedPeerId)) return; matches.add(matchedPeerId); lsSet(SK.MATCHES, [...matches]); const profile = onlineProfiles.get(matchedPeerId); if (profile) showMatchModal(matchedPeerId, profile); refreshDiscover(); }
function showMatchModal(peerId, profile) { const myPhoto = myPhotos[0]||null; const theirPhoto = profile.photo||null; $("matchMyAvatar").innerHTML = myPhoto?`<img src="${myPhoto}">`:(myProfile?.name?.charAt(0)||"👤"); $("matchTheirAvatar").innerHTML = theirPhoto?`<img src="${theirPhoto}">`:(profile.name?.charAt(0)||"👤"); $("matchText").textContent = t("matchWith",{name:profile.name}); $("matchChatBtn").onclick = () => { hide("matchModal"); openChat(peerId); }; $("matchKeepBtn").onclick = () => hide("matchModal"); show("matchModal"); }

/* ===== Matches View ===== */
function renderMatchesView() { const container = $("matchesList"); const matchedProfiles = []; matches.forEach(peerId => { const profile = onlineProfiles.get(peerId); if (profile) matchedProfiles.push({ peerId, profile }); }); if (matchedProfiles.length===0) { container.innerHTML = `<div class="discover-empty"><p class="empty-icon"></p><p>${t("noMatchesYet")}</p></div>`; container.className=""; return; } container.className = "matches-list"; container.innerHTML = ""; matchedProfiles.forEach(({ peerId, profile }) => { const item = document.createElement("div"); item.className = "match-item"; item.onclick = () => openChat(peerId); const photo = profile.photo||null; item.innerHTML = `<div class="match-photo">${photo?`<img src="${photo}">`:"👤"}</div><div class="match-name">${safeText(profile.name)}</div>`; container.appendChild(item); }); }

/* ===== Chat List ===== */
function renderChatListView() { const container = $("chatList"); const activeConvos = Object.entries(conversations).filter(([_,msgs]) => msgs.length>0); if (activeConvos.length===0) { container.innerHTML = `<div class="discover-empty"><p class="empty-icon">💬</p><p>${t("noChatsYet")}</p></div>`; container.className=""; return; } container.className = "chat-list-view"; container.innerHTML = ""; activeConvos.sort((a,b) => { const lastA = a[1][a[1].length-1]?.ts||0; const lastB = b[1][b[1].length-1]?.ts||0; return lastB-lastA; }); activeConvos.forEach(([peerId, msgs]) => { const profile = onlineProfiles.get(peerId)||{}; const lastMsg = msgs[msgs.length-1]; const item = document.createElement("div"); item.className = "chat-list-item"; item.onclick = () => openChat(peerId); const photo = profile.photo||null; item.innerHTML = `<div class="chat-avatar">${photo?`<img src="${photo}">`:"👤"}</div><div class="chat-preview"><div class="chat-preview-name">${safeText(profile.name||"User")}</div><div class="chat-preview-msg">${lastMsg?.mine?t("you")+": ":""}${safeText(lastMsg?.text||"")}</div></div><div class="chat-time">${timeAgo(lastMsg?.ts)}</div>`; container.appendChild(item); }); }

/* ===== Individual Chat ===== */
function openChat(peerId) { activeChatPeer = peerId; const profile = onlineProfiles.get(peerId)||{}; $("chatPeerName").textContent = profile.name||"User"; $("chatPeerStatus").textContent = onlineProfiles.has(peerId)?t("online"):t("offline"); const photo = profile.photo||null; $("chatPeerAvatar").innerHTML = photo?`<img src="${photo}">`:"👤"; renderChatMessages(peerId); view("chatView"); $("chatAudioCallBtn").style.display = matches.has(peerId)?"":"none"; $("chatVideoCallBtn").style.display = matches.has(peerId)?"":"none"; }
function renderChatMessages(peerId) { const container = $("chatMessages"); const msgs = conversations[peerId]||[]; if (msgs.length===0) { container.innerHTML = `<p class="empty">${t("noMessages")}</p>`; return; } container.innerHTML = ""; msgs.forEach(msg => { const div = document.createElement("div"); div.className = "message "+(msg.mine?"mine":"theirs"); div.innerHTML = `${safeText(msg.text)}<small>${new Date(msg.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</small>`; container.appendChild(div); }); container.scrollTop = container.scrollHeight; }
function sendChatMessage(text) { if (!activeChatPeer || !text) return; const msg = { text, mine:true, ts:Date.now() }; if (!conversations[activeChatPeer]) conversations[activeChatPeer]=[]; conversations[activeChatPeer].push(msg); lsSet(SK.CONVOS, conversations); sendViaLobby(activeChatPeer, { type:"chat-msg", from:peer.id, text, ts:msg.ts }); renderChatMessages(activeChatPeer); }
function receiveChatMessage(fromPeerId, text, ts) { if (!fromPeerId || !text) return; const msg = { text, mine:false, ts:ts||Date.now() }; if (!conversations[fromPeerId]) conversations[fromPeerId]=[]; conversations[fromPeerId].push(msg); lsSet(SK.CONVOS, conversations); if (activeChatPeer===fromPeerId) renderChatMessages(fromPeerId); }
function initChatForm() { $("chatForm").onsubmit = (e) => { e.preventDefault(); const input = $("chatInput"); const text = safeText(input.value).trim(); if (!text || !activeChatPeer) return; input.value=""; sendChatMessage(text); }; }

/* ===== View Remote Profile ===== */
function showRemoteProfile(peerId, profile) { const photos = profile.photos||(profile.photo?[profile.photo]:[]); const photosRow = $("remoteProfilePhotos"); photosRow.innerHTML = ""; photos.forEach(photo => { const thumb = document.createElement("div"); thumb.className = "profile-thumb"; thumb.innerHTML = `<img src="${photo}">`; photosRow.appendChild(thumb); }); $("remoteProfileName").textContent = `${profile.name}, ${profile.age}`; const meta = []; if (profile.city) meta.push(" "+profile.city); if (profile.gender) meta.push(t(profile.gender)); if (profile.profession) meta.push("💼 "+profile.profession); $("remoteProfileMeta").textContent = meta.join(" · ")||""; $("remoteProfileBio").textContent = profile.bio||""; const intDiv = $("remoteProfileInterests"); intDiv.innerHTML = ""; (profile.interests||[]).forEach(i => { const tag = document.createElement("span"); tag.className = "interest-display-tag"; tag.textContent = i.charAt(0).toUpperCase()+i.slice(1); intDiv.appendChild(tag); }); const detDiv = $("remoteProfileDetails"); detDiv.innerHTML = ""; if (profile.height) detDiv.innerHTML += `<div class="detail-item"><span class="detail-icon">📏</span> ${profile.height} cm</div>`; if (profile.education) detDiv.innerHTML += `<div class="detail-item"><span class="detail-icon">🎓</span> ${safeText(profile.education)}</div>`; if (profile.lookingFor) detDiv.innerHTML += `<div class="detail-item"><span class="detail-icon">💫</span> ${t(profile.lookingFor)}</div>`; show("viewProfileModal"); }

/* ===== Calls ===== */
async function startCall(peerId, video) { if (!matches.has(peerId)) return; try { localStream = await navigator.mediaDevices.getUserMedia({ video: video?{facingMode:"user"}:false, audio:true }); const call = peer.call(peerId, localStream, { metadata:{video} }); activeCall = call; setupCallHandlers(call, video); show("chatCallControls"); } catch(err) { console.error("Call error:",err); } }
function setupCallHandlers(call, video) { const tiles = $("chatTiles"); tiles.innerHTML = ""; const localTile = document.createElement("div"); localTile.className = "tile"+(video?"":" audio"); localTile.innerHTML = video?`<video autoplay muted playsinline></video><div class="tile-badge">${t("you")}</div>`:`<div class="audio-placeholder"><div class="audio-avatar">${(myProfile?.name||"?").charAt(0)}</div><div class="audio-title">${t("you")}</div></div>`; if (video) localTile.querySelector("video").srcObject = localStream; tiles.appendChild(localTile); call.on("stream", (remoteStream) => { const remoteTile = document.createElement("div"); remoteTile.className = "tile"+(video?"":" audio"); const profile = onlineProfiles.get(call.peer)||{}; remoteTile.innerHTML = video?`<video autoplay playsinline></video><div class="tile-badge">${safeText(profile.name||"User")}</div>`:`<div class="audio-placeholder"><div class="audio-avatar">${(profile.name||"?").charAt(0)}</div><div class="audio-title">${safeText(profile.name||"User")}</div></div>`; if (video) remoteTile.querySelector("video").srcObject = remoteStream; tiles.appendChild(remoteTile); }); call.on("close", () => endCall()); call.on("error", () => endCall()); }
function endCall() { if (activeCall) { try { activeCall.close(); } catch(_){} } activeCall = null; if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; } hide("chatCallControls"); $("chatTiles").innerHTML = ""; }
function showIncomingCallModal(call) { const profile = onlineProfiles.get(call.peer)||{}; const photo = profile.photo||null; $("incomingCallerAvatar").innerHTML = photo?`<img src="${photo}">`:"👤"; $("incomingCallerName").textContent = profile.name||"Incoming call"; show("incomingModal"); $("answerCallBtn").onclick = async () => { hide("incomingModal"); try { localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video:call.metadata?.video||false }); call.answer(localStream); activeCall = call; setupCallHandlers(call, call.metadata?.video||false); if (activeChatPeer!==call.peer) openChat(call.peer); show("chatCallControls"); } catch(err) { call.close(); } }; $("declineCallBtn").onclick = () => { hide("incomingModal"); call.close(); pendingCall = null; }; }
function toggleMic() { if (!localStream) return; const track = localStream.getAudioTracks()[0]; if (!track) return; track.enabled = !track.enabled; const btn = $("chatMuteBtn"); btn.textContent = track.enabled?t("muteMic"):t("unmuteMic"); btn.classList.toggle("active", !track.enabled); }
function toggleCamera() { if (!localStream) return; const track = localStream.getVideoTracks()[0]; if (!track) return; track.enabled = !track.enabled; const btn = $("chatCameraBtn"); btn.textContent = track.enabled?t("turnCameraOff"):t("turnCameraOn"); btn.classList.toggle("active", !track.enabled); }

/* ===== File Sharing ===== */
const MAX_FILE_SIZE = 50*1024*1024, CHUNK_SIZE = 16384;
async function handleChatFile(input) { const file = input.files?.[0]; if (!file || !activeChatPeer) { input.value=""; return; } if (file.size > MAX_FILE_SIZE) { alert(t("fileTooBig")); input.value=""; return; } const msg = { text:`📎 ${file.name}`, mine:true, ts:Date.now() }; if (!conversations[activeChatPeer]) conversations[activeChatPeer]=[]; conversations[activeChatPeer].push(msg); lsSet(SK.CONVOS, conversations); renderChatMessages(activeChatPeer); const reader = new FileReader(); reader.onload = () => { const buffer = reader.result; const totalChunks = Math.ceil(buffer.byteLength/CHUNK_SIZE); sendViaLobby(activeChatPeer, { type:"file-meta", from:peer.id, fileName:file.name, fileSize:file.size, totalChunks }); for (let i = 0; i < totalChunks; i++) { const start = i*CHUNK_SIZE, end = Math.min(start+CHUNK_SIZE, buffer.byteLength); sendViaLobby(activeChatPeer, { type:"file-chunk", from:peer.id, index:i, data:Array.from(new Uint8Array(buffer.slice(start,end))) }); } sendViaLobby(activeChatPeer, { type:"file-end", from:peer.id }); }; reader.readAsArrayBuffer(file); input.value = ""; }

/* ===== Clear Data ===== */
async function clearAllData() { if (!confirm(t("clearConfirm"))) return; Object.values(SK).forEach(k => lsRemove(k)); await dbClear(); myProfile=null; myPhotos=[]; sentLikes=new Set(); receivedLikes=new Set(); matches=new Set(); conversations={}; onlineProfiles.clear(); hide("bottomNav"); view("setupView"); }

/* ===== Language Modal ===== */
function buildLangModal() { const list = $("langList"); list.innerHTML = ""; Object.keys(STRINGS).forEach(code => { const s = STRINGS[code]; const btn = document.createElement("button"); btn.className = "lang-btn"+(code===currentLang?" current":""); btn.innerHTML = `<span>${s._name}</span><span class="native">${s._native}</span>`; btn.onclick = () => { currentLang = code; lsSet(SK.LANG, code); applyI18n(); buildLangModal(); refreshDiscover(); if (activeChatPeer) renderChatMessages(activeChatPeer); }; list.appendChild(btn); }); }

/* ===== PWA ===== */
function registerSW() { if ("serviceWorker" in navigator) { navigator.serviceWorker.register("sw.js").catch(()=>{}); } }

/* ===== Initialization ===== */
async function init() {
  applyTheme(); applyI18n(); registerSW();
  loadLocalProfile(); await loadPhotosFromDB();
  initSetupView(); initNavigation(); initChatForm();
  $("editProfileBtn").onclick = openEditProfile; $("cancelEditBtn").onclick = () => view("profileView"); $("saveEditBtn").onclick = saveEditProfile;
  $("themeBtn").onclick = toggleTheme; $("langBtn").onclick = () => { buildLangModal(); show("langModal"); }; $("closeLangBtn").onclick = () => hide("langModal"); $("clearDataBtn").onclick = clearAllData;
  $("closeViewProfileBtn").onclick = () => hide("viewProfileModal"); $("viewProfileModal").onclick = (e) => { if (e.target===$("viewProfileModal")) hide("viewProfileModal"); };
  $("chatBackBtn").onclick = () => { endCall(); view("chatListView"); renderChatListView(); }; $("chatAudioCallBtn").onclick = () => { if (activeChatPeer) startCall(activeChatPeer,false); }; $("chatVideoCallBtn").onclick = () => { if (activeChatPeer) startCall(activeChatPeer,true); }; $("chatMuteBtn").onclick = toggleMic; $("chatCameraBtn").onclick = toggleCamera; $("chatHangupBtn").onclick = endCall;
  $("matchModal").onclick = (e) => { if (e.target===$("matchModal")) hide("matchModal"); }; $("incomingModal").onclick = (e) => { if (e.target===$("incomingModal")) hide("incomingModal"); }; $("langModal").onclick = (e) => { if (e.target===$("langModal")) hide("langModal"); };
  $("refreshDiscoverBtn").onclick = refreshDiscover;
  const setupDone = lsGet(SK.SETUP_DONE, false);
  if (setupDone && myProfile) { showMainApp(); } else { view("setupView"); }
  initPeer();
  window.addEventListener("beforeunload", () => { if (localStream) localStream.getTracks().forEach(t => t.stop()); });
}
init();
