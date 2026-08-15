"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regenerator() { var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var $ = function $(id) {
  return document.getElementById(id);
};
var DB_NAME = "peercall-dating-db",
  DB_STORE = "photos",
  PHOTO_FALLBACK_PREFIX = "pc-photo-";
function hasIndexedDB() {
  return typeof window.indexedDB !== "undefined";
}
function fallbackPhotoGet(idx) {
  try {
    return localStorage.getItem(PHOTO_FALLBACK_PREFIX + idx);
  } catch (_) {
    return null;
  }
}
function fallbackPhotoPut(idx, data) {
  try {
    localStorage.setItem(PHOTO_FALLBACK_PREFIX + idx, data);
  } catch (_) {}
}
function fallbackPhotoDelete(idx) {
  try {
    localStorage.removeItem(PHOTO_FALLBACK_PREFIX + idx);
  } catch (_) {}
}
function openDB() {
  return new Promise(function (resolve, reject) {
    if (!hasIndexedDB()) {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    var req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function () {
      if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE, {
        keyPath: "idx"
      });
    };
    req.onsuccess = function () {
      return resolve(req.result);
    };
    req.onerror = function () {
      return reject(req.error || new Error("Could not open photo storage"));
    };
  });
}
function dbPut(_x, _x2) {
  return _dbPut.apply(this, arguments);
}
function _dbPut() {
  _dbPut = _asyncToGenerator(_regenerator().m(function _callee4(idx, data) {
    var db, _t2;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          _context4.p = 0;
          _context4.n = 1;
          return openDB();
        case 1:
          db = _context4.v;
          _context4.n = 2;
          return new Promise(function (res, rej) {
            var tx = db.transaction(DB_STORE, "readwrite");
            tx.objectStore(DB_STORE).put({
              idx: idx,
              data: data
            });
            tx.oncomplete = function () {
              return res();
            };
            tx.onerror = function () {
              return rej(tx.error);
            };
          });
        case 2:
          _context4.n = 4;
          break;
        case 3:
          _context4.p = 3;
          _t2 = _context4.v;
          fallbackPhotoPut(idx, data);
        case 4:
          return _context4.a(2);
      }
    }, _callee4, null, [[0, 3]]);
  }));
  return _dbPut.apply(this, arguments);
}
function dbGet(_x3) {
  return _dbGet.apply(this, arguments);
}
function _dbGet() {
  _dbGet = _asyncToGenerator(_regenerator().m(function _callee5(idx) {
    var db, _t3;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.p = _context5.n) {
        case 0:
          _context5.p = 0;
          _context5.n = 1;
          return openDB();
        case 1:
          db = _context5.v;
          _context5.n = 2;
          return new Promise(function (res, rej) {
            var tx = db.transaction(DB_STORE, "readonly");
            var r = tx.objectStore(DB_STORE).get(idx);
            r.onsuccess = function () {
              var _r$result;
              return res(((_r$result = r.result) === null || _r$result === void 0 ? void 0 : _r$result.data) || fallbackPhotoGet(idx));
            };
            r.onerror = function () {
              return rej(r.error);
            };
          });
        case 2:
          return _context5.a(2, _context5.v);
        case 3:
          _context5.p = 3;
          _t3 = _context5.v;
          return _context5.a(2, fallbackPhotoGet(idx));
      }
    }, _callee5, null, [[0, 3]]);
  }));
  return _dbGet.apply(this, arguments);
}
function dbDelete(_x4) {
  return _dbDelete.apply(this, arguments);
}
function _dbDelete() {
  _dbDelete = _asyncToGenerator(_regenerator().m(function _callee6(idx) {
    var db, _t4;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          fallbackPhotoDelete(idx);
          _context6.p = 1;
          _context6.n = 2;
          return openDB();
        case 2:
          db = _context6.v;
          _context6.n = 3;
          return new Promise(function (res, rej) {
            var tx = db.transaction(DB_STORE, "readwrite");
            tx.objectStore(DB_STORE).delete(idx);
            tx.oncomplete = function () {
              return res();
            };
            tx.onerror = function () {
              return rej(tx.error);
            };
          });
        case 3:
          _context6.n = 5;
          break;
        case 4:
          _context6.p = 4;
          _t4 = _context6.v;
        case 5:
          return _context6.a(2);
      }
    }, _callee6, null, [[1, 4]]);
  }));
  return _dbDelete.apply(this, arguments);
}
function dbClear() {
  return _dbClear.apply(this, arguments);
}
function _dbClear() {
  _dbClear = _asyncToGenerator(_regenerator().m(function _callee7() {
    var i, db, _t5;
    return _regenerator().w(function (_context7) {
      while (1) switch (_context7.p = _context7.n) {
        case 0:
          for (i = 0; i < MAX_PHOTOS; i++) fallbackPhotoDelete(i);
          _context7.p = 1;
          _context7.n = 2;
          return openDB();
        case 2:
          db = _context7.v;
          _context7.n = 3;
          return new Promise(function (res, rej) {
            var tx = db.transaction(DB_STORE, "readwrite");
            tx.objectStore(DB_STORE).clear();
            tx.oncomplete = function () {
              return res();
            };
            tx.onerror = function () {
              return rej(tx.error);
            };
          });
        case 3:
          _context7.n = 5;
          break;
        case 4:
          _context7.p = 4;
          _t5 = _context7.v;
        case 5:
          return _context7.a(2);
      }
    }, _callee7, null, [[1, 4]]);
  }));
  return _dbClear.apply(this, arguments);
}
var SK = {
  PROFILE: "pc-profile",
  SETUP_DONE: "pc-setup-done",
  SENT_LIKES: "pc-sent-likes",
  RECEIVED_LIKES: "pc-received-likes",
  MATCHES: "pc-matches",
  CONVOS: "pc-conversations",
  THEME: "pc-theme",
  LANG: "pc-lang"
};
function lsGet(key, fallback) {
  try {
    var v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (_) {
    return fallback;
  }
}
function lsSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch (_) {
    return false;
  }
}
function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}
var myProfile = null,
  myPhotos = [],
  sentLikes = new Set(),
  receivedLikes = new Set(),
  matches = new Set(),
  conversations = {};
var onlineProfiles = new Map(),
  activeChatPeer = null,
  localStream = null,
  activeCall = null,
  pendingCall = null;
var peer = null,
  lobbyState = "idle",
  lobbyHostConn = null,
  lobbyMembers = new Map();
