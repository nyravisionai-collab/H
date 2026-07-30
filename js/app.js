/* Static PeerJS calling app. Room membership is coordinated by the creator's
   temporary PeerJS ID; media and messages travel peer-to-peer. */
"use strict";

const $ = (id) => document.getElementById(id);
const statusEl = $("status"), myIdEl = $("myId");

let peer, localStream = null, privateCall = null, pendingPrivate = null;
let privateConnection = null, room = null, pendingGroupCalls = [], groupCalls = new Map();
let reconnectAttempts = 0, roomJoinTimer = null, inGroupCall = false;
let myProfile = { name: "", avatar: "👤", color: "#5b8cff", useInitials: false };
const remoteProfiles = new Map(); // peerId -> { name, avatar, color, useInitials }
let screenStream = null; // active screen-share MediaStream if any

/* -------------------------------------------------------------------------- */
/* i18n                                                                       */
/* -------------------------------------------------------------------------- */
const STRINGS = {
  en: {
    _name: "English", _native: "English",
    appTitle: "Peer Call",
    eyebrow: "Browser WebRTC",
    subtitle: "Private calls, temporary rooms, chat, and file sharing — no sign-up needed.",
    connecting: "Connecting…",
    profile: "Profile",
    callFriendTitle: "Call a Friend",
    callFriendDesc: "Share your Peer ID for one-to-one audio, video, chat, and files.",
    joinRoomTitle: "Join a Room",
    joinRoomDesc: "Create or join a temporary group room with audio, video, chat, and files.",
    back: "Back",
    yourId: "Your ID",
    copy: "Copy",
    enterFriendId: "Enter friend's ID",
    videoCall: "Video Call",
    audioCall: "Audio Call",
    incomingPrivate: "Incoming private call",
    answer: "Answer",
    muteMic: "Mute mic",
    unmuteMic: "Unmute mic",
    turnCameraOff: "Turn camera off",
    turnCameraOn: "Turn camera on",
    audioOnly: "Audio only",
    shareScreen: "Share screen",
    stopShare: "Stop sharing",
    hangUp: "Hang Up",
    privateChat: "Private chat",
    enterFriendIdStart: "Enter a friend's ID to start chatting.",
    clear: "Clear",
    noMessages: "No messages yet",
    typeMessage: "Type a message…",
    send: "Send",
    groupRoom: "Group Room",
    leaveRoom: "Leave Room",
    roomNote: "Rooms are temporary and exist only while their creator stays online.",
    createRoom: "Create a Room",
    or: "or",
    roomCodePh: "6-character code",
    joinRoom: "Join Room",
    roomCode: "Room code",
    copyCode: "Copy code",
    liveParticipants: "Live Participants",
    groupCall: "Group call",
    startVideoCall: "Start Video Call",
    startAudioCall: "Start Audio Call",
    answerGroup: "Answer Group Call",
    endCallEveryone: "End Call for Everyone",
    noGroupCall: "No group call is active.",
    roomChat: "Room chat",
    roomChatNote: "Messages are shared only with current room participants.",
    messageRoom: "Message the room…",
    incomingGroupCall: "Incoming group call",
    joinCallQ: "Join the call?",
    notNow: "Not now",
    yourProfile: "Your Profile",
    profileNote: "Set your display name, color and emoji avatar. Saved on this device and shared with peers you connect to.",
    profilePreviewHelp: "This is how others will see you.",
    name: "Name",
    yourNamePh: "Your name",
    avatarEmoji: "Avatar (emoji)",
    profileColor: "Color (for initials)",
    useInitialsAvatar: "Use colored initials instead of emoji in participant list & call tiles",
    save: "Save",
    cancel: "Cancel",
    chooseLanguage: "Choose language",
    close: "Close",
    ready: "Ready. Choose Call a Friend or Join a Room.",
    copied: "Copied",
    copiedRoom: "Room code copied!",
    nothingCopy: "Nothing to copy yet.",
    clipboardFail: "Could not copy to clipboard.",
    fileTooBig: "File is too large (max {size}).",
    fileUnsupported: "Camera/microphone access is unsupported in this browser.",
    micDenied: "Microphone/camera permission was denied or is unavailable.",
    friendIdEmpty: "Enter a friend's ID first.",
    ownId: "You cannot call your own ID.",
    endGroupFirst: "End the group call before starting a private call.",
    endPrivateFirst: "End the private call before starting a group call.",
    calling: "Calling {id}…",
    privateEnded: "Private call ended.",
    invalidCode: "Enter a valid 6-character room code.",
    stillConnecting: "Still connecting — please try again.",
    lookingRoom: "Looking for room {code}…",
    roomCreated: "Room created. Share code {code}.",
    roomJoined: "Joining room {code}…",
    roomNotFound: "Room not found or creator is offline.",
    roomClosed: "The room creator left; this room is closed.",
    leftRoom: "You left the room.",
    notConnectedRoom: "Not connected to the room.",
    noOtherParticipants: "No other room participants are connected yet.",
    groupVideoActive: "A group video call is active.",
    groupAudioActive: "A group audio call is active.",
    incomingGroupVideo: "A participant is inviting you to the group video call.",
    incomingGroupAudio: "A participant is inviting you to the group audio call.",
    groupCalling: "Calling everyone in the room…",
    groupConnected: "Connected to group call.",
    profileSaved: "Profile saved!",
    cantConnectChat: "Could not connect to chat.",
    connectingChat: "Connecting to chat…",
    connectingFile: "Connecting for file transfer…",
    cantConnectFile: "Could not connect for file transfer.",
    rejectedFile: "Rejected an incoming file with invalid metadata.",
    fileTimeout: "File transfer timed out.",
    fileIncomplete: "File transfer is incomplete.",
    fileSizeMismatch: "File size mismatch — transfer stopped.",
    fileIntegrityFail: "Integrity check failed — file may be corrupted.",
    fileChunkInvalid: "File transfer stopped: invalid chunk size.",
    fileTooMuchData: "File transfer stopped: received too much data.",
    sendFileFail: "Failed to send file.",
    waitingFile: "Waiting for file…",
    sending: "Sending… {pct}%",
    receiving: "Receiving… {pct}%",
    verifying: "Verifying…",
    sent: "Sent",
    received: "Received",
    disconnectedReconnect: "Disconnected from the signaling server — reconnecting…",
    connectionError: "Connection error: {type}.",
    chatDisconnected: "Chat disconnected.",
    screenShareUnsupported: "Screen sharing is not supported in this browser.",
    screenShareError: "Could not start screen sharing.",
    sharing: "Sharing: {name}",
    you: "You",
    participant: "Participant",
    participantsOnline: "{n} participant{s} online",
    onlineCount: "{n} online",
  },
  gu: {
    _name: "Gujarati", _native: "ગુજરાતી",
    appTitle: "પીઅર કૉલ",
    eyebrow: "બ્રાઉઝર WebRTC",
    subtitle: "ખાનગી કૉલ, અસ્થાયી રૂમ, ચેટ અને ફાઇલ શેરિંગ — કોઈ સાઇન-અપ નહીં.",
    connecting: "કનેક્ટ થઈ રહ્યું છે…",
    profile: "પ્રોફાઇલ",
    callFriendTitle: "મિત્રને કૉલ કરો",
    callFriendDesc: "એક-થી-એક ઑડિઓ, વીડિયો, ચેટ અને ફાઇલો માટે તમારો Peer ID શેર કરો.",
    joinRoomTitle: "રૂમમાં જોડાઓ",
    joinRoomDesc: "ઑડિઓ, વીડિયો, ચેટ અને ફાઇલો સાથે અસ્થાયી જૂથ રૂમ બનાવો અથવા જોડાઓ.",
    back: "પાછા",
    yourId: "તમારો ID",
    copy: "કૉપિ",
    enterFriendId: "મિત્રનો ID દાખલ કરો",
    videoCall: "વીડિયો કૉલ",
    audioCall: "ઑડિઓ કૉલ",
    incomingPrivate: "આવતી ખાનગી કૉલ",
    answer: "જવાબ આપો",
    muteMic: "માઇક મ્યૂટ કરો",
    unmuteMic: "માઇક અનમ્યૂટ કરો",
    turnCameraOff: "કૅમેરા બંધ કરો",
    turnCameraOn: "કૅમેરા ચાલુ કરો",
    audioOnly: "ફક્ત ઑડિઓ",
    shareScreen: "સ્ક્રીન શેર કરો",
    stopShare: "શેર કરવાનું બંધ કરો",
    hangUp: "કૉલ કાપો",
    privateChat: "ખાનગી ચેટ",
    enterFriendIdStart: "ચેટ શરૂ કરવા મિત્રનો ID દાખલ કરો.",
    clear: "સાફ કરો",
    noMessages: "હજુ સુધી કોઈ સંદેશ નથી",
    typeMessage: "સંદેશ લખો…",
    send: "મોકલો",
    groupRoom: "જૂથ રૂમ",
    leaveRoom: "રૂમ છોડો",
    roomNote: "રૂમ અસ્થાયી છે અને બનાવનાર ઑનલાઇન હોય ત્યાં સુધી જ અસ્તિત્વમાં છે.",
    createRoom: "રૂમ બનાવો",
    or: "અથવા",
    roomCodePh: "6-અક્ષરનો કોડ",
    joinRoom: "રૂમમાં જોડાઓ",
    roomCode: "રૂમ કોડ",
    copyCode: "કોડ કૉપિ કરો",
    liveParticipants: "જીવંત સહભાગીઓ",
    groupCall: "જૂથ કૉલ",
    startVideoCall: "વીડિયો કૉલ શરૂ કરો",
    startAudioCall: "ઑડિઓ કૉલ શરૂ કરો",
    answerGroup: "જૂથ કૉલનો જવાબ આપો",
    endCallEveryone: "બધા માટે કૉલ સમાપ્ત કરો",
    noGroupCall: "કોઈ જૂથ કૉલ સક્રિય નથી.",
    roomChat: "રૂમ ચેટ",
    roomChatNote: "સંદેશાઓ ફક્ત વર્તમાન રૂમ સહભાગીઓ સાથે શેર થાય છે.",
    messageRoom: "રૂમમાં સંદેશ મોકલો…",
    incomingGroupCall: "આવતો જૂથ કૉલ",
    joinCallQ: "કૉલમાં જોડાશો?",
    notNow: "હમણાં નહીં",
    yourProfile: "તમારી પ્રોફાઇલ",
    profileNote: "તમારું નામ, રંગ અને ઇમોજી અવતાર સેટ કરો. આ ઉપકરણ પર સાચવેલ છે અને કનેક્ટ થતા મિત્રો સાથે શેર થાય છે.",
    profilePreviewHelp: "આ રીતે અન્ય લોકો તમને જોશે.",
    name: "નામ",
    yourNamePh: "તમારું નામ",
    avatarEmoji: "અવતાર (ઇમોજી)",
    profileColor: "રંગ (આદ્યાક્ષરો માટે)",
    useInitialsAvatar: "સહભાગી યાદી અને કૉલ ટાઇલ્સમાં ઇમોજીને બદલે રંગીન આદ્યાક્ષરો વાપરો",
    save: "સાચવો",
    cancel: "રદ કરો",
    chooseLanguage: "ભાષા પસંદ કરો",
    close: "બંધ કરો",
    ready: "તૈયાર. મિત્રને કૉલ કરો અથવા રૂમમાં જોડાઓ.",
    copied: "કૉપિ થયું",
    copiedRoom: "રૂમ કોડ કૉપિ થયો!",
    nothingCopy: "હજુ કૉપિ કરવા જેવું કંઈ નથી.",
    clipboardFail: "ક્લિપબોર્ડ પર કૉપિ કરી શકાયું નહીં.",
    fileTooBig: "ફાઇલ ઘણી મોટી છે (મહત્તમ {size}).",
    fileUnsupported: "આ બ્રાઉઝરમાં કૅમેરા/માઇક્રોફોન સપોર્ટેડ નથી.",
    micDenied: "માઇક્રોફોન/કૅમેરાની પરવાનગી નકારી કાઢવામાં આવી.",
    friendIdEmpty: "પહેલા મિત્રનો ID દાખલ કરો.",
    ownId: "તમે તમારા પોતાના ID પર કૉલ ન કરી શકો.",
    endGroupFirst: "ખાનગી કૉલ શરૂ કરતા પહેલા જૂથ કૉલ સમાપ્ત કરો.",
    endPrivateFirst: "જૂથ કૉલ શરૂ કરતા પહેલા ખાનગી કૉલ સમાપ્ત કરો.",
    calling: "{id} ને કૉલ કરી રહ્યા છીએ…",
    privateEnded: "ખાનગી કૉલ સમાપ્ત.",
    invalidCode: "માન્ય 6-અક્ષરનો રૂમ કોડ દાખલ કરો.",
    stillConnecting: "હજી કનેક્ટ થઈ રહ્યું છે — ફરી પ્રયાસ કરો.",
    lookingRoom: "રૂમ {code} શોધી રહ્યા છીએ…",
    roomCreated: "રૂમ બન્યો. કોડ {code} શેર કરો.",
    roomJoined: "રૂમ {code} માં જોડાઈ રહ્યા છીએ…",
    roomNotFound: "રૂમ મળ્યો નહીં અથવા બનાવનાર ઑફલાઇન છે.",
    roomClosed: "રૂમ બનાવનાર ચાલ્યો ગયો; રૂમ બંધ થયું.",
    leftRoom: "તમે રૂમ છોડી દીધું.",
    notConnectedRoom: "રૂમ સાથે કનેક્ટેડ નથી.",
    noOtherParticipants: "હજુ સુધી કોઈ અન્ય સહભાગી કનેક્ટેડ નથી.",
    groupVideoActive: "એક જૂથ વીડિયો કૉલ ચાલુ છે.",
    groupAudioActive: "એક જૂથ ઑડિઓ કૉલ ચાલુ છે.",
    incomingGroupVideo: "એક સહભાગી તમને જૂથ વીડિયો કૉલમાં આમંત્રિત કરી રહ્યો છે.",
    incomingGroupAudio: "એક સહભાગી તમને જૂથ ઑડિઓ કૉલમાં આમંત્રિત કરી રહ્યો છે.",
    groupCalling: "રૂમના દરેકને કૉલ કરી રહ્યા છીએ…",
    groupConnected: "જૂથ કૉલ સાથે કનેક્ટેડ.",
    profileSaved: "પ્રોફાઇલ સાચવી!",
    cantConnectChat: "ચેટ કનેક્ટ કરી શકાઈ નથી.",
    connectingChat: "ચેટ સાથે કનેક્ટ થઈ રહ્યું છે…",
    connectingFile: "ફાઇલ ટ્રાન્સફર માટે કનેક્ટ થઈ રહ્યું છે…",
    cantConnectFile: "ફાઇલ ટ્રાન્સફર માટે કનેક્ટ કરી શકાયું નહીં.",
    rejectedFile: "અમાન્ય મેટાડેટા સાથે આવતી ફાઇલ નકારી.",
    fileTimeout: "ફાઇલ ટ્રાન્સફરનો સમય પૂરો.",
    fileIncomplete: "ફાઇલ ટ્રાન્સફર અધૂરી છે.",
    fileSizeMismatch: "ફાઇલ કદ મેળ ખાતું નથી — ટ્રાન્સફર અટકાવ્યું.",
    fileIntegrityFail: "અખંડિતતા ચકાસણી નિષ્ફળ — ફાઇલ દૂષિત હોઈ શકે છે.",
    fileChunkInvalid: "ફાઇલ ટ્રાન્સફર બંધ: અમાન્ય ખંડ કદ.",
    fileTooMuchData: "ફાઇલ ટ્રાન્સફર બંધ: વધુ પડતો ડેટા મળ્યો.",
    sendFileFail: "ફાઇલ મોકલવામાં નિષ્ફળ.",
    waitingFile: "ફાઇલની રાહ જોઈ રહ્યા છીએ…",
    sending: "મોકલી રહ્યા છીએ… {pct}%",
    receiving: "મેળવી રહ્યા છીએ… {pct}%",
    verifying: "ચકાસણી થઈ રહી છે…",
    sent: "મોકલ્યું",
    received: "પ્રાપ્ત થયું",
    disconnectedReconnect: "સિગ્નલિંગ સર્વરથી ડિસ્કનેક્ટ — ફરી કનેક્ટ થઈ રહ્યું છે…",
    connectionError: "કનેક્શન ભૂલ: {type}.",
    chatDisconnected: "ચેટ ડિસ્કનેક્ટ થઈ.",
    screenShareUnsupported: "આ બ્રાઉઝરમાં સ્ક્રીન શેરિંગ સપોર્ટેડ નથી.",
    screenShareError: "સ્ક્રીન શેરિંગ શરૂ કરી શકાયું નહીં.",
    sharing: "શેર કરી રહ્યા છીએ: {name}",
    you: "તમે",
    participant: "સહભાગી",
    participantsOnline: "{n} સહભાગી ઓનલાઇન",
    onlineCount: "{n} ઓનલાઇન",
  },
  hi: {
    _name: "Hindi", _native: "हिन्दी",
    appTitle: "पीयर कॉल",
    eyebrow: "ब्राउज़र WebRTC",
    subtitle: "निजी कॉल, अस्थायी रूम, चैट और फ़ाइल शेयरिंग — कोई साइन-अप नहीं.",
    connecting: "कनेक्ट हो रहा है…",
    profile: "प्रोफ़ाइल",
    callFriendTitle: "दोस्त को कॉल करें",
    callFriendDesc: "एक-से-एक ऑडियो, वीडियो, चैट और फ़ाइलों के लिए अपनी Peer ID साझा करें.",
    joinRoomTitle: "रूम में शामिल हों",
    joinRoomDesc: "ऑडियो, वीडियो, चैट और फ़ाइलों के साथ अस्थायी समूह रूम बनाएँ या उसमें शामिल हों.",
    back: "वापस",
    yourId: "आपकी ID",
    copy: "कॉपी",
    enterFriendId: "दोस्त की ID दर्ज करें",
    videoCall: "वीडियो कॉल",
    audioCall: "ऑडियो कॉल",
    incomingPrivate: "इनकमिंग निजी कॉल",
    answer: "जवाब दें",
    muteMic: "माइक म्यूट करें",
    unmuteMic: "माइक अनम्यूट करें",
    turnCameraOff: "कैमरा बंद करें",
    turnCameraOn: "कैमरा चालू करें",
    audioOnly: "केवल ऑडियो",
    shareScreen: "स्क्रीन शेयर करें",
    stopShare: "शेयर करना बंद करें",
    hangUp: "कॉल काटें",
    privateChat: "निजी चैट",
    enterFriendIdStart: "चैट शुरू करने के लिए दोस्त की ID दर्ज करें.",
    clear: "साफ़ करें",
    noMessages: "अभी कोई संदेश नहीं",
    typeMessage: "संदेश लिखें…",
    send: "भेजें",
    groupRoom: "समूह रूम",
    leaveRoom: "रूम छोड़ें",
    roomNote: "रूम अस्थायी हैं और केवल निर्माता के ऑनलाइन रहने तक मौजूद हैं.",
    createRoom: "रूम बनाएँ",
    or: "या",
    roomCodePh: "6-अक्षर का कोड",
    joinRoom: "रूम में शामिल हों",
    roomCode: "रूम कोड",
    copyCode: "कोड कॉपी करें",
    liveParticipants: "लाइव प्रतिभागी",
    groupCall: "समूह कॉल",
    startVideoCall: "वीडियो कॉल शुरू करें",
    startAudioCall: "ऑडियो कॉल शुरू करें",
    answerGroup: "समूह कॉल का जवाब दें",
    endCallEveryone: "सभी के लिए कॉल समाप्त करें",
    noGroupCall: "कोई समूह कॉल सक्रिय नहीं है.",
    roomChat: "रूम चैट",
    roomChatNote: "संदेश केवल वर्तमान रूम प्रतिभागियों के साथ साझा किए जाते हैं.",
    messageRoom: "रूम में संदेश भेजें…",
    incomingGroupCall: "इनकमिंग समूह कॉल",
    joinCallQ: "कॉल में शामिल होंगे?",
    notNow: "अभी नहीं",
    yourProfile: "आपकी प्रोफ़ाइल",
    profileNote: "अपना नाम, रंग और इमोजी अवतार सेट करें. इस डिवाइस पर सहेजा जाता है और कनेक्ट होने वाले मित्रों के साथ साझा होता है.",
    profilePreviewHelp: "दूसरे आपको ऐसे देखेंगे.",
    name: "नाम",
    yourNamePh: "आपका नाम",
    avatarEmoji: "अवतार (इमोजी)",
    profileColor: "रंग (आद्याक्षरों के लिए)",
    useInitialsAvatar: "सहभागी सूची और कॉल टाइल्स में इमोजी के बजाय रंगीन आद्याक्षर उपयोग करें",
    save: "सहेजें",
    cancel: "रद्द करें",
    chooseLanguage: "भाषा चुनें",
    close: "बंद करें",
    ready: "तैयार. दोस्त को कॉल करें या रूम में शामिल हों.",
    copied: "कॉपी हो गया",
    copiedRoom: "रूम कोड कॉपी हो गया!",
    nothingCopy: "अभी कॉपी करने के लिए कुछ नहीं.",
    clipboardFail: "क्लिपबोर्ड पर कॉपी नहीं कर सका.",
    fileTooBig: "फ़ाइल बहुत बड़ी है (अधिकतम {size}).",
    fileUnsupported: "इस ब्राउज़र में कैमरा/माइक्रोफ़ोन समर्थित नहीं है.",
    micDenied: "माइक्रोफ़ोन/कैमरा की अनुमति अस्वीकृत या अनुपलब्ध है.",
    friendIdEmpty: "पहले दोस्त की ID दर्ज करें.",
    ownId: "आप अपनी खुद की ID को कॉल नहीं कर सकते.",
    endGroupFirst: "निजी कॉल शुरू करने से पहले समूह कॉल समाप्त करें.",
    endPrivateFirst: "समूह कॉल शुरू करने से पहले निजी कॉल समाप्त करें.",
    calling: "{id} को कॉल कर रहे हैं…",
    privateEnded: "निजी कॉल समाप्त.",
    invalidCode: "वैध 6-अक्षर का रूम कोड दर्ज करें.",
    stillConnecting: "अभी कनेक्ट हो रहा है — कृपया पुनः प्रयास करें.",
    lookingRoom: "रूम {code} खोज रहे हैं…",
    roomCreated: "रूम बन गया. कोड {code} साझा करें.",
    roomJoined: "रूम {code} में शामिल हो रहे हैं…",
    roomNotFound: "रूम नहीं मिला या निर्माता ऑफ़लाइन है.",
    roomClosed: "रूम निर्माता चला गया; रूम बंद हो गया.",
    leftRoom: "आपने रूम छोड़ दिया.",
    notConnectedRoom: "रूम से कनेक्टेड नहीं हैं.",
    noOtherParticipants: "अभी तक कोई अन्य प्रतिभागी कनेक्टेड नहीं है.",
    groupVideoActive: "एक समूह वीडियो कॉल सक्रिय है.",
    groupAudioActive: "एक समूह ऑडियो कॉल सक्रिय है.",
    incomingGroupVideo: "एक प्रतिभागी आपको समूह वीडियो कॉल में आमंत्रित कर रहा है.",
    incomingGroupAudio: "एक प्रतिभागी आपको समूह ऑडियो कॉल में आमंत्रित कर रहा है.",
    groupCalling: "रूम में सभी को कॉल कर रहे हैं…",
    groupConnected: "समूह कॉल से कनेक्टेड.",
    profileSaved: "प्रोफ़ाइल सहेजी गई!",
    cantConnectChat: "चैट कनेक्ट नहीं कर सका.",
    connectingChat: "चैट से कनेक्ट हो रहा है…",
    connectingFile: "फ़ाइल स्थानांतरण के लिए कनेक्ट हो रहा है…",
    cantConnectFile: "फ़ाइल स्थानांतरण के लिए कनेक्ट नहीं कर सका.",
    rejectedFile: "अमान्य मेटाडेटा वाली आने वाली फ़ाइल अस्वीकृत.",
    fileTimeout: "फ़ाइल स्थानांतरण का समय समाप्त.",
    fileIncomplete: "फ़ाइल स्थानांतरण अधूरा है.",
    fileSizeMismatch: "फ़ाइल आकार मेल नहीं खाता — स्थानांतरण रोका गया.",
    fileIntegrityFail: "अखंडता जांच विफल — फ़ाइल दूषित हो सकती है.",
    fileChunkInvalid: "फ़ाइल स्थानांतरण रोका गया: अमान्य खंड आकार.",
    fileTooMuchData: "फ़ाइल स्थानांतरण रोका गया: बहुत अधिक डेटा प्राप्त हुआ.",
    sendFileFail: "फ़ाइल भेजने में विफल.",
    waitingFile: "फ़ाइल की प्रतीक्षा कर रहे हैं…",
    sending: "भेज रहे हैं… {pct}%",
    receiving: "प्राप्त कर रहे हैं… {pct}%",
    verifying: "सत्यापित कर रहे हैं…",
    sent: "भेजा गया",
    received: "प्राप्त हुआ",
    disconnectedReconnect: "सिग्नलिंग सर्वर से डिस्कनेक्ट — फिर से कनेक्ट हो रहा है…",
    connectionError: "कनेक्शन त्रुटि: {type}.",
    chatDisconnected: "चैट डिस्कनेक्ट हो गई.",
    screenShareUnsupported: "इस ब्राउज़र में स्क्रीन शेयरिंग समर्थित नहीं है.",
    screenShareError: "स्क्रीन शेयरिंग शुरू नहीं कर सका.",
    sharing: "शेयर कर रहे हैं: {name}",
    you: "आप",
    participant: "प्रतिभागी",
    participantsOnline: "{n} प्रतिभागी ऑनलाइन",
    onlineCount: "{n} ऑनलाइन",
  },
};

