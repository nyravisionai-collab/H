import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "index.html", "css/style.css", "manifest.json", "sw.js",
  "js/app.js", "js/app.source.js", "js/compat.js",
  "js/vendor/polyfills.min.js", "js/vendor/css-vars-ponyfill.min.js", "js/vendor/peerjs.min.js",
  "icons/favicon-32.png", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png",
  "icons/icon-maskable-192.png", "icons/icon-maskable-512.png"
];
await Promise.all(requiredFiles.map((file) => access(file)));

for (const file of ["js/app.js", "js/app.source.js", "js/compat.js", "js/vendor/peerjs.min.js", "sw.js", "scripts/build.mjs"]) {
  const checked = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (checked.status !== 0) throw new Error(`${file} has invalid JavaScript:\n${checked.stderr}`);
}

const appBuild = await readFile("js/app.js", "utf8");
const peerBuild = await readFile("js/vendor/peerjs.min.js", "utf8");
for (const [name, source] of [["app build", appBuild], ["PeerJS build", peerBuild]]) {
  if (/=>|\?\./.test(source) || /\b(?:const|let)\s+[A-Za-z_$]/.test(source)) {
    throw new Error(`${name} still contains modern syntax that cannot be parsed by legacy browsers`);
  }
}

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
if (manifest.display !== "standalone" || !manifest.start_url || !manifest.scope) throw new Error("Manifest is missing installability fields");
if (!manifest.icons.some((icon) => icon.sizes === "192x192") || !manifest.icons.some((icon) => icon.sizes === "512x512") || !manifest.icons.some((icon) => icon.purpose === "maskable")) {
  throw new Error("Manifest must include 192px, 512px, and maskable icons");
}

async function pngDimensions(path) {
  const png = await readFile(path);
  if (png.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error(`${path} is not a PNG`);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}
for (const icon of manifest.icons) {
  const expected = icon.sizes.split("x").map(Number);
  const actual = await pngDimensions(icon.src);
  if (expected[0] !== actual[0] || expected[1] !== actual[1]) throw new Error(`${icon.src} dimensions do not match ${icon.sizes}`);
}

const html = await readFile("index.html", "utf8");
if (!html.includes('rel="manifest"') || !html.includes("beforeinstallprompt") && !appBuild.includes("beforeinstallprompt")) throw new Error("Install support is missing");
if (/https?:\/\/[^"']+\.js/.test(html)) throw new Error("Runtime JavaScript must be local so the installed app shell works offline");

const worker = await readFile("sw.js", "utf8");
for (const asset of requiredFiles.filter((file) => !file.endsWith("source.js") && !file.startsWith("scripts/") && file !== "sw.js")) {
  if (fileIsRuntimeAsset(asset) && !worker.includes(`./${asset}`)) throw new Error(`${asset} is missing from the service-worker app shell`);
}

function fileIsRuntimeAsset(file) {
  return file === "index.html" || file === "manifest.json" || file.startsWith("css/") || file.startsWith("icons/") || (file.startsWith("js/") && file !== "js/app.source.js");
}

console.log("Validation passed: install manifest, icon sizes, offline shell, and legacy builds are valid.");