var deferredInstallPrompt = null;
var FRIEND_LOBBY_ID = "peercall-dating-lobby-v2";
var MAX_PHOTOS = 6;
var INTERESTS = ["travel", "music", "movies", "reading", "cooking", "fitness", "photography", "art", "gaming", "dancing", "yoga", "hiking", "foodie", "coffee", "nature", "tech", "fashion", "cricket", "animals", "languages", "writing", "spirituality", "comedy", "food"];
var STRINGS = {
  en: {
    _name: "English",
    _native: "English",
    appTitle: "Peer Call",
    setupTitle: "Create Your Profile",
    setupSubtitle: "Tell people about yourself. Your data stays on this device only.",
    photosLabel: "Your Photos",
    photosHint: "Add up to 6 photos. First photo is your main display.",
    addPhotos: "Add",
    name: "Name",
    yourNamePh: "Your name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    interestedIn: "Interested in",
    men: "Men",
    women: "Women",
    everyoneOpt: "Everyone",
    aboutYou: "About You",
    bioPh: "Write something interesting about yourself…",
    interests: "Interests",
    lookingFor: "Looking for",
    relationship: "Relationship",
    casual: "Casual",
    friends: "Friends",
    justChat: "Just Chat",
    optionalDetails: "Details (optional)",
    height: "Height (cm)",
    city: "City",
    cityPh: "Ahmedabad",
    education: "Education",
    educationPh: "Engineer",
    profession: "Profession",
    professionPh: "Developer",
    completeSetup: "Complete Profile",
    discover: "Discover",
    refresh: "Refresh",
    lookingForPeople: "Looking for people online…",
    noOnlinePeople: "No one online right now. Check back soon!",
    matches: "Matches",
    noMatchesYet: "No matches yet. Keep exploring!",
    chats: "Chats",
    noChatsYet: "No conversations yet. Match with someone to start chatting!",
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    toggleTheme: "🌙 Theme",
    language: "🌐 Language",
    clearAllData: "Clear All Data",
    save: "Save",
    cancel: "Cancel",
    back: "← Back",
    itsAMatch: "It's a Match!",
    sendMessage: "Send Message",
    keepBrowsing: "Keep Browsing",
    incomingCall: "Incoming call",
    answer: "Answer",
    decline: "Decline",
    muteMic: "Mute mic",
    unmuteMic: "Unmute mic",
    turnCameraOff: "Turn camera off",
    turnCameraOn: "Turn camera on",
    hangUp: "Hang Up",
    typeMessage: "Type a message…",
    send: "Send",
    noMessages: "No messages yet",
    online: "Online",
    offline: "Offline",
    chooseLanguage: "Choose language",
    close: "Close",
    you: "You",
    nameRequired: "Please enter your name.",
    dobRequired: "Please enter your date of birth.",
    genderRequired: "Please select your gender.",
    profileSaved: "Profile saved!",
    setupComplete: "Profile created! Let's find your match.",
    likeSent: "Like sent!",
    matchFound: "You matched with {name}!",
    noOneToLike: "No one available to like right now.",
    cannotLikeSelf: "You can't like yourself.",
    clearConfirm: "This will delete your profile, matches, and all data. Are you sure?",
    dataCleared: "All data cleared.",
    installApp: "Install this app on your device!",
    install: "Install",
    pass: "Pass",
    viewProfile: "View Profile",
    connectStatus: "Connecting…",
    readyStatus: "Ready",
    ageSuffix: " yrs",
    noPhoto: "No photo",
    matchWith: "You and {name} liked each other!",
    chatOffline: "This person is offline right now.",
    fileTooBig: "File is too large (max 50MB)."
  },
  gu: {
    _name: "Gujarati",
    _native: "ગુજરાતી",
    appTitle: "પીઅર કૉલ",
    setupTitle: "તમારી પ્રોફાઇલ બનાવો",
    setupSubtitle: "તમારા વિશે જણાવો. તમારો ડેટા ફક્ત આ ડિવાઇસ પર રહેશે.",
    photosLabel: "તમારા ફોટા",
    photosHint: "6 સુધી ફોટા ઉમેરો. પહેલો ફોટો મુખ્ય ડિસ્પ્લે છે.",
    addPhotos: "ઉમેરો",
    name: "નામ",
    yourNamePh: "તમારું નામ",
    dateOfBirth: "જન્મ તારીખ",
    gender: "લિંગ",
    male: "પુરુષ",
    female: "સ્ત્રી",
    other: "અન્ય",
    interestedIn: "રસ છે",
    men: "પુરુષો",
    women: "સ્ત્રીઓ",
    everyoneOpt: "બધા",
    aboutYou: "તમારા વિશે",
    bioPh: "તમારા વિશે કંઈક રસપ્રદ લખો…",
    interests: "રુચિઓ",
    lookingFor: "શોધો છો",
    relationship: "સંબંધ",
    casual: "કૅઝ્યુઅલ",
    friends: "મિત્રો",
    justChat: "ફક્ત ચેટ",
    optionalDetails: "વિગતો (વૈકલ્પિક)",
    height: "ઊંચાઈ (cm)",
    city: "શહેર",
    cityPh: "અમદાવાદ",
    education: "શિક્ષણ",
    educationPh: "એન્જિનિયર",
    profession: "વ્યવસાય",
    professionPh: "ડેવલપર",
    completeSetup: "પ્રોફાઇલ પૂર્ણ કરો",
    discover: "શોધો",
    refresh: "રીફ્રેશ",
    lookingForPeople: "નલાઇન લોકો શોધી રહ્યા છીએ…",
    noOnlinePeople: "હાલ કોઈ ઑનલાઇન નથી.",
    matches: "મૅચ",
    noMatchesYet: "હજુ કોઈ મૅચ નથી.",
    chats: "ચેટ",
    noChatsYet: "હજુ કોઈ વાતચીત નથી.",
    myProfile: "મારી પ્રોફાઇલ",
    editProfile: "પ્રોફાઇલ સંપાદિત કરો",
    toggleTheme: "🌙 થીમ",
    language: "🌐 ભાષા",
    clearAllData: "બધો ડેટા સાફ કરો",
    save: "સાચવો",
    cancel: "રદ કરો",
    back: "← પાછા",
    itsAMatch: "મૅચ થયો!",
    sendMessage: "સંદેશ મોકલો",
    keepBrowsing: "શોધ ચાલુ રાખો",
    incomingCall: "આવતી કૉલ",
    answer: "જવાબ આપો",
    decline: "નકારો",
    muteMic: "માઇક મ્યૂટ",
    unmuteMic: "માઇક અનમ્યૂટ",
    turnCameraOff: "કૅમેરા બંધ",
    turnCameraOn: "કૅમેરા ચાલુ",
    hangUp: "કૉલ કાપો",
    typeMessage: "સંદેશ લખો…",
    send: "મોકલો",
    noMessages: "હજુ કોઈ સંદેશ નથી",
    online: "ઑનલાઇન",
    offline: "ઑફલાઇન",
    chooseLanguage: "ભાષા પસંદ કરો",
    close: "બંધ કરો",
    you: "તમે",
    nameRequired: "કૃપા કરીને નામ દાખલ કરો.",
    dobRequired: "કૃપા કરીને જન્મ તારીખ દાખલ કરો.",
    genderRequired: "કૃપા કરીને લિંગ પસંદ કરો.",
    profileSaved: "પ્રોફાઇલ સાચવાઈ!",
    setupComplete: "પ્રોફાઇલ બની ગઈ!",
    likeSent: "લાઈક મોકલાઈ!",
    matchFound: "{name} સાથે મૅચ થયો!",
    noOneToLike: "લાઈક કરવા કોઈ નથી.",
    cannotLikeSelf: "જાતને લાઈક ન કરી શકો.",
    clearConfirm: "બધો ડેટા ડિલીટ થશે. ખાતરી?",
    dataCleared: "બધો ડેટા સાફ થયો.",
    installApp: "આ એપ ઇન્સ્ટોલ કરો!",
    install: "ઇન્સ્ટોલ",
    pass: "પાસ",
    viewProfile: "પ્રોફાઇલ જુઓ",
    connectStatus: "કનેક્ટ થઈ રહ્યું છે…",
    readyStatus: "તૈયાર",
    ageSuffix: " વર્ષ",
    noPhoto: "ફોટો નથી",
    matchWith: "તમે અને {name} એ એકબીજાને લાઈક કર્યા!",
    chatOffline: "આ વ્યક્તિ ઑફલાઇન છે.",
    fileTooBig: "ફાઇલ ખૂબ મોટી છે (50MB)."
  }
};
Object.assign(STRINGS.en, {
  installTitle: "Install PeerCall",
  installReady: "Install PeerCall for quick, full-screen access.",
  installNow: "Install",
  installLater: "Not now",
  installInstructions: "Add PeerCall to your home screen",
  installIos: "Tap the Share button, then choose ‘Add to Home Screen’ and tap ‘Add’.",
  installAndroid: "Open the browser menu and choose ‘Install app’ or ‘Add to Home screen’.",
  installDesktop: "Open your browser menu and choose ‘Install PeerCall’ or ‘Create shortcut’.",
  alreadyInstalled: "PeerCall is already installed on this device.",
  installUnavailable: "Your browser does not show an automatic install prompt. Use its menu and choose ‘Add to Home Screen’ or ‘Install app’.",
  offlineNotice: "You are offline. Saved profiles remain available; discovery, chat, and calls reconnect when you are online.",
  limitedBrowser: "This browser has limited call support. Profiles still work, but use a newer Chrome, Edge, Firefox, or Safari for chat and calls.",
  callUnsupported: "Camera and microphone calls are not supported by this browser.",
  dismiss: "Dismiss"
});
Object.assign(STRINGS.gu, {
  installTitle: "PeerCall ઇન્સ્ટોલ કરો",
  installReady: "ઝડપી અને ફુલ-સ્ક્રીન ઉપયોગ માટે PeerCall ઇન્સ્ટોલ કરો.",
  installNow: "ઇન્સ્ટોલ",
  installLater: "હમણાં નહીં",
  installInstructions: "PeerCall ને તમારી હોમ સ્ક્રીન પર ઉમેરો",
  installIos: "Share બટન ટેપ કરો, પછી ‘Add to Home Screen’ પસંદ કરીને ‘Add’ ટેપ કરો.",
  installAndroid: "બ્રાઉઝર મેનુ ખોલીને ‘Install app’ અથવા ‘Add to Home screen’ પસંદ કરો.",
  installDesktop: "બ્રાઉઝર મેનુ ખોલીને ‘Install PeerCall’ અથવા ‘Create shortcut’ પસંદ કરો.",
  alreadyInstalled: "PeerCall આ ડિવાઇસમાં પહેલેથી ઇન્સ્ટોલ છે.",
  installUnavailable: "આ બ્રાઉઝર આપમેળે ઇન્સ્ટોલ વિકલ્પ બતાવતું નથી. મેનુમાંથી ‘Add to Home Screen’ અથવા ‘Install app’ પસંદ કરો.",
  offlineNotice: "તમે ઑફલાઇન છો. સાચવેલી પ્રોફાઇલ ઉપલબ્ધ રહેશે; ઑનલાઇન થશો ત્યારે શોધ, ચેટ અને કૉલ ફરી જોડાશે.",
  limitedBrowser: "આ બ્રાઉઝરમાં કૉલની મર્યાદિત સુવિધા છે. પ્રોફાઇલ કામ કરશે, પરંતુ ચેટ અને કૉલ માટે નવું Chrome, Edge, Firefox અથવા Safari વાપરો.",
  callUnsupported: "આ બ્રાઉઝરમાં કેમેરા અને માઇક્રોફોન કૉલ સપોર્ટેડ નથી.",
  dismiss: "બંધ કરો"
});
var currentLang = lsGet(SK.LANG, "en");
function t(key, params) {
  var _STRINGS$currentLang;
  var str = ((_STRINGS$currentLang = STRINGS[currentLang]) === null || _STRINGS$currentLang === void 0 ? void 0 : _STRINGS$currentLang[key]) || STRINGS.en[key] || key;
  if (params) Object.keys(params).forEach(function (k) {
    str = str.replace("{".concat(k, "}"), params[k]);
  });
  return str;
}
function applyI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    var val = t(key);
    if (val) el.textContent = val;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    var key = el.getAttribute("data-i18n-placeholder");
    var val = t(key);
    if (val) el.placeholder = val;
  });
}
function safeText(s) {
  var d = document.createElement("div");
  d.textContent = s || "";
  return d.textContent;
}
function show(id) {
  var _$;
  (_$ = $(id)) === null || _$ === void 0 || _$.classList.remove("hidden");
}
function hide(id) {
  var _$2;
  (_$2 = $(id)) === null || _$2 === void 0 || _$2.classList.add("hidden");
}
function calcAge(dob) {
  if (!dob) return 0;
  var d = new Date(dob),
    n = new Date();
  var age = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || n.getMonth() === d.getMonth() && n.getDate() < d.getDate()) age--;
  return age;
}
function timeAgo(ts) {
  if (!ts) return "";
  var diff = Date.now() - ts;
  if (diff < 60000) return "now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h";
  return Math.floor(diff / 86400000) + "d";
}
function supportsCalls() {
  return Boolean(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
function attachMediaStream(element, stream) {
  if (!element) return;
  if ("srcObject" in element) {
    element.srcObject = stream;
  } else if (window.URL && window.URL.createObjectURL) {
    element.src = window.URL.createObjectURL(stream);
  }
}
function applyTheme() {
  document.body.setAttribute("data-theme", lsGet(SK.THEME, "dark"));
}
function toggleTheme() {
  var cur = document.body.getAttribute("data-theme");
  var next = cur === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  lsSet(SK.THEME, next);
}
function loadLocalProfile() {
  myProfile = lsGet(SK.PROFILE, null);
  myPhotos = [];
  sentLikes = new Set(lsGet(SK.SENT_LIKES, []));
  receivedLikes = new Set(lsGet(SK.RECEIVED_LIKES, []));
  matches = new Set(lsGet(SK.MATCHES, []));
  conversations = lsGet(SK.CONVOS, {});
}
function loadPhotosFromDB() {
  return _loadPhotosFromDB.apply(this, arguments);
}
function _loadPhotosFromDB() {
  _loadPhotosFromDB = _asyncToGenerator(_regenerator().m(function _callee8() {
    var i, data;
    return _regenerator().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          myPhotos = [];
          i = 0;
        case 1:
          if (!(i < MAX_PHOTOS)) {
            _context8.n = 4;
            break;
          }
          _context8.n = 2;
          return dbGet(i);
        case 2:
          data = _context8.v;
          myPhotos.push(data || null);
        case 3:
          i++;
          _context8.n = 1;
          break;
        case 4:
          return _context8.a(2);
      }
    }, _callee8);
  }));
  return _loadPhotosFromDB.apply(this, arguments);
}
function saveProfileToStorage() {
  return _saveProfileToStorage.apply(this, arguments);
}
function _saveProfileToStorage() {
  _saveProfileToStorage = _asyncToGenerator(_regenerator().m(function _callee9() {
    return _regenerator().w(function (_context9) {
      while (1) switch (_context9.n) {
        case 0:
          lsSet(SK.PROFILE, myProfile);
          lsSet(SK.SETUP_DONE, true);
          lsSet(SK.SENT_LIKES, _toConsumableArray(sentLikes));
          lsSet(SK.RECEIVED_LIKES, _toConsumableArray(receivedLikes));
          lsSet(SK.MATCHES, _toConsumableArray(matches));
          lsSet(SK.CONVOS, conversations);
        case 1:
          return _context9.a(2);
      }
    }, _callee9);
  }));
  return _saveProfileToStorage.apply(this, arguments);
}
function savePhotoToSlot(_x5, _x6) {
  return _savePhotoToSlot.apply(this, arguments);
}
function _savePhotoToSlot() {
  _savePhotoToSlot = _asyncToGenerator(_regenerator().m(function _callee0(index, dataUrl) {
    return _regenerator().w(function (_context0) {
      while (1) switch (_context0.n) {
        case 0:
          _context0.n = 1;
          return dbPut(index, dataUrl);
        case 1:
          myPhotos[index] = dataUrl;
        case 2:
          return _context0.a(2);
      }
    }, _callee0);
  }));
  return _savePhotoToSlot.apply(this, arguments);
}
function getProfileSummary() {
  if (!myProfile) return null;
  return {
    name: myProfile.name,
    age: calcAge(myProfile.dob),
    gender: myProfile.gender,
    interestedIn: myProfile.interestedIn,
    bio: myProfile.bio || "",
    photo: myPhotos[0] || null,
    photos: myPhotos.filter(Boolean),
    interests: myProfile.interests || [],
    city: myProfile.city || "",
    lookingFor: myProfile.lookingFor || "",
    education: myProfile.education || "",
    profession: myProfile.profession || "",
    height: myProfile.height || 0
  };
}
var setupSelectedGender = "",
  setupSelectedInterested = "",
  setupSelectedLookingFor = "",
  setupSelectedInterests = new Set(),
  setupPhotos = [];