let currentLang = localStorage.getItem("peerLang") || "en";
function t(key, vars) {
  const s = (STRINGS[currentLang] && STRINGS[currentLang][key]) || STRINGS.en[key] || key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : "{" + k + "}"));
}
function applyI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });
  if (statusEl && statusEl.dataset.currentKey) {
    statusEl.textContent = t(statusEl.dataset.currentKey, JSON.parse(statusEl.dataset.currentVars || "{}"));
  }
  // Update lang button label
  const langBtn = $("langBtn");
  if (langBtn) {
    const code = currentLang.toUpperCase();
    langBtn.textContent = "🌐 " + code;
    langBtn.title = STRINGS[currentLang]._name || "Language";
  }
}
function status(key, vars) {
  statusEl.dataset.currentKey = key || "";
  statusEl.dataset.currentVars = vars ? JSON.stringify(vars) : "";
  statusEl.textContent = key ? t(key, vars) : "";
}
function buildLangModal() {
  const list = $("langList");
  list.innerHTML = "";
  Object.keys(STRINGS).forEach((code) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-btn" + (code === currentLang ? " current" : "");
    btn.innerHTML = `<span>${STRINGS[code]._name}</span><span class="native">${STRINGS[code]._native}</span>`;
    btn.onclick = () => {
      currentLang = code;
      localStorage.setItem("peerLang", code);
      applyI18n();
      buildLangModal();
      // update any dynamic UI that uses translated text
      if (room) updateRoomUI();
      updateParticipantsList();
      updateMediaControls();
    };
    list.appendChild(btn);
  });
}

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */
let currentTheme = localStorage.getItem("peerTheme") || "dark";
function applyTheme() {
  document.body.dataset.theme = currentTheme;
  localStorage.setItem("peerTheme", currentTheme);
  const btn = $("themeBtn");
  if (btn) btn.textContent = currentTheme === "dark" ? "🌙" : "☀️";
}
function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme();
}

