# PeerCall

PeerCall is a static, installable peer-to-peer dating and communication web app. Profiles and photos stay in the browser; online discovery, chat, calls, and file transfer use PeerJS/WebRTC without an application backend.

## Install the app

The site is a Progressive Web App (PWA) and must be hosted over HTTPS (or `localhost`).

- **Chrome / Edge / Android:** use the in-app **Install PeerCall** button or the browser's **Install app** option.
- **iPhone / iPad:** open the Share menu, choose **Add to Home Screen**, then tap **Add**.
- **Safari / Firefox / other browsers:** use **Add to Home Screen**, **Install**, or **Create shortcut** in the browser menu when available.

The web app manifest supplies correctly-sized regular and maskable icons. The service worker stores the full local app shell, so an installed copy opens offline. Discovery, chat, and calls still require a network connection.

## Browser compatibility

The production scripts are transpiled to ES5 and load local polyfills for Promise, Map/Set, modern language APIs, CSS custom properties, older DOM methods, prefixed IndexedDB, and legacy `getUserMedia`. CSS includes a non-Grid fallback layout. If IndexedDB is unavailable, the app falls back to local storage for photos.

Profile, theme, language, and locally saved data continue to work in older browsers. Real-time discovery and calling require WebRTC; browsers without WebRTC show a non-blocking compatibility notice instead of failing to load. For full call support, use a reasonably recent Chrome, Edge, Firefox, or Safari.

## Development

Requirements: Node.js 18 or newer.

```bash
npm install
npm run build
npm run check
npm run serve
```

Edit `js/app.source.js`, not the generated `js/app.js`. `npm run build`:

1. transpiles the app to an IE 11 / older Safari compatible ES5 build;
2. transpiles and vendors PeerJS locally;
3. copies the local polyfill and CSS-variable compatibility bundles.

Commit both source and generated browser assets because deployment is static and does not require a server-side build step.

## Deployment and permissions

Serve the repository root as static files over HTTPS. Camera and microphone access is requested only when a user starts or answers a call. PeerJS signaling and WebRTC connectivity require network access; the PWA's offline mode is limited to the cached interface and locally stored profile data.