function initSetupView() {
  renderInterestsGrid("interestsGrid", setupSelectedInterests);
  var maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  $("setupDob").max = maxDate.toISOString().split("T")[0];
  $("genderGroup").querySelectorAll(".option-btn").forEach(function (btn) {
    btn.onclick = function () {
      $("genderGroup").querySelectorAll(".option-btn").forEach(function (b) {
        return b.classList.remove("selected");
      });
      btn.classList.add("selected");
      setupSelectedGender = btn.dataset.value;
    };
  });
  $("interestedGroup").querySelectorAll(".option-btn").forEach(function (btn) {
    btn.onclick = function () {
      $("interestedGroup").querySelectorAll(".option-btn").forEach(function (b) {
        return b.classList.remove("selected");
      });
      btn.classList.add("selected");
      setupSelectedInterested = btn.dataset.value;
    };
  });
  $("lookingForGroup").querySelectorAll(".option-btn").forEach(function (btn) {
    btn.onclick = function () {
      $("lookingForGroup").querySelectorAll(".option-btn").forEach(function (b) {
        return b.classList.remove("selected");
      });
      btn.classList.add("selected");
      setupSelectedLookingFor = btn.dataset.value;
    };
  });
  $("photoInput").onchange = function () {
    var _ref = _asyncToGenerator(_regenerator().m(function _callee(e) {
      var files, _i, _files, file, dataUrl;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            files = Array.from(e.target.files || []);
            _i = 0, _files = files;
          case 1:
            if (!(_i < _files.length)) {
              _context.n = 5;
              break;
            }
            file = _files[_i];
            if (!(setupPhotos.length >= MAX_PHOTOS)) {
              _context.n = 2;
              break;
            }
            return _context.a(3, 5);
          case 2:
            _context.n = 3;
            return readFileAsDataURL(file);
          case 3:
            dataUrl = _context.v;
            if (dataUrl) {
              setupPhotos.push(dataUrl);
              renderSetupPhotoGrid();
            }
          case 4:
            _i++;
            _context.n = 1;
            break;
          case 5:
            e.target.value = "";
          case 6:
            return _context.a(2);
        }
      }, _callee);
    }));
    return function (_x7) {
      return _ref.apply(this, arguments);
    };
  }();
  $("completeSetupBtn").onclick = completeSetup;
}
function renderSetupPhotoGrid() {
  var grid = $("photoGrid");
  grid.innerHTML = "";
  setupPhotos.forEach(function (photo, i) {
    var slot = document.createElement("div");
    slot.className = "photo-slot" + (i === 0 ? " main-photo" : "");
    slot.innerHTML = "<img src=\"".concat(photo, "\"><button class=\"photo-remove\" data-idx=\"").concat(i, "\">\xD7</button>");
    slot.querySelector(".photo-remove").onclick = function () {
      setupPhotos.splice(i, 1);
      renderSetupPhotoGrid();
    };
    grid.appendChild(slot);
  });
  if (setupPhotos.length < MAX_PHOTOS) {
    var addBtn = document.createElement("label");
    addBtn.className = "photo-add";
    addBtn.innerHTML = "<input type=\"file\" accept=\"image/*\" class=\"file-input\" onchange=\"handleSetupPhotoAdd(this)\"><span class=\"photo-add-icon\">+</span><span class=\"photo-add-text\">".concat(t("addPhotos"), "</span>");
    grid.appendChild(addBtn);
  }
}
function handleSetupPhotoAdd(_x8) {
  return _handleSetupPhotoAdd.apply(this, arguments);
}
function _handleSetupPhotoAdd() {
  _handleSetupPhotoAdd = _asyncToGenerator(_regenerator().m(function _callee1(input) {
    var files, _i2, _files2, file, dataUrl;
    return _regenerator().w(function (_context1) {
      while (1) switch (_context1.n) {
        case 0:
          files = Array.from(input.files || []);
          _i2 = 0, _files2 = files;
        case 1:
          if (!(_i2 < _files2.length)) {
            _context1.n = 5;
            break;
          }
          file = _files2[_i2];
          if (!(setupPhotos.length >= MAX_PHOTOS)) {
            _context1.n = 2;
            break;
          }
          return _context1.a(3, 5);
        case 2:
          _context1.n = 3;
          return readFileAsDataURL(file);
        case 3:
          dataUrl = _context1.v;
          if (dataUrl) setupPhotos.push(dataUrl);
        case 4:
          _i2++;
          _context1.n = 1;
          break;
        case 5:
          input.value = "";
          renderSetupPhotoGrid();
        case 6:
          return _context1.a(2);
      }
    }, _callee1);
  }));
  return _handleSetupPhotoAdd.apply(this, arguments);
}
function renderInterestsGrid(containerId, selectedSet) {
  var grid = $(containerId);
  grid.innerHTML = "";
  INTERESTS.forEach(function (interest) {
    var tag = document.createElement("button");
    tag.type = "button";
    tag.className = "interest-tag" + (selectedSet.has(interest) ? " selected" : "");
    tag.textContent = interest.charAt(0).toUpperCase() + interest.slice(1);
    tag.onclick = function () {
      if (selectedSet.has(interest)) {
        selectedSet.delete(interest);
        tag.classList.remove("selected");
      } else {
        selectedSet.add(interest);
        tag.classList.add("selected");
      }
    };
    grid.appendChild(tag);
  });
}
function completeSetup() {
  return _completeSetup.apply(this, arguments);
}
function _completeSetup() {
  _completeSetup = _asyncToGenerator(_regenerator().m(function _callee10() {
    var name, dob, i;
    return _regenerator().w(function (_context10) {
      while (1) switch (_context10.n) {
        case 0:
          name = safeText($("setupName").value).trim();
          dob = $("setupDob").value;
          if (name) {
            _context10.n = 1;
            break;
          }
          return _context10.a(2, alert(t("nameRequired")));
        case 1:
          if (dob) {
            _context10.n = 2;
            break;
          }
          return _context10.a(2, alert(t("dobRequired")));
        case 2:
          if (setupSelectedGender) {
            _context10.n = 3;
            break;
          }
          return _context10.a(2, alert(t("genderRequired")));
        case 3:
          myProfile = {
            name: name,
            dob: dob,
            gender: setupSelectedGender,
            interestedIn: setupSelectedInterested,
            bio: safeText($("setupBio").value).trim(),
            interests: _toConsumableArray(setupSelectedInterests),
            lookingFor: setupSelectedLookingFor,
            height: parseInt($("setupHeight").value) || 0,
            city: safeText($("setupCity").value).trim(),
            education: safeText($("setupEducation").value).trim(),
            profession: safeText($("setupProfession").value).trim()
          };
          myPhotos = [];
          i = 0;
        case 4:
          if (!(i < MAX_PHOTOS)) {
            _context10.n = 8;
            break;
          }
          if (!setupPhotos[i]) {
            _context10.n = 6;
            break;
          }
          _context10.n = 5;
          return savePhotoToSlot(i, setupPhotos[i]);
        case 5:
          myPhotos[i] = setupPhotos[i];
          _context10.n = 7;
          break;
        case 6:
          myPhotos[i] = null;
        case 7:
          i++;
          _context10.n = 4;
          break;
        case 8:
          _context10.n = 9;
          return saveProfileToStorage();
        case 9:
          showMainApp();
        case 10:
          return _context10.a(2);
      }
    }, _callee10);
  }));
  return _completeSetup.apply(this, arguments);
}
function readFileAsDataURL(file) {
  return new Promise(function (resolve) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        var MAX = 800;
        var w = img.width,
          h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round(h * MAX / w);
            w = MAX;
          } else {
            w = Math.round(w * MAX / h);
            h = MAX;
          }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = function () {
        return resolve(null);
      };
      img.src = reader.result;
    };
    reader.onerror = function () {
      return resolve(null);
    };
    reader.readAsDataURL(file);
  });
}
var editPhotos = [],
  editInterests = new Set();