/* -------------------------------------------------------------------------- */
/* Profile (local + remote)                                                   */
/* -------------------------------------------------------------------------- */
const AVATAR_COLORS = [
  "#5b8cff", "#ef476f", "#3ddc97", "#f4b740", "#b975ff",
  "#ff7a59", "#00c2a8", "#ff4fa3", "#7c8cff", "#5cc8ff",
  "#e6b450", "#8b5cf6", "#f97316", "#10b981", "#e11d48",
];
function randomName() { return "User" + Math.floor(Math.random() * 9000 + 1000); }
function randomColor() { return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]; }
function initialsOf(name) {
  const n = (name || "").trim();
  if (!n) return "?";
  // Take first letter of first two words
  const parts = n.split(/\s+/).slice(0, 2).map((p) => [...p][0] || "");
  const s = parts.join("").toUpperCase();
  return s.slice(0, 2);
}
function sanitizeProfile(p) {
  if (!p || typeof p !== "object") return null;
  const name = typeof p.name === "string" ? p.name.trim().slice(0, 24) : "";
  const avatar = typeof p.avatar === "string" ? Array.from(p.avatar).slice(0, 4).join("") : "";
  const color = typeof p.color === "string" && /^#[0-9a-f]{3,8}$/i.test(p.color) ? p.color : "#5b8cff";
  const useInitials = Boolean(p.useInitials);
  if (!name) return null;
  return { name, avatar: avatar || "👤", color, useInitials };
}
function profileFor(id) {
  if (id && id === peer?.id) return myProfile;
  return remoteProfiles.get(id) || { name: t("participant"), avatar: "👥", color: "#6b7280", useInitials: false };
}
function buildAvatarEl(profile, sizeClass) {
  const el = document.createElement("div");
  el.className = "avatar" + (sizeClass ? " " + sizeClass : "");
  if (profile.useInitials) {
    el.classList.add("initials");
    el.textContent = initialsOf(profile.name);
    el.style.background = profile.color || "var(--primary)";
  } else {
    el.textContent = profile.avatar || "👤";
    el.style.background = profile.color || "var(--primary)";
  }
  return el;
}
function loadProfile() {
  try {
    const saved = localStorage.getItem("peerProfile");
    if (saved) {
      const parsed = JSON.parse(saved);
      const clean = sanitizeProfile({ name: parsed.name, avatar: parsed.avatar, color: parsed.color, useInitials: parsed.useInitials });
      if (clean) myProfile = clean;
    }
  } catch (_) {}
  if (!myProfile.name) myProfile.name = randomName();
  if (!myProfile.color) myProfile.color = randomColor();
  if (!myProfile.avatar) myProfile.avatar = "👤";
}
function saveProfile() { localStorage.setItem("peerProfile", JSON.stringify(myProfile)); }

function sendProfileToConnection(connection) {
  if (!connection?.open) return;
  try { connection.send({ type: "profile", profile: myProfile }); } catch (_) {}
}
function broadcastProfile() {
  if (!room) return;
  if (room.creator) {
    room.members.forEach((c) => sendProfileToConnection(c));
  } else if (room.hostConnection?.open) {
    room.hostConnection.send({ type: "profile-relay", profile: myProfile });
  }
}
function handleProfileUpdate(peerId, profile) {
  const clean = sanitizeProfile(profile);
  if (!clean || !peerId) return;
  remoteProfiles.set(peerId, clean);
  updateParticipantsList();
  updateTileLabels();
}

function updateParticipantsList() {
  const container = $("participantsList");
  if (!container || !room) return;
  container.innerHTML = "";
  const all = allRoomIds();
  $("liveCount").textContent = t("onlineCount", { n: all.length });
  all.forEach((id) => {
    const isMe = id === peer.id;
    const prof = isMe ? myProfile : profileFor(id);
    const pill = document.createElement("div");
    pill.className = "participant-pill" + (isMe ? " you" : "");
    const av = buildAvatarEl(prof);
    const name = document.createElement("span");
    name.textContent = isMe ? prof.name : prof.name;
    pill.append(av, name);
    container.appendChild(pill);
  });
}

/* -------------------------------------------------------------------------- */
/* Core helpers                                                               */
/* -------------------------------------------------------------------------- */
function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }
function view(name) { ["homeView", "friendView", "roomView"].forEach((id) => $(id).classList.toggle("hidden", id !== name)); }
function safeText(value) { return typeof value === "string" ? value.trim().slice(0, 1000) : ""; }
function safeFileName(value) { return safeText(value).slice(0, 180) || "file"; }
function liveTracks(stream, kind) { return (stream?.getTracks() || []).filter((track) => track.kind === kind && track.readyState !== "ended"); }
function stopMedia() {
  if (localStream) localStream.getTracks().forEach((t) => t.stop());
  localStream = null;
  stopScreenShare(false);
  updateMediaControls();
}

function wireLocalStream(stream) {
  stream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => { updateMediaControls(); refreshLocalTiles(); });
  });
  updateMediaControls();
}

async function getMedia(video) {
  const hasUsableAudio = liveTracks(localStream, "audio").length > 0;
  const hasRequestedVideo = !video || liveTracks(localStream, "video").length > 0;
  if (localStream && hasUsableAudio && hasRequestedVideo) { updateMediaControls(); return localStream; }
  if (!navigator.mediaDevices?.getUserMedia) { status("fileUnsupported"); return null; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: { ideal: "user" } } : false });
    if (localStream) {
      // Keep existing screen share video if any
      const screenVideo = liveTracks(screenStream, "video")[0];
      if (screenVideo) stream.addTrack(screenVideo);
      localStream.getTracks().forEach((t) => { if (!(screenVideo && t === screenVideo)) t.stop(); });
    }
    localStream = stream;
    wireLocalStream(stream);
    // if we were in a call, replace tracks
    replaceSenderTracks(stream);
    refreshLocalTiles();
    return stream;
  } catch (error) { console.error(error); status("micDenied"); return null; }
}

function replaceSenderTracks(stream) {
  if (!stream) return;
  const calls = [];
  if (privateCall) calls.push(privateCall);
  groupCalls.forEach((c) => calls.push(c));
  calls.forEach((call) => {
    const pc = call.peerConnection;
    if (!pc) return;
    const senders = pc.getSenders();
    stream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track && s.track.kind === track.kind);
      if (sender) { try { sender.replaceTrack(track); } catch (_) {} }
    });
  });
}

function addMessage(containerId, text, mine, senderId, senderNameOverride) {
  const container = $(containerId), empty = container.querySelector(".empty"); if (empty) empty.remove();
  const item = document.createElement("article");
  item.className = "message " + (mine ? "mine" : "theirs");
  const sender = document.createElement("span");
  sender.className = "sender";
  const prof = mine ? myProfile : profileFor(senderId);
  const label = document.createElement("span");
  label.className = "sender-pill";
  const mini = buildAvatarEl(prof);
  mini.className = "mini-avatar";
  if (prof.useInitials) mini.textContent = initialsOf(prof.name);
  const tname = document.createElement("span");
  tname.textContent = senderNameOverride || (mine ? t("you") : prof.name);
  label.append(mini, tname);
  sender.append(label);
  const body = document.createElement("div");
  body.textContent = safeText(text);
  item.append(sender, body);
  const meta = document.createElement("small");
  meta.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  item.append(meta);
  container.append(item); container.scrollTop = container.scrollHeight;
}
function addSystemFileMessage(containerId, label, mine, senderId) {
  // Reuse addMessage structure but for file transfer rows we'll create custom items; see file messaging below.
}
function clearMessages(id) {
  $(id).replaceChildren(Object.assign(document.createElement("p"), { className: "empty", textContent: t("noMessages") }));
}
function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text; area.setAttribute("readonly", "");
  area.style.position = "fixed"; area.style.opacity = "0";
  document.body.append(area); area.select();
  const ok = document.execCommand("copy"); area.remove();
  return ok;
}
async function copyText(text, button, copiedText) {
  if (!text) return status("nothingCopy");
  const old = button.textContent;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else if (!fallbackCopy(text)) throw new Error("clipboard unavailable");
    button.textContent = copiedText || t("copied");
    setTimeout(() => { button.textContent = old; }, 1100);
  } catch (error) {
    console.error(error); status("clipboardFail");
  }
}