function openEditProfile() {
  editPhotos = _toConsumableArray(myPhotos);
  editInterests = new Set(myProfile.interests || []);
  $("editName").value = myProfile.name || "";
  $("editBio").value = myProfile.bio || "";
  $("editCity").value = myProfile.city || "";
  $("editEducation").value = myProfile.education || "";
  $("editProfession").value = myProfile.profession || "";
  renderEditPhotoGrid();
  renderInterestsGrid("editInterestsGrid", editInterests);
  view("editProfileView");
}
function renderEditPhotoGrid() {
  var grid = $("editPhotoGrid");
  grid.innerHTML = "";
  editPhotos.forEach(function (photo, i) {
    if (!photo) return;
    var slot = document.createElement("div");
    slot.className = "photo-slot" + (i === 0 ? " main-photo" : "");
    slot.innerHTML = "<img src=\"".concat(photo, "\"><button class=\"photo-remove\" data-idx=\"").concat(i, "\">\xD7</button>");
    slot.querySelector(".photo-remove").onclick = _asyncToGenerator(_regenerator().m(function _callee2() {
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            editPhotos.splice(i, 1);
            while (editPhotos.length < MAX_PHOTOS) editPhotos.push(null);
            editPhotos = editPhotos.filter(Boolean);
            while (editPhotos.length < MAX_PHOTOS) editPhotos.push(null);
            renderEditPhotoGrid();
          case 1:
            return _context2.a(2);
        }
      }, _callee2);
    }));
    grid.appendChild(slot);
  });
  var photoCount = editPhotos.filter(Boolean).length;
  if (photoCount < MAX_PHOTOS) {
    var addBtn = document.createElement("label");
    addBtn.className = "photo-add";
    addBtn.innerHTML = "<input type=\"file\" accept=\"image/*\" class=\"file-input\" onchange=\"handleEditPhotoAdd(this)\"><span class=\"photo-add-icon\">+</span><span class=\"photo-add-text\">".concat(t("addPhotos"), "</span>");
    grid.appendChild(addBtn);
  }
}
function handleEditPhotoAdd(_x9) {
  return _handleEditPhotoAdd.apply(this, arguments);
}
function _handleEditPhotoAdd() {
  _handleEditPhotoAdd = _asyncToGenerator(_regenerator().m(function _callee11(input) {
    var files, _i3, _files3, file, count, dataUrl, idx;
    return _regenerator().w(function (_context11) {
      while (1) switch (_context11.n) {
        case 0:
          files = Array.from(input.files || []);
          _i3 = 0, _files3 = files;
        case 1:
          if (!(_i3 < _files3.length)) {
            _context11.n = 5;
            break;
          }
          file = _files3[_i3];
          count = editPhotos.filter(Boolean).length;
          if (!(count >= MAX_PHOTOS)) {
            _context11.n = 2;
            break;
          }
          return _context11.a(3, 5);
        case 2:
          _context11.n = 3;
          return readFileAsDataURL(file);
        case 3:
          dataUrl = _context11.v;
          if (dataUrl) {
            idx = editPhotos.findIndex(function (p) {
              return !p;
            });
            if (idx >= 0) editPhotos[idx] = dataUrl;else editPhotos.push(dataUrl);
          }
        case 4:
          _i3++;
          _context11.n = 1;
          break;
        case 5:
          input.value = "";
          renderEditPhotoGrid();
        case 6:
          return _context11.a(2);
      }
    }, _callee11);
  }));
  return _handleEditPhotoAdd.apply(this, arguments);
}
function saveEditProfile() {
  return _saveEditProfile.apply(this, arguments);
}
function _saveEditProfile() {
  _saveEditProfile = _asyncToGenerator(_regenerator().m(function _callee12() {
    var name, i;
    return _regenerator().w(function (_context12) {
      while (1) switch (_context12.n) {
        case 0:
          name = safeText($("editName").value).trim();
          if (name) {
            _context12.n = 1;
            break;
          }
          return _context12.a(2, alert(t("nameRequired")));
        case 1:
          myProfile.name = name;
          myProfile.bio = safeText($("editBio").value).trim();
          myProfile.city = safeText($("editCity").value).trim();
          myProfile.education = safeText($("editEducation").value).trim();
          myProfile.profession = safeText($("editProfession").value).trim();
          myProfile.interests = _toConsumableArray(editInterests);
          myPhotos = [];
          i = 0;
        case 2:
          if (!(i < MAX_PHOTOS)) {
            _context12.n = 7;
            break;
          }
          if (!editPhotos[i]) {
            _context12.n = 4;
            break;
          }
          _context12.n = 3;
          return savePhotoToSlot(i, editPhotos[i]);
        case 3:
          myPhotos[i] = editPhotos[i];
          _context12.n = 6;
          break;
        case 4:
          _context12.n = 5;
          return dbDelete(i);
        case 5:
          myPhotos[i] = null;
        case 6:
          i++;
          _context12.n = 2;
          break;
        case 7:
          _context12.n = 8;
          return saveProfileToStorage();
        case 8:
          broadcastProfileToLobby();
          renderProfileView();
          view("profileView");
        case 9:
          return _context12.a(2);
      }
    }, _callee12);
  }));
  return _saveEditProfile.apply(this, arguments);
}
function renderProfileView() {
  if (!myProfile) return;
  var row = $("profilePhotosRow");
  row.innerHTML = "";
  myPhotos.filter(Boolean).forEach(function (photo) {
    var thumb = document.createElement("div");
    thumb.className = "profile-thumb";
    thumb.innerHTML = "<img src=\"".concat(photo, "\">");
    row.appendChild(thumb);
  });
  var age = calcAge(myProfile.dob);
  $("profileDisplayName").textContent = "".concat(myProfile.name, ", ").concat(age);
  var meta = [];
  if (myProfile.city) meta.push("📍 " + myProfile.city);
  if (myProfile.gender) meta.push(t(myProfile.gender));
  if (myProfile.profession) meta.push("💼 " + myProfile.profession);
  $("profileDisplayMeta").textContent = meta.join(" · ") || "";
  $("profileDisplayBio").textContent = myProfile.bio || "";
  var intDiv = $("profileDisplayInterests");
  intDiv.innerHTML = "";
  (myProfile.interests || []).forEach(function (i) {
    var tag = document.createElement("span");
    tag.className = "interest-display-tag";
    tag.textContent = i.charAt(0).toUpperCase() + i.slice(1);
    intDiv.appendChild(tag);
  });
  var detDiv = $("profileDisplayDetails");
  detDiv.innerHTML = "";
  if (myProfile.height) detDiv.innerHTML += "<div class=\"detail-item\"><span class=\"detail-icon\">\uD83D\uDCCF</span> ".concat(myProfile.height, " cm</div>");
  if (myProfile.education) detDiv.innerHTML += "<div class=\"detail-item\"><span class=\"detail-icon\"></span> ".concat(safeText(myProfile.education), "</div>");
  if (myProfile.lookingFor) detDiv.innerHTML += "<div class=\"detail-item\"><span class=\"detail-icon\">\uD83D\uDCAB</span> ".concat(t(myProfile.lookingFor), "</div>");
}
function view(viewId) {
  ["setupView", "discoverView", "matchesView", "chatListView", "chatView", "profileView", "editProfileView"].forEach(function (id) {
    if (id === viewId) show(id);else hide(id);
  });
  document.querySelectorAll(".nav-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });
}
function showMainApp() {
  show("bottomNav");
  renderProfileView();
  renderMatchesView();
  renderChatListView();
  view("discoverView");
  refreshDiscover();
}
function initNavigation() {
  document.querySelectorAll(".nav-btn").forEach(function (btn) {
    btn.onclick = function () {
      var v = btn.dataset.view;
      if (v === "discoverView") refreshDiscover();
      if (v === "matchesView") renderMatchesView();
      if (v === "chatListView") renderChatListView();
      if (v === "profileView") renderProfileView();
      view(v);
    };
  });
}
function initPeer() {
  if (typeof window.Peer !== "function" || !window.RTCPeerConnection) {
    showBrowserCapabilityNotice();
    return;
  }
  var peerId = "pc-dating-" + Math.random().toString(36).slice(2, 10);
  try {
    peer = new window.Peer(peerId, {
      debug: 0
    });
  } catch (_) {
    showBrowserCapabilityNotice();
    return;
  }
  peer.on("open", function () {
    joinLobby();
  });
  peer.on("connection", function (conn) {
    conn.on("data", function (data) {
      if (!(data !== null && data !== void 0 && data.type)) return;
      if (data.type === "chat-msg") receiveChatMessage(data.from, data.text, data.ts);
    });
  });
  peer.on("call", function (call) {
    if (matches.has(call.peer) || onlineProfiles.has(call.peer)) {
      pendingCall = call;
      showIncomingCallModal(call);
    } else {
      call.close();
    }
  });
  peer.on("disconnected", function () {
    setTimeout(function () {
      try {
        peer.reconnect();
      } catch (_) {}
    }, 2000);
  });
  peer.on("error", function (err) {
    if (err.type === "unavailable-id") setTimeout(function () {
      return joinLobby();
    }, 1000);
  });
}
function joinLobby() {
  var testPeer = new Peer(FRIEND_LOBBY_ID, {
    debug: 0
  });
  testPeer.on("open", function () {
    testPeer.destroy();
    becomeLobbyHost();
  });
  testPeer.on("error", function () {
    testPeer.destroy();
    becomeLobbyMember();
  });
}
function becomeLobbyHost() {
  var hostPeer = new Peer(FRIEND_LOBBY_ID, {
    debug: 0
  });
  hostPeer.on("open", function () {
    lobbyState = "host";
    hostPeer.on("connection", function (conn) {
      lobbyMembers.set(conn.peer, conn);
      conn.on("open", function () {
        var roster = {};
        onlineProfiles.forEach(function (p, id) {
          if (id !== conn.peer) roster[id] = p;
        });
        conn.send({
          type: "roster",
          roster: roster
        });
        broadcastMyProfileToMember(conn);
      });
      conn.on("data", function (data) {
        return handleLobbyMessage(data, conn);
      });
      conn.on("close", function () {
        lobbyMembers.delete(conn.peer);
        onlineProfiles.delete(conn.peer);
        broadcastRoster();
        refreshDiscover();
      });
    });
  });
  hostPeer.on("error", function () {
    hostPeer.destroy();
    becomeLobbyMember();
  });
  window.addEventListener("beforeunload", function () {
    try {
      hostPeer.destroy();
    } catch (_) {}
  });
}
function becomeLobbyMember() {
  lobbyState = "member";
  var conn = peer.connect(FRIEND_LOBBY_ID, {
    reliable: true
  });
  lobbyHostConn = conn;
  conn.on("open", function () {
    broadcastProfileToLobby();
  });
  conn.on("data", function (data) {
    return handleLobbyMessage(data, conn);
  });
  conn.on("close", function () {
    lobbyHostConn = null;
    setTimeout(function () {
      if (lobbyState === "member") becomeLobbyMember();
    }, 3000);
  });
  conn.on("error", function () {
    setTimeout(function () {
      if (lobbyState === "member") becomeLobbyMember();
    }, 3000);
  });
}
function broadcastProfileToLobby() {
  var _lobbyHostConn;
  var summary = getProfileSummary();
  if (!summary) return;
  var msg = {
    type: "profile",
    profile: summary
  };
  if (lobbyState === "host") {
    lobbyMembers.forEach(function (conn) {
      if (conn.open) conn.send(msg);
    });
    onlineProfiles.set(peer.id, summary);
    broadcastRoster();
  } else if ((_lobbyHostConn = lobbyHostConn) !== null && _lobbyHostConn !== void 0 && _lobbyHostConn.open) {
    lobbyHostConn.send(msg);
  }
}
function broadcastMyProfileToMember(conn) {
  var summary = getProfileSummary();
  if (!summary || !conn.open) return;
  conn.send({
    type: "profile",
    profile: summary
  });
}
function broadcastRoster() {
  if (lobbyState !== "host") return;
  var roster = {};
  onlineProfiles.forEach(function (p, id) {
    roster[id] = p;
  });
  lobbyMembers.forEach(function (conn) {
    if (conn.open) conn.send({
      type: "roster",
      roster: roster
    });
  });
}
function handleLobbyMessage(data, conn) {
  if (!data || !data.type) return;
  switch (data.type) {
    case "profile":
      if (data.profile && conn.peer !== peer.id) {
        onlineProfiles.set(conn.peer, data.profile);
        if (lobbyState === "host") {
          lobbyMembers.forEach(function (c) {
            if (c !== conn && c.open) c.send(data);
          });
          broadcastRoster();
        }
        refreshDiscover();
      }
      break;
    case "roster":
      if (data.roster) {
        onlineProfiles.clear();
        Object.entries(data.roster).forEach(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
            id = _ref4[0],
            p = _ref4[1];
          return onlineProfiles.set(id, p);
        });
        var mySummary = getProfileSummary();
        if (mySummary) onlineProfiles.set(peer.id, mySummary);
        refreshDiscover();
      }
      break;
    case "like":
      if (lobbyState === "host" && data.target) {
        var targetConn = lobbyMembers.get(data.target);
        if (targetConn !== null && targetConn !== void 0 && targetConn.open) targetConn.send({
          type: "incoming-like",
          from: data.from
        });
        if (data.target === peer.id) handleIncomingLike(data.from);
      }
      break;
    case "incoming-like":
      handleIncomingLike(data.from);
      break;
    case "match-notification":
      handleMatchNotification(data.matchedWith);
      break;
    case "relay":
      if (lobbyState === "host" && data.target) {
        var _targetConn = lobbyMembers.get(data.target);
        if (_targetConn !== null && _targetConn !== void 0 && _targetConn.open) _targetConn.send(data.payload);
        if (data.target === peer.id) handleRelayPayload(data.payload);
      }
      break;
    default:
      handleRelayPayload(data);
      break;
  }
}
function handleRelayPayload(data) {
  if (!(data !== null && data !== void 0 && data.type)) return;
  if (data.type === "chat-msg") receiveChatMessage(data.from, data.text, data.ts);
}
function sendViaLobby(targetPeerId, payload) {
  var _lobbyHostConn2;
  if (lobbyState === "host") {
    var targetConn = lobbyMembers.get(targetPeerId);
    if (targetConn !== null && targetConn !== void 0 && targetConn.open) targetConn.send(payload);
    if (targetPeerId === peer.id) handleRelayPayload(payload);
  } else if ((_lobbyHostConn2 = lobbyHostConn) !== null && _lobbyHostConn2 !== void 0 && _lobbyHostConn2.open) {
    lobbyHostConn.send({
      type: "relay",
      target: targetPeerId,
      payload: payload
    });
  }
}
function refreshDiscover() {
  var container = $("discoverCards"),
    status = $("discoverStatus");
  var available = [];
  onlineProfiles.forEach(function (profile, peerId) {
    if (peerId === peer.id) return;
    if (matches.has(peerId)) return;
    if (sentLikes.has(peerId)) return;
    available.push({
      peerId: peerId,
      profile: profile
    });
  });
  if (available.length === 0) {
    container.innerHTML = "<div class=\"discover-empty\"><p class=\"empty-icon\">\uD83D\uDD0D</p><p>".concat(t("noOnlinePeople"), "</p></div>");
    status.textContent = onlineProfiles.size > 1 ? "".concat(onlineProfiles.size - 1, " online") : t("lookingForPeople");
    return;
  }
  status.textContent = "".concat(available.length, " ").concat(available.length === 1 ? "person" : "people", " online");
  container.innerHTML = "";
  available.forEach(function (_ref5) {
    var peerId = _ref5.peerId,
      profile = _ref5.profile;
    container.appendChild(createDiscoverCard(peerId, profile));
  });
}
function createDiscoverCard(peerId, profile) {
  var card = document.createElement("div");
  card.className = "discover-card";
  card.dataset.peerId = peerId;
  var photos = profile.photos || (profile.photo ? [profile.photo] : []);
  var photosHTML = "";
  if (photos.length > 0) {
    photosHTML = "<div class=\"card-photo-container\"><img src=\"".concat(photos[0], "\" alt=\"").concat(safeText(profile.name), "\"><div class=\"card-gradient\"></div><div class=\"card-info\"><h3>").concat(safeText(profile.name), ", ").concat(profile.age).concat(t("ageSuffix"), "</h3>").concat(profile.city ? "<div class=\"card-city\">\uD83D\uDCCD ".concat(safeText(profile.city), "</div>") : "").concat(profile.bio ? "<div class=\"card-bio\">".concat(safeText(profile.bio), "</div>") : "").concat((profile.interests || []).length ? "<div class=\"card-interests\">".concat(profile.interests.slice(0, 4).map(function (i) {
      return "<span class=\"card-interest-tag\">".concat(safeText(i), "</span>");
    }).join(""), "</div>") : "", "</div></div>").concat(photos.length > 1 ? "<div class=\"card-photo-dots\">".concat(photos.map(function (_, i) {
      return "<div class=\"card-photo-dot".concat(i === 0 ? " active" : "", "\" data-idx=\"").concat(i, "\"></div>");
    }).join(""), "</div>") : "");
  } else {
    photosHTML = "<div class=\"card-photo-container\"><div class=\"no-photo-placeholder\">\uD83D\uDC64</div><div class=\"card-gradient\"></div><div class=\"card-info\"><h3>".concat(safeText(profile.name), ", ").concat(profile.age).concat(t("ageSuffix"), "</h3>").concat(profile.city ? "<div class=\"card-city\">\uD83D\uDCCD ".concat(safeText(profile.city), "</div>") : "").concat(profile.bio ? "<div class=\"card-bio\">".concat(safeText(profile.bio), "</div>") : "", "</div></div>");
  }
  card.innerHTML = "".concat(photosHTML, "<div class=\"card-actions\"><button class=\"card-action-btn info-btn\" data-action=\"info\">\u2139\uFE0F</button><button class=\"card-action-btn pass-btn\" data-action=\"pass\">\u2717</button><button class=\"card-action-btn like-btn\" data-action=\"like\">\u2764\uFE0F</button></div>");
  if (photos.length > 1) {
    card.querySelectorAll(".card-photo-dot").forEach(function (dot) {
      dot.onclick = function () {
        var idx = parseInt(dot.dataset.idx);
        card.querySelector(".card-photo-container img").src = photos[idx];
        card.querySelectorAll(".card-photo-dot").forEach(function (d) {
          return d.classList.toggle("active", d === dot);
        });
      };
    });
  }
  card.querySelector('[data-action="pass"]').onclick = function () {
    card.classList.add("swiping-left");
    setTimeout(function () {
      return card.remove();
    }, 300);
  };
  card.querySelector('[data-action="like"]').onclick = function () {
    sendLike(peerId);
    card.classList.add("swiping-right");
    setTimeout(function () {
      return card.remove();
    }, 300);
  };
  card.querySelector('[data-action="info"]').onclick = function () {
    showRemoteProfile(peerId, profile);
  };
  return card;
}
function sendLike(targetPeerId) {
  var _lobbyHostConn3;
  if (targetPeerId === peer.id) return;
  if (sentLikes.has(targetPeerId)) return;
  if (matches.has(targetPeerId)) return;
  sentLikes.add(targetPeerId);
  lsSet(SK.SENT_LIKES, _toConsumableArray(sentLikes));
  if (lobbyState === "host") {
    var targetConn = lobbyMembers.get(targetPeerId);
    if (targetConn !== null && targetConn !== void 0 && targetConn.open) targetConn.send({
      type: "incoming-like",
      from: peer.id
    });
    if (targetPeerId === peer.id) handleIncomingLike(peer.id);
  } else if ((_lobbyHostConn3 = lobbyHostConn) !== null && _lobbyHostConn3 !== void 0 && _lobbyHostConn3.open) {
    lobbyHostConn.send({
      type: "like",
      from: peer.id,
      target: targetPeerId
    });
  }
  if (receivedLikes.has(targetPeerId)) createMatch(targetPeerId);
}
function handleIncomingLike(fromPeerId) {
  if (!fromPeerId || fromPeerId === peer.id) return;
  receivedLikes.add(fromPeerId);
  lsSet(SK.RECEIVED_LIKES, _toConsumableArray(receivedLikes));
  if (sentLikes.has(fromPeerId)) {
    var _lobbyHostConn4;
    createMatch(fromPeerId);
    if (lobbyState === "host") {
      var fromConn = lobbyMembers.get(fromPeerId);
      if (fromConn !== null && fromConn !== void 0 && fromConn.open) fromConn.send({
        type: "match-notification",
        matchedWith: peer.id
      });
    } else if ((_lobbyHostConn4 = lobbyHostConn) !== null && _lobbyHostConn4 !== void 0 && _lobbyHostConn4.open) {
      lobbyHostConn.send({
        type: "relay",
        target: fromPeerId,
        payload: {
          type: "match-notification",
          matchedWith: peer.id
        }
      });
    }
  }
}
function createMatch(peerId) {
  if (matches.has(peerId)) return;
  matches.add(peerId);
  lsSet(SK.MATCHES, _toConsumableArray(matches));
  var profile = onlineProfiles.get(peerId);
  if (profile) showMatchModal(peerId, profile);
  refreshDiscover();
}
function handleMatchNotification(matchedPeerId) {
  if (!matchedPeerId || matches.has(matchedPeerId)) return;
  matches.add(matchedPeerId);
  lsSet(SK.MATCHES, _toConsumableArray(matches));
  var profile = onlineProfiles.get(matchedPeerId);
  if (profile) showMatchModal(matchedPeerId, profile);
  refreshDiscover();
}
function showMatchModal(peerId, profile) {
  var _myProfile, _profile$name;
  var myPhoto = myPhotos[0] || null;
  var theirPhoto = profile.photo || null;
  $("matchMyAvatar").innerHTML = myPhoto ? "<img src=\"".concat(myPhoto, "\">") : ((_myProfile = myProfile) === null || _myProfile === void 0 || (_myProfile = _myProfile.name) === null || _myProfile === void 0 ? void 0 : _myProfile.charAt(0)) || "👤";
  $("matchTheirAvatar").innerHTML = theirPhoto ? "<img src=\"".concat(theirPhoto, "\">") : ((_profile$name = profile.name) === null || _profile$name === void 0 ? void 0 : _profile$name.charAt(0)) || "👤";
  $("matchText").textContent = t("matchWith", {
    name: profile.name
  });
  $("matchChatBtn").onclick = function () {
    hide("matchModal");
    openChat(peerId);
  };
  $("matchKeepBtn").onclick = function () {
    return hide("matchModal");
  };
  show("matchModal");
}
function renderMatchesView() {
  var container = $("matchesList");
  var matchedProfiles = [];
  matches.forEach(function (peerId) {
    var profile = onlineProfiles.get(peerId);
    if (profile) matchedProfiles.push({
      peerId: peerId,
      profile: profile
    });
  });
  if (matchedProfiles.length === 0) {
    container.innerHTML = "<div class=\"discover-empty\"><p class=\"empty-icon\"></p><p>".concat(t("noMatchesYet"), "</p></div>");
    container.className = "";
    return;
  }
  container.className = "matches-list";
  container.innerHTML = "";
  matchedProfiles.forEach(function (_ref6) {
    var peerId = _ref6.peerId,
      profile = _ref6.profile;
    var item = document.createElement("div");
    item.className = "match-item";
    item.onclick = function () {
      return openChat(peerId);
    };
    var photo = profile.photo || null;
    item.innerHTML = "<div class=\"match-photo\">".concat(photo ? "<img src=\"".concat(photo, "\">") : "👤", "</div><div class=\"match-name\">").concat(safeText(profile.name), "</div>");
    container.appendChild(item);
  });
}
function renderChatListView() {
  var container = $("chatList");
  var activeConvos = Object.entries(conversations).filter(function (_ref7) {
    var _ref8 = _slicedToArray(_ref7, 2),
      _ = _ref8[0],
      msgs = _ref8[1];
    return msgs.length > 0;
  });
  if (activeConvos.length === 0) {
    container.innerHTML = "<div class=\"discover-empty\"><p class=\"empty-icon\">\uD83D\uDCAC</p><p>".concat(t("noChatsYet"), "</p></div>");
    container.className = "";
    return;
  }
  container.className = "chat-list-view";
  container.innerHTML = "";
  activeConvos.sort(function (a, b) {
    var _a$, _b$;
    var lastA = ((_a$ = a[1][a[1].length - 1]) === null || _a$ === void 0 ? void 0 : _a$.ts) || 0;
    var lastB = ((_b$ = b[1][b[1].length - 1]) === null || _b$ === void 0 ? void 0 : _b$.ts) || 0;
    return lastB - lastA;
  });
  activeConvos.forEach(function (_ref9) {
    var _ref0 = _slicedToArray(_ref9, 2),
      peerId = _ref0[0],
      msgs = _ref0[1];
    var profile = onlineProfiles.get(peerId) || {};
    var lastMsg = msgs[msgs.length - 1];
    var item = document.createElement("div");
    item.className = "chat-list-item";
    item.onclick = function () {
      return openChat(peerId);
    };
    var photo = profile.photo || null;
    item.innerHTML = "<div class=\"chat-avatar\">".concat(photo ? "<img src=\"".concat(photo, "\">") : "👤", "</div><div class=\"chat-preview\"><div class=\"chat-preview-name\">").concat(safeText(profile.name || "User"), "</div><div class=\"chat-preview-msg\">").concat(lastMsg !== null && lastMsg !== void 0 && lastMsg.mine ? t("you") + ": " : "").concat(safeText((lastMsg === null || lastMsg === void 0 ? void 0 : lastMsg.text) || ""), "</div></div><div class=\"chat-time\">").concat(timeAgo(lastMsg === null || lastMsg === void 0 ? void 0 : lastMsg.ts), "</div>");
    container.appendChild(item);
  });
}
function openChat(peerId) {
  activeChatPeer = peerId;
  var profile = onlineProfiles.get(peerId) || {};
  $("chatPeerName").textContent = profile.name || "User";
  $("chatPeerStatus").textContent = onlineProfiles.has(peerId) ? t("online") : t("offline");
  var photo = profile.photo || null;
  $("chatPeerAvatar").innerHTML = photo ? "<img src=\"".concat(photo, "\">") : "👤";
  renderChatMessages(peerId);
  view("chatView");
  $("chatAudioCallBtn").style.display = matches.has(peerId) ? "" : "none";
  $("chatVideoCallBtn").style.display = matches.has(peerId) ? "" : "none";
}
function renderChatMessages(peerId) {
  var container = $("chatMessages");
  var msgs = conversations[peerId] || [];
  if (msgs.length === 0) {
    container.innerHTML = "<p class=\"empty\">".concat(t("noMessages"), "</p>");
    return;
  }
  container.innerHTML = "";
  msgs.forEach(function (msg) {
    var div = document.createElement("div");
    div.className = "message " + (msg.mine ? "mine" : "theirs");
    div.innerHTML = "".concat(safeText(msg.text), "<small>").concat(new Date(msg.ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }), "</small>");
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}
function sendChatMessage(text) {
  if (!activeChatPeer || !text) return;
  var msg = {
    text: text,
    mine: true,
    ts: Date.now()
  };
  if (!conversations[activeChatPeer]) conversations[activeChatPeer] = [];
  conversations[activeChatPeer].push(msg);
  lsSet(SK.CONVOS, conversations);
  sendViaLobby(activeChatPeer, {
    type: "chat-msg",
    from: peer.id,
    text: text,
    ts: msg.ts
  });
  renderChatMessages(activeChatPeer);
}
function receiveChatMessage(fromPeerId, text, ts) {
  if (!fromPeerId || !text) return;
  var msg = {
    text: text,
    mine: false,
    ts: ts || Date.now()
  };
  if (!conversations[fromPeerId]) conversations[fromPeerId] = [];
  conversations[fromPeerId].push(msg);
  lsSet(SK.CONVOS, conversations);
  if (activeChatPeer === fromPeerId) renderChatMessages(fromPeerId);
}
function initChatForm() {
  $("chatForm").onsubmit = function (e) {
    e.preventDefault();
    var input = $("chatInput");
    var text = safeText(input.value).trim();
    if (!text || !activeChatPeer) return;
    input.value = "";
    sendChatMessage(text);
  };
}
function showRemoteProfile(peerId, profile) {
  var photos = profile.photos || (profile.photo ? [profile.photo] : []);
  var photosRow = $("remoteProfilePhotos");
  photosRow.innerHTML = "";
  photos.forEach(function (photo) {
    var thumb = document.createElement("div");
    thumb.className = "profile-thumb";
    thumb.innerHTML = "<img src=\"".concat(photo, "\">");
    photosRow.appendChild(thumb);
  });
  $("remoteProfileName").textContent = "".concat(profile.name, ", ").concat(profile.age);
  var meta = [];
  if (profile.city) meta.push(" " + profile.city);
  if (profile.gender) meta.push(t(profile.gender));
  if (profile.profession) meta.push("💼 " + profile.profession);
  $("remoteProfileMeta").textContent = meta.join(" · ") || "";
  $("remoteProfileBio").textContent = profile.bio || "";
  var intDiv = $("remoteProfileInterests");
  intDiv.innerHTML = "";
  (profile.interests || []).forEach(function (i) {
    var tag = document.createElement("span");
    tag.className = "interest-display-tag";
    tag.textContent = i.charAt(0).toUpperCase() + i.slice(1);
    intDiv.appendChild(tag);
  });
  var detDiv = $("remoteProfileDetails");
  detDiv.innerHTML = "";
  if (profile.height) detDiv.innerHTML += "<div class=\"detail-item\"><span class=\"detail-icon\">\uD83D\uDCCF</span> ".concat(profile.height, " cm</div>");
  if (profile.education) detDiv.innerHTML += "<div class=\"detail-item\"><span class=\"detail-icon\">\uD83C\uDF93</span> ".concat(safeText(profile.education), "</div>");
  if (profile.lookingFor) detDiv.innerHTML += "<div class=\"detail-item\"><span class=\"detail-icon\">\uD83D\uDCAB</span> ".concat(t(profile.lookingFor), "</div>");
  show("viewProfileModal");
}
function startCall(_x0, _x1) {
  return _startCall.apply(this, arguments);
}
function _startCall() {
  _startCall = _asyncToGenerator(_regenerator().m(function _callee13(peerId, video) {
    var call, _t6;
    return _regenerator().w(function (_context13) {
      while (1) switch (_context13.p = _context13.n) {
        case 0:
          if (matches.has(peerId)) {
            _context13.n = 1;
            break;
          }
          return _context13.a(2);
        case 1:
          if (!(!supportsCalls() || !peer)) {
            _context13.n = 2;
            break;
          }
          alert(t("callUnsupported"));
          showBrowserCapabilityNotice();
          return _context13.a(2);
        case 2:
          _context13.p = 2;
          _context13.n = 3;
          return navigator.mediaDevices.getUserMedia({
            video: video ? {
              facingMode: "user"
            } : false,
            audio: true
          });
        case 3:
          localStream = _context13.v;
          call = peer.call(peerId, localStream, {
            metadata: {
              video: video
            }
          });
          activeCall = call;
          setupCallHandlers(call, video);
          show("chatCallControls");
          _context13.n = 5;
          break;
        case 4:
          _context13.p = 4;
          _t6 = _context13.v;
          console.error("Call error:", _t6);
        case 5:
          return _context13.a(2);
      }
    }, _callee13, null, [[2, 4]]);
  }));
  return _startCall.apply(this, arguments);
}
function setupCallHandlers(call, video) {
  var _myProfile2;
  var tiles = $("chatTiles");
  tiles.innerHTML = "";
  var localTile = document.createElement("div");
  localTile.className = "tile" + (video ? "" : " audio");
  localTile.innerHTML = video ? "<video autoplay muted playsinline></video><div class=\"tile-badge\">".concat(t("you"), "</div>") : "<div class=\"audio-placeholder\"><div class=\"audio-avatar\">".concat((((_myProfile2 = myProfile) === null || _myProfile2 === void 0 ? void 0 : _myProfile2.name) || "?").charAt(0), "</div><div class=\"audio-title\">").concat(t("you"), "</div></div>");
  if (video) attachMediaStream(localTile.querySelector("video"), localStream);
  tiles.appendChild(localTile);
  call.on("stream", function (remoteStream) {
    var remoteTile = document.createElement("div");
    remoteTile.className = "tile" + (video ? "" : " audio");
    var profile = onlineProfiles.get(call.peer) || {};
    remoteTile.innerHTML = video ? "<video autoplay playsinline></video><div class=\"tile-badge\">".concat(safeText(profile.name || "User"), "</div>") : "<div class=\"audio-placeholder\"><div class=\"audio-avatar\">".concat((profile.name || "?").charAt(0), "</div><div class=\"audio-title\">").concat(safeText(profile.name || "User"), "</div></div>");
    if (video) attachMediaStream(remoteTile.querySelector("video"), remoteStream);
    tiles.appendChild(remoteTile);
  });
  call.on("close", function () {
    return endCall();
  });
  call.on("error", function () {
    return endCall();
  });
}
function endCall() {
  if (activeCall) {
    try {
      activeCall.close();
    } catch (_) {}
  }
  activeCall = null;
  if (localStream) {
    localStream.getTracks().forEach(function (t) {
      return t.stop();
    });
    localStream = null;
  }
  hide("chatCallControls");
  $("chatTiles").innerHTML = "";
}
function showIncomingCallModal(call) {
  var profile = onlineProfiles.get(call.peer) || {};
  var photo = profile.photo || null;
  $("incomingCallerAvatar").innerHTML = photo ? "<img src=\"".concat(photo, "\">") : "👤";
  $("incomingCallerName").textContent = profile.name || "Incoming call";
  show("incomingModal");
  $("answerCallBtn").onclick = _asyncToGenerator(_regenerator().m(function _callee3() {
    var _call$metadata, _call$metadata2, _t;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          hide("incomingModal");
          _context3.p = 1;
          _context3.n = 2;
          return navigator.mediaDevices.getUserMedia({
            audio: true,
            video: ((_call$metadata = call.metadata) === null || _call$metadata === void 0 ? void 0 : _call$metadata.video) || false
          });
        case 2:
          localStream = _context3.v;
          call.answer(localStream);
          activeCall = call;
          setupCallHandlers(call, ((_call$metadata2 = call.metadata) === null || _call$metadata2 === void 0 ? void 0 : _call$metadata2.video) || false);
          if (activeChatPeer !== call.peer) openChat(call.peer);
          show("chatCallControls");
          _context3.n = 4;
          break;
        case 3:
          _context3.p = 3;
          _t = _context3.v;
          call.close();
        case 4:
          return _context3.a(2);
      }
    }, _callee3, null, [[1, 3]]);
  }));
  $("declineCallBtn").onclick = function () {
    hide("incomingModal");
    call.close();
    pendingCall = null;
  };
}
function toggleMic() {
  if (!localStream) return;
  var track = localStream.getAudioTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  var btn = $("chatMuteBtn");
  btn.textContent = track.enabled ? t("muteMic") : t("unmuteMic");
  btn.classList.toggle("active", !track.enabled);
}
function toggleCamera() {
  if (!localStream) return;
  var track = localStream.getVideoTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  var btn = $("chatCameraBtn");
  btn.textContent = track.enabled ? t("turnCameraOff") : t("turnCameraOn");
  btn.classList.toggle("active", !track.enabled);
}
var MAX_FILE_SIZE = 50 * 1024 * 1024,
  CHUNK_SIZE = 16384;