/* -------------------------------------------------------------------------- */
/* File sharing                                                               */
/* -------------------------------------------------------------------------- */
const FILE_CHUNK_SIZE = 32 * 1024;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const BUFFERED_AMOUNT_HIGH = 2 * 1024 * 1024;
const INCOMING_FILE_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_FILE_CHUNKS = Math.ceil(MAX_FILE_SIZE / FILE_CHUNK_SIZE) + 1;
const incomingFiles = new Map();
const fileMessageEls = new Map();

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
function failIncomingFile(fileId, messageKey, vars) {
  const fd = incomingFiles.get(fileId);
  if (fd?.timeoutId) clearTimeout(fd.timeoutId);
  incomingFiles.delete(fileId);
  finalizeFileMessage(fileId, { ok: false, error: t(messageKey, vars) });
}
async function sha256Hex(buffer) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("SHA-256 unavailable");
  const digest = await subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function scheduleUrlRevoke(url, delayMs) {
  if (!url) return;
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, delayMs || 10 * 60 * 1000);
}
function appendFileDownloadLink(refs, url) {
  const link = document.createElement("a");
  link.href = url; link.textContent = "Download"; link.className = "file-link"; link.download = refs.fileName || "file";
  link.addEventListener("click", () => scheduleUrlRevoke(url, 60 * 1000), { once: true });
  scheduleUrlRevoke(url);
  refs.body.insertBefore(link, refs.statusEl);
  refs.link = link;
}
function createFileMessage(containerId, { fileId, fileName, mine, senderId, sizeBytes, url }) {
  fileName = safeFileName(fileName);
  const container = $(containerId), empty = container.querySelector(".empty"); if (empty) empty.remove();
  const item = document.createElement("article"); item.className = "message file-message " + (mine ? "mine" : "theirs");
  const sender = document.createElement("span"); sender.className = "sender";
  const prof = mine ? myProfile : profileFor(senderId);
  const label = document.createElement("span"); label.className = "sender-pill";
  const mini = buildAvatarEl(prof); mini.className = "mini-avatar";
  if (prof.useInitials) mini.textContent = initialsOf(prof.name);
  const nm = document.createElement("span"); nm.textContent = mine ? t("you") : prof.name;
  label.append(mini, nm); sender.append(label);
  const body = document.createElement("div"); body.className = "file-body";
  const nameRow = document.createElement("div"); nameRow.className = "file-name-row";
  const nameEl = document.createElement("span"); nameEl.className = "file-name"; nameEl.textContent = "📎 " + fileName;
  nameRow.append(nameEl);
  if (typeof sizeBytes === "number") {
    const sizeEl = document.createElement("span"); sizeEl.className = "file-size"; sizeEl.textContent = formatFileSize(sizeBytes); nameRow.append(sizeEl);
  }
  body.append(nameRow);
  const progressWrap = document.createElement("div"); progressWrap.className = "file-progress-wrap";
  const progressBar = document.createElement("div"); progressBar.className = "file-progress-bar";
  progressWrap.append(progressBar); body.append(progressWrap);
  const statusEl = document.createElement("small"); statusEl.className = "file-status muted";
  statusEl.textContent = mine ? t("sending", { pct: 0 }) : t("waitingFile");
  body.append(statusEl);
  const meta = document.createElement("small"); meta.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  item.append(sender, body, meta);
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
    refs.statusEl.textContent = sent ? t("sent") : t("received");
    refs.statusEl.classList.remove("file-error");
  } else {
    refs.statusEl.textContent = error || t("sendFileFail");
    refs.statusEl.classList.add("file-error");
  }
  fileMessageEls.delete(fileId);
}
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
    status("rejectedFile");
    return;
  }
  const timeoutId = setTimeout(() => { incomingFiles.delete(fileId); finalizeFileMessage(fileId, { ok: false, error: t("fileTimeout") }); }, INCOMING_FILE_TIMEOUT_MS);
  const senderProfile = sanitizeProfile(data.senderProfile) || { name: safeText(data.sender) || t("participant"), avatar: "👥", color: "#6b7280", useInitials: false };
  if (data.sender) remoteProfiles.set(data.sender, senderProfile);
  incomingFiles.set(fileId, {
    name: safeFileName(data.name),
    mime: typeof data.mime === "string" && data.mime.length <= 120 ? data.mime : "application/octet-stream",
    size, totalChunks,
    hash: data.hash ? data.hash.toLowerCase() : "",
    sender: safeText(data.sender),
    senderProfile,
    chunks: new Map(),
    receivedBytes: 0,
    timeoutId,
  });
  createFileMessage(containerId, { fileId, fileName: data.name, mine: false, senderId: data.sender, sizeBytes: size });
  updateParticipantsList();
}
async function assembleIncomingFile(fileId, fd, containerId) {
  const chunks = [];
  for (let i = 0; i < fd.totalChunks; i++) {
    if (!fd.chunks.has(i)) { finalizeFileMessage(fileId, { ok: false, error: t("fileIncomplete") }); return; }
    chunks.push(fd.chunks.get(i));
  }
  const blob = new Blob(chunks, { type: fd.mime || "application/octet-stream" });
  if (blob.size !== fd.size) { finalizeFileMessage(fileId, { ok: false, error: t("fileSizeMismatch") }); return; }
  if (fd.hash && globalThis.crypto?.subtle?.digest) {
    updateFileProgress(fileId, 100, t("verifying"));
    try {
      const buffer = await blob.arrayBuffer();
      const actualHash = await sha256Hex(buffer);
      if (actualHash !== fd.hash) { finalizeFileMessage(fileId, { ok: false, error: t("fileIntegrityFail") }); return; }
    } catch (e) { console.error("Hash verification error:", e); }
  }
  const url = URL.createObjectURL(blob);
  finalizeFileMessage(fileId, { ok: true, url });
}
function handleFileChunk(data, containerId) {
  if (!data || data.type !== "file-chunk") return;
  const fd = incomingFiles.get(data.fileId);
  if (!fd) return;
  const index = Number(data.index);
  const chunk = normalizeIncomingChunk(data.chunk);
  if (!Number.isInteger(index) || index < 0 || index >= fd.totalChunks || !chunk) return;
  if (fd.chunks.has(index)) return;
  const expectedBytes = index === fd.totalChunks - 1 ? fd.size - FILE_CHUNK_SIZE * (fd.totalChunks - 1) : FILE_CHUNK_SIZE;
  if (chunk.byteLength !== expectedBytes || chunk.byteLength > FILE_CHUNK_SIZE) {
    failIncomingFile(data.fileId, "fileChunkInvalid"); return;
  }
  fd.receivedBytes += chunk.byteLength;
  if (fd.receivedBytes > fd.size) { failIncomingFile(data.fileId, "fileTooMuchData"); return; }
  fd.chunks.set(index, chunk);
  const percent = Math.round((fd.chunks.size / fd.totalChunks) * 100);
  updateFileProgress(data.fileId, percent, t("receiving", { pct: percent }));
  if (fd.chunks.size >= fd.totalChunks) {
    clearTimeout(fd.timeoutId);
    incomingFiles.delete(data.fileId);
    assembleIncomingFile(data.fileId, fd, containerId);
  }
}
async function sendFile({ file, containerId, mine, senderId, sendFn, getConnections }) {
  if (!file) return;
  if (!Number.isFinite(file.size) || file.size > MAX_FILE_SIZE) { status("fileTooBig", { size: formatFileSize(MAX_FILE_SIZE) }); return; }
  const fileId = fileTransferId();
  const localUrl = URL.createObjectURL(file);
  createFileMessage(containerId, { fileId, fileName: file.name, mine, senderId, sizeBytes: file.size, url: localUrl });
  try {
    const buffer = await file.arrayBuffer();
    let hash = null;
    if (globalThis.crypto?.subtle?.digest) { try { hash = await sha256Hex(buffer); } catch (e) { console.error("Hashing error:", e); } }
    const total = Math.max(1, Math.ceil(buffer.byteLength / FILE_CHUNK_SIZE));
    sendFn({ type: "file-start", fileId, name: file.name, mime: file.type || "application/octet-stream", size: buffer.byteLength, totalChunks: total, hash, sender: peer?.id || "", senderProfile: myProfile });
    for (let i = 0; i < total; i++) {
      await waitForBufferedAmount(getConnections);
      const chunk = buffer.slice(i * FILE_CHUNK_SIZE, (i + 1) * FILE_CHUNK_SIZE);
      sendFn({ type: "file-chunk", fileId, index: i, chunk, sender: peer?.id || "" });
      const percent = Math.round(((i + 1) / total) * 100);
      updateFileProgress(fileId, percent, t("sending", { pct: percent }));
      if (i % 8 === 7) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    finalizeFileMessage(fileId, { ok: true, sent: true });
  } catch (e) {
    console.error("File send error:", e);
    finalizeFileMessage(fileId, { ok: false, error: t("sendFileFail") });
  }
}

/* -------------------------------------------------------------------------- */
/* Private chat/calls                                                         */
/* -------------------------------------------------------------------------- */
function wirePrivateConnection(connection) {
  connection.on("open", () => {
    privateConnection = connection;
    $("privateChatStatus").textContent = t("you") + " → " + connection.peer;
    // Send profile on connect
    sendProfileToConnection(connection);
  });
  connection.on("data", (data) => {
    if (!data || typeof data !== "object") return;
    if (data.type === "private-chat") addMessage("privateMessages", data.text, false, connection.peer);
    if (data.type === "profile") handleProfileUpdate(connection.peer, data.profile);
    if (data.type === "file-start") handleFileStart(data, "privateMessages");
    if (data.type === "file-chunk") handleFileChunk(data, "privateMessages");
  });
  connection.on("close", () => { if (privateConnection === connection) { privateConnection = null; $("privateChatStatus").textContent = t("chatDisconnected"); } });
  connection.on("error", () => { $("privateChatStatus").textContent = t("cantConnectChat"); });
}
function waitForConnectionOpen(connection, timeoutMs) {
  if (connection?.open) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => { if (settled) return; settled = true; clearTimeout(timer); resolve(ok); };
    const timer = setTimeout(() => finish(false), timeoutMs || 8000);
    connection.once("open", () => finish(true));
    connection.once("close", () => finish(false));
    connection.once("error", () => finish(false));
  });
}
function privateChatConnection(remoteId) {
  if (!peer?.open || !remoteId || remoteId === peer.id) return null;
  if (privateConnection?.open && privateConnection.peer === remoteId) return privateConnection;
  if (privateConnection) privateConnection.close();
  privateConnection = peer.connect(remoteId, { reliable: true });
  wirePrivateConnection(privateConnection);
  return privateConnection;
}
function endPrivateCall() {
  const call = privateCall; privateCall = null;
  if (call) call.close();
  clearMediaTiles("privateTiles");
  if (!inGroupCall) stopMedia();
  hide("privateCallControls"); hide("privateHangupBtn");
  show("callBtn"); show("audioCallBtn");
  status("privateEnded");
}
function wirePrivateCall(call) {
  privateCall = call;
  hide("callBtn"); hide("audioCallBtn");
  show("privateCallControls"); show("privateHangupBtn");
  updateMediaControls();
  call.on("stream", (stream) => addPrivateTile(call.peer, stream));
  call.on("close", () => { clearMediaTiles("privateTiles"); if (privateCall === call) endPrivateCall(); });
  call.on("error", () => endPrivateCall());
}
async function startPrivateCall(video) {
  if (inGroupCall) return status("endGroupFirst");
  const remoteId = $("peerId").value.trim();
  if (!remoteId) return status("friendIdEmpty");
  if (remoteId === peer?.id) return status("ownId");
  const stream = await getMedia(video); if (!stream) return;
  addPrivateTile(peer.id, stream, true);
  privateChatConnection(remoteId);
  status("calling", { id: remoteId });
  wirePrivateCall(peer.call(remoteId, stream, { metadata: { kind: "private", video, profile: myProfile } }));
}
async function answerPrivate() {
  if (!pendingPrivate) return;
  if (inGroupCall) return status("endGroupFirst");
  const stream = await getMedia(Boolean(pendingPrivate.metadata?.video !== false)); if (!stream) return;
  addPrivateTile(peer.id, stream, true);
  const call = pendingPrivate; pendingPrivate = null;
  hide("privateIncoming");
  wirePrivateCall(call);
  call.answer(stream);
  // Apply caller's profile metadata if present
  if (call.metadata?.profile) handleProfileUpdate(call.peer, call.metadata.profile);
}

/* -------------------------------------------------------------------------- */
/* Rooms                                                                      */
/* -------------------------------------------------------------------------- */
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
function broadcast(data) { if (!room?.creator) return; room.members.forEach((c) => { if (c.open) c.send(data); }); }
function updateRoomUI() {
  if (!room) return;
  $("roomCode").textContent = room.code;
  const n = allRoomIds().length;
  $("participantCount").textContent = t("participantsOnline", { n, s: n === 1 ? "" : "s" });
  if (room.callActive) {
    const key = room.video ? "groupVideoActive" : "groupAudioActive";
    $("groupCallStatus").textContent = t(key);
  } else {
    $("groupCallStatus").textContent = t("noGroupCall");
  }
  updateParticipantsList();
}
function announceRoster() {
  const roster = allRoomIds();
  broadcast({ type: "roster", roster, active: room.callActive, video: room.video });
  updateRoomUI();
}
function roomMessage(text, senderId) { addMessage("roomMessages", text, senderId === peer.id, senderId); }
function clearRoomJoinTimer() { if (roomJoinTimer) clearTimeout(roomJoinTimer); roomJoinTimer = null; }
function closePendingGroupCalls() { pendingGroupCalls.splice(0).forEach((c) => c.close()); hide("incomingModal"); }
function showIncomingGroupCall(video) {
  if (!room || inGroupCall) return;
  offerGroupAnswer();
  show("incomingModal");
  $("incomingText").textContent = video ? t("incomingGroupVideo") : t("incomingGroupAudio");
}
function handleRoomData(data, connection) {
  if (!data || typeof data.type !== "string") return;
  if (room?.creator) {
    if (data.type === "join" && data.peerId === connection.peer) {
      room.members.set(connection.peer, connection);
      connection.send({ type: "welcome", code: room.code, roster: allRoomIds(), active: room.callActive, video: room.video, profiles: collectProfiles() });
      announceRoster();
      // Send them our profile and ask for theirs
      sendProfileToConnection(connection);
      if (room.callActive && localStream) connectGroupPeers();
      status("roomCreated", { code: room.code });
    }
    if (data.type === "leave") { room.members.delete(connection.peer); remoteProfiles.delete(connection.peer); announceRoster(); }
    if (data.type === "profile-relay") {
      // From non-host member to host; store and broadcast
      if (data.profile) handleProfileUpdate(connection.peer, data.profile);
      broadcast({ type: "profile", peerId: connection.peer, profile: sanitizeProfile(data.profile) });
    }
    if (data.type === "profile") {
      handleProfileUpdate(connection.peer, data.profile);
      broadcast({ type: "profile", peerId: connection.peer, profile: sanitizeProfile(data.profile) });
    }
    if (data.type === "room-chat") {
      const text = safeText(data.text);
      if (text) { broadcast({ type: "room-chat", text, sender: connection.peer }); roomMessage(text, connection.peer); }
    }
    if (data.type === "start-call") {
      room.callActive = true; room.video = Boolean(data.video);
      broadcast({ type: "call-state", active: true, video: room.video, starter: connection.peer });
      if (!inGroupCall) offerGroupAnswer();
    }
    if (data.type === "end-call") endGroupCall(true);
    if (data.type === "file-start" || data.type === "file-chunk") {
      const relayed = { ...data, sender: connection.peer };
      room.members.forEach((conn) => { if (conn.open && conn.peer !== connection.peer) conn.send(relayed); });
      if (relayed.type === "file-start") handleFileStart(relayed, "roomMessages");
      else handleFileChunk(relayed, "roomMessages");
      return;
    }
    return;
  }
  // Non-host (member)
  if (data.type === "welcome") {
    room.roster = data.roster || []; room.callActive = Boolean(data.active); room.video = Boolean(data.video);
    // Apply any profiles host shared
    if (data.profiles && typeof data.profiles === "object") {
      Object.entries(data.profiles).forEach(([id, p]) => { if (id !== peer.id) handleProfileUpdate(id, p); });
    }
    updateRoomUI();
    if (room.callActive && !inGroupCall) offerGroupAnswer(); else if (!room.callActive) finishGroupCall(false);
    // Send our profile back to host
    if (room.hostConnection?.open) room.hostConnection.send({ type: "profile-relay", profile: myProfile });
  }
  if (data.type === "roster") {
    room.roster = data.roster || []; room.callActive = Boolean(data.active); room.video = Boolean(data.video);
    updateRoomUI();
    if (room.callActive && !inGroupCall) offerGroupAnswer(); else if (!room.callActive) finishGroupCall(false);
  }
  if (data.type === "profile") {
    if (data.peerId) handleProfileUpdate(data.peerId, data.profile);
  }
  if (data.type === "room-chat") { const text = safeText(data.text); if (text) roomMessage(text, data.sender); }
  if (data.type === "call-state") {
    room.callActive = Boolean(data.active); room.video = Boolean(data.video);
    if (room.callActive) { if (!inGroupCall) offerGroupAnswer(); } else finishGroupCall(false);
    updateRoomUI();
  }
  if (data.type === "file-start") { handleFileStart(data, "roomMessages"); return; }
  if (data.type === "file-chunk") { handleFileChunk(data, "roomMessages"); return; }
  if (data.type === "room-closed") { status("roomClosed"); leaveRoom(false); }
}
function collectProfiles() {
  const out = {};
  out[peer.id] = myProfile;
  remoteProfiles.forEach((p, id) => { out[id] = p; });
  return out;
}
function wireHostConnection(connection) {
  connection.on("data", (data) => handleRoomData(data, connection));
  connection.on("close", () => {
    if (room?.creator) { room.members.delete(connection.peer); remoteProfiles.delete(connection.peer); announceRoster(); }
    else if (room?.hostConnection === connection) { status("roomClosed"); leaveRoom(false); }
  });
}
function createRoom() {
  if (!peer?.open) return status("stillConnecting");
  const code = randomCode(), host = new Peer(roomHostId(code));
  room = { code, creator: true, hostPeer: host, members: new Map(), roster: [peer.id], callActive: false, video: true };
  host.on("open", () => { hide("roomLobby"); show("roomActive"); show("leaveRoomBtn"); updateRoomUI(); status("roomCreated", { code }); });
  host.on("connection", (connection) => wireHostConnection(connection));
  host.on("error", (error) => { console.error(error); status("stillConnecting"); leaveRoom(false); });
}
function joinRoom() {
  const code = $("roomCodeInput").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z0-9]{6}$/.test(code)) return status("invalidCode");
  if (!peer?.open) return status("stillConnecting");
  clearRoomJoinTimer();
  const hostConnection = peer.connect(roomHostId(code), { reliable: true });
  room = { code, creator: false, hostConnection, roster: [], callActive: false, video: true };
  status("lookingRoom", { code });
  roomJoinTimer = setTimeout(() => {
    if (room?.hostConnection === hostConnection && !hostConnection.open) { status("roomNotFound"); leaveRoom(false); }
  }, 8000);
  hostConnection.on("open", () => {
    clearRoomJoinTimer();
    hostConnection.send({ type: "join", peerId: peer.id });
    hide("roomLobby"); show("roomActive"); show("leaveRoomBtn");
    status("roomJoined", { code });
  });
  hostConnection.on("error", () => { clearRoomJoinTimer(); status("roomNotFound"); leaveRoom(false); });
  wireHostConnection(hostConnection);
}
function leaveRoom(changeView) {
  clearRoomJoinTimer();
  if (!room) return;
  const currentRoom = room;
  if (currentRoom.creator) { broadcast({ type: "room-closed" }); currentRoom.hostPeer?.destroy(); }
  else if (currentRoom.hostConnection?.open) currentRoom.hostConnection.send({ type: "leave" });
  finishGroupCall(false);
  room = null;
  remoteProfiles.clear();
  currentRoom.hostConnection?.close();
  hide("roomActive"); hide("leaveRoomBtn"); show("roomLobby");
  clearMessages("roomMessages");
  if (changeView) { view("homeView"); status("leftRoom"); } else { updateParticipantsList(); }
}
function setPressed(button, pressed) {
  if (!button) return;
  button.setAttribute("aria-pressed", String(pressed));
  button.classList.toggle("active", pressed);
}

/* -------------------------------------------------------------------------- */
/* Media controls + screen share                                              */
/* -------------------------------------------------------------------------- */
function updateMediaControls() {
  const audioTracks = liveTracks(localStream, "audio");
  const videoTracks = liveTracks(localStream, "video");
  const screenTrack = liveTracks(screenStream, "video")[0];
  const muted = audioTracks.length > 0 && audioTracks.every((t) => !t.enabled);
  const cameraOff = videoTracks.filter((t) => t !== screenTrack).length > 0 && videoTracks.filter((t) => t !== screenTrack).every((t) => !t.enabled);
  const hasCamera = videoTracks.filter((t) => t !== screenTrack).length > 0;
  const inAnyCall = Boolean(privateCall) || inGroupCall;

  [
    [$( "privateMuteBtn"), $("privateCameraBtn"), $("privateShareBtn")],
    [$( "groupMuteBtn"), $("groupCameraBtn"), $("groupShareBtn")],
  ].forEach(([muteBtn, cameraBtn, shareBtn]) => {
    if (muteBtn) {
      muteBtn.disabled = audioTracks.length === 0;
      muteBtn.textContent = muted ? t("unmuteMic") : t("muteMic");
      setPressed(muteBtn, muted);
    }
    if (cameraBtn) {
      cameraBtn.disabled = videoTracks.length === 0 && !screenTrack;
      if (screenTrack) {
        cameraBtn.textContent = hasCamera ? (cameraOff ? t("turnCameraOn") : t("turnCameraOff")) : t("audioOnly");
      } else if (videoTracks.length === 0) {
        cameraBtn.textContent = t("audioOnly");
      } else {
        cameraBtn.textContent = cameraOff ? t("turnCameraOn") : t("turnCameraOff");
      }
      setPressed(cameraBtn, cameraOff);
    }
    if (shareBtn) {
      if (inAnyCall && !!navigator.mediaDevices?.getDisplayMedia) {
        shareBtn.classList.remove("hidden");
        shareBtn.textContent = screenTrack ? t("stopShare") : t("shareScreen");
        shareBtn.classList.toggle("sharing", !!screenTrack);
      } else {
        shareBtn.classList.add("hidden");
      }
    }
  });
}
function toggleMic() {
  const audioTracks = liveTracks(localStream, "audio");
  if (!audioTracks.length) return;
  const mute = audioTracks.some((t) => t.enabled);
  audioTracks.forEach((t) => { t.enabled = !mute; });
  updateMediaControls(); refreshLocalTiles(); updateTileMutedState();
}
function toggleCamera() {
  const videoTracks = liveTracks(localStream, "video").filter((t) => t !== liveTracks(screenStream, "video")[0]);
  if (!videoTracks.length) return;
  const turnOff = videoTracks.some((t) => t.enabled);
  videoTracks.forEach((t) => { t.enabled = !turnOff; });
  updateMediaControls(); refreshLocalTiles();
}

async function startScreenShare() {
  if (screenStream) return stopScreenShare(true);
  if (!navigator.mediaDevices?.getDisplayMedia) return status("screenShareUnsupported");
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    screenStream = stream;
    const videoTrack = stream.getVideoTracks()[0];
    if (!localStream) {
      // Create a minimal stream (audio required for call answer; but we only enter this during a call which already has media)
      localStream = new MediaStream([videoTrack]);
    } else {
      // Remove existing screen track if any
      liveTracks(localStream, "video").filter((t) => t._screenShare).forEach((t) => { localStream.removeTrack(t); t.stop(); });
      videoTrack._screenShare = true;
      localStream.addTrack(videoTrack);
    }
    videoTrack.addEventListener("ended", () => stopScreenShare(true), { once: true });
    replaceSenderTracks(localStream);
    wireLocalStream(localStream);
    refreshLocalTiles();
    updateMediaControls();
    status("sharing", { name: videoTrack.label || "Screen" });
  } catch (e) {
    console.error(e); status("screenShareError");
  }
}
function stopScreenShare(replace) {
  if (!screenStream) { updateMediaControls(); return; }
  const track = liveTracks(screenStream, "video")[0];
  if (track) {
    if (localStream) localStream.removeTrack(track);
    track.stop();
  }
  screenStream.getTracks().forEach((t) => t.stop());
  screenStream = null;
  if (replace && localStream && (privateCall || inGroupCall)) replaceSenderTracks(localStream);
  refreshLocalTiles();
  updateMediaControls();
}