function handleChatFile(_x10) {
  return _handleChatFile.apply(this, arguments);
}
function _handleChatFile() {
  _handleChatFile = _asyncToGenerator(_regenerator().m(function _callee14(input) {
    var _input$files;
    var file, msg, reader;
    return _regenerator().w(function (_context14) {
      while (1) switch (_context14.n) {
        case 0:
          file = (_input$files = input.files) === null || _input$files === void 0 ? void 0 : _input$files[0];
          if (!(!file || !activeChatPeer)) {
            _context14.n = 1;
            break;
          }
          input.value = "";
          return _context14.a(2);
        case 1:
          if (!(file.size > MAX_FILE_SIZE)) {
            _context14.n = 2;
            break;
          }
          alert(t("fileTooBig"));
          input.value = "";
          return _context14.a(2);
        case 2:
          msg = {
            text: "\uD83D\uDCCE ".concat(file.name),
            mine: true,
            ts: Date.now()
          };
          if (!conversations[activeChatPeer]) conversations[activeChatPeer] = [];
          conversations[activeChatPeer].push(msg);
          lsSet(SK.CONVOS, conversations);
          renderChatMessages(activeChatPeer);
          reader = new FileReader();
          reader.onload = function () {
            var buffer = reader.result;
            var totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);
            sendViaLobby(activeChatPeer, {
              type: "file-meta",
              from: peer.id,
              fileName: file.name,
              fileSize: file.size,
              totalChunks: totalChunks
            });
            for (var i = 0; i < totalChunks; i++) {
              var start = i * CHUNK_SIZE,
                end = Math.min(start + CHUNK_SIZE, buffer.byteLength);
              sendViaLobby(activeChatPeer, {
                type: "file-chunk",
                from: peer.id,
                index: i,
                data: Array.from(new Uint8Array(buffer.slice(start, end)))
              });
            }
            sendViaLobby(activeChatPeer, {
              type: "file-end",
              from: peer.id
            });
          };
          reader.readAsArrayBuffer(file);
          input.value = "";
        case 3:
          return _context14.a(2);
      }
    }, _callee14);
  }));
  return _handleChatFile.apply(this, arguments);
}
function clearAllData() {
  return _clearAllData.apply(this, arguments);
}
function _clearAllData() {
  _clearAllData = _asyncToGenerator(_regenerator().m(function _callee15() {
    return _regenerator().w(function (_context15) {
      while (1) switch (_context15.n) {
        case 0:
          if (confirm(t("clearConfirm"))) {
            _context15.n = 1;
            break;
          }
          return _context15.a(2);
        case 1:
          Object.values(SK).forEach(function (k) {
            return lsRemove(k);
          });
          _context15.n = 2;
          return dbClear();
        case 2:
          myProfile = null;
          myPhotos = [];
          sentLikes = new Set();
          receivedLikes = new Set();
          matches = new Set();
          conversations = {};
          onlineProfiles.clear();
          hide("bottomNav");
          view("setupView");
        case 3:
          return _context15.a(2);
      }
    }, _callee15);
  }));
  return _clearAllData.apply(this, arguments);
}
function buildLangModal() {
  var list = $("langList");
  list.innerHTML = "";
  Object.keys(STRINGS).forEach(function (code) {
    var s = STRINGS[code];
    var btn = document.createElement("button");
    btn.className = "lang-btn" + (code === currentLang ? " current" : "");
    btn.innerHTML = "<span>".concat(s._name, "</span><span class=\"native\">").concat(s._native, "</span>");
    btn.onclick = function () {
      currentLang = code;
      lsSet(SK.LANG, code);
      applyI18n();
      buildLangModal();
      refreshDiscover();
      refreshInstallUI();
      if (activeChatPeer) renderChatMessages(activeChatPeer);
    };
    list.appendChild(btn);
  });
}
function isStandalone() {
  return Boolean(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
}
function isIosDevice() {
  var ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}
function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || "");
}
function installHelpText() {
  if (isStandalone()) return t("alreadyInstalled");
  if (isIosDevice()) return t("installIos");
  if (isAndroidDevice()) return t("installAndroid");
  if (/Windows|Macintosh|Linux/i.test(navigator.userAgent || "")) return t("installDesktop");
  return t("installUnavailable");
}
function refreshInstallUI() {
  var installed = isStandalone();
  var profileButton = $("installProfileBtn");
  if (profileButton) profileButton.classList.toggle("hidden", installed);
  var instructions = $("installInstructionsText");
  if (instructions) instructions.textContent = installHelpText();
  if (installed) hide("installBanner");
  updateAppNotice();
}
function requestInstall() {
  return _requestInstall.apply(this, arguments);
}
function _requestInstall() {
  _requestInstall = _asyncToGenerator(_regenerator().m(function _callee16() {
    var promptEvent, _t7;
    return _regenerator().w(function (_context16) {
      while (1) switch (_context16.p = _context16.n) {
        case 0:
          if (!isStandalone()) {
            _context16.n = 1;
            break;
          }
          $("installInstructionsText").textContent = t("alreadyInstalled");
          show("installModal");
          return _context16.a(2);
        case 1:
          if (!deferredInstallPrompt) {
            _context16.n = 6;
            break;
          }
          promptEvent = deferredInstallPrompt;
          deferredInstallPrompt = null;
          promptEvent.prompt();
          _context16.p = 2;
          _context16.n = 3;
          return promptEvent.userChoice;
        case 3:
          _context16.n = 5;
          break;
        case 4:
          _context16.p = 4;
          _t7 = _context16.v;
        case 5:
          hide("installBanner");
          refreshInstallUI();
          return _context16.a(2);
        case 6:
          $("installInstructionsText").textContent = installHelpText();
          show("installModal");
        case 7:
          return _context16.a(2);
      }
    }, _callee16, null, [[2, 4]]);
  }));
  return _requestInstall.apply(this, arguments);
}
function initInstallExperience() {
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (!isStandalone()) show("installBanner");
  });
  window.addEventListener("appinstalled", function () {
    deferredInstallPrompt = null;
    hide("installBanner");
    hide("installModal");
    refreshInstallUI();
  });
  $("installBannerBtn").onclick = requestInstall;
  $("installLaterBtn").onclick = function () {
    return hide("installBanner");
  };
  $("installProfileBtn").onclick = requestInstall;
  $("closeInstallBtn").onclick = function () {
    return hide("installModal");
  };
  $("installModal").onclick = function (event) {
    if (event.target === $("installModal")) hide("installModal");
  };
  if (!isStandalone() && (isIosDevice() || isAndroidDevice())) setTimeout(function () {
    if (!isStandalone()) show("installBanner");
  }, 1200);
  refreshInstallUI();
}
function updateAppNotice() {
  var notice = $("appNotice"),
    text = $("appNoticeText");
  if (!notice || !text) return;
  if (navigator.onLine === false) {
    text.textContent = t("offlineNotice");
    show("appNotice");
    return;
  }
  if (!supportsCalls() || typeof window.Peer !== "function") {
    text.textContent = t("limitedBrowser");
    show("appNotice");
    return;
  }
  hide("appNotice");
}
function showBrowserCapabilityNotice() {
  updateAppNotice();
}
function initNetworkStatus() {
  window.addEventListener("online", function () {
    updateAppNotice();
    if (!peer) initPeer();
  });
  window.addEventListener("offline", updateAppNotice);
  $("dismissNoticeBtn").onclick = function () {
    return hide("appNotice");
  };
  updateAppNotice();
}
function registerSW() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("./sw.js", {
      scope: "./"
    }).catch(function () {});
  }
}
function init() {
  return _init.apply(this, arguments);
}
function _init() {
  _init = _asyncToGenerator(_regenerator().m(function _callee17() {
    var setupDone;
    return _regenerator().w(function (_context17) {
      while (1) switch (_context17.n) {
        case 0:
          applyTheme();
          applyI18n();
          registerSW();
          initInstallExperience();
          initNetworkStatus();
          loadLocalProfile();
          _context17.n = 1;
          return loadPhotosFromDB();
        case 1:
          initSetupView();
          initNavigation();
          initChatForm();
          $("editProfileBtn").onclick = openEditProfile;
          $("cancelEditBtn").onclick = function () {
            return view("profileView");
          };
          $("saveEditBtn").onclick = saveEditProfile;
          $("themeBtn").onclick = toggleTheme;
          $("langBtn").onclick = function () {
            buildLangModal();
            show("langModal");
          };
          $("closeLangBtn").onclick = function () {
            return hide("langModal");
          };
          $("clearDataBtn").onclick = clearAllData;
          $("closeViewProfileBtn").onclick = function () {
            return hide("viewProfileModal");
          };
          $("viewProfileModal").onclick = function (e) {
            if (e.target === $("viewProfileModal")) hide("viewProfileModal");
          };
          $("chatBackBtn").onclick = function () {
            endCall();
            view("chatListView");
            renderChatListView();
          };
          $("chatAudioCallBtn").onclick = function () {
            if (activeChatPeer) startCall(activeChatPeer, false);
          };
          $("chatVideoCallBtn").onclick = function () {
            if (activeChatPeer) startCall(activeChatPeer, true);
          };
          $("chatMuteBtn").onclick = toggleMic;
          $("chatCameraBtn").onclick = toggleCamera;
          $("chatHangupBtn").onclick = endCall;
          $("matchModal").onclick = function (e) {
            if (e.target === $("matchModal")) hide("matchModal");
          };
          $("incomingModal").onclick = function (e) {
            if (e.target === $("incomingModal")) hide("incomingModal");
          };
          $("langModal").onclick = function (e) {
            if (e.target === $("langModal")) hide("langModal");
          };
          $("refreshDiscoverBtn").onclick = refreshDiscover;
          setupDone = lsGet(SK.SETUP_DONE, false);
          if (setupDone && myProfile) {
            showMainApp();
          } else {
            view("setupView");
          }
          initPeer();
          window.addEventListener("beforeunload", function () {
            if (localStream) localStream.getTracks().forEach(function (t) {
              return t.stop();
            });
          });
        case 2:
          return _context17.a(2);
      }
    }, _callee17);
  }));
  return _init.apply(this, arguments);
}
init().catch(function (error) {
  if (window.console && console.error) console.error("PeerCall could not start:", error);
  var notice = $("appNoticeText");
  if (notice) {
    notice.textContent = t("limitedBrowser");
    show("appNotice");
  }
});