/* -------------------------------------------------------------------------- */
/* Tiles                                                                      */
/* -------------------------------------------------------------------------- */
function safeTileId(prefix, id) { return prefix + String(id || "unknown").replace(/[^a-z0-9_-]/gi, "_"); }
function hasVisibleVideo(stream) {
  return liveTracks(stream, "video").some((t) => t.enabled);
}
function streamHasScreenShare(stream) {
  if (!stream) return false;
  return liveTracks(stream, "video").some((t) => t._screenShare || (t.label && /screen|tab|window/i.test(t.label)));
}
function streamIsMuted(stream) {
  const a = liveTracks(stream, "audio");
  return a.length > 0 && a.every((t) => !t.enabled);
}
function updateTileVisual(tile, stream, local) {
  const visibleVideo = hasVisibleVideo(stream);
  const hasVideoTrack = liveTracks(stream, "video").length > 0;
  const micMuted = streamIsMuted(stream);
  const screenSharing = !local && streamHasScreenShare(stream);
  tile.classList.toggle("audio", !visibleVideo);
  const title = tile.querySelector(".audio-title");
  const detail = tile.querySelector(".audio-detail");
  if (title) title.textContent = hasVideoTrack ? (local ? "Camera off" : "Waiting for video…") : t("audioOnly");
  if (detail) detail.textContent = local ? (micMuted ? "🔇" : "🎙️") : "";
  const shareTag = tile.querySelector(".screenshare-tag");
  if (shareTag) shareTag.remove();
  if (screenSharing) {
    const tag = document.createElement("span");
    tag.className = "screenshare-tag";
    tag.textContent = "🖥️ Screen";
    tile.append(tag);
  }
  updateTileBadge(tile, stream, local);
}
function updateTileBadge(tile, stream, local) {
  const peerId = tile.dataset.peerId;
  const prof = local ? myProfile : profileFor(peerId);
  let badge = tile.querySelector(".tile-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "tile-badge";
    tile.append(badge);
  }
  badge.innerHTML = "";
  const av = buildAvatarEl(prof);
  av.className = "mini-avatar";
  if (prof.useInitials) av.textContent = initialsOf(prof.name);
  const name = document.createElement("span");
  name.textContent = local ? t("you") : prof.name;
  badge.append(av, name);
  // Muted tag
  let mutedTag = tile.querySelector(".muted-tag");
  if (streamIsMuted(stream)) {
    if (!mutedTag) {
      mutedTag = document.createElement("span");
      mutedTag.className = "muted-tag";
      mutedTag.textContent = "🔇";
      tile.append(mutedTag);
    }
  } else if (mutedTag) {
    mutedTag.remove();
  }
}
function updateTileLabels() {
  document.querySelectorAll(".tile").forEach((tile) => {
    const stream = tile.querySelector("video")?.srcObject;
    if (!stream) return;
    const isLocal = tile.dataset.local === "1";
    updateTileBadge(tile, stream, isLocal);
  });
}
function updateTileMutedState() {
  document.querySelectorAll(".tile").forEach((tile) => {
    const stream = tile.querySelector("video")?.srcObject;
    if (!stream) return;
    const isLocal = tile.dataset.local === "1";
    updateTileVisual(tile, stream, isLocal);
  });
}
function bindTileMediaEvents(tile, stream, local) {
  if (typeof tile._cleanupMediaTile === "function") tile._cleanupMediaTile();
  const video = tile.querySelector("video");
  const listeners = [];
  const listen = (target, event, handler) => { target.addEventListener(event, handler); listeners.push(() => target.removeEventListener(event, handler)); };
  const refresh = () => updateTileVisual(tile, stream, local);
  const tryPlay = () => video.play().catch(() => {});
  ["loadedmetadata", "loadeddata", "canplay", "playing", "resize"].forEach((event) => listen(video, event, () => { refresh(); tryPlay(); }));
  if (typeof stream.addEventListener === "function") ["addtrack", "removetrack"].forEach((event) => listen(stream, event, refresh));
  (stream.getTracks() || []).forEach((track) => { ["mute", "unmute", "ended"].forEach((event) => listen(track, event, refresh)); });
  tile._cleanupMediaTile = () => { listeners.splice(0).forEach((c) => c()); tile._cleanupMediaTile = null; };
}
function createMediaTile(containerId, tileId, peerId, local) {
  let tile = $(tileId);
  if (tile) return tile;
  tile = document.createElement("div");
  tile.id = tileId;
  tile.className = "tile";
  tile.dataset.peerId = peerId || "";
  tile.dataset.local = local ? "1" : "0";
  const video = document.createElement("video");
  video.autoplay = true; video.playsInline = true;
  tile.append(video);
  const placeholder = document.createElement("div");
  placeholder.className = "audio-placeholder";
  const audioAvatar = buildAvatarEl(local ? myProfile : profileFor(peerId));
  audioAvatar.className = "audio-avatar";
  if ((local ? myProfile : profileFor(peerId)).useInitials) audioAvatar.textContent = initialsOf((local ? myProfile : profileFor(peerId)).name);
  placeholder.append(audioAvatar);
  placeholder.innerHTML += '<div class="audio-title">Audio only</div><p class="audio-detail"></p>';
  // Replace the first child (the avatar we appended) with a correctly-styled one already inside innerHTML? Keep simple:
  placeholder.innerHTML = '<div class="audio-avatar">🎧</div><div class="audio-title">Audio only</div><p class="audio-detail"></p>';
  tile.append(placeholder);
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
function addPrivateTile(id, stream, local) {
  const tile = createMediaTile("privateTiles", safeTileId("private-", id), id, local);
  setTileStream(tile, stream, local);
}
function addTile(id, stream, local) {
  const tile = createMediaTile("participantTiles", safeTileId("tile-", id), id, local);
  setTileStream(tile, stream, local);
}
function cleanupMediaTile(tile) { if (typeof tile?._cleanupMediaTile === "function") tile._cleanupMediaTile(); }
function clearMediaTiles(containerId) { const c = $(containerId); c?.querySelectorAll(".tile").forEach(cleanupMediaTile); c?.replaceChildren(); }
function removeTile(id) { const tile = $(safeTileId("tile-", id)); cleanupMediaTile(tile); tile?.remove(); }
function connectGroupPeers() {
  if (!room || !localStream) return;
  memberIds().forEach((id) => {
    if (id === peer.id || groupCalls.has(id)) return;
    const call = peer.call(id, localStream, { metadata: { kind: "group", room: room.code, video: room.video, profile: myProfile } });
    wireGroupCall(call);
  });
}
function wireGroupCall(call) {
  if (groupCalls.has(call.peer)) { call.close(); return; }
  groupCalls.set(call.peer, call);
  if (call.metadata?.profile) handleProfileUpdate(call.peer, call.metadata.profile);
  call.on("stream", (stream) => addTile(call.peer, stream, false));
  call.on("close", () => { groupCalls.delete(call.peer); removeTile(call.peer); });
  call.on("error", () => { groupCalls.delete(call.peer); removeTile(call.peer); });
}
function offerGroupAnswer() {
  const key = room?.video ? "groupVideoActive" : "groupAudioActive";
  $("groupCallStatus").textContent = t(key);
  hide("startVideoBtn"); hide("startAudioBtn"); show("answerGroupBtn");
}
async function startGroupCall(video) {
  if (!room) return;
  if (privateCall) return status("endPrivateFirst");
  const stream = await getMedia(video); if (!stream) return;
  room.callActive = true; room.video = video; inGroupCall = true;
  addTile(peer.id, stream, true);
  hide("startVideoBtn"); hide("startAudioBtn"); hide("answerGroupBtn");
  show("groupCallControls"); show("endGroupBtn");
  updateMediaControls();
  $("groupCallStatus").textContent = t("groupCalling");
  if (room.creator) { broadcast({ type: "call-state", active: true, video, starter: peer.id }); }
  else sendHost({ type: "start-call", video });
  connectGroupPeers();
}
async function answerGroupCall() {
  if (pendingGroupCalls.length) return answerIncomingGroup();
  if (!room?.callActive) return;
  if (privateCall) return status("endPrivateFirst");
  const stream = await getMedia(room.video); if (!stream) return;
  inGroupCall = true;
  addTile(peer.id, stream, true);
  hide("answerGroupBtn"); hide("startVideoBtn"); hide("startAudioBtn");
  show("groupCallControls"); show("endGroupBtn");
  updateMediaControls();
  $("groupCallStatus").textContent = t("groupConnected");
  connectGroupPeers();
}
function finishGroupCall(resetState) {
  closePendingGroupCalls();
  groupCalls.forEach((c) => c.close()); groupCalls.clear();
  inGroupCall = false;
  clearMediaTiles("participantTiles");
  if (!privateCall) { stopMedia(); }
  else { stopScreenShare(true); }
  if (resetState && room) room.callActive = false;
  hide("groupCallControls"); hide("endGroupBtn"); hide("answerGroupBtn");
  show("startVideoBtn"); show("startAudioBtn");
  $("groupCallStatus").textContent = t("noGroupCall");
}
function endGroupCall(notify) {
  if (notify && room) {
    if (room.creator) { room.callActive = false; broadcast({ type: "call-state", active: false }); }
    else sendHost({ type: "end-call" });
  }
  finishGroupCall(true);
}

/* -------------------------------------------------------------------------- */
/* Peer init + events                                                         */
/* -------------------------------------------------------------------------- */
function initPeer() {
  peer = new Peer();
  peer.on("open", (id) => {
    myIdEl.textContent = id;
    status("ready");
    reconnectAttempts = 0;
  });
  peer.on("error", (error) => { console.error(error); status("connectionError", { type: error.type || "unknown" }); });
  peer.on("disconnected", () => {
    status("disconnectedReconnect");
    reconnectAttempts += 1;
    const delay = Math.min(10000, 1000 * reconnectAttempts);
    setTimeout(() => { if (peer && !peer.destroyed && peer.disconnected) peer.reconnect(); }, delay);
  });
  peer.on("connection", (connection) => {
    if (privateConnection) privateConnection.close();
    privateConnection = connection;
    wirePrivateConnection(connection);
  });
  peer.on("call", (call) => {
    if (call.metadata?.profile) handleProfileUpdate(call.peer, call.metadata.profile);
    if (call.metadata?.kind === "group") {
      if (!room || call.metadata.room !== room.code) return call.close();
      room.callActive = true; room.video = Boolean(call.metadata.video);
      if (inGroupCall && localStream) {
        if (groupCalls.has(call.peer)) return call.close();
        wireGroupCall(call); call.answer(localStream);
        return;
      }
      if (pendingGroupCalls.some((p) => p.peer === call.peer)) return call.close();
      pendingGroupCalls.push(call);
      showIncomingGroupCall(room.video);
      return;
    }
    if (privateCall || pendingPrivate) return call.close();
    pendingPrivate = call;
    show("privateIncoming");
    // show incoming caller name in status
    const prof = call.metadata?.profile;
    if (prof) { handleProfileUpdate(call.peer, prof); status("incomingPrivate"); }
    $("privateIncoming").querySelector(".label").textContent = t("incomingPrivate") + (prof?.name ? " — " + prof.name : "");
  });
}
async function answerIncomingGroup() {
  if (privateCall) return status("endPrivateFirst");
  const calls = pendingGroupCalls.splice(0);
  hide("incomingModal");
  if (!calls.length) return;
  if (!room) { calls.forEach((c) => c.close()); return; }
  const matchingCalls = calls.filter((c) => c.metadata?.room === room.code);
  calls.forEach((c) => { if (!matchingCalls.includes(c)) c.close(); });
  if (!matchingCalls.length) return;
  room.callActive = true; room.video = Boolean(matchingCalls[0].metadata?.video);
  matchingCalls.forEach((c) => { if (c.metadata?.profile) handleProfileUpdate(c.peer, c.metadata.profile); });
  const stream = await getMedia(room.video); if (!stream) { matchingCalls.forEach((c) => c.close()); return; }
  inGroupCall = true;
  addTile(peer.id, stream, true);
  hide("answerGroupBtn"); hide("startVideoBtn"); hide("startAudioBtn");
  show("groupCallControls"); show("endGroupBtn");
  updateMediaControls();
  $("groupCallStatus").textContent = t("groupConnected");
  matchingCalls.forEach((c) => { wireGroupCall(c); c.answer(stream); });
  connectGroupPeers();
}

/* -------------------------------------------------------------------------- */
/* Static UI wiring                                                           */
/* -------------------------------------------------------------------------- */
$("friendChoice").onclick = () => view("friendView");
$("roomChoice").onclick = () => view("roomView");
document.querySelectorAll(".back-btn").forEach((button) => button.onclick = () => { if (room) leaveRoom(false); view("homeView"); });
$("copyBtn").onclick = () => copyText(peer?.id || "", $("copyBtn"));
$("callBtn").onclick = () => startPrivateCall(true);
$("audioCallBtn").onclick = () => startPrivateCall(false);
$("answerPrivateBtn").onclick = answerPrivate;
$("privateHangupBtn").onclick = endPrivateCall;
$("privateMuteBtn").onclick = toggleMic;
$("privateCameraBtn").onclick = toggleCamera;
$("privateShareBtn").onclick = startScreenShare;
$("groupMuteBtn").onclick = toggleMic;
$("groupCameraBtn").onclick = toggleCamera;
$("groupShareBtn").onclick = startScreenShare;

$("privateChatForm").onsubmit = async (event) => {
  event.preventDefault();
  const text = safeText($("privateMessage").value), id = $("peerId").value.trim();
  if (!text || !id) return;
  const connection = privateChatConnection(id);
  if (!connection) return ($("privateChatStatus").textContent = t("cantConnectChat"));
  if (!connection.open) {
    $("privateChatStatus").textContent = t("connectingChat");
    const connected = await waitForConnectionOpen(connection);
    if (!connected) return ($("privateChatStatus").textContent = t("cantConnectChat"));
  }
  connection.send({ type: "private-chat", text });
  addMessage("privateMessages", text, true);
  $("privateMessage").value = "";
};
$("clearPrivateChat").onclick = () => clearMessages("privateMessages");
$("createRoomBtn").onclick = createRoom;
$("joinRoomBtn").onclick = joinRoom;
$("roomCodeInput").oninput = (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); };
$("copyRoomBtn").onclick = () => copyText(room?.code || "", $("copyRoomBtn"), t("copiedRoom"));
$("leaveRoomBtn").onclick = () => leaveRoom(true);
$("startVideoBtn").onclick = () => startGroupCall(true);
$("startAudioBtn").onclick = () => startGroupCall(false);
$("answerGroupBtn").onclick = answerGroupCall;
$("endGroupBtn").onclick = () => endGroupCall(true);

$("roomChatForm").onsubmit = (event) => {
  event.preventDefault();
  const text = safeText($("roomMessage").value);
  if (!text || !room) return;
  if (room.creator) { broadcast({ type: "room-chat", text, sender: peer.id }); roomMessage(text, peer.id); }
  else { if (!room.hostConnection?.open) return status("notConnectedRoom"); sendHost({ type: "room-chat", text }); }
  $("roomMessage").value = "";
};
$("clearRoomChat").onclick = () => clearMessages("roomMessages");
$("modalAnswerBtn").onclick = answerIncomingGroup;
$("modalDeclineBtn").onclick = closePendingGroupCalls;
window.addEventListener("beforeunload", () => { if (room?.creator) room.hostPeer?.destroy(); if (screenStream) screenStream.getTracks().forEach((t) => t.stop()); if (localStream) localStream.getTracks().forEach((t) => t.stop()); });

async function handlePrivateFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  const id = $("peerId").value.trim();
  if (!id) { status("friendIdEmpty"); input.value = ""; return; }
  const connection = privateChatConnection(id);
  if (!connection) { status("cantConnectChat"); input.value = ""; return; }
  if (!connection.open) {
    $("privateChatStatus").textContent = t("connectingFile");
    const connected = await waitForConnectionOpen(connection);
    if (!connected) { status("cantConnectFile"); input.value = ""; return; }
  }
  await sendFile({
    file, containerId: "privateMessages", mine: true, senderId: peer.id,
    sendFn: (payload) => connection.send(payload),
    getConnections: () => [connection],
  });
  input.value = "";
}
function openRoomMemberConnections() { return room?.creator ? [...room.members.values()].filter((c) => c.open) : []; }
async function handleRoomFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  if (!room) { status("notConnectedRoom"); input.value = ""; return; }
  if (room.creator) {
    if (!openRoomMemberConnections().length) { status("noOtherParticipants"); input.value = ""; return; }
    await sendFile({
      file, containerId: "roomMessages", mine: true, senderId: peer.id,
      sendFn: (payload) => {
        const targets = openRoomMemberConnections();
        if (!targets.length) throw new Error("No open room connections.");
        targets.forEach((c) => c.send(payload));
      },
      getConnections: openRoomMemberConnections,
    });
  } else {
    if (!room.hostConnection?.open) { status("notConnectedRoom"); input.value = ""; return; }
    await sendFile({
      file, containerId: "roomMessages", mine: true, senderId: peer.id,
      sendFn: (payload) => room.hostConnection.send(payload),
      getConnections: () => [room.hostConnection],
    });
  }
  input.value = "";
}

/* -------------------------------------------------------------------------- */
/* Profile modal                                                              */
/* -------------------------------------------------------------------------- */
function openProfile() {
  $("profileName").value = myProfile.name || "";
  $("profileAvatar").value = myProfile.avatar || "👤";
  $("profileUseInitials").checked = !!myProfile.useInitials;
  renderColorPicker(myProfile.color);
  updateProfilePreview();
  show("profileModal");
  setTimeout(() => $("profileName").focus(), 30);
}
function closeProfile() { hide("profileModal"); }
function renderColorPicker(selected) {
  const picker = $("colorPicker");
  picker.innerHTML = "";
  AVATAR_COLORS.forEach((c) => {
    const sw = document.createElement("button");
    sw.type = "button";
    sw.className = "color-swatch" + (c.toLowerCase() === (selected || "").toLowerCase() ? " selected" : "");
    sw.style.background = c;
    sw.setAttribute("data-color", c);
    sw.setAttribute("title", c);
    sw.onclick = () => {
      picker.querySelectorAll(".color-swatch").forEach((x) => x.classList.remove("selected"));
      sw.classList.add("selected");
      myProfile.color = c;
      updateProfilePreview();
    };
    picker.appendChild(sw);
  });
}
function updateProfilePreview() {
  const name = safeText($("profileName").value) || myProfile.name || "User";
  const avatar = $("profileAvatar").value || myProfile.avatar || "👤";
  const useInitials = $("profileUseInitials").checked;
  const color = myProfile.color || "var(--primary)";
  const preview = $("profileAvatarPreview");
  preview.className = "avatar big" + (useInitials ? " initials" : "");
  preview.style.background = color;
  preview.textContent = useInitials ? initialsOf(name) : avatar;
  $("profileNamePreview").textContent = name;
  // highlight emoji picker
  document.querySelectorAll(".avatar-pick").forEach((btn) => {
    btn.classList.toggle("selected", btn.getAttribute("data-emoji") === avatar && !useInitials);
  });
}
function saveProfileFromForm() {
  const name = safeText($("profileName").value);
  const avatar = safeText($("profileAvatar").value);
  const useInitials = $("profileUseInitials").checked;
  if (name) myProfile.name = name;
  if (avatar) myProfile.avatar = Array.from(avatar).slice(0,4).join("");
  myProfile.useInitials = useInitials;
  saveProfile();
  hide("profileModal");
  updateParticipantsList();
  refreshLocalTiles();
  updateTileLabels();
  broadcastProfile();
  status("profileSaved");
}
$("profileBtn").onclick = openProfile;
$("closeProfileBtn").onclick = closeProfile;
$("saveProfileBtn").onclick = saveProfileFromForm;
$("profileName").addEventListener("input", updateProfilePreview);
$("profileAvatar").addEventListener("input", updateProfilePreview);
$("profileUseInitials").addEventListener("change", updateProfilePreview);
document.addEventListener("click", (e) => {
  const btn = e.target.closest?.(".avatar-pick");
  if (btn && $("profileModal") && !$("profileModal").classList.contains("hidden")) {
    const emoji = btn.getAttribute("data-emoji");
    if (emoji) { $("profileAvatar").value = emoji; updateProfilePreview(); }
  }
});
$("profileModal").addEventListener("click", (e) => { if (e.target === $("profileModal")) closeProfile(); });
document.addEventListener("keydown", (e) => {
  const profOpen = $("profileModal") && !$("profileModal").classList.contains("hidden");
  const langOpen = $("langModal") && !$("langModal").classList.contains("hidden");
  if (e.key === "Escape") {
    if (profOpen) closeProfile();
    else if (langOpen) hide("langModal");
  }
  if (e.key === "Enter" && profOpen) {
    const tag = document.activeElement?.tagName || "";
    if (tag === "INPUT" && document.activeElement?.type !== "checkbox") { e.preventDefault(); saveProfileFromForm(); }
  }
});

/* -------------------------------------------------------------------------- */
/* Language + theme                                                           */
/* -------------------------------------------------------------------------- */
$("langBtn").onclick = () => { buildLangModal(); show("langModal"); };
$("closeLangBtn").onclick = () => hide("langModal");
$("langModal").addEventListener("click", (e) => { if (e.target === $("langModal")) hide("langModal"); });
$("themeBtn").onclick = toggleTheme;

/* -------------------------------------------------------------------------- */
/* Start                                                                      */
/* -------------------------------------------------------------------------- */
loadProfile();
applyTheme();
applyI18n();
initPeer();
